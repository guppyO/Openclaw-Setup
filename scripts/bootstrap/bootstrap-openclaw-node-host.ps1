param(
  [string]$NodeName = $(if ($env:OPENCLAW_NODE_HOST_ID) { $env:OPENCLAW_NODE_HOST_ID } else { "windows-browser" }),
  [string]$DisplayName = $(if ($env:OPENCLAW_NODE_DISPLAY_NAME) { $env:OPENCLAW_NODE_DISPLAY_NAME } else { "Revenue OS Windows Browser" }),
  [ValidateSet("lab", "stage", "prod")]
  [string]$Environment = $(if ($env:REVENUE_OS_ENVIRONMENT) { $env:REVENUE_OS_ENVIRONMENT } else { "stage" }),
  [string]$GatewayHost = "127.0.0.1",
  [int]$GatewayPort = 0,
  [switch]$InstallOnly
)

function Get-RepoRoot() {
  return [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\.."))
}

function Get-DefaultPort([string]$Name) {
  switch ($Name) {
    "lab" { return 4101 }
    "stage" { return 4201 }
    default { return 4301 }
  }
}

function Update-LocalEnv([string]$Key, [string]$Value) {
  $repoRoot = Get-RepoRoot
  $resolvedEnvPath = Join-Path $repoRoot ".secrets\revenue-os.local.env"
  if (-not (Test-Path $resolvedEnvPath)) {
    return
  }

  $content = Get-Content $resolvedEnvPath -Raw
  $escapedKey = [Regex]::Escape($Key)
  $line = "$Key=$Value"
  if ($content -match "(?m)^$escapedKey=") {
    $content = [Regex]::Replace($content, "(?m)^$escapedKey=.*$", $line)
  } else {
    if ($content.Length -gt 0 -and -not $content.EndsWith("`n")) {
      $content += "`n"
    }
    $content += "$line`n"
  }
  Set-Content -Path $resolvedEnvPath -Value $content -NoNewline
}

function Import-LocalRuntimeEnv() {
  $repoRoot = Get-RepoRoot
  $resolvedEnvPath = Join-Path $repoRoot ".secrets\revenue-os.local.env"
  if (-not (Test-Path $resolvedEnvPath)) {
    return
  }

  foreach ($rawLine in Get-Content $resolvedEnvPath) {
    $line = $rawLine.Trim()
    if (-not $line -or $line.StartsWith("#")) {
      continue
    }

    $parts = $line -split "=", 2
    if ($parts.Length -ne 2) {
      continue
    }

    $key = $parts[0].Trim()
    $value = $parts[1].Trim()
    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
  }
}

if (-not (Get-Command openclaw -ErrorAction SilentlyContinue)) {
  if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "npm is required to install OpenClaw on the Windows node host."
  }
  npm install -g openclaw@latest
}

Import-LocalRuntimeEnv

$gatewayPortValue = if ($GatewayPort -gt 0) { $GatewayPort } elseif ($env:OPENCLAW_GATEWAY_PORT) { [int]$env:OPENCLAW_GATEWAY_PORT } else { Get-DefaultPort $Environment }
$gatewayToken = $env:OPENCLAW_GATEWAY_TOKEN
if (-not $gatewayToken) {
  throw "OPENCLAW_GATEWAY_TOKEN is required before installing or running the Windows node host."
}

$gatewayBaseUrl = if ($env:OPENCLAW_GATEWAY_BASE_URL) { $env:OPENCLAW_GATEWAY_BASE_URL } else { "http://$GatewayHost:$gatewayPortValue" }
$remoteMode = if ($env:OPENCLAW_REMOTE_ACCESS_MODE) { $env:OPENCLAW_REMOTE_ACCESS_MODE } else { "local" }

[System.Environment]::SetEnvironmentVariable("OPENCLAW_GATEWAY_TOKEN", $gatewayToken, "Process")
[System.Environment]::SetEnvironmentVariable("OPENCLAW_GATEWAY_BASE_URL", $gatewayBaseUrl, "Process")

if ($remoteMode -ne "local" -and -not $env:OPENCLAW_GATEWAY_BASE_URL) {
  Update-LocalEnv -Key "OPENCLAW_GATEWAY_BASE_URL" -Value $gatewayBaseUrl
}

Update-LocalEnv -Key "OPENCLAW_NODE_HOST_ID" -Value $NodeName
Update-LocalEnv -Key "OPENCLAW_NODE_DISPLAY_NAME" -Value $DisplayName
Update-LocalEnv -Key "OPENCLAW_GATEWAY_PORT" -Value "$gatewayPortValue"
Update-LocalEnv -Key "OPENCLAW_NODE_HOST_STATUS" -Value "configured"

openclaw node install --host $GatewayHost --port $gatewayPortValue --node-id $NodeName --display-name $DisplayName

if ($InstallOnly) {
  Write-Host "Installed node host $NodeName for $GatewayHost:$gatewayPortValue using OPENCLAW_GATEWAY_TOKEN from the local secret env. Run this script again without -InstallOnly to start it."
  exit 0
}

Update-LocalEnv -Key "OPENCLAW_NODE_HOST_STATUS" -Value "ready"
Write-Host "Starting OpenClaw node host $NodeName against $GatewayHost:$gatewayPortValue"
openclaw node run --host $GatewayHost --port $gatewayPortValue --node-id $NodeName
