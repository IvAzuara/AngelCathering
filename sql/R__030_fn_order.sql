-- ============================================================
-- R__030: Funciones y Procedimientos de "order" (Pedidos)
-- ============================================================

-- Listar pedidos activos (Pendientes y En Proceso)
DROP FUNCTION IF EXISTS "fn_order_list_active"();
CREATE OR REPLACE FUNCTION "fn_order_list_active"()
RETURNS TABLE (
     "id_order" INT
    ,"customer_name" VARCHAR
    ,"customer_phone" VARCHAR
    ,"customer_email" VARCHAR
    ,"event_type" VARCHAR
    ,"event_date" DATE
    ,"guest_count" INT
    ,"status" VARCHAR
    ,"is_urgent" BOOLEAN
    ,"sort_priority" INT
    ,"total_estimated" NUMERIC
    ,"notes" TEXT
    ,"created_at" TIMESTAMP
    ,"updated_at" TIMESTAMP
)
LANGUAGE sql
STABLE
AS $$
    SELECT "o"."id_order", "o"."customer_name", "o"."customer_phone", "o"."customer_email",
           "o"."event_type", "o"."event_date", "o"."guest_count", "o"."status",
           "o"."is_urgent", "o"."sort_priority", "o"."total_estimated", "o"."notes",
           "o"."created_at", "o"."updated_at"
    FROM "order" AS "o"
    WHERE "o"."status" IN ('PENDIENTE', 'EN_PROCESO')
    ORDER BY "o"."is_urgent" DESC, "o"."sort_priority" ASC, "o"."event_date" ASC;
$$;

-- Listar histórico de pedidos concluidos o cancelados
DROP FUNCTION IF EXISTS "fn_order_list_history"();
CREATE OR REPLACE FUNCTION "fn_order_list_history"()
RETURNS TABLE (
     "id_order" INT
    ,"customer_name" VARCHAR
    ,"customer_phone" VARCHAR
    ,"customer_email" VARCHAR
    ,"event_type" VARCHAR
    ,"event_date" DATE
    ,"guest_count" INT
    ,"status" VARCHAR
    ,"is_urgent" BOOLEAN
    ,"sort_priority" INT
    ,"total_estimated" NUMERIC
    ,"notes" TEXT
    ,"created_at" TIMESTAMP
    ,"updated_at" TIMESTAMP
)
LANGUAGE sql
STABLE
AS $$
    SELECT "o"."id_order", "o"."customer_name", "o"."customer_phone", "o"."customer_email",
           "o"."event_type", "o"."event_date", "o"."guest_count", "o"."status",
           "o"."is_urgent", "o"."sort_priority", "o"."total_estimated", "o"."notes",
           "o"."created_at", "o"."updated_at"
    FROM "order" AS "o"
    WHERE "o"."status" IN ('COMPLETADO', 'CANCELADO')
    ORDER BY "o"."updated_at" DESC, "o"."event_date" DESC;
$$;

-- Obtener pedido por ID
DROP FUNCTION IF EXISTS "fn_order_get_by_id"(INT);
CREATE OR REPLACE FUNCTION "fn_order_get_by_id"("p_id_order" INT)
RETURNS TABLE (
     "id_order" INT
    ,"customer_name" VARCHAR
    ,"customer_phone" VARCHAR
    ,"customer_email" VARCHAR
    ,"event_type" VARCHAR
    ,"event_date" DATE
    ,"guest_count" INT
    ,"status" VARCHAR
    ,"is_urgent" BOOLEAN
    ,"sort_priority" INT
    ,"total_estimated" NUMERIC
    ,"notes" TEXT
    ,"created_at" TIMESTAMP
    ,"updated_at" TIMESTAMP
)
LANGUAGE sql
STABLE
AS $$
    SELECT "o"."id_order", "o"."customer_name", "o"."customer_phone", "o"."customer_email",
           "o"."event_type", "o"."event_date", "o"."guest_count", "o"."status",
           "o"."is_urgent", "o"."sort_priority", "o"."total_estimated", "o"."notes",
           "o"."created_at", "o"."updated_at"
    FROM "order" AS "o"
    WHERE "o"."id_order" = "p_id_order"
    LIMIT 1;
$$;

-- Crear pedido usando table_sequence
DROP FUNCTION IF EXISTS "fn_order_create"(VARCHAR, VARCHAR, VARCHAR, VARCHAR, DATE, INT, VARCHAR, BOOLEAN, INT, NUMERIC, TEXT);
CREATE OR REPLACE FUNCTION "fn_order_create"(
     "p_customer_name" VARCHAR
    ,"p_customer_phone" VARCHAR
    ,"p_customer_email" VARCHAR
    ,"p_event_type" VARCHAR
    ,"p_event_date" DATE
    ,"p_guest_count" INT
    ,"p_status" VARCHAR
    ,"p_is_urgent" BOOLEAN
    ,"p_sort_priority" INT
    ,"p_total_estimated" NUMERIC
    ,"p_notes" TEXT
)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    "v_id_order" INT;
BEGIN
    INSERT INTO "table_sequence" ("table_name", "last_id")
    VALUES ('order', 1)
    ON CONFLICT ("table_name") DO UPDATE
        SET "last_id" = "table_sequence"."last_id" + 1
           ,"updated_at" = CURRENT_TIMESTAMP
    RETURNING "table_sequence"."last_id" INTO "v_id_order";

    INSERT INTO "order" (
        "id_order", "customer_name", "customer_phone", "customer_email",
        "event_type", "event_date", "guest_count", "status",
        "is_urgent", "sort_priority", "total_estimated", "notes"
    )
    VALUES (
        "v_id_order", TRIM("p_customer_name"), "p_customer_phone", "p_customer_email",
        COALESCE("p_event_type", 'Evento General'), "p_event_date", COALESCE("p_guest_count", 1),
        COALESCE("p_status", 'PENDIENTE'), COALESCE("p_is_urgent", FALSE), COALESCE("p_sort_priority", 0),
        COALESCE("p_total_estimated", 0.00), "p_notes"
    );

    RETURN "v_id_order";
END;
$$;

-- Actualización completa de pedido
DROP PROCEDURE IF EXISTS "sp_order_update"(INT, VARCHAR, VARCHAR, VARCHAR, VARCHAR, DATE, INT, VARCHAR, BOOLEAN, INT, NUMERIC, TEXT);
CREATE OR REPLACE PROCEDURE "sp_order_update"(
     "p_id_order" INT
    ,"p_customer_name" VARCHAR
    ,"p_customer_phone" VARCHAR
    ,"p_customer_email" VARCHAR
    ,"p_event_type" VARCHAR
    ,"p_event_date" DATE
    ,"p_guest_count" INT
    ,"p_status" VARCHAR
    ,"p_is_urgent" BOOLEAN
    ,"p_sort_priority" INT
    ,"p_total_estimated" NUMERIC
    ,"p_notes" TEXT
)
LANGUAGE sql
AS $$
    UPDATE "order"
    SET "customer_name" = TRIM("p_customer_name")
       ,"customer_phone" = "p_customer_phone"
       ,"customer_email" = "p_customer_email"
       ,"event_type" = "p_event_type"
       ,"event_date" = "p_event_date"
       ,"guest_count" = "p_guest_count"
       ,"status" = "p_status"
       ,"is_urgent" = "p_is_urgent"
       ,"sort_priority" = "p_sort_priority"
       ,"total_estimated" = "p_total_estimated"
       ,"notes" = "p_notes"
       ,"updated_at" = CURRENT_TIMESTAMP
    WHERE "id_order" = "p_id_order";
$$;

-- Actualización puntual de estado / urgencia / orden
DROP PROCEDURE IF EXISTS "sp_order_update_status"(INT, VARCHAR, BOOLEAN, INT);
CREATE OR REPLACE PROCEDURE "sp_order_update_status"(
     "p_id_order" INT
    ,"p_status" VARCHAR
    ,"p_is_urgent" BOOLEAN DEFAULT NULL
    ,"p_sort_priority" INT DEFAULT NULL
)
LANGUAGE sql
AS $$
    UPDATE "order"
    SET "status" = "p_status"
       ,"is_urgent" = COALESCE("p_is_urgent", "is_urgent")
       ,"sort_priority" = COALESCE("p_sort_priority", "sort_priority")
       ,"updated_at" = CURRENT_TIMESTAMP
    WHERE "id_order" = "p_id_order";
$$;

-- Eliminar pedido
DROP PROCEDURE IF EXISTS "sp_order_delete"(INT);
CREATE OR REPLACE PROCEDURE "sp_order_delete"("p_id_order" INT)
LANGUAGE sql
AS $$
    DELETE FROM "order" WHERE "id_order" = "p_id_order";
$$;
