@echo off
echo ===================================================
echo   Pushing AAM - All in One Communication App to GitHub
echo ===================================================
echo.
git push -u origin main
git push origin --tags
echo.
echo ===================================================
echo   Done! Check GitHub Actions:
echo   https://github.com/bapanayya/AAM-Communication-App/actions
echo   (or https://github.com/bapanayya/AUM-Messaging-App/actions)
echo ===================================================
pause
