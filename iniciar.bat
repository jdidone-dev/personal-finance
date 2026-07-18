@echo off
title Gestao de Investimentos
cd /d "%~dp0"

if not exist "dist" (
    echo [INFO] Pasta /dist nao encontrada. Gerando build...
    call npm run build
    if errorlevel 1 (
        echo.
        echo [ERRO] Build falhou. Verifique os erros acima.
        pause
        exit /b 1
    )
)

echo.
echo  ==========================================
echo   Gestao de Investimentos
echo   http://localhost:3000
echo   Pressione Ctrl+C para encerrar
echo  ==========================================
echo.

start /b cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3000"
npx serve dist
