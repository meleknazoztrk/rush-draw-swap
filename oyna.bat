@echo off
chcp 65001 >nul
title Rush Draw Swap - Oyun Baslatici
echo ========================================================
echo   ⚡ RUSH DRAW SWAP - OYUN SUNUCUSU BASLATILIYOR
echo ========================================================
echo.

:: Mevcut node ve cloudflared islemlerini temizle
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM cloudflared.exe >nul 2>&1

:: Node sunucusunu baslat
start "Rush Server" cmd /k "node server.js"
timeout /t 2 /nobreak >nul

:: Cloudflare internet tunelini baslat (Dunya capinda erisim)
echo 🌐 Internet Tuneli Aciliyor...
start "Rush Internet Tunnel" cmd /k "cloudflared tunnel --url http://localhost:3000"

:: Tarayicida ac
timeout /t 2 /nobreak >nul
start http://localhost:3000

echo.
echo ✅ Oyun yerel olarak acildi!
echo 🌍 Internetten baglanacak arkadaslariniz icin acilan 
echo    'Rush Internet Tunnel' penceresindeki https://xxx.trycloudflare.com
echo    linkini arkadaslariniza gonderebilirsiniz!
echo.
pause
