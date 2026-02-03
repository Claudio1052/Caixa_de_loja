// ============================================
// APP PRINCIPAL - PDV MÁGICO PRO
// ============================================

import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { AuthSection } from '@/sections/AuthSection';
import { PDVSection } from '@/sections/PDVSection';
import { StockSection } from '@/sections/StockSection';
import { DashboardSection } from '@/sections/DashboardSection';
import { PaymentModal, ReceiptModal, AccountModal } from '@/sections/Modals';
import type { CartItem } from '@/hooks/useSales';
import type { Sale } from '@/lib/supabase';
import './index.css';

type TabType = 'pdv' | 'stock' | 'dashboard';

function AppContent() {
  const { isAuthenticated, isLoading, logout, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('pdv');
  const [darkMode, setDarkMode] = useState(false);
  
  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  
  // Sale data
  const [currentCart, setCurrentCart] = useState<CartItem[]>([]);
  const [currentDiscount, setCurrentDiscount] = useState(0);
  const [currentProcessingTime, setCurrentProcessingTime] = useState(0);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Load dark mode preference
  useEffect(() => {
    const saved = localStorage.getItem('darkMode') === 'true';
    setDarkMode(saved);
    if (saved) {
      document.body.classList.add('dark-mode');
    }
  }, []);

  // Listen for tab switch events
  useEffect(() => {
    const handleSwitchTab = (e: any) => {
      setActiveTab(e.detail);
    };
    document.addEventListener('switchTab', handleSwitchTab);
    return () => document.removeEventListener('switchTab', handleSwitchTab);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
    if (newMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  const handleOpenPayment = (cart: CartItem[], discount: number, processingTime: number) => {
    setCurrentCart(cart);
    setCurrentDiscount(discount);
    setCurrentProcessingTime(processingTime);
    setShowPaymentModal(true);
  };

  const handleSaleComplete = (sale: Sale) => {
    setCompletedSale(sale);
    setShowPaymentModal(false);
    setShowReceiptModal(true);
  };

  const handleCloseReceipt = () => {
    setShowReceiptModal(false);
    setCompletedSale(null);
    setCurrentCart([]);
    setCurrentDiscount(0);
    setCurrentProcessingTime(0);
  };

  const handleLogout = async () => {
    await logout();
    setShowAccountModal(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '6px solid #dfe6e9',
          borderTopColor: '#6c5ce7',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p>Carregando PDV Mágico Pro...</p>
      </div>
    );
  }

  // Auth state
  if (!isAuthenticated) {
    return <AuthSection onAuthSuccess={() => {}} />;
  }

  // Check subscription
  const checkSubscription = () => {
    if (!profile) return true;
    const validUntil = new Date(profile.valid_until);
    return validUntil > new Date();
  };

  const isSubscriptionValid = checkSubscription();

  // Cart notification count
  const cartCount = 0; // This would come from PDVSection state in a real implementation

  // Low stock count
  const lowStockCount = 0; // This would come from StockSection state

  return (
    <div className="app-container">
      {/* Sidebar */}
      <nav className="sidebar">
        <button
          className={`nav-btn ${activeTab === 'pdv' ? 'active' : ''}`}
          onClick={() => setActiveTab('pdv')}
          title="Vendas"
        >
          🛒
          {cartCount > 0 && (
            <span className="nav-notification">{cartCount}</span>
          )}
        </button>
        <button
          className={`nav-btn ${activeTab === 'stock' ? 'active' : ''}`}
          onClick={() => setActiveTab('stock')}
          title="Estoque"
        >
          📦
          {lowStockCount > 0 && (
            <span className="nav-notification">{lowStockCount}</span>
          )}
        </button>
        <button
          className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
          title="Dashboard"
        >
          📊
        </button>
        <button
          className="nav-btn"
          onClick={() => setShowAccountModal(true)}
          title="Minha Conta"
        >
          👤
        </button>
        <button
          className="dark-mode-toggle"
          onClick={toggleDarkMode}
          title="Modo Escuro"
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </nav>

      {/* Main Content */}
      <main className="content-area">
        {!isSubscriptionValid && (
          <div style={{
            background: '#ff7675',
            color: 'white',
            padding: '15px 20px',
            borderRadius: '12px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <i className="fas fa-exclamation-triangle" style={{ marginRight: '10px' }}></i>
              <strong>Sua assinatura expirou!</strong> Renove para continuar usando todas as funcionalidades.
            </div>
            <button
              onClick={() => setShowAccountModal(true)}
              style={{
                background: 'white',
                color: '#ff7675',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              Renovar Agora
            </button>
          </div>
        )}

        {activeTab === 'pdv' && (
          <PDVSection onOpenPayment={handleOpenPayment} />
        )}
        
        {activeTab === 'stock' && isSubscriptionValid && (
          <StockSection />
        )}
        
        {activeTab === 'stock' && !isSubscriptionValid && (
          <div className="section active" style={{ textAlign: 'center', padding: '50px' }}>
            <i className="fas fa-lock" style={{ fontSize: '4rem', color: '#b2bec3', marginBottom: '20px' }}></i>
            <h2>Acesso Bloqueado</h2>
            <p>Sua assinatura expirou. Renove para acessar o controle de estoque.</p>
            <button
              className="btn-checkout"
              onClick={() => setShowAccountModal(true)}
              style={{ marginTop: '20px', maxWidth: '300px' }}
            >
              Renovar Assinatura
            </button>
          </div>
        )}
        
        {activeTab === 'dashboard' && isSubscriptionValid && (
          <DashboardSection />
        )}
        
        {activeTab === 'dashboard' && !isSubscriptionValid && (
          <div className="section active" style={{ textAlign: 'center', padding: '50px' }}>
            <i className="fas fa-lock" style={{ fontSize: '4rem', color: '#b2bec3', marginBottom: '20px' }}></i>
            <h2>Acesso Bloqueado</h2>
            <p>Sua assinatura expirou. Renove para acessar o dashboard.</p>
            <button
              className="btn-checkout"
              onClick={() => setShowAccountModal(true)}
              style={{ marginTop: '20px', maxWidth: '300px' }}
            >
              Renovar Assinatura
            </button>
          </div>
        )}
      </main>

      {/* Modals */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        cart={currentCart}
        discount={currentDiscount}
        processingTime={currentProcessingTime}
        onSaleComplete={handleSaleComplete}
      />

      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={handleCloseReceipt}
        sale={completedSale}
        cart={currentCart}
      />

      <AccountModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        onLogout={handleLogout}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
