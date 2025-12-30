@echo off
echo ============================================================
echo Starting Chrome with Remote Debugging on port 9222
echo ============================================================
echo.
echo 1. Chrome will open with debugging enabled
echo 2. Navigate to https://diablo.trade
echo 3. Solve any captcha and login
echo 4. Then run: npm run track-prices
echo.
echo ============================================================

REM Try common Chrome locations
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="%TEMP%\chrome-debug-profile"
    goto :done
)

if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="%TEMP%\chrome-debug-profile"
    goto :done
)

if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    start "" "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="%TEMP%\chrome-debug-profile"
    goto :done
)

echo Chrome not found in common locations!
echo Please run manually: chrome.exe --remote-debugging-port=9222
pause
goto :end

:done
echo.
echo Chrome started! Waiting 5 seconds...
timeout /t 5 /nobreak > nul
echo.
echo Testing connection...
curl -s http://127.0.0.1:9222/json/version > nul 2>&1
if %ERRORLEVEL% == 0 (
    echo SUCCESS! Chrome is ready for remote debugging.
) else (
    echo WARNING: Could not verify connection. Chrome might still be starting.
)
echo.
echo Now navigate to diablo.trade in Chrome, solve captcha, then run:
echo   npm run track-prices
echo.

:end
pause
