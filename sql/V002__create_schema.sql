-- ============================================================
-- V002: Tablas principales del sistema de Catering
-- Prohibido SERIAL / autoincrement. Todos los IDs se gestionan vía table_sequence.
-- ============================================================

-- 1. Tabla de Usuarios Administradores
CREATE TABLE IF NOT EXISTS "user" (
     "id_user" INT NOT NULL
    ,"username" VARCHAR(100) NOT NULL
    ,"password_hash" VARCHAR(255) NOT NULL
    ,"full_name" VARCHAR(150) NOT NULL
    ,"is_active" BOOLEAN NOT NULL DEFAULT TRUE
    ,"created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

    ,CONSTRAINT "pk_user" PRIMARY KEY ("id_user")
    ,CONSTRAINT "uq_user_username" UNIQUE ("username")
);

-- 2. Categorías del Menú
CREATE TABLE IF NOT EXISTS "menu_category" (
     "id_category" INT NOT NULL
    ,"name" VARCHAR(100) NOT NULL
    ,"description" TEXT NULL
    ,"sort_order" INT NOT NULL DEFAULT 0
    ,"is_active" BOOLEAN NOT NULL DEFAULT TRUE
    ,"created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

    ,CONSTRAINT "pk_menu_category" PRIMARY KEY ("id_category")
);

-- 3. Platillos y Opciones de Menú
CREATE TABLE IF NOT EXISTS "menu_item" (
     "id_item" INT NOT NULL
    ,"id_category" INT NOT NULL
    ,"title" VARCHAR(150) NOT NULL
    ,"description" TEXT NULL
    ,"price" NUMERIC(12, 2) NOT NULL DEFAULT 0.00
    ,"unit_label" VARCHAR(50) NOT NULL DEFAULT 'por persona'
    ,"image_url" TEXT NULL
    ,"is_available" BOOLEAN NOT NULL DEFAULT TRUE
    ,"created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ,"updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

    ,CONSTRAINT "pk_menu_item" PRIMARY KEY ("id_item")
    ,CONSTRAINT "fk_menu_item_category" FOREIGN KEY ("id_category") REFERENCES "menu_category" ("id_category") ON DELETE RESTRICT
);

-- 4. Pedidos Manuales
CREATE TABLE IF NOT EXISTS "order" (
     "id_order" INT NOT NULL
    ,"customer_name" VARCHAR(150) NOT NULL
    ,"customer_phone" VARCHAR(50) NULL
    ,"customer_email" VARCHAR(150) NULL
    ,"event_type" VARCHAR(100) NOT NULL DEFAULT 'Evento General'
    ,"event_date" DATE NOT NULL
    ,"guest_count" INT NOT NULL DEFAULT 1
    ,"status" VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE' -- PENDIENTE, EN_PROCESO, COMPLETADO, CANCELADO
    ,"is_urgent" BOOLEAN NOT NULL DEFAULT FALSE
    ,"sort_priority" INT NOT NULL DEFAULT 0
    ,"total_estimated" NUMERIC(12, 2) NOT NULL DEFAULT 0.00
    ,"notes" TEXT NULL
    ,"created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ,"updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

    ,CONSTRAINT "pk_order" PRIMARY KEY ("id_order")
);

CREATE INDEX IF NOT EXISTS "idx_menu_item_category" ON "menu_item"("id_category");
CREATE INDEX IF NOT EXISTS "idx_order_status" ON "order"("status");
CREATE INDEX IF NOT EXISTS "idx_order_event_date" ON "order"("event_date");
CREATE INDEX IF NOT EXISTS "idx_order_is_urgent" ON "order"("is_urgent");
