// ============================================
// SEÇÃO DE AUTENTICAÇÃO - PDV MÁGICO PRO
// ============================================

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface AuthSectionProps {
  onAuthSuccess: () => void;
}

export function AuthSection({ onAuthSuccess }: AuthSectionProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form
  const [regCompany, setRegCompany] = useState('');
  const [regDocument, setRegDocument] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regTerms, setRegTerms] = useState(false);
  
  const { login, register } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      await login(loginEmail, loginPassword);
      onAuthSuccess();
    } catch (err: any) {
      setError(err.message || 'Email ou senha incorretos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Validações
    if (regPassword !== regConfirmPassword) {
      setError('As senhas não coincidem');
      setIsLoading(false);
      return;
    }
    
    if (regPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setIsLoading(false);
      return;
    }
    
    if (!regTerms) {
      setError('Você deve aceitar os termos de uso');
      setIsLoading(false);
      return;
    }
    
    try {
      await register({
        email: regEmail,
        password: regPassword,
        companyName: regCompany,
        document: regDocument,
        phone: regPhone,
      });
      
      // Após registro, fazer login
      await login(regEmail, regPassword);
      onAuthSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDocInput = (value: string) => {
    const clean = value.replace(/\D/g, '');
    if (clean.length <= 11) {
      return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const formatPhoneInput = (value: string) => {
    const clean = value.replace(/\D/g, '');
    if (clean.length <= 10) {
      return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  if (isLogin) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">✨</div>
            <h1 className="auth-title">PDV Mágico Pro</h1>
            <p className="auth-subtitle">Sistema Inteligente de Vendas</p>
          </div>
          
          {error && (
            <div style={{ 
              background: '#ffebee', 
              color: '#c62828', 
              padding: '12px 16px', 
              borderRadius: '12px', 
              marginBottom: '20px',
              fontSize: '0.9rem'
            }}>
              <i className="fas fa-exclamation-circle" style={{ marginRight: '8px' }}></i>
              {error}
            </div>
          )}
          
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="seu@email.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Senha</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>
            
            <button
              type="submit"
              className="auth-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <><i className="fas fa-spinner fa-spin"></i> Entrando...</>
              ) : (
                <><i className="fas fa-sign-in-alt"></i> Entrar no Sistema</>
              )}
            </button>
            
            <div className="auth-switch">
              Não tem uma conta?{' '}
              <a onClick={() => { setIsLogin(false); setError(null); }}>
                Cadastre-se gratuitamente
              </a>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">🚀</div>
          <h1 className="auth-title">Criar Conta</h1>
          <p className="auth-subtitle">7 dias grátis, depois R$ 29,90/mês</p>
        </div>
        
        <div className="plan-card">
          <div className="plan-badge">7 DIAS GRÁTIS</div>
          <h3>Plano Profissional</h3>
          <div className="plan-price">R$ 29,90</div>
          <div className="plan-period">por mês</div>
          <ul className="plan-features">
            <li><i className="fas fa-check"></i> PDV Completo</li>
            <li><i className="fas fa-check"></i> Gestão de Estoque</li>
            <li><i className="fas fa-check"></i> Dashboard Avançado</li>
            <li><i className="fas fa-check"></i> Suporte 24/7</li>
            <li><i className="fas fa-check"></i> Atualizações Gratuitas</li>
          </ul>
        </div>
        
        {error && (
          <div style={{ 
            background: '#ffebee', 
            color: '#c62828', 
            padding: '12px 16px', 
            borderRadius: '12px', 
            marginTop: '20px',
            marginBottom: '10px',
            fontSize: '0.9rem'
          }}>
            <i className="fas fa-exclamation-circle" style={{ marginRight: '8px' }}></i>
            {error}
          </div>
        )}
        
        <form className="auth-form" onSubmit={handleRegister}>
          <div className="form-group">
            <label className="form-label">Nome da Empresa</label>
            <input
              type="text"
              className="form-input"
              placeholder="Sua Empresa LTDA"
              value={regCompany}
              onChange={(e) => setRegCompany(e.target.value)}
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">CNPJ/CPF</label>
              <input
                type="text"
                className="form-input"
                placeholder="00.000.000/0000-00"
                value={regDocument}
                onChange={(e) => setRegDocument(formatDocInput(e.target.value))}
                maxLength={18}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Telefone</label>
              <input
                type="tel"
                className="form-input"
                placeholder="(11) 99999-9999"
                value={regPhone}
                onChange={(e) => setRegPhone(formatPhoneInput(e.target.value))}
                maxLength={15}
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="seu@email.com"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Senha</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Confirmar Senha</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="terms-checkbox">
            <input
              type="checkbox"
              id="regTerms"
              checked={regTerms}
              onChange={(e) => setRegTerms(e.target.checked)}
              required
            />
            <label htmlFor="regTerms">
              Concordo com os <a onClick={() => alert(`TERMOS DE USO DO PDV MÁGICO PRO

1. Período de Teste: 7 dias gratuitos
2. Assinatura: R$ 29,90/mês após o período de teste
3. Pagamento: Cobrança automática mensal
4. Cancelamento: A qualquer momento
5. Dados: Seus dados são armazenados na nuvem

Para cancelar, entre em contato com nosso suporte.`)}>Termos de Uso</a> e autorizo a cobrança mensal de R$ 29,90 após o período de teste.
            </label>
          </div>
          
          <button
            type="submit"
            className="auth-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <><i className="fas fa-spinner fa-spin"></i> Criando conta...</>
            ) : (
              <><i className="fas fa-rocket"></i> Começar Período Grátis</>
            )}
          </button>
          
          <div className="auth-switch">
            Já tem uma conta?{' '}
            <a onClick={() => { setIsLogin(true); setError(null); }}>
              Faça login
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
