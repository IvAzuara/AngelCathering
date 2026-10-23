-- =====================================================
-- V002: Seed de Usuario Admin Inicial y Categorías Demo
-- =====================================================

-- Usuario inicial: admin / Admin123* (bcrypt hash generado con salt factor 11)
INSERT INTO users (username, password_hash, full_name, is_active)
VALUES (
    'admin',
    '$2a$11$N.vE9R3hGZ22/B3E9LpIe.8s78pP.u4xS2Y3/aP6V6E0ZkKk4nJum',
    'Administrador Catering',
    TRUE
)
ON CONFLICT (username) DO NOTHING;

-- Categorías iniciales de Menú
INSERT INTO menu_categories (id_category, name, description, sort_order, is_active)
VALUES 
    (1, 'Entradas y Canapés', 'Bocadillos gourmet y entradas para comenzar el evento', 1, TRUE),
    (2, 'Platos Fuertes', 'Carnes, aves, pescados y opciones vegetarianas principales', 2, TRUE),
    (3, 'Postres y Repostería', 'Mesas de postres, tartas y bocados dulces artesanales', 3, TRUE),
    (4, 'Bebidas y Coctelería', 'Barras de bebidas, coctelería con y sin alcohol', 4, TRUE)
ON CONFLICT (id_category) DO NOTHING;

-- Platillos iniciales de demostración
INSERT INTO menu_items (id_category, title, description, price, unit_label, image_url, is_available)
VALUES 
    (1, 'Bruschettas Mediterráneas', 'Pan rústico con tomate confitado, albahaca fresca y aceite de oliva virgen extra.', 65.00, 'por docena', 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?auto=format&fit=crop&w=600&q=80', TRUE),
    (1, 'Tabla de Quesos y Carnes Frías', 'Selección de quesos madurados, jamón serrano, frutos secos y uvas.', 180.00, 'por persona', 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80', TRUE),
    (2, 'Solomillo en Salsa de Setas', 'Tierno medallón con reducción de hongos silvestres y puré trufado.', 320.00, 'por persona', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', TRUE),
    (2, 'Pechuga Rellena Florentina', 'Rellena de espinacas a la crema y queso provolone en salsa de vino blanco.', 240.00, 'por persona', 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=600&q=80', TRUE),
    (3, 'Mini Tartaletas de Frutos Rojos', 'Masa sablée con crema pastelera aromatizada con vainilla Bourbon.', 85.00, 'por docena', 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80', TRUE),
    (4, 'Barra de Aguas Frutales Gourmet', 'Infusiones naturales de jamaica con romero, pepino con menta y maracuyá.', 45.00, 'por persona', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80', TRUE);

-- Ajustar secuencias de ID
SELECT setval(pg_get_serial_sequence('menu_categories', 'id_category'), coalesce(max(id_category), 1)) FROM menu_categories;
SELECT setval(pg_get_serial_sequence('menu_items', 'id_item'), coalesce(max(id_item), 1)) FROM menu_items;
