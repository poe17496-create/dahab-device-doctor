@echo off
chcp 65001 > nul
echo ======================================================
echo    Dahab Device Doctor - رفع المشروع إلى GitHub
echo ======================================================
echo.
git branch -M main
git remote set-url origin https://github.com/poe17496-create/dahab-device-doctor.git
echo جاري الرفع إلى https://github.com/poe17496-create/dahab-device-doctor ...
git push -u origin main
echo.
if %errorlevel% equ 0 (
    echo [OK] تم الرفع إلى GitHub بنجاح! يمكنك الآن الذهاب لـ Vercel والضغط على Deploy.
) else (
    echo [!] حدث خطأ أو مطلوب تسجيل الدخول إلى GitHub في المتصفح.
)
pause
