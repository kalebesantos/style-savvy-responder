@echo off
echo.
echo 🚀 Limpando dependências antigas...
IF EXIST node_modules rmdir /s /q node_modules
IF EXIST package-lock.json del /q package-lock.json

echo.
echo 📦 Instalando dependências com --legacy-peer-deps...
npm install --legacy-peer-deps

echo.
echo 🔧 Compilando TypeScript...
npm run build

echo.
echo 🤖 Iniciando o bot...
npm start

pause
