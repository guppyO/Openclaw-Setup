param(
  [ValidateSet("lab", "stage", "prod")]
  [string]$Environment = $(if ($env:REVENUE_OS_ENVIRONMENT) { $env:REVENUE_OS_ENVIRONMENT } else { "stage" }),
  [string]$Host = $env:LIVE_VPS_HOST,
  [string]$User = $(if ($env:LIVE_VPS_USER) { $env:LIVE_VPS_USER } else { "root" }),
  [int]$LocalPort = 0,
  [int]$RemotePort = 0
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

if (-not $Host) {
  throw "Set LIVE_VPS_HOST or pass -Host before starting the SSH tunnel."
}

$remotePortValue = if ($RemotePort -gt 0) { $RemotePort } else { Get-DefaultPort $Environment }
$localPortValue = if ($LocalPort -gt 0) { $LocalPort } else { $remotePortValue }

Update-LocalEnv -Key "OPENCLAW_REMOTE_ACCESS_MODE" -Value "ssh-tunnel"
Update-LocalEnv -Key "OPENCLAW_GATEWAY_PORT" -Value "$localPortValue"
Update-LocalEnv -Key "OPENCLAW_GATEWAY_BASE_URL" -Value "http://127.0.0.1:$localPortValue"

Write-Host "Starting SSH tunnel on local port $localPortValue to $User@$Host:127.0.0.1:$remotePortValue"
Write-Host "This process stays attached. Keep it running while the Windows node host or attached Chrome uses the remote gateway."

ssh -N -L "${localPortValue}:127.0.0.1:${remotePortValue}" "$User@$Host"
