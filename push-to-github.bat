@echo off
echo ===================================================
echo   Pushing AUM Application to GitHub Repository
echo ===================================================
echo.
git push -u origin main
git push origin --tags
echo.
echo ===================================================
echo   Done! Check GitHub Actions:
echo   https://github.com/bapanayya/AUM-Messaging-App/actions
echo ===================================================
pause
