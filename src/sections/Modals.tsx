// ============================================
// MODAIS - PDV MÁGICO PRO
// ============================================

import { useState } from 'react';
import { useSales, type CartItem } from '@/hooks/useSales';
import { formatCurrency, type Sale } from '@/lib/supabase';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  discount: number;
  processingTime: number;
  onSaleComplete: (sale: Sale) => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  cart,
  discount,
  processingTime,
  onSaleComplete,
}: PaymentModalProps) {
  const { makeSale } = useSales();
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const discountAmount = subtotal * (discount / 100);
  const total = subtotal - discountAmount;

  const handlePayment = async (method: string) => {
    setIsProcessing(true);
    
    try {
      let finalMethod = method;
      
      // Aplicar desconto de 5% no Pix
      if (method === 'Pix') {
        finalMethod = 'Pix (5% OFF)';
      }
      
      const sale = await makeSale(cart, finalMethod, discount, processingTime);
      onSaleComplete(sale);
      showToast(`Venda #${sale.sale_code} finalizada! 🎉`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Erro ao processar pagamento', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Pagamento 💸</h2>
        <p style={{ color: '#636e72', marginBottom: '10px' }}>Total da venda:</p>
        <p style={{
          fontSize: '2.5rem',
          fontWeight: 900,
          color: 'var(--primary)',
          marginBottom: '10px'
        }}>
          {formatCurrency(total)}
        </p>

        <div style={{
          margin: '20px 0',
          padding: '15px',
          background: '#f8f9fa',
          borderRadius: '16px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '10px'
          }}>
            <span>Subtotal:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}>
              <span>Desconto ({discount}%):</span>
              <span style={{ color: '#00b894' }}>-{formatCurrency(discountAmount)}</span>
            </div>
          )}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontWeight: 700
          }}>
            <span>Total:</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="payment-options">
          <button
            className="btn-pay"
            onClick={() => handlePayment('Pix')}
            disabled={isProcessing}
          >
            <i className="fas fa-qrcode"></i> 💠 Pix (5% OFF)
          </button>
          <button
            className="btn-pay"
            onClick={() => handlePayment('Cartão Crédito')}
            disabled={isProcessing}
          >
            <i className="fas fa-credit-card"></i> 💳 Crédito
          </button>
          <button
            className="btn-pay"
            onClick={() => handlePayment('Cartão Débito')}
            disabled={isProcessing}
          >
            <i className="fas fa-credit-card"></i> 💳 Débito
          </button>
          <button
            className="btn-pay"
            onClick={() => handlePayment('Dinheiro')}
            disabled={isProcessing}
          >
            <i className="fas fa-money-bill-wave"></i> 💵 Dinheiro
          </button>
        </div>

        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button
            className="btn-checkout"
            style={{ background: '#ff7675', flex: 1 }}
            onClick={onClose}
            disabled={isProcessing}
          >
            <i className="fas fa-times"></i> Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  cart: CartItem[];
}

export function ReceiptModal({ isOpen, onClose, sale, cart }: ReceiptModalProps) {
  if (!isOpen || !sale) return null;

  const generateReceiptText = () => {
    let text = `*PDV Mágico Pro - Comprovante de Venda* ✨%0A`;
    text += `ID: ${sale.sale_code}%0A`;
    text += `Data: ${new Date(sale.created_at).toLocaleString('pt-BR')}%0A`;
    text += `Pagamento: ${sale.payment_method}%0A`;
    text += `--------------------------------%0A`;
    text += `*ITENS*%0A`;

    cart.forEach((item) => {
      text += `${item.qty}x ${item.name}%0A`;
      text += `   ${formatCurrency(item.price * item.qty)}%0A`;
    });

    text += `--------------------------------%0A`;
    text += `Subtotal: ${formatCurrency(sale.subtotal)}%0A`;
    if (sale.discount > 0) {
      text += `Desconto: -${formatCurrency(sale.discount)}%0A`;
    }
    text += `*TOTAL: ${formatCurrency(sale.total)}*%0A`;
    text += `--------------------------------%0A`;
    text += `Obrigado pela preferência! 🌟%0A`;
    text += `Volte sempre!`;

    return text;
  };

  const sendViaWhatsapp = () => {
    const text = generateReceiptText();
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    showToast('Comprovante pronto para envio no WhatsApp', 'success');
  };

  const sendViaEmail = () => {
    let body = `PDV Mágico Pro - Comprovante de Venda\n`;
    body += `ID: ${sale.sale_code}\n`;
    body += `Data: ${new Date(sale.created_at).toLocaleString('pt-BR')}\n`;
    body += `Pagamento: ${sale.payment_method}\n`;
    body += `--------------------------------\n`;
    body += `ITENS:\n`;

    cart.forEach((item) => {
      body += `${item.qty}x ${item.name} - ${formatCurrency(item.price * item.qty)}\n`;
    });

    body += `--------------------------------\n`;
    body += `Subtotal: ${formatCurrency(sale.subtotal)}\n`;
    if (sale.discount > 0) {
      body += `Desconto: -${formatCurrency(sale.discount)}\n`;
    }
    body += `TOTAL: ${formatCurrency(sale.total)}\n\n`;
    body += `Obrigado pela preferência! 🌟\n`;
    body += `Volte sempre!`;

    const subject = encodeURIComponent(`Comprovante ${sale.sale_code} - PDV Mágico Pro`);
    const encodedBody = encodeURIComponent(body);

    window.location.href = `mailto:?subject=${subject}&body=${encodedBody}`;
    showToast('Cliente de email aberto com comprovante', 'info');
  };

  const printReceipt = () => {
    const width = 300;
    const height = 600;
    const left = (screen.width / 2) - (width / 2);
    const top = (screen.height / 2) - (height / 2);

    const win = window.open(
      '',
      'Receipt',
      `toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=${width},height=${height},top=${top},left=${left}`
    );

    const itemsHtml = cart
      .map(
        (item) => `
          <div style="margin-bottom: 8px;">
            <div>${item.qty}x ${item.name.substring(0, 20)}</div>
            <div style="text-align: right;">${formatCurrency(item.price * item.qty)}</div>
          </div>
        `
      )
      .join('');

    win!.document.write(`
      <html>
      <head>
        <title>Cupom Fiscal - ${sale.sale_code}</title>
        <style>
          body { font-family: 'Courier New', monospace; font-size: 12px; padding: 15px; width: 100%; margin: 0; }
          .center { text-align: center; }
          .line { border-bottom: 1px dashed #000; margin: 8px 0; }
          .total { font-weight: bold; font-size: 14px; margin-top: 12px; }
          .header { margin-bottom: 15px; }
          .footer { margin-top: 20px; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="header center">
          <strong>PDV MÁGICO PRO ✨</strong><br>
          <small>Sistema Inteligente de Vendas</small><br>
          ${new Date(sale.created_at).toLocaleString('pt-BR')}<br>
          ID: ${sale.sale_code}<br>
          ---------------------------
        </div>
        
        <div><strong>ITENS:</strong></div>
        ${itemsHtml}
        <div class="line"></div>
        
        <div style="text-align: right;">
          <div>Subtotal: ${formatCurrency(sale.subtotal)}</div>
          ${sale.discount > 0 ? `<div>Desconto: -${formatCurrency(sale.discount)}</div>` : ''}
          <div class="total">TOTAL: ${formatCurrency(sale.total)}</div>
        </div>
        
        <div class="line"></div>
        <div>Pagamento: ${sale.payment_method}</div>
        
        <div class="footer center">
          ---------------------------<br>
          Obrigado pela preferência!<br>
          Volte sempre! 🌟<br>
          PDV Mágico Pro
        </div>
        
        <script>
          setTimeout(() => {
            window.print();
            setTimeout(() => window.close(), 500);
          }, 300);
        <\/script>
      </body>
      </html>
    `);

    win!.document.close();
    showToast('Impressão de recibo iniciada', 'success');
  };

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Venda Finalizada! 🎉</h2>
        <p style={{ color: '#636e72', marginBottom: '20px' }}>
          Comprovante gerado com sucesso!
        </p>

        <div style={{
          background: '#f8f9fa',
          padding: '20px',
          borderRadius: '16px',
          marginBottom: '25px',
          textAlign: 'left'
        }}>
          <p><strong>ID da Venda:</strong> #{sale.sale_code}</p>
          <p><strong>Data/Hora:</strong> {new Date(sale.created_at).toLocaleString('pt-BR')}</p>
          <p><strong>Método de Pagamento:</strong> {sale.payment_method}</p>
          <p>
            <strong>Valor Total:</strong>{' '}
            <span style={{ fontWeight: 900, color: 'var(--primary)' }}>
              {formatCurrency(sale.total)}
            </span>
          </p>
        </div>

        <p style={{ color: '#636e72', marginBottom: '20px' }}>
          Como deseja emitir o comprovante?
        </p>

        <div className="receipt-options">
          <button className="btn-receipt btn-print" onClick={printReceipt}>
            <i className="fas fa-print"></i> 🖨️ Imprimir
          </button>
          <button className="btn-receipt btn-whatsapp" onClick={sendViaWhatsapp}>
            <i className="fab fa-whatsapp"></i> 📱 Enviar WhatsApp
          </button>
          <button className="btn-receipt btn-email" onClick={sendViaEmail}>
            <i className="fas fa-envelope"></i> 📧 Enviar por Email
          </button>
        </div>

        <button
          className="btn-checkout"
          style={{ background: '#b2bec3', marginTop: '20px' }}
          onClick={onClose}
        >
          <i className="fas fa-redo"></i> Fechar / Nova Venda
        </button>
      </div>
    </div>
  );
}

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

import { useAuth } from '@/hooks/useAuth';
import { formatDocument, formatPhone, getDaysUntil } from '@/lib/supabase';

export function AccountModal({ isOpen, onClose, onLogout }: AccountModalProps) {
  const { profile } = useAuth();

  if (!isOpen || !profile) return null;

  const daysLeft = getDaysUntil(profile.valid_until);

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <h2>Minha Conta 👤</h2>

        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 15px',
            color: 'white',
            fontSize: '2rem'
          }}>
            👑
          </div>
          <h3>{profile.company_name}</h3>
          <p style={{ color: '#636e72' }}>{profile.email}</p>
        </div>

        <div style={{
          background: '#f8f9fa',
          padding: '20px',
          borderRadius: '16px',
          marginBottom: '25px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '15px'
          }}>
            <span>Plano Atual:</span>
            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
              {profile.is_trial ? 'TRIAL' : profile.plan.toUpperCase()}
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '15px'
          }}>
            <span>Válido até:</span>
            <span style={{ fontWeight: 700 }}>
              {new Date(profile.valid_until).toLocaleDateString('pt-BR')}
            </span>
          </div>
          {profile.is_trial && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '15px'
            }}>
              <span>Dias restantes:</span>
              <span style={{
                fontWeight: 700,
                color: daysLeft <= 3 ? '#ff7675' : '#00b894'
              }}>
                {daysLeft} dias
              </span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Próxima cobrança:</span>
            <span style={{ fontWeight: 700 }}>
              {profile.is_trial
                ? 'R$ 29,90 após o trial'
                : `R$ 29,90 em ${new Date(profile.next_billing || '').toLocaleDateString('pt-BR')}`}
            </span>
          </div>
        </div>

        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>Informações da Empresa</h3>
          <div style={{ display: 'grid', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>CNPJ/CPF:</span>
              <span style={{ fontWeight: 700 }}>{formatDocument(profile.document)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Telefone:</span>
              <span style={{ fontWeight: 700 }}>{formatPhone(profile.phone)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Data de Cadastro:</span>
              <span style={{ fontWeight: 700 }}>
                {new Date(profile.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '10px' }}>
          <button
            className="btn-checkout"
            onClick={() => {
              showToast('Página de pagamento em desenvolvimento', 'warning');
            }}
          >
            <i className="fas fa-crown"></i> 💎 Atualizar para Plano Premium
          </button>
          <button
            className="btn-checkout"
            style={{ background: '#ff7675' }}
            onClick={onLogout}
          >
            <i className="fas fa-sign-out-alt"></i> Sair do Sistema
          </button>
        </div>
      </div>
    </div>
  );
}

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
