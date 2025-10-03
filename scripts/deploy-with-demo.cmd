@echo off
REM Script para hacer deploy con modo demo habilitado
REM Ejecutar: scripts\deploy-with-demo.cmd

echo.
echo 🎭 Preparando deploy con Modo Demo...
echo.

REM Verificar rama actual
for /f "tokens=*" %%i in ('git branch --show-current') do set BRANCH=%%i
echo 📍 Rama actual: %BRANCH%
echo.

REM Agregar todos los cambios
echo 📦 Agregando cambios...
git add .

REM Commit
echo 💾 Creando commit...
git commit -m "feat: add demo mode for presentations without authentication"

REM Push
echo 🚀 Haciendo push a GitHub...
git push origin %BRANCH%

echo.
echo ✅ Deploy iniciado!
echo.
echo 📋 Próximos pasos:
echo 1. Espera 2-3 minutos para que Vercel haga el deploy
echo 2. Ve a tu URL de Vercel
echo 3. Busca la sección 'MODO DEMO' en el landing
echo 4. Haz clic en 'Entrar como Cliente' o 'Entrar como Especialista'
echo.
echo 🎉 ¡Listo para tu presentación!
echo.
pause
