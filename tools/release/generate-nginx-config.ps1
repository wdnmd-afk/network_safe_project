[CmdletBinding()]
param(
    [string]$NginxRoot = "",
    [string]$WebRoot = "",
    [string]$OutputConfig = "",
    [int]$ListenPort = 8080,
    [int]$ServerPort = 6667,
    [switch]$Validate
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-AbsolutePath([string]$PathValue) {
    return [System.IO.Path]::GetFullPath($PathValue)
}

function Convert-ToNginxPath([string]$PathValue) {
    $absolutePath = Resolve-AbsolutePath $PathValue
    return '"' + $absolutePath.Replace("\", "/") + '"'
}

function Assert-Port([int]$PortValue, [string]$Name) {
    if ($PortValue -lt 1 -or $PortValue -gt 65535) {
        throw "$Name must be between 1 and 65535"
    }
}

Assert-Port $ListenPort "ListenPort"
Assert-Port $ServerPort "ServerPort"

$scriptRoot = Resolve-AbsolutePath $PSScriptRoot
$templatePath = Join-Path $scriptRoot "../../nginx/network-safe.conf.template"

if (-not (Test-Path -LiteralPath $templatePath -PathType Leaf)) {
    throw "nginx template not found: $templatePath"
}

if (-not $NginxRoot) {
    $nginxCommand = Get-Command nginx.exe -ErrorAction SilentlyContinue

    if (-not $nginxCommand) {
        throw "nginx.exe was not found; pass -NginxRoot with the nginx installation directory"
    }

    $NginxRoot = Split-Path -Parent $nginxCommand.Source
}

$NginxRoot = Resolve-AbsolutePath $NginxRoot
$nginxExecutable = Join-Path $NginxRoot "nginx.exe"
$mimeTypesPath = Join-Path $NginxRoot "conf/mime.types"

if (-not (Test-Path -LiteralPath $nginxExecutable -PathType Leaf)) {
    throw "nginx executable not found: $nginxExecutable"
}

if (-not (Test-Path -LiteralPath $mimeTypesPath -PathType Leaf)) {
    throw "nginx mime.types not found: $mimeTypesPath"
}

if (-not $WebRoot) {
    $WebRoot = Join-Path $scriptRoot "../../apps/web/dist"
}

$WebRoot = Resolve-AbsolutePath $WebRoot
$webIndex = Join-Path $WebRoot "index.html"

if (-not (Test-Path -LiteralPath $webIndex -PathType Leaf)) {
    throw "frontend build index.html not found: $webIndex; run the web build first"
}

if (-not $OutputConfig) {
    $OutputConfig = Join-Path ([System.IO.Path]::GetTempPath()) "network-safe-nginx.conf"
}

$OutputConfig = Resolve-AbsolutePath $OutputConfig
$outputDirectory = Split-Path -Parent $OutputConfig

if (-not (Test-Path -LiteralPath $outputDirectory -PathType Container)) {
    New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
}

$logDirectory = Join-Path $NginxRoot "logs"
if (-not (Test-Path -LiteralPath $logDirectory -PathType Container)) {
    New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
}

$replacements = @{
    "__NGINX_ERROR_LOG__" = Convert-ToNginxPath (Join-Path $logDirectory "network-safe-error.log")
    "__NGINX_PID__" = Convert-ToNginxPath (Join-Path $logDirectory "network-safe.pid")
    "__NGINX_MIME_TYPES__" = Convert-ToNginxPath $mimeTypesPath
    "__NGINX_ACCESS_LOG__" = Convert-ToNginxPath (Join-Path $logDirectory "network-safe-access.log")
    "__WEB_ROOT__" = Convert-ToNginxPath $WebRoot
    "__LISTEN_PORT__" = [string]$ListenPort
    "__SERVER_PORT__" = [string]$ServerPort
}

$config = Get-Content -Raw -Encoding utf8 $templatePath
foreach ($placeholder in $replacements.Keys) {
    $config = $config.Replace($placeholder, $replacements[$placeholder])
}

if ($config -match "__[A-Z0-9_]+__") {
    throw "generated config still contains unresolved placeholders"
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($OutputConfig, $config, $utf8NoBom)

if ($Validate) {
    $nginxPrefix = "$NginxRoot/"
    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName = $nginxExecutable
    $startInfo.Arguments = '-t -p "' + $nginxPrefix + '" -c "' + $OutputConfig + '"'
    $startInfo.UseShellExecute = $false
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true
    $startInfo.CreateNoWindow = $true

    $validationProcess = New-Object System.Diagnostics.Process
    $validationProcess.StartInfo = $startInfo
    [void]$validationProcess.Start()
    $validationStandardOutput = $validationProcess.StandardOutput.ReadToEnd().Trim()
    $validationStandardError = $validationProcess.StandardError.ReadToEnd().Trim()
    $validationProcess.WaitForExit()
    $validationExitCode = $validationProcess.ExitCode

    if ($validationStandardOutput) {
        Write-Output $validationStandardOutput
    }

    if ($validationStandardError) {
        Write-Output $validationStandardError
    }

    if ($validationExitCode -ne 0) {
        throw "nginx config validation failed: $OutputConfig"
    }
}

Write-Output "generated nginx config: $OutputConfig"
Write-Output "web root: $WebRoot"
Write-Output "listen: $ListenPort; api upstream: $ServerPort"
