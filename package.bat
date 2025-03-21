@echo off
REM YouTube Looper Packaging Script
echo Packaging YouTube Looper extension...

REM Check if the zip file exists and try to remove it safely
if exist "youtube-looper.zip" (
    echo Found existing youtube-looper.zip. Attempting to remove...
    
    REM Try to delete the file
    del /F "youtube-looper.zip" 2>nul
    
    REM Check if deletion was successful
    if exist "youtube-looper.zip" (
        echo WARNING: Could not delete the existing zip file. It may be in use.
        echo Please close any programs that might be using the file and try again.
        echo You can also try manually deleting the file: youtube-looper.zip
        echo.
        echo Press any key to attempt to continue anyway...
        pause >nul
    ) else (
        echo Successfully removed old zip file.
    )
)

echo Creating new package...
REM Use a unique temporary name first
set TEMP_ZIP=youtube-looper-temp-%RANDOM%.zip

REM Create archive with the temporary name
powershell Compress-Archive -Path "manifest.json", "content.js", "styles.css", "icons/*" -DestinationPath "%TEMP_ZIP%" -Force

if %ERRORLEVEL% EQU 0 (
    REM If old file still exists and we created a temp file successfully, try one more deletion
    if exist "youtube-looper.zip" (
        del /F "youtube-looper.zip" 2>nul
    )
    
    REM Try to rename the temp file to the final name
    if exist "youtube-looper.zip" (
        echo WARNING: Using alternate filename because youtube-looper.zip is locked.
        echo Your package is available as: %TEMP_ZIP%
    ) else (
        ren "%TEMP_ZIP%" "youtube-looper.zip"
        echo Done! The extension is packaged as youtube-looper.zip
    )
    
    echo You can now upload it to addons.mozilla.org or load it temporarily in Firefox.
) else (
    echo Error occurred during packaging. Check for any missing files.
    if exist "%TEMP_ZIP%" del "%TEMP_ZIP%" 2>nul
)

pause 