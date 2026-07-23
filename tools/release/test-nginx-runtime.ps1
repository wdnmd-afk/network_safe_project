[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$NginxRoot,
    [Parameter(Mandatory = $true)]
    [string]$ConfigPath,
    [string]$ServerRoot = "",
    [string]$ServerBaseUrl = "http://127.0.0.1:6667",
    [string]$NginxBaseUrl = "http://127.0.0.1:8080"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

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
