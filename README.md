# ViictorN TV 📺

Uma plataforma de multistream premium desenvolvida para a comunidade, oferecendo uma experiência unificada para assistir e interagir com transmissões da Twitch e Kick simultaneamente.

## ✨ Funcionalidades

- **Multistream Player**: Assista Twitch ou Kick com troca instantânea e modo teatro.
- **Chat Unificado**: 
  - Suporte completo a **emotes 7TV, BTTV e FFZ**.
  - Renderização de **Badges** (Sub, Mod, VIP, Founder, etc) para ambas as plataformas.
  - Chat em tempo real com conexão WebSocket.
- **Design Premium**: Interface moderna com **Tailwind CSS v4**, animações fluidas (**Framer Motion**) e temas personalizados (LOUD/ViictorN).
- **Mobile First**: Layout otimizado para celulares com modo retrato e paisagem.
- **Cloud Sync**: Sincronização de preferências e notas de moderação via **Supabase**.
- **Ferramentas de Moderação**: Notas privadas sobre usuários (persistidas no banco de dados).

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, TypeScript
- **Estilização**: Tailwind CSS v4, PostCSS
- **Animações**: Framer Motion
- **Backend/Auth**: Supabase (PostgreSQL, Auth)
- **Ícones**: Lucide React

## 🚀 Como Rodar Localmente

### Pré-requisitos
- Node.js (v18+)
- NPM ou Yarn

### 1. Clone e Instale
```bash
git clone https://github.com/ViictorN/ViictorN-TV.git
cd ViictorN-TV
npm install
```

### 2. Configuração de Ambiente
Crie um arquivo `.env` na raiz do projeto com as credenciais do Supabase:

```properties
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_annon_key_do_supabase
```

*(O projeto possui um modo offline/local caso as chaves não sejam fornecidas, mas funcionalidades como login e sync não funcionarão)*

### 3. Execução
```bash
npm run dev
```
O servidor iniciará em `http://localhost:5173`.

## 📦 Scripts Disponíveis

- `npm run dev`: Inicia o servidor de desenvolvimento.
- `npm run build`: Gera o build de produção (utilizando Tailwind v4).
- `npm run preview`: Visualiza o build de produção localmente.

## 🤝 Contribuição

Sinta-se à vontade para abrir Issues e Pull Requests para melhorias.

---
Desenvolvido com 💜 para a comunidade.
