$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectDir

if (-not (Test-Path "dist")) {
    Write-Host "[INFO] Pasta /dist nao encontrada. Gerando build..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERRO] Build falhou." -ForegroundColor Red
        Read-Host "Pressione Enter para sair"
        exit 1
    }
}

Write-Host ""
Write-Host " ==========================================" -ForegroundColor Cyan
Write-Host "  Gestao de Investimentos" -ForegroundColor Cyan
Write-Host "  http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Pressione Ctrl+C para encerrar" -ForegroundColor Cyan
Write-Host " ==========================================" -ForegroundColor Cyan
Write-Host ""

Start-Job -ScriptBlock { Start-Sleep 2; Start-Process "http://localhost:3000" } | Out-Null

npx serve dist
