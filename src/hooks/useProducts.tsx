// ============================================
// HOOK DE PRODUTOS - PDV MÁGICO PRO
// ============================================

import { useState, useEffect, useCallback } from 'react';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  subscribeToProducts,
  type Product,
} from '@/lib/supabase';
import { useAuth } from './useAuth';

export function useProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar produtos
  const loadProducts = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getProducts(user.id);
      setProducts(data);
    } catch (err) {
      setError('Erro ao carregar produtos');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Carregar produtos na montagem
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Subscribe a mudanças em tempo real
  useEffect(() => {
    if (!user) return;

    const subscription = subscribeToProducts(user.id, (payload) => {
      if (payload.eventType === 'INSERT') {
        setProducts((prev) => [...prev, payload.new]);
      } else if (payload.eventType === 'UPDATE') {
        setProducts((prev) =>
          prev.map((p) => (p.id === payload.new.id ? payload.new : p))
        );
      } else if (payload.eventType === 'DELETE') {
        setProducts((prev) => prev.filter((p) => p.id !== payload.old.id));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  // Adicionar produto
  const addProduct = useCallback(
    async (product: Omit<Product, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('Usuário não autenticado');

      try {
        const newProduct = await createProduct({
          ...product,
          user_id: user.id,
        } as any);
        return newProduct;
      } catch (err) {
        console.error('Error creating product:', err);
        throw err;
      }
    },
    [user]
  );

  // Editar produto
  const editProduct = useCallback(
    async (productId: string, updates: Partial<Product>) => {
      try {
        const updated = await updateProduct(productId, updates);
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? updated : p))
        );
        return updated;
      } catch (err) {
        console.error('Error updating product:', err);
        throw err;
      }
    },
    []
  );

  // Remover produto
  const removeProduct = useCallback(
    async (productId: string) => {
      try {
        await deleteProduct(productId);
        setProducts((prev) => prev.filter((p) => p.id !== productId));
      } catch (err) {
        console.error('Error deleting product:', err);
        throw err;
      }
    },
    []
  );

  // Atualizar estoque
  const changeStock = useCallback(
    async (productId: string, newStock: number, reason?: string) => {
      try {
        await updateStock(productId, newStock, reason);
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId ? { ...p, stock: newStock } : p
          )
        );
      } catch (err) {
        console.error('Error updating stock:', err);
        throw err;
      }
    },
    []
  );

  // Buscar produto por ID
  const getProductById = useCallback(
    (id: string) => {
      return products.find((p) => p.id === id);
    },
    [products]
  );

  // Buscar produto por nome/código
  const searchProducts = useCallback(
    (term: string) => {
      const lowerTerm = term.toLowerCase();
      return products.filter(
        (p) =>
          p.name.toLowerCase().includes(lowerTerm) ||
          p.barcode?.toLowerCase() === lowerTerm
      );
    },
    [products]
  );

  // Produtos com estoque baixo
  const lowStockProducts = products.filter(
    (p) => p.stock < p.min_stock
  );

  return {
    products,
    isLoading,
    error,
    lowStockProducts,
    loadProducts,
    addProduct,
    editProduct,
    removeProduct,
    changeStock,
    getProductById,
    searchProducts,
  };
}
