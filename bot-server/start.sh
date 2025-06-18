
#!/bin/bash

echo "🚀 Iniciando WhatsApp AI Bot Server..."

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js 18+ primeiro."
    exit 1
fi

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Verificar se o arquivo .env existe
if [ ! -f ".env" ]; then
    echo "⚠️  Arquivo .env não encontrado. Copiando .env.example..."
    cp .env.example .env
    echo "📝 Configure o arquivo .env antes de continuar."
    exit 1
fi

# Iniciar o servidor
echo "🤖 Iniciando o bot..."
npm run dev
