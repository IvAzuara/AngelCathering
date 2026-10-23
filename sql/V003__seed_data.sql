-- ============================================================
-- V003: Datos Semilla Iniciales
-- Se inicializa table_sequence con el último ID de cada tabla.
-- ============================================================

-- Usuario inicial: admin / Admin123*
INSERT INTO "user" ("id_user", "username", "password_hash", "full_name", "is_active")
VALUES (
    1,
    'admin',
    '$2a$11$N.vE9R3hGZ22/B3E9LpIe.8s78pP.u4xS2Y3/aP6V6E0ZkKk4nJum',
    'Administrador Catering',
    TRUE
)
ON CONFLICT ("id_user") DO NOTHING;

-- Categorías
INSERT INTO "menu_category" ("id_category", "name", "description", "sort_order", "is_active")
VALUES 
    (1, 'Entradas y Canapés', 'Bocadillos gourmet y entradas para comenzar el evento', 1, TRUE),
    (2, 'Platos Fuertes', 'Carnes, aves, pescados y opciones vegetarianas principales', 2, TRUE),
    (3, 'Postres y Repostería', 'Mesas de postres, tartas y bocados dulces artesanales', 3, TRUE),
    (4, 'Bebidas y Coctelería', 'Barras de bebidas, coctelería con y sin alcohol', 4, TRUE)
ON CONFLICT ("id_category") DO NOTHING;

-- Platillos iniciales
INSERT INTO "menu_item" ("id_item", "id_category", "title", "description", "price", "unit_label", "image_url", "is_available")
VALUES 
    (1, 1, 'Bruschettas Mediterráneas', 'Pan rústico con tomate confitado, albahaca fresca y aceite de oliva virgen extra.', 65.00, 'por docena', 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?auto=format&fit=crop&w=600&q=80', TRUE),
    (2, 1, 'Tabla de Quesos y Carnes Frías', 'Selección de quesos madurados, jamón serrano, frutos secos y uvas.', 180.00, 'por persona', 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80', TRUE),
    (3, 2, 'Solomillo en Salsa de Setas', 'Tierno medallón con reducción de hongos silvestres y puré trufado.', 320.00, 'por persona', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', TRUE),
    (4, 2, 'Pechuga Rellena Florentina', 'Rellena de espinacas a la crema y queso provolone en salsa de vino blanco.', 240.00, 'por persona', 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=600&q=80', TRUE),
    (5, 3, 'Mini Tartaletas de Frutos Rojos', 'Masa sablée con crema pastelera aromatizada con vainilla Bourbon.', 85.00, 'por docena', 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80', TRUE),
    (6, 4, 'Barra de Aguas Frutales Gourmet', 'Infusiones naturales de jamaica con romero, pepino con menta y maracuyá.', 45.00, 'por persona', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80', TRUE)
ON CONFLICT ("id_item") DO NOTHING;

-- Inicializar tabla de secuencias con los últimos IDs
INSERT INTO "table_sequence" ("table_name", "last_id")
VALUES 
    ('user', 1),
    ('menu_category', 4),
    ('menu_item', 6),
    ('order', 0)
ON CONFLICT ("table_name") DO UPDATE
    SET "last_id" = EXCLUDED."last_id";
