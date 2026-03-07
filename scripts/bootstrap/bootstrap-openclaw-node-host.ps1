param(
  [string]$NodeName = $(if ($env:OPENCLAW_NODE_HOST_ID) { $env:OPENCLAW_NODE_HOST_ID } else { "windows-browser" }),
  [ValidateSet("lab", "stage", "prod")]
  [string]$Environment = $(if ($env:REVENUE_OS_ENVIRONMENT) { $env:REVENUE_OS_ENVIRONMENT } else { "stage" }),
  [string]$GatewayHost = "127.0.0.1",
  [int]$GatewayPort = 0,
  [switch]$InstallOnly
)

function Get-DefaultPort([string]$Name) {
  switch ($Name) {
    "lab" { return 4101 }
    "stage" { return 4201 }
    default { return 4301 }
  }
}

function Update-LocalEnv([string]$Key, [string]$Value) {
  $repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\.."))
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

if (-not (Get-Command openclaw -ErrorAction SilentlyContinue)) {
  if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "npm is required to install OpenClaw on the Windows node host."
  }
  npm install -g @openclaw/cli
}

$gatewayPortValue = if ($GatewayPort -gt 0) { $GatewayPort } elseif ($env:OPENCLAW_GATEWAY_PORT) { [int]$env:OPENCLAW_GATEWAY_PORT } else { Get-DefaultPort $Environment }

Update-LocalEnv -Key "OPENCLAW_NODE_HOST_ID" -Value $NodeName
Update-LocalEnv -Key "OPENCLAW_GATEWAY_PORT" -Value "$gatewayPortValue"
Update-LocalEnv -Key "OPENCLAW_NODE_HOST_STATUS" -Value "configured"

openclaw nodes install $NodeName --host $GatewayHost --port $gatewayPortValue

if ($InstallOnly) {
  Write-Host "Installed node host $NodeName for $GatewayHost:$gatewayPortValue. Run this script again without -InstallOnly to start it."
  exit 0
}

Update-LocalEnv -Key "OPENCLAW_NODE_HOST_STATUS" -Value "ready"
Write-Host "Starting OpenClaw node host $NodeName against $GatewayHost:$gatewayPortValue"
openclaw nodes run $NodeName --host $GatewayHost --port $gatewayPortValue
