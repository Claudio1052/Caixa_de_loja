// ============================================
// SEÇÃO PDV (CAIXA) - PDV MÁGICO PRO
// ============================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { useProducts } from '@/hooks/useProducts';
import type { CartItem } from '@/hooks/useSales';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, type Product } from '@/lib/supabase';

interface PDVSectionProps {
  onOpenPayment: (cart: CartItem[], discount: number, processingTime: number) => void;
}

export function PDVSection({ onOpenPayment }: PDVSectionProps) {
  const { products, lowStockProducts, searchProducts } = useProducts();
  const { profile } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [discount, setDiscount] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [saleStartTime, setSaleStartTime] = useState<number | null>(null);
  const [processingTime, setProcessingTime] = useState(0);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Timer de processamento
  useEffect(() => {
    if (saleStartTime && cart.length > 0) {
      const interval = setInterval(() => {
        setProcessingTime(((Date.now() - saleStartTime) / 1000));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [saleStartTime, cart.length]);

  // Iniciar timer quando adicionar primeiro item
  const startTimer = useCallback(() => {
    if (!saleStartTime) {
      setSaleStartTime(Date.now());
    }
  }, [saleStartTime]);

  // Buscar sugestões
  useEffect(() => {
    if (searchTerm.length > 1) {
      const found = searchProducts(searchTerm).slice(0, 5);
      setSuggestions(found);
      setShowSuggestions(found.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [searchTerm, searchProducts]);

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        openVoiceSearch();
      }
      if (e.key === 'F5' && cart.length > 0) {
        e.preventDefault();
        handleCheckout();
      }
      if (e.key === 'F8') {
        e.preventDefault();
        clearCart();
      }
      if (e.key === 'F9') {
        e.preventDefault();
        applyDiscount(10);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [cart.length]);

  const addToCart = (product: Product) => {
    const cartItem = cart.find((i) => i.id === product.id);
    const currentQty = cartItem ? cartItem.qty : 0;

    if (product.stock <= currentQty) {
      showToast(`Estoque insuficiente de ${product.name}. Disponível: ${product.stock}`, 'warning');
      return;
    }

    startTimer();

    if (cartItem) {
      setCart(cart.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i)));
    } else {
      setCart([
        ...cart,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          qty: 1,
          emoji: product.emoji,
          category: product.category,
          stock: product.stock,
        },
      ]);
    }

    showToast(`${product.name} adicionado ao carrinho`, 'success');
    setSearchTerm('');
    setShowSuggestions(false);
  };

  const updateQty = (id: string, delta: number) => {
    setCart(
      cart.map((item) => {
        if (item.id === id) {
          const newQty = item.qty + delta;
          if (newQty <= 0) return item;
          if (newQty > item.stock) {
            showToast('Quantidade indisponível em estoque', 'warning');
            return item;
          }
          return { ...item, qty: newQty };
        }
        return item;
      })
    );
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((i) => i.id !== id));
    if (cart.length === 1) {
      setSaleStartTime(null);
      setProcessingTime(0);
    }
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (confirm('Tem certeza que deseja limpar o carrinho?')) {
      setCart([]);
      setDiscount(0);
      setSaleStartTime(null);
      setProcessingTime(0);
      showToast('Carrinho limpo com sucesso', 'info');
    }
  };

  const applyDiscount = (percent: number) => {
    if (cart.length === 0) {
      showToast('Adicione produtos ao carrinho antes de aplicar desconto', 'warning');
      return;
    }
    setDiscount(percent);
    showToast(`Desconto de ${percent}% aplicado!`, 'success');
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    onOpenPayment(cart, discount, processingTime);
  };

  const openVoiceSearch = () => {
    const win = window as any;
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const recognition = new (win.SpeechRecognition || win.webkitSpeechRecognition)();
      recognition.lang = 'pt-BR';
      recognition.interimResults = false;
      
      recognition.start();
      showToast('Ouvindo... fale o nome do produto 🎤', 'info');
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        setSearchTerm(transcript);
        
        const found = products.find((p) =>
          p.name.toLowerCase().includes(transcript)
        );
        
        if (found) {
          setTimeout(() => addToCart(found), 500);
        } else {
          showToast('Produto não encontrado por voz. Tente digitar.', 'warning');
        }
      };
      
      recognition.onerror = () => {
        showToast('Erro no reconhecimento de voz. Tente novamente.', 'error');
      };
    } else {
      showToast('Reconhecimento de voz não suportado no seu navegador', 'warning');
    }
  };

  // Cálculos
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const discountAmount = subtotal * (discount / 100);
  const total = subtotal - discountAmount;
  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);

  // Status da assinatura
  const getSubscriptionStatus = () => {
    if (!profile) return { text: 'Carregando...', color: '#b2bec3' };
    
    const validUntil = new Date(profile.valid_until);
    const daysLeft = Math.ceil((validUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    if (profile.is_trial) {
      if (daysLeft <= 3) {
        return { text: `Trial: ${daysLeft} dias`, color: '#ff7675' };
      }
      return { text: `Trial: ${daysLeft} dias`, color: '#fdcb6e' };
    }
    return { text: 'Plano Ativo', color: '#00b894' };
  };

  const subStatus = getSubscriptionStatus();

  return (
    <section id="pdv" className="section active">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h2><i className="fas fa-cash-register"></i> Caixa Inteligente ✨</h2>
        <div
          className="stat-badge"
          style={{ background: subStatus.color, color: 'white' }}
        >
          <i className="fas fa-crown"></i>
          <span>{subStatus.text}</span>
        </div>
      </div>

      <div className="pdv-header" style={{ position: 'relative' }}>
        <input
          ref={searchInputRef}
          type="text"
          className="scan-input"
          placeholder="🔍 Escaneie o código, digite o nome ou use voz... (F2 para voz)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
        />
        
        {showSuggestions && (
          <div ref={suggestionsRef} className="suggestions-box active" style={{ top: '60px' }}>
            {suggestions.map((product) => (
              <div
                key={product.id}
                className="suggestion-item"
                onClick={() => addToCart(product)}
              >
                <div className="suggestion-emoji">{product.emoji}</div>
                <div>
                  <div style={{ fontWeight: 700 }}>{product.name}</div>
                  <div style={{ fontSize: '0.9rem', color: '#636e72' }}>
                    {formatCurrency(product.price)} | Estoque: {product.stock}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="quick-actions">
          <button className="quick-action-btn" onClick={openVoiceSearch}>
            <i className="fas fa-microphone"></i> Voz
          </button>
          <button className="quick-action-btn" onClick={() => applyDiscount(10)}>
            <i className="fas fa-tag"></i> Desconto
          </button>
        </div>
      </div>

      <div className="live-stats">
        <div className="stat-badge">
          <i className="fas fa-shopping-cart"></i>
          <span>{totalItems} {totalItems === 1 ? 'item' : 'itens'}</span>
        </div>
        <div className="stat-badge">
          <i className="fas fa-dollar-sign"></i>
          <span>{formatCurrency(total)}</span>
        </div>
        <div className="stat-badge">
          <i className="fas fa-bolt"></i>
          <span>{processingTime.toFixed(1)}s</span>
        </div>
        {discount > 0 && (
          <div className="stat-badge" style={{ background: '#00b894', color: 'white' }}>
            <i className="fas fa-percent"></i>
            <span>{discount}% OFF</span>
          </div>
        )}
      </div>

      <div className="pdv-grid">
        <div className="product-list">
          {products.map((product) => {
            const cartItem = cart.find((i) => i.id === product.id);
            const inCart = cartItem ? cartItem.qty : 0;
            
            let stockClass = 'stock-high';
            if (product.stock < 3) stockClass = 'stock-low';
            else if (product.stock < 10) stockClass = 'stock-medium';

            return (
              <div
                key={product.id}
                className="product-card"
                onClick={() => addToCart(product)}
              >
                <span className={`product-stock ${stockClass}`}>
                  {product.stock} un
                </span>
                <span className="product-emoji floating">{product.emoji}</span>
                <div className="product-name">{product.name}</div>
                <div className="product-category">
                  {getCategoryName(product.category)}
                </div>
                <div className="product-price">{formatCurrency(product.price)}</div>
                {inCart > 0 && (
                  <div style={{
                    marginTop: '10px',
                    background: '#6c5ce7',
                    color: 'white',
                    padding: '5px 10px',
                    borderRadius: '10px',
                    fontSize: '0.8rem'
                  }}>
                    {inCart} no carrinho
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="cart-panel">
          <div className="cart-header">
            <h3><i className="fas fa-shopping-basket"></i> Cesta de Compras</h3>
            <button
              className="clear-cart"
              onClick={clearCart}
              disabled={cart.length === 0}
            >
              <i className="fas fa-trash"></i> Limpar
            </button>
          </div>
          
          <div className="cart-items">
            {cart.length === 0 ? (
              <div style={{
                textAlign: 'center',
                color: '#b2bec3',
                marginTop: '50px',
                padding: '30px'
              }}>
                <i className="fas fa-shopping-basket" style={{ fontSize: '3rem', marginBottom: '15px', opacity: 0.5 }}></i>
                <p>Sua cesta está vazia 🍃</p>
                <p style={{ fontSize: '0.9rem' }}>Adicione produtos escaneando ou clicando nos itens</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.emoji} {item.name}</div>
                    <div style={{ color: '#636e72', fontSize: '0.9rem' }}>
                      {formatCurrency(item.price)} un
                    </div>
                    <div className="cart-item-qty">
                      <button className="qty-btn" onClick={() => updateQty(item.id, -1)}>-</button>
                      <span style={{ fontWeight: 700, minWidth: '30px', textAlign: 'center' }}>
                        {item.qty}
                      </span>
                      <button className="qty-btn" onClick={() => updateQty(item.id, 1)}>+</button>
                      <span style={{ marginLeft: '10px', color: 'var(--primary)', fontWeight: 700 }}>
                        {formatCurrency(item.price * item.qty)}
                      </span>
                    </div>
                  </div>
                  <button className="remove-btn" onClick={() => removeFromCart(item.id)}>
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              ))
            )}
          </div>
          
          <div className="cart-footer">
            {discount > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '10px',
                fontSize: '0.9rem',
                color: '#636e72'
              }}>
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
            )}
            {discount > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '10px',
                fontSize: '0.9rem',
                color: '#00b894'
              }}>
                <span>Desconto ({discount}%):</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="cart-total">
              <span className="cart-total-label">Total:</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <button
              className="btn-checkout"
              onClick={handleCheckout}
              disabled={cart.length === 0}
            >
              <i className="fas fa-rocket"></i> Finalizar Venda 🚀
            </button>
          </div>
        </div>
      </div>

      {/* Badge de estoque baixo */}
      {lowStockProducts.length > 0 && (
        <div
          className="low-stock-badge"
          onClick={() => document.dispatchEvent(new CustomEvent('switchTab', { detail: 'stock' }))}
        >
          <i className="fas fa-exclamation-triangle"></i>
          <div>
            <strong>{lowStockProducts.length} {lowStockProducts.length === 1 ? 'produto' : 'produtos'}</strong> com estoque baixo
          </div>
        </div>
      )}
    </section>
  );
}

function getCategoryName(category: string): string {
  const categories: Record<string, string> = {
    alimento: '🍔 Alimento',
    bebida: '🥤 Bebida',
    limpeza: '🧼 Limpeza',
    eletronico: '📱 Eletrônico',
    vestuario: '👕 Vestuário',
    outro: '📦 Outro',
  };
  return categories[category] || category;
}

// Toast notification
function showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type} show`;
  
  const icons: Record<string, string> = {
    success: 'fa-check-circle',
    error: 'fa-times-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle',
  };
  
  toast.innerHTML = `
    <i class="fas ${icons[type]} toast-icon"></i>
    <span class="toast-message">${message}</span>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}
