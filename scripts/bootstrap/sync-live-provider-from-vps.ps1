param(
  [ValidateSet("lab", "stage", "prod")]
  [string]$Environment = $(if ($env:REVENUE_OS_ENVIRONMENT) { $env:REVENUE_OS_ENVIRONMENT } else { "stage" }),
  [string]$GatewayHost = $env:LIVE_VPS_HOST,
  [string]$User = $(if ($env:LIVE_VPS_USER) { $env:LIVE_VPS_USER } else { "root" }),
  [string]$RuntimeUser = $(if ($env:LIVE_VPS_RUNTIME_USER) { $env:LIVE_VPS_RUNTIME_USER } else { "revenueos" }),
  [string]$RemoteRepoDir = $(if ($env:REMOTE_REPO_DIR) { $env:REMOTE_REPO_DIR } else { "/opt/revenue-os" }),
  [string]$SshKey = $(if ($env:LIVE_VPS_SSH_KEY) { $env:LIVE_VPS_SSH_KEY } elseif (Test-Path (Join-Path $HOME ".ssh\hetzner_ed25519")) { Join-Path $HOME ".ssh\hetzner_ed25519" } else { "" })
)

function Get-RepoRoot() {
  return [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\.."))
}

function Update-LocalEnv([string]$Key, [string]$Value) {
  $repoRoot = Get-RepoRoot
  $resolvedEnvPath = Join-Path $repoRoot ".secrets\revenue-os.local.env"
  if (-not (Test-Path $resolvedEnvPath)) {
    throw "Missing local env file at $resolvedEnvPath"
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

function Invoke-SshJson([string]$Command) {
  $output = Invoke-SshRaw $Command
  return $output | ConvertFrom-Json
}

function Invoke-SshRaw([string]$Command) {
  $sshArgs = @()
  if ($SshKey) {
    $sshArgs += @("-i", $SshKey)
  }
  $sshArgs += @("${User}@${GatewayHost}", $Command)
  $output = & ssh @sshArgs
  if ($LASTEXITCODE -ne 0) {
    throw "SSH command failed: $Command"
  }
  return $output
}

if (-not $GatewayHost) {
  throw "Set LIVE_VPS_HOST or pass -GatewayHost before syncing live provider metadata."
}

$remoteBin = (Invoke-SshRaw "cd $RemoteRepoDir && scripts/bootstrap/resolve-openclaw-bin.sh $RemoteRepoDir").Trim()
if (-not $remoteBin) {
  throw "Failed to resolve the remote OpenClaw binary path."
}

$remoteConfigPath = "$RemoteRepoDir/data/generated/openclaw/$Environment.json"
$statusCommand = "sudo -u $RuntimeUser -H bash -lc 'OPENCLAW_CONFIG_PATH=$remoteConfigPath $remoteBin models status --json'"
$listCommand = "sudo -u $RuntimeUser -H bash -lc 'OPENCLAW_CONFIG_PATH=$remoteConfigPath $remoteBin models list --provider openai-codex --json'"
$versionCommand = "sudo -u $RuntimeUser -H bash -lc '$remoteBin --version'"

$status = Invoke-SshJson $statusCommand
$list = Invoke-SshJson $listCommand
$version = (Invoke-SshRaw $versionCommand).Trim()

$primary = [string]$status.resolvedDefault
if (-not $primary) {
  $primary = [string]$status.defaultModel
}
if (-not $primary) {
  throw "Live provider primary model was empty."
}

$candidates = @()
if ($list.models) {
  foreach ($model in $list.models) {
    if ($model.key -and $model.available -ne $false) {
      $candidates += [string]$model.key
    }
  }
}

if ($candidates.Count -eq 0) {
  $candidates = @($primary)
}

$deep = $primary
if ($status.aliases -and $status.aliases.'frontier-deep') {
  $deep = [string]$status.aliases.'frontier-deep'
}

Update-LocalEnv -Key "OPENCLAW_LIVE_PROVIDER_PRIMARY" -Value $primary
Update-LocalEnv -Key "OPENCLAW_LIVE_PROVIDER_DEEP" -Value $deep
Update-LocalEnv -Key "OPENCLAW_LIVE_PROVIDER_CANDIDATES" -Value (($candidates | ConvertTo-Json -Compress))
Update-LocalEnv -Key "OPENCLAW_LIVE_RUNTIME_VERSION" -Value $version
Update-LocalEnv -Key "OPENCLAW_LIVE_RUNTIME_ENVIRONMENT" -Value $Environment

Write-Host "Synced live provider metadata from $GatewayHost"
Write-Host "Primary: $primary"
Write-Host "Deep: $deep"
Write-Host "Candidates: $($candidates -join ', ')"
Write-Host "Runtime version: $version"
