// ============================================
// SUPABASE CLIENT - PDV MÁGICO PRO
// ============================================

import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://kbucnveojexlxlnefmdo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtidWNudmVvamV4bHhsbmVmbWRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2OTUzOTgsImV4cCI6MjA4NTI3MTM5OH0.usSiBO518-4rdkvVxq1QAi71hCLTicIurfAu2N0gShs';

// Criar cliente do Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// ============================================
// TIPOS DO SUPABASE
// ============================================

export interface Profile {
  id: string;
  company_name: string;
  document: string;
  phone: string;
  email: string;
  plan: 'trial' | 'professional' | 'premium';
  status: 'active' | 'suspended' | 'cancelled';
  valid_until: string;
  next_billing: string | null;
  is_trial: boolean;
  payment_method: string;
  created_at: string;
  updated_at: string;
  settings: Record<string, any>;
}

export interface Product {
  id: string;
  user_id: string;
  name: string;
  price: number;
  stock: number;
  emoji: string;
  category: 'alimento' | 'bebida' | 'limpeza' | 'eletronico' | 'vestuario' | 'outro';
  barcode: string | null;
  description: string | null;
  cost_price: number;
  min_stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  user_id: string;
  sale_code: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: string;
  items_count: number;
  processing_time: number;
  notes: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  is_refunded: boolean;
  refunded_at: string | null;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string | null;
  product_name: string;
  product_price: number;
  quantity: number;
  total: number;
  emoji: string;
  created_at: string;
}

export interface StockHistory {
  id: string;
  user_id: string;
  product_id: string | null;
  product_name: string;
  old_stock: number;
  new_stock: number;
  change_type: 'entrada' | 'saida' | 'ajuste' | 'venda' | 'cancelamento';
  reason: string | null;
  sale_id: string | null;
  created_at: string;
}

export interface StoreSettings {
  id: string;
  user_id: string;
  store_name: string | null;
  store_address: string | null;
  store_phone: string | null;
  store_email: string | null;
  receipt_header: string;
  receipt_footer: string;
  enable_pix_discount: boolean;
  pix_discount_percent: number;
  enable_low_stock_alert: boolean;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  today_sales: number;
  today_tickets: number;
  avg_ticket: number;
  week_sales: number;
  month_sales: number;
  low_stock_count: number;
  top_product: string;
  top_product_qty: number;
}

// ============================================
// FUNÇÕES DE AUTENTICAÇÃO
// ============================================

export async function signUp(
  email: string,
  password: string,
  companyName: string,
  document: string,
  phone: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        company_name: companyName,
        document: document,
        phone: phone,
      },
    },
  });

  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

// ============================================
// FUNÇÕES DE PERFIL
// ============================================

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// FUNÇÕES DE PRODUTOS
// ============================================

export async function getProducts(userId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return data || [];
}

export async function createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProduct(productId: string, updates: Partial<Product>) {
  const { data, error } = await supabase
    .from('products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', productId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProduct(productId: string) {
  const { error } = await supabase
    .from('products')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', productId);

  if (error) throw error;
}

export async function updateStock(productId: string, newStock: number, reason?: string) {
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('stock, name')
    .eq('id', productId)
    .single();

  if (fetchError) throw fetchError;

  const oldStock = product.stock;

  const { error: updateError } = await supabase
    .from('products')
    .update({ stock: newStock, updated_at: new Date().toISOString() })
    .eq('id', productId);

  if (updateError) throw updateError;

  // Registrar no histórico
  const { error: historyError } = await supabase
    .from('stock_history')
    .insert({
      user_id: (await getCurrentUser())?.id,
      product_id: productId,
      product_name: product.name,
      old_stock: oldStock,
      new_stock: newStock,
      change_type: newStock > oldStock ? 'entrada' : 'saida',
      reason: reason || 'Ajuste manual',
    });

  if (historyError) console.error('Error logging stock history:', historyError);
}

// ============================================
// FUNÇÕES DE VENDAS
// ============================================

export interface CreateSaleData {
  user_id: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: string;
  items_count: number;
  processing_time: number;
  items: {
    product_id: string;
    product_name: string;
    product_price: number;
    quantity: number;
    total: number;
    emoji: string;
  }[];
}

export async function createSale(saleData: CreateSaleData): Promise<Sale> {
  // Iniciar transação
  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert({
      user_id: saleData.user_id,
      subtotal: saleData.subtotal,
      discount: saleData.discount,
      total: saleData.total,
      payment_method: saleData.payment_method,
      items_count: saleData.items_count,
      processing_time: saleData.processing_time,
    })
    .select()
    .single();

  if (saleError) throw saleError;

  // Inserir itens da venda
  const saleItems = saleData.items.map(item => ({
    sale_id: sale.id,
    ...item,
  }));

  const { error: itemsError } = await supabase
    .from('sale_items')
    .insert(saleItems);

  if (itemsError) {
    // Rollback: deletar venda se falhar ao inserir itens
    await supabase.from('sales').delete().eq('id', sale.id);
    throw itemsError;
  }

  return sale;
}

export async function getSales(userId: string, limit: number = 50): Promise<Sale[]> {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching sales:', error);
    return [];
  }

  return data || [];
}

export async function getSaleItems(saleId: string): Promise<SaleItem[]> {
  const { data, error } = await supabase
    .from('sale_items')
    .select('*')
    .eq('sale_id', saleId);

  if (error) {
    console.error('Error fetching sale items:', error);
    return [];
  }

  return data || [];
}

export async function getSalesWithItems(userId: string, limit: number = 50): Promise<(Sale & { items: SaleItem[] })[]> {
  const { data: sales, error: salesError } = await supabase
    .from('sales')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (salesError) {
    console.error('Error fetching sales:', salesError);
    return [];
  }

  const salesWithItems = await Promise.all(
    (sales || []).map(async (sale) => {
      const items = await getSaleItems(sale.id);
      return { ...sale, items };
    })
  );

  return salesWithItems;
}

// ============================================
// FUNÇÕES DO DASHBOARD
// ============================================

export async function getDashboardStats(userId: string): Promise<DashboardStats | null> {
  const { data, error } = await supabase
    .rpc('get_dashboard_stats', { p_user_id: userId });

  if (error) {
    console.error('Error fetching dashboard stats:', error);
    return null;
  }

  return data?.[0] || null;
}

// ============================================
// FUNÇÕES DE CONFIGURAÇÕES
// ============================================

export async function getStoreSettings(userId: string): Promise<StoreSettings | null> {
  const { data, error } = await supabase
    .from('store_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching store settings:', error);
    return null;
  }

  return data;
}

export async function updateStoreSettings(userId: string, updates: Partial<StoreSettings>) {
  const { data, error } = await supabase
    .from('store_settings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// FUNÇÕES DE EMOJIS
// ============================================

export async function getEmojis(): Promise<{ emoji: string; keywords: string; category: string }[]> {
  const { data, error } = await supabase
    .from('emoji_reference')
    .select('emoji, keywords, category')
    .order('id');

  if (error) {
    console.error('Error fetching emojis:', error);
    return [];
  }

  return data || [];
}

// ============================================
// SUBSCRIPTIONS (REALTIME)
// ============================================

export function subscribeToProducts(userId: string, callback: (payload: any) => void) {
  return supabase
    .channel('products_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'products',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
}

export function subscribeToSales(userId: string, callback: (payload: any) => void) {
  return supabase
    .channel('sales_changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'sales',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
}

// ============================================
// UTILITÁRIOS
// ============================================

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDocument(doc: string): string {
  const cleanDoc = doc.replace(/\D/g, '');
  
  if (cleanDoc.length === 11) {
    return cleanDoc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (cleanDoc.length === 14) {
    return cleanDoc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  
  return doc;
}

export function formatPhone(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length === 11) {
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
}

export function getDaysUntil(dateString: string): number {
  const targetDate = new Date(dateString);
  const now = new Date();
  const diffTime = targetDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
