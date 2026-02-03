// ============================================
// SEÇÃO ESTOQUE - PDV MÁGICO PRO
// ============================================

import { useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { formatCurrency, type Product } from '@/lib/supabase';

const EMOJI_DB = [
  { char: '🍔', keys: 'hamburguer burger lanche fast food comida', category: 'alimento' },
  { char: '🍕', keys: 'pizza comida massa italiana queijo', category: 'alimento' },
  { char: '🌭', keys: 'hotdog cachorro quente salsicha lanche', category: 'alimento' },
  { char: '🍟', keys: 'batata frita chips salgado fast', category: 'alimento' },
  { char: '🥪', keys: 'sanduiche misto natural lanche', category: 'alimento' },
  { char: '🌮', keys: 'taco mexicano comida', category: 'alimento' },
  { char: '🍙', keys: 'sushi onigiri arroz japao japones', category: 'alimento' },
  { char: '🍣', keys: 'sushi peixe cru japao', category: 'alimento' },
  { char: '🍤', keys: 'camarao frito empanado mar', category: 'alimento' },
  { char: '🍦', keys: 'sorvete casquinha doce gelado', category: 'alimento' },
  { char: '🍩', keys: 'donut rosquinha doce padaria', category: 'alimento' },
  { char: '🍪', keys: 'cookie biscoito bolacha doce', category: 'alimento' },
  { char: '🍫', keys: 'chocolate barra doce cacau', category: 'alimento' },
  { char: '🍬', keys: 'bala doce caramelo', category: 'alimento' },
  { char: '🍭', keys: 'pirulito doce', category: 'alimento' },
  { char: '🍮', keys: 'pudim flan sobremesa', category: 'alimento' },
  { char: '☕', keys: 'cafe coffee expresso bebida quente', category: 'bebida' },
  { char: '🥤', keys: 'suco refrigerante bebida copo', category: 'bebida' },
  { char: '🍺', keys: 'cerveja beer alcool bebida', category: 'bebida' },
  { char: '🍷', keys: 'vinho taca bebida alcool', category: 'bebida' },
  { char: '🍸', keys: 'drink coquetel alcool', category: 'bebida' },
  { char: '🍎', keys: 'maca fruta saudavel vermelha', category: 'alimento' },
  { char: '🍌', keys: 'banana fruta amarela', category: 'alimento' },
  { char: '🍇', keys: 'uva fruta roxo vinho', category: 'alimento' },
  { char: '🥥', keys: 'coco fruta tropical', category: 'alimento' },
  { char: '🍉', keys: 'melancia fruta verao', category: 'alimento' },
  { char: '🍒', keys: 'cereja fruta bolo', category: 'alimento' },
  { char: '🍓', keys: 'morango fruta vermelho doce', category: 'alimento' },
  { char: '🥩', keys: 'carne bife churrasco proteina', category: 'alimento' },
  { char: '🍗', keys: 'frango coxa assado carne', category: 'alimento' },
  { char: '🥓', keys: 'bacon carne porco cafe', category: 'alimento' },
  { char: '👕', keys: 'camisa roupa vestuario moda', category: 'vestuario' },
  { char: '👖', keys: 'calca jeans roupa moda', category: 'vestuario' },
  { char: '👗', keys: 'vestido roupa mulher', category: 'vestuario' },
  { char: '👟', keys: 'tenis sapato calcado esporte', category: 'vestuario' },
  { char: '⌚', keys: 'relogio watch tempo acessorio', category: 'eletronico' },
  { char: '💻', keys: 'notebook laptop computador pc', category: 'eletronico' },
  { char: '📱', keys: 'celular iphone smartphone', category: 'eletronico' },
  { char: '🔌', keys: 'tomada cabo energia', category: 'eletronico' },
  { char: '🔋', keys: 'bateria pilha energia', category: 'eletronico' },
  { char: '🎁', keys: 'presente caixa surpresa', category: 'outro' },
  { char: '📦', keys: 'caixa pacote encomenda', category: 'outro' },
  { char: '💊', keys: 'remedio pilula farmacia saude', category: 'outro' },
  { char: '🧹', keys: 'vassoura limpeza casa', category: 'limpeza' },
  { char: '🛒', keys: 'carrinho compras mercado', category: 'outro' },
  { char: '🧴', keys: 'sabonete shampoo higiene', category: 'limpeza' },
  { char: '🧼', keys: 'sabao detergente limpeza', category: 'limpeza' },
  { char: '📺', keys: 'televisao tv entretenimento', category: 'eletronico' },
  { char: '🎮', keys: 'videogame jogo console', category: 'eletronico' },
  { char: '📚', keys: 'livro leitura estudo', category: 'outro' },
  { char: '✏️', keys: 'lapis caneta escrita', category: 'outro' },
];

export function StockSection() {
  const { products, isLoading, addProduct, editProduct, removeProduct, changeStock, lowStockProducts } = useProducts();
  
  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('');
  const [emoji, setEmoji] = useState('');
  const [emojiPreview, setEmojiPreview] = useState('📦');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Search
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtered products
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Suggest emoji based on name
  const suggestEmoji = (productName: string) => {
    if (!productName) return;
    
    const searchTerm = productName.toLowerCase();
    const found = EMOJI_DB.find((item) =>
      item.keys.includes(searchTerm) ||
      searchTerm.includes(item.keys.split(' ')[0])
    );
    
    if (found) {
      setEmoji(found.char);
      setEmojiPreview(found.char);
      if (!category) {
        setCategory(found.category);
      }
    }
  };

  const handleNameChange = (value: string) => {
    setName(value);
    suggestEmoji(value);
  };

  const handleEmojiChange = (value: string) => {
    setEmoji(value);
    // Extrair emoji do início da string
    const emojiRegex = /[\p{Emoji_Presentation}\p{Emoji}\uFE0F]/u;
    if (emojiRegex.test(value.charAt(0))) {
      setEmojiPreview(value.charAt(0));
    } else {
      // Buscar nos emojis
      const found = EMOJI_DB.find((item) =>
        item.keys.includes(value.toLowerCase())
      );
      setEmojiPreview(found ? found.char : '❓');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !price || !stock) {
      showToast('Preencha todos os campos obrigatórios', 'error');
      return;
    }
    
    const productData = {
      name,
      price: parseFloat(price),
      stock: parseInt(stock),
      emoji: emoji || '📦',
      category: (category || 'outro') as 'alimento' | 'bebida' | 'limpeza' | 'eletronico' | 'vestuario' | 'outro',
      barcode: null,
      description: null,
      cost_price: 0,
      min_stock: 5,
      is_active: true,
    };
    
    try {
      if (editingId) {
        await editProduct(editingId, productData);
        showToast('Produto atualizado com sucesso!', 'success');
        setEditingId(null);
      } else {
        await addProduct(productData as any);
        showToast('Produto adicionado com sucesso!', 'success');
      }
      
      // Reset form
      setName('');
      setPrice('');
      setStock('');
      setCategory('');
      setEmoji('');
      setEmojiPreview('📦');
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar produto', 'error');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setName(product.name);
    setPrice(product.price.toString());
    setStock(product.stock.toString());
    setCategory(product.category);
    setEmoji(product.emoji);
    setEmojiPreview(product.emoji);
    
    // Scroll to form
    document.querySelector('.form-add')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setPrice('');
    setStock('');
    setCategory('');
    setEmoji('');
    setEmojiPreview('📦');
  };

  const handleDelete = async (product: Product) => {
    if (confirm(`Tem certeza que deseja excluir "${product.name}"?`)) {
      try {
        await removeProduct(product.id);
        showToast('Produto excluído com sucesso!', 'success');
      } catch (err: any) {
        showToast(err.message || 'Erro ao excluir produto', 'error');
      }
    }
  };

  const handleStockChange = async (product: Product, newStock: number) => {
    try {
      await changeStock(product.id, newStock, 'Ajuste manual');
      showToast(`Estoque de ${product.name} atualizado!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Erro ao atualizar estoque', 'error');
    }
  };

  const exportCSV = () => {
    let csv = 'Produto;Preço;Estoque;Categoria\n';
    products.forEach((p) => {
      csv += `"${p.name}";${p.price.toFixed(2)};${p.stock};${p.category}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `estoque_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Estoque exportado como CSV', 'success');
  };

  if (isLoading) {
    return (
      <div className="section active" style={{ textAlign: 'center', padding: '50px' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--primary)' }}></i>
        <p>Carregando produtos...</p>
      </div>
    );
  }

  return (
    <section id="stock" className="section active">
      <h2><i className="fas fa-boxes"></i> Gestão de Estoque Inteligente 📦</h2>
      
      {/* Formulário */}
      <form className="form-add" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nome do Produto"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
        />
        <input
          type="number"
          placeholder="Preço (R$)"
          step="0.01"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <input
          type="number"
          placeholder="Quantidade"
          min="0"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
        />
        
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Categoria...</option>
          <option value="alimento">🍔 Alimentos</option>
          <option value="bebida">🥤 Bebidas</option>
          <option value="limpeza">🧼 Limpeza</option>
          <option value="eletronico">📱 Eletrônicos</option>
          <option value="vestuario">👕 Vestuário</option>
          <option value="outro">📦 Outros</option>
        </select>
        
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            placeholder="Emoji (digite para buscar)"
            value={emoji}
            onChange={(e) => handleEmojiChange(e.target.value)}
            list="emojiList"
          />
          <datalist id="emojiList">
            {EMOJI_DB.map((item, idx) => (
              <option key={idx} value={`${item.char} ${item.keys.split(' ')[0]}`} />
            ))}
          </datalist>
          <div style={{
            position: 'absolute',
            right: '15px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '1.5rem',
            pointerEvents: 'none'
          }}>
            {emojiPreview}
          </div>
        </div>

        <button
          type="submit"
          className="btn-checkout"
          style={{ width: 'auto', padding: '14px 25px' }}
        >
          <i className={editingId ? 'fas fa-save' : 'fas fa-plus-circle'}></i>
          {editingId ? ' Salvar' : ' Adicionar'}
        </button>
        
        {editingId && (
          <button
            type="button"
            className="btn-checkout"
            style={{ width: 'auto', padding: '14px 25px', background: '#ff7675' }}
            onClick={handleCancelEdit}
          >
            <i className="fas fa-times"></i> Cancelar
          </button>
        )}
      </form>

      {/* Tabela */}
      <div className="table-container">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <h3 style={{ margin: 0 }}>
            Produtos Cadastrados
            {lowStockProducts.length > 0 && (
              <span style={{
                background: '#ff7675',
                color: 'white',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '0.8rem',
                marginLeft: '10px'
              }}>
                {lowStockProducts.length} com estoque baixo
              </span>
            )}
          </h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="Buscar produto..."
              style={{ width: '200px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="quick-action-btn" onClick={exportCSV}>
              <i className="fas fa-file-export"></i> Exportar
            </button>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Preço</th>
              <th>Estoque</th>
              <th>Categoria</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#b2bec3' }}>
                  <i className="fas fa-box-open" style={{ fontSize: '2rem', marginBottom: '10px', display: 'block' }}></i>
                  Nenhum produto encontrado
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => {
                let stockClass = 'stock-high';
                if (product.stock < 3) stockClass = 'stock-low';
                else if (product.stock < product.min_stock) stockClass = 'stock-medium';
                
                return (
                  <tr key={product.id}>
                    <td>{product.emoji} {product.name}</td>
                    <td>{formatCurrency(product.price)}</td>
                    <td>
                      <span className={`product-stock ${stockClass}`} style={{ position: 'static', display: 'inline-block' }}>
                        {product.stock}
                      </span>
                      <input
                        type="number"
                        defaultValue={product.stock}
                        onBlur={(e) => handleStockChange(product, parseInt(e.target.value) || 0)}
                        style={{ width: '70px', padding: '5px 8px', borderRadius: '8px', border: '1px solid #dfe6e9', marginLeft: '10px' }}
                      />
                    </td>
                    <td>{getCategoryName(product.category)}</td>
                    <td>
                      <button
                        onClick={() => handleEdit(product)}
                        style={{
                          background: '#00cec9',
                          color: 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          marginRight: '5px'
                        }}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        style={{
                          background: '#ff7675',
                          color: 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
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
