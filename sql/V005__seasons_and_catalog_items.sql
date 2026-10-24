-- ============================================================
-- V005: Temporadas Dinámicas y Carga de Platillos de Catálogos
-- Prohibido SERIAL / autoincrement. Gestionado con table_sequence.
-- ============================================================

-- 1. Tabla de Temporadas
CREATE TABLE IF NOT EXISTS "season" (
     "id_season" INT NOT NULL
    ,"name" VARCHAR(150) NOT NULL
    ,"slug" VARCHAR(100) NOT NULL
    ,"badge_text" VARCHAR(100) NULL
    ,"description" TEXT NULL
    ,"banner_url" TEXT NULL
    ,"is_active" BOOLEAN NOT NULL DEFAULT TRUE
    ,"created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ,"updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

    ,CONSTRAINT "pk_season" PRIMARY KEY ("id_season")
    ,CONSTRAINT "uq_season_slug" UNIQUE ("slug")
);

-- Registrar la tabla en table_sequence
INSERT INTO "table_sequence" ("table_name", "last_id")
VALUES ('season', 2)
ON CONFLICT ("table_name") DO NOTHING;

-- Agregar columna id_season opcional a menu_item si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'menu_item' AND column_name = 'id_season'
    ) THEN
        ALTER TABLE "menu_item" ADD COLUMN "id_season" INT NULL;
        ALTER TABLE "menu_item" ADD CONSTRAINT "fk_menu_item_season" 
            FOREIGN KEY ("id_season") REFERENCES "season" ("id_season") ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Temporadas Iniciales (Todo el año y Navideña)
INSERT INTO "season" ("id_season", "name", "slug", "badge_text", "description", "is_active")
VALUES 
    (1, 'Carta Regular & Eventos Todo el Año', 'regular', 'Todo el año', 'Experiencias gastronómicas elegantes para bodas, celebraciones y banquetes.', TRUE),
    (2, '🎄 Temporada Navideña & Posadas', 'navidad', 'Posadas 2026', 'Menús especiales para posadas corporativas y cenas navideñas.', TRUE)
ON CONFLICT ("id_season") DO UPDATE
    SET "name" = EXCLUDED."name"
       ,"badge_text" = EXCLUDED."badge_text"
       ,"description" = EXCLUDED."description";

-- 3. Actualizar e insertar categorías con base en CATALOGO ROSE y Catálogo Navideño
INSERT INTO "menu_category" ("id_category", "name", "description", "sort_order", "is_active")
VALUES 
    (1, 'Banquetes y 3 Tiempos', 'Menús formales emplatados con loza y servicio de cocina.', 1, TRUE),
    (2, 'Barras & Especialidades', 'Pizza Bar, Charcutería, Brunch, Coffee Break y Box Lunch.', 2, TRUE),
    (3, 'Platillos Fuertes Individuales', 'Proteínas completas con guarniciones, pan y agua.', 3, TRUE),
    (4, 'Buffets Navideños (Posadas)', 'Paquetes buffet por persona con guarniciones y mesa abierta.', 4, TRUE),
    (5, 'Entradas y Cremas', 'Cremas gourmet de brócoli, elote y bocadillos iniciales.', 5, TRUE),
    (6, 'Postres y Dulces', 'Brownies con nieve de vainilla, cheesecake de fresas y pasteles.', 6, TRUE)
ON CONFLICT ("id_category") DO UPDATE
    SET "name" = EXCLUDED."name"
       ,"description" = EXCLUDED."description"
       ,"sort_order" = EXCLUDED."sort_order"
       ,"is_active" = TRUE;

-- 4. Insertar platillos de los catálogos oficiales
-- Catálogo Anual y Catálogo Navideño
INSERT INTO "menu_item" ("id_item", "id_category", "id_season", "title", "description", "price", "unit_label", "image_url", "is_available")
VALUES 
    -- BANQUETES Y 3 TIEMPOS
    (1, 1, 1, 'Menú Formal Banquete 3 Tiempos', 'Entrada (Crema de brócoli o elote) + Plato Fuerte (Lasagna, Rollo de carne o Pechuga chipotle) + Postre (Brownie con nieve, Pastel o Pay). Incluye loza, cubiertos y servicio de cocina.', 340.00, 'por persona', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', TRUE),
    
    -- PLATOS FUERTES INDIVIDUALES (CATALOGO ROSE)
    (2, 3, 1, 'Lasagna Bolognesa Artesanal', 'Elaborada con finas láminas de pasta fresca, carne sazonada y queso gratinado. Acompañada de ensalada fresca y puré de papa.', 230.00, 'por persona', 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=600&q=80', TRUE),
    (3, 3, 1, 'Rollo de Carne Relleno en Tocino', 'Tierno rollo de carne relleno de vegetales y envuelto en tocino crujiente, bañado en salsa de la casa. Acompañado de pasta alfredo y puré de papa.', 220.00, 'por persona', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', TRUE),
    (4, 3, 1, 'Pechuga en Crema de Chipotle', 'Pechuga de pollo a la plancha bañada en cremosa salsa de chipotle con un toque ahumado. Acompañada de pasta alfredo y puré de papa.', 230.00, 'por persona', 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=600&q=80', TRUE),
    (5, 3, 1, 'Pechuga en Crema de Champiñones', 'Pechuga de pollo en suave salsa blanca con champiñones frescos salteados. Acompañada de pasta alfredo y puré de papa.', 230.00, 'por persona', 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=600&q=80', TRUE),

    -- BARRAS Y SERVICIOS
    (6, 2, 1, 'Pizza Bar Artesanal', 'Variedad de pizzas recién horneadas (pepperoni, hawaiana, jamón, champiñones, 2 quesos), pastas a elegir, ensalada italiana y aderezos gourmet. 1 hr de servicio con personal.', 200.00, 'por persona', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80', TRUE),
    (7, 2, 1, 'Mesa de Charcutería & Quesos', 'Selección de quesos madurados, jamón serrano, salami, frutos secos, aceitunas y uvas con panes rústicos.', 180.00, 'por persona', 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80', TRUE),
    (8, 2, 1, 'Estación Brunch & Coffee Break', 'Croissants de pechuga de pavo, fruta fresca de temporada, galletas artesanales y barra de café de grano con jugos naturales.', 140.00, 'por persona', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80', TRUE),
    (9, 2, 1, 'Box Lunch Ejecutivo', 'Opción práctica e higiénica: baguette o croissant gourmet, ensalada rústica, jugo natural y postre artesanal en empaque ecológico.', 135.00, 'por persona', 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=600&q=80', TRUE),

    -- TEMPORADA NAVIDEÑA (CATALOGO NAVIDEÑO)
    (10, 4, 2, '🎄 Paquete Buffet Navideño (2 Proteínas + 3 Guarniciones)', 'Servicio de buffet navideño conformado por 2 platos fuertes y 3 guarniciones a elegir (Lomo con gravy, Lasagna, Rollo en tocino / Puré, pastas, ensalada, verduras). Incluye pan, montaje buffet con mantel, loza y mesa abierta por 1.5 hrs.', 320.00, 'por persona', 'https://images.unsplash.com/photo-1576867757603-05b134ebc379?auto=format&fit=crop&w=600&q=80', TRUE),
    (11, 4, 2, '✨ Paquete Celebración Navideña (3 Proteínas + 4 Guarniciones)', 'Servicio premium de buffet navideño con 3 platos fuertes y 4 guarniciones a elegir. Incluye pan, montaje buffet, loza completa, decoración y servicio por 1.5 hrs.', 350.00, 'por persona', 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=600&q=80', TRUE),
    (12, 4, 2, '🍽️ Emplatado Navideño 1 Tiempo (1 Proteína + 2 Guarniciones)', 'Servicio emplatado formal con 1 proteína a elegir (Lomo con gravy, Lasagna o Rollo en tocino) y 2 guarniciones (Puré de papa y Ensalada o Pasta).', 240.00, 'por persona', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', TRUE),
    (13, 4, 2, '⭐ Emplatado Navideño 2 Tiempos (Entrada + Plato Fuerte)', 'Servicio formal con crema caliente de entrada + plato fuerte navideño con 2 guarniciones y pan durante la cena.', 280.00, 'por persona', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80', TRUE)
ON CONFLICT ("id_item") DO UPDATE
    SET "title" = EXCLUDED."title"
       ,"id_category" = EXCLUDED."id_category"
       ,"id_season" = EXCLUDED."id_season"
       ,"description" = EXCLUDED."description"
       ,"price" = EXCLUDED."price"
       ,"unit_label" = EXCLUDED."unit_label"
       ,"image_url" = EXCLUDED."image_url"
       ,"is_available" = TRUE;

-- 5. Actualizar table_sequence con el último ID de categorías, platillos y temporadas
INSERT INTO "table_sequence" ("table_name", "last_id")
VALUES 
    ('menu_category', 6),
    ('menu_item', 13),
    ('season', 2)
ON CONFLICT ("table_name") DO UPDATE
    SET "last_id" = GREATEST("table_sequence"."last_id", EXCLUDED."last_id");
