// ============================================
// HOOK DE VENDAS - PDV MÁGICO PRO
// ============================================

import { useState, useEffect, useCallback } from 'react';
import {
  getSalesWithItems,
  createSale,
  subscribeToSales,
  type Sale,
  type SaleItem,
  type CreateSaleData,
} from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  emoji: string;
  category: string;
  stock: number;
}

export function useSales() {
  const { user } = useAuth();
  const [sales, setSales] = useState<(Sale & { items: SaleItem[] })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar vendas
  const loadSales = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getSalesWithItems(user.id, 50);
      setSales(data);
    } catch (err) {
      setError('Erro ao carregar vendas');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Carregar vendas na montagem
  useEffect(() => {
    loadSales();
  }, [loadSales]);

  // Subscribe a novas vendas em tempo real
  useEffect(() => {
    if (!user) return;

    const subscription = subscribeToSales(user.id, () => {
      loadSales();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user, loadSales]);

  // Criar nova venda
  const makeSale = useCallback(
    async (
      cart: CartItem[],
      paymentMethod: string,
      discount: number = 0,
      processingTime: number = 0
    ) => {
      if (!user) throw new Error('Usuário não autenticado');
      if (cart.length === 0) throw new Error('Carrinho vazio');

      const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
      const discountAmount = subtotal * (discount / 100);
      const total = subtotal - discountAmount;

      const saleData: CreateSaleData = {
        user_id: user.id,
        subtotal,
        discount: discountAmount,
        total,
        payment_method: paymentMethod,
        items_count: cart.reduce((acc, item) => acc + item.qty, 0),
        processing_time: processingTime,
        items: cart.map((item) => ({
          product_id: item.id,
          product_name: item.name,
          product_price: item.price,
          quantity: item.qty,
          total: item.price * item.qty,
          emoji: item.emoji,
        })),
      };

      try {
        const newSale = await createSale(saleData);
        await loadSales();
        return newSale;
      } catch (err) {
        console.error('Error creating sale:', err);
        throw err;
      }
    },
    [user, loadSales]
  );

  // Calcular estatísticas de vendas
  const getSalesStats = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const todaySales = sales.filter(
      (s) => new Date(s.created_at) >= today
    );
    const weekSales = sales.filter(
      (s) => new Date(s.created_at) >= weekAgo
    );
    const monthSales = sales.filter(
      (s) => new Date(s.created_at) >= monthAgo
    );

    const todayTotal = todaySales.reduce((acc, s) => acc + s.total, 0);
    const weekTotal = weekSales.reduce((acc, s) => acc + s.total, 0);
    const monthTotal = monthSales.reduce((acc, s) => acc + s.total, 0);

    const avgTicket =
      todaySales.length > 0 ? todayTotal / todaySales.length : 0;

    return {
      todayTotal,
      todayCount: todaySales.length,
      weekTotal,
      monthTotal,
      avgTicket,
    };
  }, [sales]);

  // Produto mais vendido
  const getTopProduct = useCallback(() => {
    const productCounts: Record<string, { name: string; qty: number }> = {};

    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (productCounts[item.product_name]) {
          productCounts[item.product_name].qty += item.quantity;
        } else {
          productCounts[item.product_name] = {
            name: item.product_name,
            qty: item.quantity,
          };
        }
      });
    });

    const products = Object.values(productCounts);
    if (products.length === 0) return null;

    return products.reduce((prev, current) =>
      prev.qty > current.qty ? prev : current
    );
  }, [sales]);

  return {
    sales,
    isLoading,
    error,
    loadSales,
    makeSale,
    getSalesStats,
    getTopProduct,
  };
}
