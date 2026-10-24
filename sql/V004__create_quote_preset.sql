-- ============================================================
-- V004: Tabla de Plantillas de Cotización (Quote Preset / Template)
-- Prohibido SERIAL. Se gestiona con table_sequence.
-- ============================================================

CREATE TABLE IF NOT EXISTS "quote_preset" (
     "id_preset" INT NOT NULL
    ,"name" VARCHAR(150) NOT NULL
    ,"service_type" VARCHAR(150) NOT NULL
    ,"included_menu" VARCHAR(200) NOT NULL
    ,"price_per_person" NUMERIC(12, 2) NOT NULL DEFAULT 0.00
    ,"food_details" TEXT NULL
    ,"complement_details" TEXT NULL
    ,"includes_details" TEXT NULL
    ,"default_description" VARCHAR(150) NULL
    ,"is_active" BOOLEAN NOT NULL DEFAULT TRUE
    ,"created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ,"updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

    ,CONSTRAINT "pk_quote_preset" PRIMARY KEY ("id_preset")
);

-- Registrar la tabla en table_sequence si no existe
INSERT INTO "table_sequence" ("table_name", "last_id")
VALUES ('quote_preset', 1)
ON CONFLICT ("table_name") DO NOTHING;

-- Insertar única plantilla base: Pizza Bar
INSERT INTO "quote_preset" (
    "id_preset", "name", "service_type", "included_menu", "price_per_person",
    "food_details", "complement_details", "includes_details", "default_description", "is_active"
)
VALUES (
    1,
    '🍕 Pizza Bar Artesanal',
    'Pizza Bar',
    'Pizza artesanal + complementos',
    200.00,
    'Variedad de pizzas: pepperoni, hawaiana, jamón, champiñones, 2 quesos' || E'\n\n' || 'Pasta (a elegir)' || E'\n\n' || 'Ensalada italiana',
    'Aderezos gourmet' || E'\n\n' || 'Queso parmesano' || E'\n\n' || 'Chile quebrado',
    '1 hora de servicio continuo' || E'\n' || 'Personal de cocina y atención' || E'\n' || 'Desechables biodegradables (platos y cubiertos)' || E'\n' || 'Decoración temática rústica / boho',
    'Pizza bar artesanal',
    TRUE
)
ON CONFLICT ("id_preset") DO UPDATE
    SET "name" = EXCLUDED."name"
       ,"service_type" = EXCLUDED."service_type"
       ,"included_menu" = EXCLUDED."included_menu"
       ,"price_per_person" = EXCLUDED."price_per_person"
       ,"food_details" = EXCLUDED."food_details"
       ,"complement_details" = EXCLUDED."complement_details"
       ,"includes_details" = EXCLUDED."includes_details"
       ,"default_description" = EXCLUDED."default_description"
       ,"is_active" = TRUE;
