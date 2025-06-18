
# WhatsApp AI Bot Server

Servidor Node.js para o bot WhatsApp com IA personalizada usando Baileys, LM Studio e Whisper.

## 📋 Pré-requisitos

1. **Node.js 18+**
2. **LM Studio** rodando localmente na porta 1234
3. **Whisper** instalado no sistema (para transcrição de áudio)
4. **Supabase** configurado (já feito no projeto web)

## 🛠️ Instalação

1. **Instalar dependências:**
```bash
cd bot-server
npm install
```

2. **Configurar variáveis de ambiente:**
```bash
cp .env.example .env
# Editar .env com suas configurações
```

3. **Instalar Whisper (opcional, para áudio):**
```bash
pip install openai-whisper
```

## 🚀 Como usar

### 1. Iniciar LM Studio
- Abra o LM Studio
- Carregue o modelo Mixtral ou similar
- Inicie o servidor local (porta 1234)

### 2. Executar o bot
```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

### 3. Conectar WhatsApp
1. O bot gerará um QR code no terminal
2. Abra o WhatsApp no celular
3. Vá em **Menu > Dispositivos conectados > Conectar dispositivo**
4.escanear o QR code
5. O bot ficará online e conectado!

## 📁 Estrutura do Projeto

```
bot-server/
├── src/
│   ├── config/         # Configuração do banco de dados
│   ├── services/       # Serviços principais (WhatsApp, AI, Audio)
│   ├── types/          # Tipos TypeScript
│   ├── utils/          # Utilitários
│   └── index.ts        # Ponto de entrada
├── sessions/           # Sessões WhatsApp salvas
├── temp/              # Arquivos temporários (áudio)
└── dist/              # Build compilado
```

## 🤖 Funcionalidades

### ✅ Implementado
- 🔗 Conexão WhatsApp via Baileys
- 💾 Sincronização com banco Supabase
- 🧠 Integração com LM Studio (Mixtral)
- 👤 Sistema multi-usuário
- 🎤 Transcrição de áudio com Whisper
- 📊 Coleta de dados de aprendizado
- 🔄 Reconexão automática
- 📱 Controle via painel web

### 🚧 Próximos passos
- 📁 Processamento de arquivos de histórico
- 📈 Sistema de aprendizado avançado
- 🔊 Geração de áudio (TTS)
- 🌐 API REST para integrações
- 📊 Métricas e análises detalhadas

## 🎯 Como funciona

1. **Conexão**: Bot conecta no WhatsApp via QR code
2. **Recebimento**: Mensagens chegam e são processadas
3. **Transcrição**: Áudios são convertidos em texto (Whisper)
4. **IA**: Mensagem é enviada para LM Studio com contexto personalizado
5. **Resposta**: IA gera resposta personalizada baseada no histórico
6. **Aprendizado**: Dados são salvos para melhorar futuras respostas

## 🔧 Configurações

### LM Studio
- URL padrão: `http://localhost:1234`
- Modelo recomendado: Mixtral 7B ou 8x7B
- Temperatura: 0.7 (configurável)

### Whisper
- Modelo padrão: `base` (mais rápido)
- Modelos disponíveis: `tiny`, `base`, `small`, `medium`, `large`
- Idioma: Português (pt)

### Logs
- Nível padrão: `info`
- Formatos: Console colorido + arquivo opcional

## 🐛 Solução de problemas

### Bot não conecta
- Verificar se LM Studio está rodando
- Conferir variáveis de ambiente
- Limpar pasta `sessions/` se necessário

### Áudio não transcreve
- Instalar Whisper: `pip install openai-whisper`
- Verificar modelos disponíveis: `whisper --help`

### IA não responde
- Verificar conexão com LM Studio
- Conferir modelo carregado
- Ver logs para erros detalhados

## 📞 Suporte

- Logs detalhados em tempo real
- Sistema de fallback para erros
- Reconexão automática do WhatsApp
- Monitoramento de status no painel web

---

**Status**: ✅ Pronto para uso  
**Versão**: 1.0.0  
**Compatibilidade**: WhatsApp Web Multi-Device
