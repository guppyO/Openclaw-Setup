param(
  [string]$SourceRepo = $(if ($env:OPENCLAW_SOURCE_REPO) { $env:OPENCLAW_SOURCE_REPO } else { "https://github.com/openclaw/openclaw.git" }),
  [string]$SourceRef = $(if ($env:OPENCLAW_SOURCE_REF) { $env:OPENCLAW_SOURCE_REF } else { "84f5d7dc1d1b041382c126384c6eb28cad2f53fa" }),
  [string]$SourceDir = $(if ($env:OPENCLAW_SOURCE_DIR) { $env:OPENCLAW_SOURCE_DIR } else { (Join-Path $HOME ".revenue-os\openclaw-source") }),
  [string]$PnpmVersion = $(if ($env:OPENCLAW_SOURCE_PNPM_VERSION) { $env:OPENCLAW_SOURCE_PNPM_VERSION } else { "10.23.0" })
)

$ErrorActionPreference = "Stop"

function Get-RepoRoot() {
  return [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\.."))
}

function Update-LocalEnv([string]$Key, [string]$Value) {
  $repoRoot = Get-RepoRoot
  $envPath = Join-Path $repoRoot ".secrets\revenue-os.local.env"
  if (-not (Test-Path $envPath)) {
    return
  }

  $content = Get-Content $envPath -Raw
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
  [System.IO.File]::WriteAllText($envPath, $content, $utf8NoBom)
}

function Invoke-Step([string]$FilePath, [string[]]$Arguments, [string]$WorkingDirectory) {
  Push-Location $WorkingDirectory
  try {
    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
      throw "Command failed: $FilePath $($Arguments -join ' ')"
    }
  } finally {
    Pop-Location
  }
}

$repoRoot = Get-RepoRoot
$sourceDir = [System.IO.Path]::GetFullPath($SourceDir)
$binDir = Join-Path $sourceDir "bin"
$toolDir = Join-Path $sourceDir ".revenue-os-tools"
$wrapperCmd = Join-Path $binDir "openclaw-source.cmd"
$wrapperPs1 = Join-Path $binDir "openclaw-source.ps1"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw "git is required to install the OpenClaw source build."
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "node is required to install the OpenClaw source build."
}
if (-not (Get-Command corepack -ErrorAction SilentlyContinue)) {
  throw "corepack is required to install the OpenClaw source build."
}

[System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($sourceDir)) | Out-Null

if (Test-Path (Join-Path $sourceDir ".git")) {
  git -C $sourceDir fetch --depth 1 origin $SourceRef
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to fetch OpenClaw source ref $SourceRef"
  }
} else {
  git clone --depth 1 $SourceRepo $sourceDir
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to clone OpenClaw source repository."
  }
  git -C $sourceDir fetch --depth 1 origin $SourceRef
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to fetch OpenClaw source ref $SourceRef after clone."
  }
}

git -C $sourceDir checkout --force $SourceRef
if ($LASTEXITCODE -ne 0) {
  throw "Failed to checkout OpenClaw source ref $SourceRef"
}

corepack enable | Out-Null
corepack prepare "pnpm@$PnpmVersion" --activate | Out-Null
[System.IO.Directory]::CreateDirectory($toolDir) | Out-Null
[System.IO.File]::WriteAllText((Join-Path $toolDir "pnpm.cmd"), "@echo off`r`ncorepack pnpm %*`r`n", (New-Object System.Text.UTF8Encoding($false)))
$pnpmShellShim = @'
#!/usr/bin/env sh
corepack pnpm "$@"
'@
[System.IO.File]::WriteAllText((Join-Path $toolDir "pnpm"), $pnpmShellShim.Trim() + "`n", (New-Object System.Text.UTF8Encoding($false)))
$gitCmd = (Get-Command git -ErrorAction Stop).Source
$gitBashPath = Join-Path ([System.IO.Path]::GetDirectoryName([System.IO.Path]::GetDirectoryName($gitCmd))) "bin\bash.exe"
if (-not (Test-Path $gitBashPath)) {
  $fallbackGitBash = Join-Path ${env:ProgramFiles} "Git\bin\bash.exe"
  if (Test-Path $fallbackGitBash) {
    $gitBashPath = $fallbackGitBash
  } else {
    throw "Git Bash is required to build the OpenClaw source bundle on Windows."
  }
}
[System.IO.File]::WriteAllText((Join-Path $toolDir "bash.cmd"), "@echo off`r`n`"$gitBashPath`" %*`r`n", (New-Object System.Text.UTF8Encoding($false)))
$env:Path = "$toolDir;$env:Path"

Invoke-Step -FilePath "corepack" -Arguments @("pnpm", "install", "--frozen-lockfile") -WorkingDirectory $sourceDir
try {
  Invoke-Step -FilePath "corepack" -Arguments @("pnpm", "rebuild", "node-llama-cpp") -WorkingDirectory $sourceDir
} catch {
  Write-Warning "node-llama-cpp rebuild failed; continuing."
}
Invoke-Step -FilePath "corepack" -Arguments @("pnpm", "build") -WorkingDirectory $sourceDir
Invoke-Step -FilePath "corepack" -Arguments @("pnpm", "ui:build") -WorkingDirectory $sourceDir

[System.IO.Directory]::CreateDirectory($binDir) | Out-Null

$cmdBody = @"
@echo off
setlocal
set ROOT_DIR=%~dp0..
node "%ROOT_DIR%\openclaw.mjs" %*
"@
$ps1Body = @"
`$ErrorActionPreference = "Stop"
`$rootDir = Split-Path -Parent `$PSScriptRoot
& node (Join-Path `$rootDir "openclaw.mjs") @Args
exit `$LASTEXITCODE
"@
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($wrapperCmd, $cmdBody.Trim() + "`r`n", $utf8NoBom)
[System.IO.File]::WriteAllText($wrapperPs1, $ps1Body.Trim() + "`r`n", $utf8NoBom)

Update-LocalEnv -Key "OPENCLAW_BIN" -Value $wrapperCmd
Update-LocalEnv -Key "OPENCLAW_INSTALL_CHANNEL" -Value "source-pinned"
Update-LocalEnv -Key "OPENCLAW_SOURCE_REF" -Value $SourceRef
Update-LocalEnv -Key "OPENCLAW_SOURCE_DIR" -Value $sourceDir
Update-LocalEnv -Key "OPENCLAW_MODEL_PRIMARY" -Value "openai-codex/gpt-5.4"
Update-LocalEnv -Key "OPENCLAW_MODEL_DEEP" -Value "openai-codex/gpt-5.4"
Update-LocalEnv -Key "OPENCLAW_MODEL_FALLBACK" -Value "openai-codex/gpt-5.4"

Write-Host "Installed source-built OpenClaw at $sourceDir (ref $SourceRef)"
