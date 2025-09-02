# Dino Runner Server Startup Script
Write-Host "🚀 Starting Dino Runner Server..." -ForegroundColor Green
Write-Host ""

# Переходим в папку скрипта
Set-Location $PSScriptRoot

# Проверяем, что Node.js установлен
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js not found! Please install Node.js first." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Проверяем, что npm установлен
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm not found! Please install npm first." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Node.js and npm found" -ForegroundColor Green
Write-Host ""

# Запускаем сервер
Write-Host "🎮 Starting server on port 3001..." -ForegroundColor Yellow
Write-Host "🌐 ngrok tunnel: https://ee22498c9c41.ngrok-free.app" -ForegroundColor Cyan
Write-Host ""

try {
    npm start
} catch {
    Write-Host "❌ Error starting server: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
}
