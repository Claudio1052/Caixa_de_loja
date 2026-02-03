# 🛒 PDV Mágico Pro

Sistema Inteligente de Vendas com integração ao Supabase. Gerencie seu comércio de forma simples e eficiente!

![PDV Mágico Pro](https://img.shields.io/badge/PDV-M%C3%A1gico%20Pro-6c5ce7?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase)

---

## ✨ Funcionalidades

### 🏪 PDV (Ponto de Venda)
- ✅ Interface moderna e intuitiva
- ✅ Busca por código, nome ou **voz**
- ✅ Carrinho de compras em tempo real
- ✅ Descontos personalizados
- ✅ Múltiplos métodos de pagamento
- ✅ **5% de desconto automático no Pix**

### 📦 Gestão de Estoque
- ✅ CRUD completo de produtos
- ✅ Sugestão automática de emojis
- ✅ Alertas de estoque baixo
- ✅ Histórico de movimentações
- ✅ Exportação para CSV

### 📊 Dashboard
- ✅ Vendas em tempo real
- ✅ Ticket médio
- ✅ Produto mais vendido
- ✅ Controle de estoque crítico
- ✅ Exportação de relatórios

### 👤 Autenticação
- ✅ Login/Cadastro seguro
- ✅ **7 dias de trial gratuito**
- ✅ Controle de assinatura
- ✅ Perfil da empresa

---

## 🚀 Deploy no GitHub Pages

### 1. Fork este repositório

Clique no botão "Fork" no canto superior direito desta página.

### 2. Configure o Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto
2. No **SQL Editor**, execute o script do arquivo `supabase_schema.sql`
3. Copie sua **URL** e **Anon Key** do projeto

### 3. Configure as variáveis de ambiente

Edite o arquivo `src/lib/supabase.ts` com seus dados:

```typescript
const supabaseUrl = 'https://SEU-PROJETO.supabase.co';
const supabaseAnonKey = 'SUA-ANON-KEY';
```

### 4. Ative o GitHub Pages

1. No seu repositório, vá em **Settings** → **Pages**
2. Em **Source**, selecione **GitHub Actions**

### 5. Deploy automático

O deploy será feito automaticamente a cada push na branch `main`!

Acesse: `https://SEU-USERNAME.github.io/pdv-magico-pro/`

---

## 🛠️ Desenvolvimento Local

### Pré-requisitos
- Node.js 20+
- npm ou yarn

### Instalação

```bash
# Clone o repositório
git clone https://github.com/SEU-USERNAME/pdv-magico-pro.git

# Entre na pasta
cd pdv-magico-pro

# Instale as dependências
npm install

# Rode o projeto
npm run dev
```

Acesse: `http://localhost:5173`

### Build para produção

```bash
npm run build
```

Os arquivos estarão na pasta `dist/`.

---

## 📁 Estrutura do Projeto

```
pdv-magico-pro/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Workflow de deploy
├── src/
│   ├── hooks/
│   │   ├── useAuth.tsx         # Autenticação
│   │   ├── useProducts.tsx     # Produtos
│   │   └── useSales.tsx        # Vendas
│   ├── lib/
│   │   └── supabase.ts         # Cliente Supabase
│   ├── sections/
│   │   ├── AuthSection.tsx     # Login/Cadastro
│   │   ├── PDVSection.tsx      # Caixa
│   │   ├── StockSection.tsx    # Estoque
│   │   ├── DashboardSection.tsx # Dashboard
│   │   └── Modals.tsx          # Modais
│   ├── App.tsx                 # App principal
│   └── index.css               # Estilos
├── supabase_schema.sql         # Schema do banco
├── vite.config.ts
├── package.json
└── README.md
```

---

## ⌨️ Atalhos de Teclado

| Tecla | Função |
|-------|--------|
| `F1` | Abrir PDV |
| `F2` | Busca por voz |
| `F3` | Abrir Estoque |
| `F5` | Finalizar venda |
| `F8` | Limpar carrinho |
| `F9` | Aplicar 10% de desconto |
| `ESC` | Fechar modais |

---

## 🎨 Personalização

### Cores
Edite as variáveis CSS em `src/index.css`:

```css
:root {
  --primary: #6c5ce7;      /* Roxo principal */
  --secondary: #00cec9;    /* Ciano */
  --success: #00b894;      /* Verde */
  --danger: #ff7675;       /* Vermelho */
  --warning: #fdcb6e;      /* Amarelo */
}
```

### Preço da assinatura
Edite em `src/sections/AuthSection.tsx`:

```typescript
const MONTHLY_PRICE = 29.90;
const TRIAL_DAYS = 7;
```

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 🤝 Contribuição

Contribuições são bem-vindas! Siga os passos:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

---

## 📞 Suporte

Em caso de dúvidas ou problemas:

- Abra uma [Issue](https://github.com/SEU-USERNAME/pdv-magico-pro/issues)
- Envie um email: suporte@pdvmagicopro.com

---

<p align="center">
  Feito com 💜 e ☕ por PDV Mágico Pro
</p>
