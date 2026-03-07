param(
  [ValidateSet("lab", "stage", "prod")]
  [string]$Environment = $(if ($env:REVENUE_OS_ENVIRONMENT) { $env:REVENUE_OS_ENVIRONMENT } else { "stage" }),
  [string]$Host = $env:LIVE_VPS_HOST,
  [string]$User = $(if ($env:LIVE_VPS_USER) { $env:LIVE_VPS_USER } else { "root" }),
  [int]$LocalPort = 0,
  [int]$RemotePort = 0,
  [switch]$EnableSteelTunnel = $(if ($env:STEEL_MODE -eq "self-hosted" -and $env:STEEL_SELF_HOSTED_PUBLIC_READY -eq "true") { $true } else { $false }),
  [int]$LocalSteelPort = $(if ($env:STEEL_LOCAL_PORT) { [int]$env:STEEL_LOCAL_PORT } else { 4300 }),
  [int]$RemoteSteelPort = $(if ($env:STEEL_REMOTE_PORT) { [int]$env:STEEL_REMOTE_PORT } else { 3000 })
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
  $escapedValue = ConvertTo-Json -Compress -InputObject $Value
  $line = "${Key}=${escapedValue}"
  if ($content -match "(?m)^$escapedKey=") {
    $content = [Regex]::Replace($content, "(?m)^$escapedKey=.*$", $line)
  } else {
    if ($content.Length -gt 0 -and -not $content.EndsWith("`n")) {
      $content += "`n"
    }
    $content += "$line`n"
  }
  $content = $content -replace "`r`n", "`n" -replace "`r", "`n"
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($resolvedEnvPath, $content, $utf8NoBom)
}

if (-not $Host) {
  throw "Set LIVE_VPS_HOST or pass -Host before starting the SSH tunnel."
}

$remotePortValue = if ($RemotePort -gt 0) { $RemotePort } else { Get-DefaultPort $Environment }
$localPortValue = if ($LocalPort -gt 0) { $LocalPort } else { $remotePortValue }

Update-LocalEnv -Key "OPENCLAW_REMOTE_ACCESS_MODE" -Value "ssh-tunnel"
Update-LocalEnv -Key "OPENCLAW_GATEWAY_PORT" -Value "$localPortValue"
Update-LocalEnv -Key "OPENCLAW_GATEWAY_BASE_URL" -Value "http://127.0.0.1:$localPortValue"

if ($EnableSteelTunnel) {
  Update-LocalEnv -Key "STEEL_MODE" -Value "self-hosted"
  Update-LocalEnv -Key "STEEL_SELF_HOSTED_PUBLIC_READY" -Value "true"
  Update-LocalEnv -Key "STEEL_BASE_URL" -Value "http://127.0.0.1:$LocalSteelPort"
  Update-LocalEnv -Key "STEEL_LOCAL_PORT" -Value "$LocalSteelPort"
  Update-LocalEnv -Key "STEEL_REMOTE_PORT" -Value "$RemoteSteelPort"
}

Write-Host "Starting SSH tunnel on local port $localPortValue to $User@$Host:127.0.0.1:$remotePortValue"
Write-Host "This process stays attached. Keep it running while the Windows node host or attached Chrome uses the remote gateway."
$sshArgs = @("-N", "-L", "${localPortValue}:127.0.0.1:${remotePortValue}")
if ($EnableSteelTunnel) {
  Write-Host "Forwarding self-hosted Steel from local port $LocalSteelPort to $User@$Host:127.0.0.1:$RemoteSteelPort"
  $sshArgs += @("-L", "${LocalSteelPort}:127.0.0.1:${RemoteSteelPort}")
}
$sshArgs += "$User@$Host"

ssh @sshArgs
