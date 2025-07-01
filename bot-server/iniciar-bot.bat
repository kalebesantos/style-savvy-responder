
@echo off
echo.
echo ========================================
echo     WhatsApp AI Bot - Iniciando...
echo ========================================
echo.

echo 🔍 Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js nao encontrado! Instale o Node.js primeiro.
    pause
    exit /b 1
)

echo ✅ Node.js encontrado
echo.

echo 🧹 Limpando cache e dependencias antigas...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del /q package-lock.json
echo.

echo 📦 Instalando dependencias...
npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependencias!
    pause
    exit /b 1
)
echo.

echo 🔧 Compilando TypeScript...
npm run build
if %errorlevel% neq 0 (
    echo ❌ Erro na compilacao!
    pause
    exit /b 1
)
echo.

echo 🚀 Iniciando o bot...
echo ========================================
echo   Bot WhatsApp AI - Servidor Rodando
echo ========================================
echo.
echo 💡 Dicas:
echo    - Abra o painel em: http://localhost:3001
echo    - Use Ctrl+C para parar o bot
echo    - Certifique-se que o LM Studio esteja rodando
echo.

npm start

echo.
echo 📴 Bot encerrado.
pause
