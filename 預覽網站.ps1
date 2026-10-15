$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$taskNodeCommand = Get-Command node -ErrorAction SilentlyContinue
if ($taskNodeCommand) {
    $taskNodePath = $taskNodeCommand.Source
} else {
    $taskNodePath = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
}
if (-not (Test-Path -LiteralPath $taskNodePath)) { throw '找不到 Node.js，請使用 Node.js 22 以上版本。' }
& $taskNodePath scripts/build.mjs
if ($LASTEXITCODE -ne 0) { throw '建置失敗。' }
& $taskNodePath scripts/serve.mjs
