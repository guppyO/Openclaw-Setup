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

function Get-SourceWrapperPath() {
  if ($env:OPENCLAW_SOURCE_DIR) {
    return Join-Path $env:OPENCLAW_SOURCE_DIR "bin\openclaw-source.cmd"
  }

  $homeWrapper = Join-Path $HOME ".revenue-os\openclaw-source\bin\openclaw-source.cmd"
  if (Test-Path $homeWrapper) {
    return $homeWrapper
  }

  $repoRoot = Get-RepoRoot
  return Join-Path $repoRoot "vendor\openclaw-source\bin\openclaw-source.cmd"
}

function Resolve-OpenClawCommand() {
  $explicit = $env:OPENCLAW_BIN
  if ($explicit) {
    if ((Test-Path $explicit) -or (Get-Command $explicit -ErrorAction SilentlyContinue)) {
      return $explicit
    }
  }

  $sourceWrapper = Get-SourceWrapperPath
  if (Test-Path $sourceWrapper) {
    return $sourceWrapper
  }

  $installChannel = if ($env:OPENCLAW_INSTALL_CHANNEL) { $env:OPENCLAW_INSTALL_CHANNEL } else { "source-pinned" }
  if ($installChannel -ne "release") {
    $repoRoot = Get-RepoRoot
    $installScript = Join-Path $repoRoot "scripts\bootstrap\install-openclaw-source.ps1"
    if (Test-Path $installScript) {
      & $installScript
      if ($LASTEXITCODE -ne 0) {
        throw "Failed to install source-built OpenClaw for the Windows node host."
      }
      if (Test-Path $sourceWrapper) {
        return $sourceWrapper
      }
    }
  }

  $globalCommand = Get-Command openclaw -ErrorAction SilentlyContinue
  if ($globalCommand) {
    return $globalCommand.Source
  }

  if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "npm is required to install OpenClaw on the Windows node host."
  }
  npm install -g openclaw@latest
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to install the OpenClaw CLI."
  }

  $installedCommand = Get-Command openclaw -ErrorAction SilentlyContinue
  if (-not $installedCommand) {
    throw "OpenClaw CLI is still unavailable after installation."
  }
  return $installedCommand.Source
}

function Invoke-OpenClawCommand([string]$OpenClawCommand, [string[]]$Arguments) {
  & $OpenClawCommand @Arguments
}

function Update-LocalEnv([string]$Key, [string]$Value) {
  $repoRoot = Get-RepoRoot
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

function ConvertTo-Hashtable([object]$Value) {
  if ($null -eq $Value) {
    return $null
  }

  if ($Value -is [System.Collections.IDictionary]) {
    $dictionary = @{}
    foreach ($key in $Value.Keys) {
      $dictionary[$key] = ConvertTo-Hashtable $Value[$key]
    }
    return $dictionary
  }

  if (($Value -is [System.Collections.IEnumerable]) -and -not ($Value -is [string])) {
    $items = @()
    foreach ($item in $Value) {
      $items += ,(ConvertTo-Hashtable $item)
    }
    return $items
  }

  if ($Value -is [psobject]) {
    $dictionary = @{}
    foreach ($property in $Value.PSObject.Properties) {
      $dictionary[$property.Name] = ConvertTo-Hashtable $property.Value
    }
    return $dictionary
  }

  return $Value
}

function Convert-ToWebSocketUrl([string]$Url) {
  if ($Url.StartsWith("https://")) {
    return "wss://" + $Url.Substring(8)
  }
  if ($Url.StartsWith("http://")) {
    return "ws://" + $Url.Substring(7)
  }
  return $Url
}

function Update-UserOpenClawRemoteConfig([string]$GatewayBaseUrl, [string]$GatewayToken) {
  $configDir = Join-Path $HOME ".openclaw"
  $configPath = Join-Path $configDir "openclaw.json"
  $config = @{}

  if (Test-Path $configPath) {
    $existing = ConvertTo-Hashtable (Get-Content $configPath -Raw | ConvertFrom-Json)
    if ($existing) {
      $config = $existing
    }
  }

  if (-not $config.ContainsKey("meta")) {
    $config["meta"] = @{}
  }
  if (-not $config.ContainsKey("wizard")) {
    $config["wizard"] = @{}
  }

  $config["meta"]["lastTouchedAt"] = (Get-Date).ToString("o")
  $config["wizard"]["lastRunMode"] = "remote"
  $config["gateway"] = @{
    mode = "remote"
    remote = @{
      url = Convert-ToWebSocketUrl $GatewayBaseUrl
      token = $GatewayToken
    }
  }

  $json = $config | ConvertTo-Json -Depth 20
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.Directory]::CreateDirectory($configDir) | Out-Null
  [System.IO.File]::WriteAllText($configPath, $json, $utf8NoBom)
}

Import-LocalRuntimeEnv

$openClawCommand = Resolve-OpenClawCommand
[System.Environment]::SetEnvironmentVariable("OPENCLAW_BIN", $openClawCommand, "Process")
Update-LocalEnv -Key "OPENCLAW_BIN" -Value $openClawCommand

$gatewayPortValue = if ($GatewayPort -gt 0) { $GatewayPort } elseif ($env:OPENCLAW_GATEWAY_PORT) { [int]$env:OPENCLAW_GATEWAY_PORT } else { Get-DefaultPort $Environment }
$gatewayToken = $env:OPENCLAW_GATEWAY_TOKEN
if (-not $gatewayToken) {
  throw "OPENCLAW_GATEWAY_TOKEN is required before installing or running the Windows node host."
}

$gatewayBaseUrl = if ($env:OPENCLAW_GATEWAY_BASE_URL) { $env:OPENCLAW_GATEWAY_BASE_URL } else { "http://${GatewayHost}:$gatewayPortValue" }
$remoteMode = if ($env:OPENCLAW_REMOTE_ACCESS_MODE) { $env:OPENCLAW_REMOTE_ACCESS_MODE } else { "local" }

[System.Environment]::SetEnvironmentVariable("OPENCLAW_GATEWAY_TOKEN", $gatewayToken, "Process")
[System.Environment]::SetEnvironmentVariable("OPENCLAW_GATEWAY_BASE_URL", $gatewayBaseUrl, "Process")
Update-UserOpenClawRemoteConfig -GatewayBaseUrl $gatewayBaseUrl -GatewayToken $gatewayToken

if ($remoteMode -ne "local" -and -not $env:OPENCLAW_GATEWAY_BASE_URL) {
  Update-LocalEnv -Key "OPENCLAW_GATEWAY_BASE_URL" -Value $gatewayBaseUrl
}

Update-LocalEnv -Key "OPENCLAW_NODE_HOST_ID" -Value $NodeName
Update-LocalEnv -Key "OPENCLAW_NODE_DISPLAY_NAME" -Value $DisplayName
Update-LocalEnv -Key "OPENCLAW_GATEWAY_PORT" -Value "$gatewayPortValue"
Update-LocalEnv -Key "OPENCLAW_CHROME_PROFILE_CDP_PORT" -Value "$($gatewayPortValue + 3)"
Update-LocalEnv -Key "OPENCLAW_ATTACHED_CHROME_CDP_PORT" -Value "$($gatewayPortValue + 3)"
Update-LocalEnv -Key "OPENCLAW_NODE_HOST_STATUS" -Value "configured"

$installSucceeded = $true
Invoke-OpenClawCommand -OpenClawCommand $openClawCommand -Arguments @("node", "install", "--host", $GatewayHost, "--port", "$gatewayPortValue", "--node-id", $NodeName, "--display-name", $DisplayName)
if ($LASTEXITCODE -ne 0) {
  $installSucceeded = $false
  Write-Warning "Node install failed with exit code $LASTEXITCODE. Continuing with user-mode node host run."
}

if ($InstallOnly) {
  if ($installSucceeded) {
    Write-Host "Installed node host $NodeName for ${GatewayHost}:$gatewayPortValue using OPENCLAW_GATEWAY_TOKEN from the local secret env. Run this script again without -InstallOnly to start it."
  } else {
    Write-Host "Node host install was skipped or failed for ${GatewayHost}:$gatewayPortValue. Run this script without -InstallOnly to start the node host in user mode."
  }
  exit 0
}

Update-LocalEnv -Key "OPENCLAW_NODE_HOST_STATUS" -Value "ready"
Write-Host "Starting OpenClaw node host $NodeName against ${GatewayHost}:$gatewayPortValue using $openClawCommand"
Invoke-OpenClawCommand -OpenClawCommand $openClawCommand -Arguments @("node", "run", "--host", $GatewayHost, "--port", "$gatewayPortValue", "--node-id", $NodeName)
