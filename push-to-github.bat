@echo off
echo ========================================
echo   GitHub এ কোড আপলোড করুন
echo ========================================
echo.
git add .
git commit -m "Fix: OpenRouter AI integration"
git push
echo.
echo ✅ Done! Vercel automatically redeploy করবে।
pause
