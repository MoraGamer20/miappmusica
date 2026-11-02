@echo off
title DeezerHub - Descargador de Canciones Completas (320 kbps)
color 0b
echo ===================================================================
echo   Deezer Library Hub - Servidor de Descargas Oficial (320 kbps)
echo ===================================================================
echo.
echo [*] Verificando dependencias...
where ffmpeg >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    if not exist ffmpeg.exe (
        echo [!] Descargando FFmpeg para conversion de audio a 320 kbps...
    )
)

echo [*] Iniciando tunel seguro para tu vivo Y53s y otros celulares...
start /b cmd /c "npx localtunnel --port 5000 --subdomain deezermusicgrabber"

echo [*] Iniciando servidor de descarga en segundo plano...
echo [*] Tu celular conectado a Wi-Fi o Datos puede descargar ahora directamente!
echo.
python server_grabber.py
pause
