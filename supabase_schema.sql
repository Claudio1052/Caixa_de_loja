-- ============================================
-- SCHEMA PDV MÁGICO PRO - SUPABASE
-- ============================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABELA: PERFIS DE USUÁRIOS
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    document TEXT UNIQUE NOT NULL, -- CPF ou CNPJ
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    plan TEXT DEFAULT 'trial' CHECK (plan IN ('trial', 'professional', 'premium')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    next_billing TIMESTAMP WITH TIME ZONE,
    is_trial BOOLEAN DEFAULT true,
    payment_method TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    settings JSONB DEFAULT '{}'::jsonb
);

-- Comentários
COMMENT ON TABLE public.profiles IS 'Perfis de usuários do PDV Mágico Pro';
COMMENT ON COLUMN public.profiles.document IS 'CPF ou CNPJ do usuário/empresa';
COMMENT ON COLUMN public.profiles.valid_until IS 'Data de validade da assinatura';

-- ============================================
-- TABELA: PRODUTOS
-- ============================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    emoji TEXT DEFAULT '📦',
    category TEXT DEFAULT 'outro' CHECK (category IN ('alimento', 'bebida', 'limpeza', 'eletronico', 'vestuario', 'outro')),
    barcode TEXT,
    description TEXT,
    cost_price DECIMAL(10,2) DEFAULT 0,
    min_stock INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para produtos
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products USING gin(to_tsvector('portuguese', name));

-- ============================================
-- TABELA: VENDAS
-- ============================================
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sale_code TEXT UNIQUE NOT NULL, -- Código único da venda (V000001)
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('Pix', 'Cartão Crédito', 'Cartão Débito', 'Dinheiro', 'Pix (5% OFF)', 'Múltiplo')),
    items_count INTEGER NOT NULL DEFAULT 0,
    processing_time DECIMAL(5,1) DEFAULT 0,
    notes TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    is_refunded BOOLEAN DEFAULT false,
    refunded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para vendas
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON public.sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_user_date ON public.sales(user_id, created_at);

-- ============================================
-- TABELA: ITENS DA VENDA
-- ============================================
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL, -- Snapshot do nome no momento da venda
    product_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    total DECIMAL(10,2) NOT NULL,
    emoji TEXT DEFAULT '📦',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para itens de venda
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON public.sale_items(product_id);

-- ============================================
-- TABELA: HISTÓRICO DE ESTOQUE
-- ============================================
CREATE TABLE IF NOT EXISTS public.stock_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    old_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    change_type TEXT NOT NULL CHECK (change_type IN ('entrada', 'saida', 'ajuste', 'venda', 'cancelamento')),
    reason TEXT,
    sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA: CONFIGURAÇÕES DA LOJA
-- ============================================
CREATE TABLE IF NOT EXISTS public.store_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    store_name TEXT,
    store_address TEXT,
    store_phone TEXT,
    store_email TEXT,
    receipt_header TEXT DEFAULT 'Obrigado pela preferência!',
    receipt_footer TEXT DEFAULT 'Volte sempre!',
    enable_pix_discount BOOLEAN DEFAULT true,
    pix_discount_percent DECIMAL(5,2) DEFAULT 5.00,
    enable_low_stock_alert BOOLEAN DEFAULT true,
    low_stock_threshold INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA: ASSINATURAS/PAGAMENTOS
-- ============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL CHECK (plan IN ('trial', 'professional', 'premium')),
    status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'BRL',
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    payment_method TEXT,
    payment_id TEXT,
    invoice_url TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- POLÍTICAS DE SEGURANÇA (RLS)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Política: Usuários só veem seus próprios perfis
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Política: Usuários só veem seus próprios produtos
CREATE POLICY "Users can view own products" ON public.products
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products" ON public.products
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products" ON public.products
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products" ON public.products
    FOR DELETE USING (auth.uid() = user_id);

-- Política: Usuários só veem suas próprias vendas
CREATE POLICY "Users can view own sales" ON public.sales
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sales" ON public.sales
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sales" ON public.sales
    FOR UPDATE USING (auth.uid() = user_id);

-- Política: Usuários só veem itens de suas próprias vendas
CREATE POLICY "Users can view own sale items" ON public.sale_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.sales s 
            WHERE s.id = sale_items.sale_id 
            AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own sale items" ON public.sale_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.sales s 
            WHERE s.id = sale_items.sale_id 
            AND s.user_id = auth.uid()
        )
    );

-- Política: Usuários só veem seu histórico de estoque
CREATE POLICY "Users can view own stock history" ON public.stock_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stock history" ON public.stock_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: Usuários só veem suas configurações
CREATE POLICY "Users can view own settings" ON public.store_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.store_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.store_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Política: Usuários só veem suas assinaturas
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- FUNÇÕES E TRIGGERS
-- ============================================

-- Função: Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para profiles
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para products
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para store_settings
CREATE TRIGGER update_store_settings_updated_at
    BEFORE UPDATE ON public.store_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNÇÃO: CRIAR PERFIL APÓS REGISTRO
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    trial_end TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Calcular data de término do trial (7 dias)
    trial_end := NOW() + INTERVAL '7 days';
    
    -- Criar perfil do usuário
    INSERT INTO public.profiles (
        id,
        company_name,
        document,
        phone,
        email,
        plan,
        status,
        valid_until,
        next_billing,
        is_trial,
        payment_method
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'company_name', 'Minha Empresa'),
        COALESCE(NEW.raw_user_meta_data->>'document', '00000000000'),
        COALESCE(NEW.raw_user_meta_data->>'phone', '00000000000'),
        NEW.email,
        'trial',
        'active',
        trial_end,
        trial_end,
        true,
        'pending'
    );
    
    -- Criar configurações padrão da loja
    INSERT INTO public.store_settings (user_id)
    VALUES (NEW.id);
    
    -- Criar registro de assinatura trial
    INSERT INTO public.subscriptions (
        user_id,
        plan,
        status,
        amount,
        period_start,
        period_end
    ) VALUES (
        NEW.id,
        'trial',
        'active',
        0,
        NOW(),
        trial_end
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil após registro
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- FUNÇÃO: ATUALIZAR ESTOQUE APÓS VENDA
-- ============================================
CREATE OR REPLACE FUNCTION update_stock_after_sale()
RETURNS TRIGGER AS $$
DECLARE
    product_record RECORD;
BEGIN
    -- Para cada item da venda, atualizar o estoque
    FOR product_record IN 
        SELECT si.product_id, si.quantity, si.product_name
        FROM public.sale_items si
        WHERE si.sale_id = NEW.id
    LOOP
        -- Atualizar estoque do produto
        UPDATE public.products
        SET stock = stock - product_record.quantity,
            updated_at = NOW()
        WHERE id = product_record.product_id;
        
        -- Registrar no histórico de estoque
        INSERT INTO public.stock_history (
            user_id,
            product_id,
            product_name,
            old_stock,
            new_stock,
            change_type,
            reason,
            sale_id
        )
        SELECT 
            NEW.user_id,
            product_record.product_id,
            product_record.product_name,
            p.stock + product_record.quantity,
            p.stock,
            'venda',
            'Venda #' || NEW.sale_code,
            NEW.id
        FROM public.products p
        WHERE p.id = product_record.product_id;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar estoque após venda
CREATE TRIGGER after_sale_inserted
    AFTER INSERT ON public.sales
    FOR EACH ROW EXECUTE FUNCTION update_stock_after_sale();

-- ============================================
-- FUNÇÃO: GERAR CÓDIGO DA VENDA
-- ============================================
CREATE OR REPLACE FUNCTION generate_sale_code()
RETURNS TRIGGER AS $$
DECLARE
    next_number INTEGER;
    user_prefix TEXT;
BEGIN
    -- Gerar número sequencial para o usuário
    SELECT COUNT(*) + 1 INTO next_number
    FROM public.sales
    WHERE user_id = NEW.user_id;
    
    -- Criar código no formato V000001
    NEW.sale_code := 'V' || LPAD(next_number::TEXT, 6, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar código da venda
CREATE TRIGGER before_sale_insert
    BEFORE INSERT ON public.sales
    FOR EACH ROW EXECUTE FUNCTION generate_sale_code();

-- ============================================
-- FUNÇÕES DE ESTATÍSTICAS
-- ============================================

-- Função: Obter estatísticas do dashboard
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_user_id UUID)
RETURNS TABLE (
    today_sales DECIMAL,
    today_tickets INTEGER,
    avg_ticket DECIMAL,
    week_sales DECIMAL,
    month_sales DECIMAL,
    low_stock_count INTEGER,
    top_product TEXT,
    top_product_qty INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH today_stats AS (
        SELECT 
            COALESCE(SUM(total), 0) as total,
            COUNT(*) as tickets,
            CASE WHEN COUNT(*) > 0 THEN COALESCE(SUM(total), 0) / COUNT(*) ELSE 0 END as avg_ticket
        FROM public.sales
        WHERE user_id = p_user_id
        AND DATE(created_at) = CURRENT_DATE
    ),
    week_stats AS (
        SELECT COALESCE(SUM(total), 0) as total
        FROM public.sales
        WHERE user_id = p_user_id
        AND created_at >= CURRENT_DATE - INTERVAL '7 days'
    ),
    month_stats AS (
        SELECT COALESCE(SUM(total), 0) as total
        FROM public.sales
        WHERE user_id = p_user_id
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
    ),
    low_stock AS (
        SELECT COUNT(*) as count
        FROM public.products
        WHERE user_id = p_user_id
        AND stock < min_stock
        AND is_active = true
    ),
    top_prod AS (
        SELECT 
            si.product_name,
            SUM(si.quantity) as qty
        FROM public.sale_items si
        JOIN public.sales s ON si.sale_id = s.id
        WHERE s.user_id = p_user_id
        AND s.created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY si.product_name
        ORDER BY SUM(si.quantity) DESC
        LIMIT 1
    )
    SELECT 
        t.total,
        t.tickets::INTEGER,
        t.avg_ticket,
        w.total,
        m.total,
        l.count::INTEGER,
        COALESCE(tp.product_name, '-'),
        COALESCE(tp.qty, 0)::INTEGER
    FROM today_stats t
    CROSS JOIN week_stats w
    CROSS JOIN month_stats m
    CROSS JOIN low_stock l
    LEFT JOIN top_prod tp ON true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- DADOS INICIAIS (EMOJIS)
-- ============================================

-- Tabela de emojis para referência
CREATE TABLE IF NOT EXISTS public.emoji_reference (
    id SERIAL PRIMARY KEY,
    emoji TEXT NOT NULL,
    keywords TEXT NOT NULL,
    category TEXT NOT NULL
);

-- Inserir emojis de referência
INSERT INTO public.emoji_reference (emoji, keywords, category) VALUES
('🍔', 'hamburguer burger lanche fast food comida', 'alimento'),
('🍕', 'pizza comida massa italiana queijo', 'alimento'),
('🌭', 'hotdog cachorro quente salsicha lanche', 'alimento'),
('🍟', 'batata frita chips salgado fast', 'alimento'),
('🥪', 'sanduiche misto natural lanche', 'alimento'),
('🌮', 'taco mexicano comida', 'alimento'),
('🍙', 'sushi onigiri arroz japao japones', 'alimento'),
('🍣', 'sushi peixe cru japao', 'alimento'),
('🍤', 'camarao frito empanado mar', 'alimento'),
('🍦', 'sorvete casquinha doce gelado', 'alimento'),
('🍩', 'donut rosquinha doce padaria', 'alimento'),
('🍪', 'cookie biscoito bolacha doce', 'alimento'),
('🍫', 'chocolate barra doce cacau', 'alimento'),
('🍬', 'bala doce caramelo', 'alimento'),
('🍭', 'pirulito doce', 'alimento'),
('🍮', 'pudim flan sobremesa', 'alimento'),
('☕', 'cafe coffee expresso bebida quente', 'bebida'),
('🥤', 'suco refrigerante bebida copo', 'bebida'),
('🍺', 'cerveja beer alcool bebida', 'bebida'),
('🍷', 'vinho taca bebida alcool', 'bebida'),
('🍸', 'drink coquetel alcool', 'bebida'),
('🍎', 'maca fruta saudavel vermelha', 'alimento'),
('🍌', 'banana fruta amarela', 'alimento'),
('🍇', 'uva fruta roxo vinho', 'alimento'),
('🥥', 'coco fruta tropical', 'alimento'),
('🍉', 'melancia fruta verao', 'alimento'),
('🍒', 'cereja fruta bolo', 'alimento'),
('🍓', 'morango fruta vermelho doce', 'alimento'),
('🥩', 'carne bife churrasco proteina', 'alimento'),
('🍗', 'frango coxa assado carne', 'alimento'),
('🥓', 'bacon carne porco cafe', 'alimento'),
('👕', 'camisa roupa vestuario moda', 'vestuario'),
('👖', 'calca jeans roupa moda', 'vestuario'),
('👗', 'vestido roupa mulher', 'vestuario'),
('👟', 'tenis sapato calcado esporte', 'vestuario'),
('⌚', 'relogio watch tempo acessorio', 'eletronico'),
('💻', 'notebook laptop computador pc', 'eletronico'),
('📱', 'celular iphone smartphone', 'eletronico'),
('🔌', 'tomada cabo energia', 'eletronico'),
('🔋', 'bateria pilha energia', 'eletronico'),
('🎁', 'presente caixa surpresa', 'outro'),
('📦', 'caixa pacote encomenda', 'outro'),
('💊', 'remedio pilula farmacia saude', 'outro'),
('🧹', 'vassoura limpeza casa', 'limpeza'),
('🛒', 'carrinho compras mercado', 'outro'),
('🧴', 'sabonete shampoo higiene', 'limpeza'),
('🧼', 'sabao detergente limpeza', 'limpeza'),
('📺', 'televisao tv entretenimento', 'eletronico'),
('🎮', 'videogame jogo console', 'eletronico'),
('📚', 'livro leitura estudo', 'outro'),
('✏️', 'lapis caneta escrita', 'outro');

-- ============================================
-- PERMISSÕES
-- ============================================

-- Garantir que usuários autenticados possam acessar
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Permitir acesso anônimo apenas para registro/login
GRANT SELECT ON public.emoji_reference TO anon;

-- ============================================
-- CONFIGURAÇÕES DO PROJETO
-- ============================================

-- Configurar email de confirmação (opcional)
-- UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;

-- Configurar JWT (já configurado pelo Supabase)
-- A chave anon já está configurada no projeto

-- ============================================
-- FIM DO SCHEMA
-- ============================================
