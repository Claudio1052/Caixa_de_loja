import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Tratamento de erro global
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        flex-direction: column;
        gap: 20px;
        background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
        padding: 20px;
        font-family: sans-serif;
      ">
        <div style="font-size: 4rem;">😵</div>
        <h2 style="color: #ff7675; text-align: center;">Ops! Algo deu errado</h2>
        <p style="color: #636e72; text-align: center; max-width: 400px;">
          ${event.error?.message || 'Erro desconhecido'}
        </p>
        <button onclick="window.location.reload()" style="
          background: #6c5ce7;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 700;
        ">Recarregar página</button>
      </div>
    `;
  }
});

const rootElement = document.getElementById('root');

if (!rootElement) {
  document.body.innerHTML = `
    <div style="
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      flex-direction: column;
      gap: 20px;
      background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
      padding: 20px;
      font-family: sans-serif;
    ">
      <div style="font-size: 4rem;">🔧</div>
      <h2 style="color: #ff7675; text-align: center;">Erro de inicialização</h2>
      <p style="color: #636e72; text-align: center;">
        Elemento root não encontrado. Verifique o HTML.
      </p>
    </div>
  `;
} else {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
