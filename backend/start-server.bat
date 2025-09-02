@echo off
cd /d "%~dp0"
echo Starting Dino Runner Server...
echo.
echo Server will run on port 3001
echo ngrok tunnel will be available at: https://ee22498c9c41.ngrok-free.app
echo.
echo Press Ctrl+C to stop the server
echo.
npm start
pause
