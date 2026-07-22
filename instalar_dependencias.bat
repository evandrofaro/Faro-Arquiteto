@echo off
chcp 65001 > nul
title Instalação de Dependências - Arquitetura Faro
echo ===================================================
echo 🛠️  Instalando Dependências da Arquitetura Faro...
echo ===================================================
echo.

if not exist "models" (
    mkdir models
    echo [INFO] Pasta /models criada.
)

:: Tenta encontrar o interpretador correto
py --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set PYTHON_CMD=py
) else (
    set PYTHON_CMD=python
)

%PYTHON_CMD% -m pip install --upgrade pip
%PYTHON_CMD% -m pip install -r requirements.txt

echo.
echo ===================================================
echo ✅ Processo concluído!
echo ===================================================
pause