$ErrorActionPreference = "Stop"

Write-Host "Checking local tooling..."
$tools = "node", "npm", "git", "codex"
foreach ($tool in $tools) {
  if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
    throw "Missing required tool: $tool"
  }
}

Write-Host "Install the OpenClaw Chrome extension, keep Codex signed in, and pair the attached browser relay before using authenticated browser flows."
