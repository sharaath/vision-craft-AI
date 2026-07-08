@echo off
:: Check for administrative privileges
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [ADMIN] Administrative privileges confirmed.
) else (
    echo [INFO] Requesting administrative privileges...
    powershell -Command "Start-Process -FilePath '%0' -ArgumentList 'am_admin' -Verb RunAs"
    exit /b
)

echo Adding Windows Defender Firewall rule for port 8000...
netsh advfirewall firewall add rule name="VisionCraftAI Flask Backend" dir=in action=allow protocol=TCP localport=8000

echo.
echo ===================================================
echo [SUCCESS] Firewall rule added successfully!
echo You can now connect physical devices on the local
echo Wi-Fi network to the local Flask backend at:
echo http://10.135.218.119:8000
echo ===================================================
echo.
pause
