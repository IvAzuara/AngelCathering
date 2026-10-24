-- ============================================================
-- R__040: Funciones y Procedimientos de "quote_preset" (Plantillas de Cotización)
-- Prohibido SERIAL / autoincrement. table_sequence controla los IDs.
-- ============================================================

-- Listar plantillas activas
DROP FUNCTION IF EXISTS "fn_quote_preset_list"();
CREATE OR REPLACE FUNCTION "fn_quote_preset_list"()
RETURNS TABLE (
     "id_preset" INT
    ,"name" VARCHAR
    ,"service_type" VARCHAR
    ,"included_menu" VARCHAR
    ,"price_per_person" NUMERIC
    ,"food_details" TEXT
    ,"complement_details" TEXT
    ,"includes_details" TEXT
    ,"default_description" VARCHAR
    ,"is_active" BOOLEAN
    ,"created_at" TIMESTAMP
    ,"updated_at" TIMESTAMP
)
LANGUAGE sql
STABLE
AS $$
    SELECT "p"."id_preset", "p"."name", "p"."service_type", "p"."included_menu",
           "p"."price_per_person", "p"."food_details", "p"."complement_details",
           "p"."includes_details", "p"."default_description", "p"."is_active",
           "p"."created_at", "p"."updated_at"
    FROM "quote_preset" AS "p"
    WHERE "p"."is_active" = TRUE
    ORDER BY "p"."id_preset" ASC;
$$;

-- Obtener plantilla por ID
DROP FUNCTION IF EXISTS "fn_quote_preset_get_by_id"(INT);
CREATE OR REPLACE FUNCTION "fn_quote_preset_get_by_id"("p_id_preset" INT)
RETURNS TABLE (
     "id_preset" INT
    ,"name" VARCHAR
    ,"service_type" VARCHAR
    ,"included_menu" VARCHAR
    ,"price_per_person" NUMERIC
    ,"food_details" TEXT
    ,"complement_details" TEXT
    ,"includes_details" TEXT
    ,"default_description" VARCHAR
    ,"is_active" BOOLEAN
    ,"created_at" TIMESTAMP
    ,"updated_at" TIMESTAMP
)
LANGUAGE sql
STABLE
AS $$
    SELECT "p"."id_preset", "p"."name", "p"."service_type", "p"."included_menu",
           "p"."price_per_person", "p"."food_details", "p"."complement_details",
           "p"."includes_details", "p"."default_description", "p"."is_active",
           "p"."created_at", "p"."updated_at"
    FROM "quote_preset" AS "p"
    WHERE "p"."id_preset" = "p_id_preset"
    LIMIT 1;
$$;

-- Crear plantilla usando table_sequence
DROP FUNCTION IF EXISTS "fn_quote_preset_create"(VARCHAR, VARCHAR, VARCHAR, NUMERIC, TEXT, TEXT, TEXT, VARCHAR);
CREATE OR REPLACE FUNCTION "fn_quote_preset_create"(
     "p_name" VARCHAR
    ,"p_service_type" VARCHAR
    ,"p_included_menu" VARCHAR
    ,"p_price_per_person" NUMERIC
    ,"p_food_details" TEXT
    ,"p_complement_details" TEXT
    ,"p_includes_details" TEXT
    ,"p_default_description" VARCHAR
)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    "v_id_preset" INT;
BEGIN
    INSERT INTO "table_sequence" ("table_name", "last_id")
    VALUES ('quote_preset', 1)
    ON CONFLICT ("table_name") DO UPDATE
        SET "last_id" = "table_sequence"."last_id" + 1
           ,"updated_at" = CURRENT_TIMESTAMP
    RETURNING "table_sequence"."last_id" INTO "v_id_preset";

    INSERT INTO "quote_preset" (
        "id_preset", "name", "service_type", "included_menu", "price_per_person",
        "food_details", "complement_details", "includes_details", "default_description", "is_active"
    )
    VALUES (
        "v_id_preset", TRIM("p_name"), TRIM("p_service_type"), TRIM("p_included_menu"),
        COALESCE("p_price_per_person", 0.00), "p_food_details", "p_complement_details",
        "p_includes_details", "p_default_description", TRUE
    );

    RETURN "v_id_preset";
END;
$$;

-- Actualizar plantilla
DROP PROCEDURE IF EXISTS "sp_quote_preset_update"(INT, VARCHAR, VARCHAR, VARCHAR, NUMERIC, TEXT, TEXT, TEXT, VARCHAR, BOOLEAN);
CREATE OR REPLACE PROCEDURE "sp_quote_preset_update"(
     "p_id_preset" INT
    ,"p_name" VARCHAR
    ,"p_service_type" VARCHAR
    ,"p_included_menu" VARCHAR
    ,"p_price_per_person" NUMERIC
    ,"p_food_details" TEXT
    ,"p_complement_details" TEXT
    ,"p_includes_details" TEXT
    ,"p_default_description" VARCHAR
    ,"p_is_active" BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE "quote_preset"
    SET  "name" = TRIM("p_name")
        ,"service_type" = TRIM("p_service_type")
        ,"included_menu" = TRIM("p_included_menu")
        ,"price_per_person" = COALESCE("p_price_per_person", 0.00)
        ,"food_details" = "p_food_details"
        ,"complement_details" = "p_complement_details"
        ,"includes_details" = "p_includes_details"
        ,"default_description" = "p_default_description"
        ,"is_active" = COALESCE("p_is_active", TRUE)
        ,"updated_at" = CURRENT_TIMESTAMP
    WHERE "id_preset" = "p_id_preset";
END;
$$;

-- Eliminar (Soft-delete) plantilla
DROP PROCEDURE IF EXISTS "sp_quote_preset_delete"(INT);
CREATE OR REPLACE PROCEDURE "sp_quote_preset_delete"("p_id_preset" INT)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE "quote_preset"
    SET  "is_active" = FALSE
        ,"updated_at" = CURRENT_TIMESTAMP
    WHERE "id_preset" = "p_id_preset";
END;
$$;
