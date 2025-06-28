
@echo off
echo.
echo 🤖 ========================================
echo    WHATSAPP AI BOT - SERVIDOR BACKEND
echo ========================================
echo.

:: Verificar se Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js não encontrado!
    echo    Instale Node.js 18+ antes de continuar.
    echo    Download: https://nodejs.org/
    pause
    exit /b 1
)

:: Mostrar versão do Node.js
echo ✅ Node.js encontrado:
node --version
echo.

:: Verificar se estamos no diretório correto
if not exist "package.json" (
    echo ❌ Arquivo package.json não encontrado!
    echo    Execute este arquivo dentro da pasta bot-server/
    pause
    exit /b 1
)

:: Verificar se o arquivo .env existe
if not exist ".env" (
    echo ⚠️  Arquivo .env não encontrado!
    echo    Copiando .env.example para .env...
    if exist ".env.example" (
        copy ".env.example" ".env"
        echo ✅ Arquivo .env criado.
        echo    Configure suas variáveis de ambiente antes de continuar.
        notepad .env
    ) else (
        echo ❌ Arquivo .env.example não encontrado!
    )
    pause
    exit /b 1
)

echo 📦 Verificando dependências...
if not exist "node_modules" (
    echo    Instalando dependências pela primeira vez...
    npm install --legacy-peer-deps
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Erro ao instalar dependências!
        pause
        exit /b 1
    )
) else (
    echo ✅ Dependências já instaladas.
)

echo.
echo 🔧 Compilando TypeScript...
npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro na compilação!
    echo    Verifique os erros acima e tente novamente.
    pause
    exit /b 1
)

echo.
echo 🚀 Iniciando o servidor do bot...
echo    Pressione Ctrl+C para parar o servidor
echo.
echo ========================================
echo.

:: Iniciar o servidor
npm start

:: Se chegou aqui, o servidor parou
echo.
echo 📴 Servidor parado.
pause
