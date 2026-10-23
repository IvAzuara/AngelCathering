-- ============================================================
-- V001: Tabla centralizada de secuencias
-- Usada para generar identificadores continuos y controlados por transacción.
-- ============================================================

CREATE TABLE IF NOT EXISTS "table_sequence" (
     "table_name" VARCHAR(100) NOT NULL
    ,"last_id" INT NOT NULL DEFAULT 0
    ,"updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

    ,CONSTRAINT "pk_table_sequence" PRIMARY KEY ("table_name")
);
