// ============================================
// SEÇÃO DASHBOARD - PDV MÁGICO PRO
// ============================================

import { useState, useEffect } from 'react';
import { useSales } from '@/hooks/useSales';
import { useProducts } from '@/hooks/useProducts';
import { getDashboardStats, formatCurrency, type Sale, type SaleItem } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function DashboardSection() {
  const { user } = useAuth();
  const { sales, getTopProduct } = useSales();
  const { lowStockProducts } = useProducts();
  const [stats, setStats] = useState({
    todaySales: 0,
    todayTickets: 0,
    avgTicket: 0,
    weekSales: 0,
    monthSales: 0,
    lowStockCount: 0,
    topProduct: '-',
    topProductQty: 0,
  });
  const [filter, setFilter] = useState('all');

  // Carregar estatísticas
  useEffect(() => {
    const loadStats = async () => {
      if (!user) return;
      
      const dashboardStats = await getDashboardStats(user.id);
      if (dashboardStats) {
        setStats({
          todaySales: dashboardStats.today_sales || 0,
          todayTickets: dashboardStats.today_tickets || 0,
          avgTicket: dashboardStats.avg_ticket || 0,
          weekSales: dashboardStats.week_sales || 0,
          monthSales: dashboardStats.month_sales || 0,
          lowStockCount: dashboardStats.low_stock_count || 0,
          topProduct: dashboardStats.top_product || '-',
          topProductQty: dashboardStats.top_product_qty || 0,
        });
      }
    };

    loadStats();
  }, [user, sales]);

  // Calcular variação vs ontem
  const yesterdayTotal = stats.todaySales * 0.9; // Simulado - em produção viria do backend
  const changePercent = yesterdayTotal > 0 
    ? ((stats.todaySales - yesterdayTotal) / yesterdayTotal * 100).toFixed(1)
    : '0';

  // Top product from hook
  const topProductData = getTopProduct();

  // Filtrar vendas
  const getFilteredSales = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return sales.filter((sale) => {
      const saleDate = new Date(sale.created_at);
      if (filter === 'today') return saleDate >= today;
      if (filter === 'week') return saleDate >= weekAgo;
      if (filter === 'month') return saleDate >= monthAgo;
      return true;
    }).slice(0, 10);
  };

  const filteredSales = getFilteredSales();

  const exportCSV = () => {
    let csv = 'ID;Data;Método;Itens;Subtotal;Desconto;Total\n';
    sales.forEach((s) => {
      csv += `"${s.sale_code}";"${s.created_at}";"${s.payment_method}";${s.items_count};${s.subtotal.toFixed(2)};${s.discount.toFixed(2)};${s.total.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vendas_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Vendas exportadas como CSV', 'success');
  };

  const viewSaleDetails = (sale: Sale & { items: SaleItem[] }) => {
    let details = `Venda: ${sale.sale_code}\n`;
    details += `Data: ${new Date(sale.created_at).toLocaleString('pt-BR')}\n`;
    details += `Pagamento: ${sale.payment_method}\n`;
    details += `Subtotal: ${formatCurrency(sale.subtotal)}\n`;
    details += `Desconto: ${formatCurrency(sale.discount)}\n`;
    details += `Total: ${formatCurrency(sale.total)}\n\n`;
    details += `ITENS:\n`;

    sale.items.forEach((item) => {
      details += `${item.quantity}x ${item.product_name} - ${formatCurrency(item.total)}\n`;
    });

    alert(details);
  };

  return (
    <section id="dashboard" className="section active">
      <h2><i className="fas fa-chart-line"></i> Dashboard da Loja 📈</h2>

      {/* Cards de métricas */}
      <div className="dashboard-cards">
        <div className="card-metric">
          <div className="metric-icon">💰</div>
          <div className="metric-info">
            <p>Vendas Hoje</p>
            <h3>{formatCurrency(stats.todaySales)}</h3>
            <p style={{ 
              fontSize: '0.8rem', 
              color: parseFloat(changePercent) >= 0 ? '#00b894' : '#ff7675'
            }}>
              {parseFloat(changePercent) >= 0 ? '+' : ''}{changePercent}% vs ontem
            </p>
          </div>
        </div>

        <div className="card-metric">
          <div className="metric-icon">🧾</div>
          <div className="metric-info">
            <p>Tickets</p>
            <h3>{stats.todayTickets}</h3>
            <p style={{ fontSize: '0.8rem', color: '#636e72' }}>
              Média: {formatCurrency(stats.avgTicket)}
            </p>
          </div>
        </div>

        <div className="card-metric">
          <div className="metric-icon">🔥</div>
          <div className="metric-info">
            <p>Mais Vendido</p>
            <h3 style={{ fontSize: '1.3rem' }}>
              {topProductData?.name || stats.topProduct}
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#636e72' }}>
              {topProductData?.qty || stats.topProductQty} unidades
            </p>
          </div>
        </div>

        <div className="card-metric">
          <div className="metric-icon">📦</div>
          <div className="metric-info">
            <p>Estoque Baixo</p>
            <h3>{lowStockProducts.length}</h3>
            <p style={{ fontSize: '0.8rem', color: '#ff7675' }}>
              {lowStockProducts.length === 1 ? 'Item crítico' : 'Itens críticos'}
            </p>
          </div>
        </div>
      </div>

      {/* Gráfico */}
      <div className="chart-container">
        <h3>Resumo de Vendas</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
          marginTop: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
            padding: '20px',
            borderRadius: '16px',
            color: 'white',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Esta Semana</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '10px' }}>
              {formatCurrency(stats.weekSales)}
            </div>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #00cec9, #81ecec)',
            padding: '20px',
            borderRadius: '16px',
            color: 'white',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Este Mês</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '10px' }}>
              {formatCurrency(stats.monthSales)}
            </div>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #fd79a8, #fab1a0)',
            padding: '20px',
            borderRadius: '16px',
            color: 'white',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total de Vendas</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '10px' }}>
              {sales.length}
            </div>
          </div>
        </div>
      </div>

      {/* Histórico de Vendas */}
      <div className="table-container">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <h3 style={{ margin: 0 }}>Histórico de Vendas</h3>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ width: '150px' }}
            >
              <option value="all">Todas as vendas</option>
              <option value="today">Hoje</option>
              <option value="week">Esta semana</option>
              <option value="month">Este mês</option>
            </select>
            <button className="quick-action-btn" onClick={exportCSV}>
              <i className="fas fa-download"></i> Exportar
            </button>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Método</th>
              <th>Itens</th>
              <th>Total</th>
              <th>Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#b2bec3' }}>
                  <i className="fas fa-chart-line" style={{ fontSize: '2rem', marginBottom: '10px', display: 'block' }}></i>
                  Nenhuma venda registrada no período
                </td>
              </tr>
            ) : (
              filteredSales.map((sale) => (
                <tr key={sale.id}>
                  <td>{new Date(sale.created_at).toLocaleString('pt-BR')}</td>
                  <td>{sale.payment_method}</td>
                  <td>{sale.items_count} itens</td>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    {formatCurrency(sale.total)}
                  </td>
                  <td>
                    <button
                      onClick={() => viewSaleDetails(sale)}
                      style={{
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        padding: '5px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
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
