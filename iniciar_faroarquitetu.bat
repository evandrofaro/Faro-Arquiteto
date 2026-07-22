@echo off
chcp 65001 > nul
title Estação Unificada - Arquitetura Faro
echo ===================================================
echo 🚀 Iniciando o Suporte Central da Arquitetura Faro
echo ===================================================
echo.

:: Força o uso do Python 3.12 para evitar inconsistências de CPU/Alpha
py -3.12 --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set PYTHON_CMD=py -3.12
) else (
    set PYTHON_CMD=python
)

%PYTHON_CMD% main.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Ocorreu um erro ao executar a Arquitetura Faro.
    echo Certifique-se de que o Python 3.12 está instalado.
    echo.
    pause
)