# ==============================================================================
# SCRIPT DE EMPACOTAMENTO ZIP — FIXTUR / MYRESERVE PARA PAINEL INTEGRATOR
# ==============================================================================

Write-Host "Iniciando criacao do pacote de deploy..." -ForegroundColor Cyan

$sourceDir = (Get-Location).Path
$zipPath = Join-Path (Get-Item $sourceDir).Parent.FullName "myreserve-deploy.zip"

if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

$tempFolder = Join-Path $env:TEMP "myreserve_deploy_temp"
if (Test-Path $tempFolder) {
    Remove-Item $tempFolder -Recurse -Force
}
New-Item -ItemType Directory -Path $tempFolder | Out-Null

$excludeDirs = @("node_modules", ".next", ".git", ".vitest", "coverage", "scratch", "tmp", "temp")

Get-ChildItem -Path $sourceDir | ForEach-Object {
    if ($excludeDirs -notcontains $_.Name) {
        Copy-Item -Path $_.FullName -Destination $tempFolder -Recurse -Force
    }
}

Compress-Archive -Path "$tempFolder\*" -DestinationPath $zipPath -Force
Remove-Item $tempFolder -Recurse -Force

Write-Host "Pacote gerado com sucesso em: $zipPath" -ForegroundColor Green
