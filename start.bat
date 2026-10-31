@echo off
echo ========================================================
echo Starting BlueCode OS PayU MERN Application
echo ========================================================

start "BlueCode OS - Backend API (:5001)" cmd /k "cd BlueCodeOS-PayU-MERN\server && npm run dev"
timeout /t 2 /nobreak >nul
start "BlueCode OS - Frontend (:5173)" cmd /k "cd BlueCodeOS-PayU-MERN\client && npm run dev"

echo.
echo Both Frontend (http://localhost:5173) and Backend (http://localhost:5001) are starting up!
echo Press any key to exit this launcher window...
pause >nul
