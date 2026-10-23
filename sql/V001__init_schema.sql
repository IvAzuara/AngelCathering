-- =====================================================
-- V001: Esquema Inicial para Sistema de Catering
-- =====================================================

-- 1. Tabla de Usuarios Administradores
CREATE TABLE IF NOT EXISTS users (
    id_user SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Categorías del Menú
CREATE TABLE IF NOT EXISTS menu_categories (
    id_category SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Platillos y Opciones de Menú
CREATE TABLE IF NOT EXISTS menu_items (
    id_item SERIAL PRIMARY KEY,
    id_category INT NOT NULL REFERENCES menu_categories(id_category) ON DELETE RESTRICT,
    title VARCHAR(150) NOT NULL,
    description TEXT NULL,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    unit_label VARCHAR(50) NOT NULL DEFAULT 'por persona',
    image_url TEXT NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 4. Pedidos Manuales
CREATE TABLE IF NOT EXISTS orders (
    id_order SERIAL PRIMARY KEY,
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(50) NULL,
    customer_email VARCHAR(150) NULL,
    event_type VARCHAR(100) NOT NULL DEFAULT 'Evento General',
    event_date DATE NOT NULL,
    guest_count INT NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE', -- PENDIENTE, EN_PROCESO, COMPLETADO, CANCELADO
    is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
    sort_priority INT NOT NULL DEFAULT 0,
    total_estimated NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    notes TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(id_category);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_event_date ON orders(event_date);
CREATE INDEX IF NOT EXISTS idx_orders_is_urgent ON orders(is_urgent);
