[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$NginxRoot,
    [Parameter(Mandatory = $true)]
    [string]$ConfigPath,
    [string]$ServerRoot = "",
    [string]$ServerBaseUrl = "http://127.0.0.1:6667",
    [string]$NginxBaseUrl = "http://127.0.0.1:8080",
    [string]$DemoUsername = "demo_user",
    [switch]$RunAuthenticatedChecks
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Net.Http

function Resolve-AbsolutePath([string]$PathValue) {
    return [System.IO.Path]::GetFullPath($PathValue)
}

function Wait-Http([string]$Url, [int]$Attempts = 40) {
    for ($attempt = 0; $attempt -lt $Attempts; $attempt++) {
        try {
            $response = Invoke-WebRequest -UseBasicParsing $Url -TimeoutSec 2
            if ($response.StatusCode -eq 200) {
                return $response
            }
        }
        catch {
        }

        Start-Sleep -Milliseconds 250
    }

    throw "URL did not become ready: $Url"
}

function Assert-PortFree([int]$Port) {
    $listener = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
    if ($listener) {
        throw "port is already in use: $Port"
    }
}

function Invoke-JsonRequest(
    [string]$Method,
    [string]$Url,
    [hashtable]$Headers = @{},
    [string]$Body = ""
) {
    $client = New-Object System.Net.Http.HttpClient
    $client.Timeout = New-TimeSpan -Seconds 10
    $request = New-Object System.Net.Http.HttpRequestMessage((New-Object System.Net.Http.HttpMethod($Method)), $Url)

    foreach ($header in $Headers.GetEnumerator()) {
        [void]$request.Headers.TryAddWithoutValidation($header.Key, [string]$header.Value)
    }

    if ($Body) {
        $request.Content = New-Object System.Net.Http.StringContent($Body, [System.Text.Encoding]::UTF8, "application/json")
    }

    try {
        $response = $client.SendAsync($request).GetAwaiter().GetResult()
        $content = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()

        return [pscustomobject]@{
            StatusCode = [int]$response.StatusCode
            Body = ($content | ConvertFrom-Json)
        }
    }
    finally {
        $request.Dispose()
        $client.Dispose()
    }
}

$NginxRoot = Resolve-AbsolutePath $NginxRoot
$ConfigPath = Resolve-AbsolutePath $ConfigPath
$nginxExecutable = Join-Path $NginxRoot "nginx.exe"

if (-not $ServerRoot) {
    $ServerRoot = Join-Path $PSScriptRoot "../../apps/server"
}

$ServerRoot = Resolve-AbsolutePath $ServerRoot
$serverEntry = Join-Path $ServerRoot "dist/index.js"

if (-not (Test-Path -LiteralPath $nginxExecutable -PathType Leaf)) {
    throw "nginx executable not found: $nginxExecutable"
}

if (-not (Test-Path -LiteralPath $ConfigPath -PathType Leaf)) {
    throw "nginx config not found: $ConfigPath"
}

if (-not (Test-Path -LiteralPath $serverEntry -PathType Leaf)) {
    throw "built server entry not found: $serverEntry"
}

$serverUri = [Uri]$ServerBaseUrl
$nginxUri = [Uri]$NginxBaseUrl
Assert-PortFree $serverUri.Port
Assert-PortFree $nginxUri.Port

$nodeExecutable = (Get-Command node.exe -ErrorAction Stop).Source
$serverProcess = $null
$nginxProcess = $null
$nginxStarted = $false
$nginxPrefix = "$NginxRoot/"

try {
    $serverProcess = Start-Process `
        -FilePath $nodeExecutable `
        -ArgumentList @("dist/index.js") `
        -WorkingDirectory $ServerRoot `
        -WindowStyle Hidden `
        -PassThru

    [void](Wait-Http "$ServerBaseUrl/api/health")

    $nginxArguments = '-p "' + $nginxPrefix + '" -c "' + $ConfigPath + '"'
    $nginxProcess = Start-Process `
        -FilePath $nginxExecutable `
        -ArgumentList $nginxArguments `
        -WindowStyle Hidden `
        -PassThru
    $nginxStarted = $true
    [void](Wait-Http "$NginxBaseUrl/")

    $checks = @(
        [pscustomobject]@{ Name = "home"; Url = "$NginxBaseUrl/" },
        [pscustomobject]@{ Name = "deep-route"; Url = "$NginxBaseUrl/labs/client/mitb/fixed" },
        [pscustomobject]@{ Name = "proxy-health"; Url = "$NginxBaseUrl/api/health" },
        [pscustomobject]@{ Name = "proxy-db"; Url = "$NginxBaseUrl/api/health/db" },
        [pscustomobject]@{ Name = "proxy-labs"; Url = "$NginxBaseUrl/api/labs" }
    )

    foreach ($check in $checks) {
        $response = Invoke-WebRequest -UseBasicParsing $check.Url -TimeoutSec 10
        if ($response.StatusCode -ne 200) {
            throw "$($check.Name) returned status $($response.StatusCode)"
        }

        Write-Output "$($check.Name) status=$($response.StatusCode) bytes=$($response.Content.Length)"
    }

    $labsResponse = Invoke-RestMethod "$NginxBaseUrl/api/labs" -TimeoutSec 10
    if ($labsResponse.total -ne 65 -or @($labsResponse.items).Count -ne 65) {
        throw "unexpected lab registry count: total=$($labsResponse.total); items=$(@($labsResponse.items).Count)"
    }

    Write-Output "lab-count=65"

    if ($RunAuthenticatedChecks) {
        $demoPassword = $env:NETWORK_SAFE_DEMO_PASSWORD
        if (-not $demoPassword) {
            throw "NETWORK_SAFE_DEMO_PASSWORD is required for authenticated checks"
        }

        $loginBody = @{ username = $DemoUsername; password = $demoPassword } | ConvertTo-Json -Compress
        $loginResponse = Invoke-JsonRequest "POST" "$NginxBaseUrl/api/auth/login" @{} $loginBody
        if ($loginResponse.StatusCode -ne 200 -or -not $loginResponse.Body.token -or $loginResponse.Body.user.username -ne $DemoUsername) {
            throw "authenticated login failed"
        }

        $authHeaders = @{ authorization = "Bearer $($loginResponse.Body.token)" }
        $meResponse = Invoke-JsonRequest "GET" "$NginxBaseUrl/api/auth/me" $authHeaders
        if ($meResponse.StatusCode -ne 200 -or $meResponse.Body.user.username -ne $DemoUsername) {
            throw "current-user check failed"
        }

        $workbenchResponse = Invoke-JsonRequest "GET" "$NginxBaseUrl/api/labs/network/mitm/workbench"
        if ($workbenchResponse.StatusCode -ne 200 -or -not $workbenchResponse.Body.workbench) {
            throw "guided workbench check failed"
        }

        $workbench = $workbenchResponse.Body.workbench
        $scenarioKey = $workbench.defaultScenarioKey
        $blockedControls = @($workbench.controls | Where-Object { $_.fixedDecision -eq "blocked" })
        $acceptedControls = @($workbench.controls | Where-Object { $_.fixedDecision -eq "accepted" })
        if (-not $scenarioKey -or $blockedControls.Count -eq 0 -or $acceptedControls.Count -eq 0) {
            throw "guided workbench controls are incomplete"
        }

        $vulnerableBody = @{ scenarioKey = $scenarioKey; controlKey = $blockedControls[0].key } | ConvertTo-Json -Compress
        $vulnerableResponse = Invoke-JsonRequest "POST" "$NginxBaseUrl/api/labs/network/mitm/vuln/evaluate" $authHeaders $vulnerableBody
        if ($vulnerableResponse.StatusCode -ne 200 -or $vulnerableResponse.Body.result.decision -ne "accepted") {
            throw "guided vulnerable evaluation check failed"
        }

        $blockedBody = @{ scenarioKey = $scenarioKey; controlKey = $blockedControls[0].key } | ConvertTo-Json -Compress
        $blockedResponse = Invoke-JsonRequest "POST" "$NginxBaseUrl/api/labs/network/mitm/fixed/evaluate" $authHeaders $blockedBody
        if ($blockedResponse.StatusCode -ne 403 -or $blockedResponse.Body.result.decision -ne "blocked") {
            throw "guided fixed blocked evaluation check failed"
        }

        $acceptedBody = @{ scenarioKey = $scenarioKey; controlKey = $acceptedControls[0].key } | ConvertTo-Json -Compress
        $acceptedResponse = Invoke-JsonRequest "POST" "$NginxBaseUrl/api/labs/network/mitm/fixed/evaluate" $authHeaders $acceptedBody
        if ($acceptedResponse.StatusCode -ne 200 -or $acceptedResponse.Body.result.decision -ne "accepted") {
            throw "guided fixed accepted evaluation check failed"
        }

        $eventResponse = Invoke-JsonRequest "GET" "$NginxBaseUrl/api/lab-event-logs/me?labKey=network.mitm" $authHeaders
        if ($eventResponse.StatusCode -ne 200 -or @($eventResponse.Body.events).Count -eq 0) {
            throw "event-log check failed"
        }

        $traceId = @($eventResponse.Body.events)[0].traceId
        $recapResponse = Invoke-JsonRequest "GET" "$NginxBaseUrl/api/lab-recap-question-completions/me?labKey=network.mitm&traceIds=$traceId" $authHeaders
        if ($recapResponse.StatusCode -ne 200) {
            throw "recap read check failed"
        }

        $recapBody = @{ traceId = $traceId; labKey = "network.mitm"; questionIndex = 0; completed = $true } | ConvertTo-Json -Compress
        $recapWriteResponse = Invoke-JsonRequest "PUT" "$NginxBaseUrl/api/lab-recap-question-completions/me" $authHeaders $recapBody
        if ($recapWriteResponse.StatusCode -ne 200 -or -not $recapWriteResponse.Body.item.completed) {
            throw "recap write check failed"
        }

        $logoutResponse = Invoke-JsonRequest "POST" "$NginxBaseUrl/api/auth/logout" $authHeaders
        if ($logoutResponse.StatusCode -ne 200 -or $logoutResponse.Body.status -ne "ok") {
            throw "logout check failed"
        }

        Write-Output "authenticated-login-pass"
        Write-Output "guided-vulnerable-fixed-pass"
        Write-Output "event-log-recap-pass"
    }

    Write-Output "NGINX_RUNTIME_ACCEPTANCE_PASS"
}
finally {
    if ($nginxStarted) {
        $stopArguments = '-p "' + $nginxPrefix + '" -c "' + $ConfigPath + '" -s quit'
        $stopProcess = Start-Process `
            -FilePath $nginxExecutable `
            -ArgumentList $stopArguments `
            -WindowStyle Hidden `
            -Wait `
            -PassThru

        if ($stopProcess.ExitCode -ne 0) {
            Write-Warning "nginx stop returned exit code $($stopProcess.ExitCode)"
        }
    }

    if ($serverProcess -and -not $serverProcess.HasExited) {
        Stop-Process -Id $serverProcess.Id -Force
    }

    $escapedConfigPath = [WildcardPattern]::Escape($ConfigPath)
    Get-CimInstance Win32_Process -Filter "Name = 'nginx.exe'" |
        Where-Object { $_.CommandLine -like "*$escapedConfigPath*" } |
        ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

    Start-Sleep -Milliseconds 500
}
