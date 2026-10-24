-- ============================================================
-- R__020: Funciones y Procedimientos de "menu" (Categorías y Platillos)
-- ============================================================

-- Listar categorías activas
DROP FUNCTION IF EXISTS "fn_menu_category_list"();
CREATE OR REPLACE FUNCTION "fn_menu_category_list"()
RETURNS TABLE (
     "id_category" INT
    ,"name" VARCHAR
    ,"description" TEXT
    ,"sort_order" INT
    ,"is_active" BOOLEAN
)
LANGUAGE sql
STABLE
AS $$
    SELECT "c"."id_category", "c"."name", "c"."description", "c"."sort_order", "c"."is_active"
    FROM "menu_category" AS "c"
    WHERE "c"."is_active" = TRUE
    ORDER BY "c"."sort_order" ASC, "c"."name" ASC;
$$;

-- Menú público (platillos disponibles filtrando por temporadas activas)
DROP FUNCTION IF EXISTS "fn_menu_item_list_public"();
CREATE OR REPLACE FUNCTION "fn_menu_item_list_public"()
RETURNS TABLE (
     "id_item" INT
    ,"id_category" INT
    ,"id_season" INT
    ,"season_name" VARCHAR
    ,"category_name" VARCHAR
    ,"title" VARCHAR
    ,"description" TEXT
    ,"price" NUMERIC
    ,"unit_label" VARCHAR
    ,"image_url" TEXT
    ,"is_available" BOOLEAN
    ,"created_at" TIMESTAMP
    ,"updated_at" TIMESTAMP
)
LANGUAGE sql
STABLE
AS $$
    SELECT "i"."id_item", "i"."id_category", "i"."id_season",
           "s"."name" AS "season_name",
           "c"."name" AS "category_name",
           "i"."title", "i"."description", "i"."price", "i"."unit_label",
           "i"."image_url", "i"."is_available", "i"."created_at", "i"."updated_at"
    FROM "menu_item" AS "i"
    JOIN "menu_category" AS "c" ON "i"."id_category" = "c"."id_category"
    LEFT JOIN "season" AS "s" ON "i"."id_season" = "s"."id_season"
    WHERE "i"."is_available" = TRUE 
      AND "c"."is_active" = TRUE
      AND ("i"."id_season" IS NULL OR "s"."is_active" = TRUE)
    ORDER BY "c"."sort_order" ASC, "i"."title" ASC;
$$;

-- Lista completa de platillos para el Admin
DROP FUNCTION IF EXISTS "fn_menu_item_list_all"(BOOLEAN);
CREATE OR REPLACE FUNCTION "fn_menu_item_list_all"("p_include_inactive" BOOLEAN DEFAULT TRUE)
RETURNS TABLE (
     "id_item" INT
    ,"id_category" INT
    ,"category_name" VARCHAR
    ,"title" VARCHAR
    ,"description" TEXT
    ,"price" NUMERIC
    ,"unit_label" VARCHAR
    ,"image_url" TEXT
    ,"is_available" BOOLEAN
    ,"created_at" TIMESTAMP
    ,"updated_at" TIMESTAMP
)
LANGUAGE sql
STABLE
AS $$
    SELECT "i"."id_item", "i"."id_category", "c"."name" AS "category_name",
           "i"."title", "i"."description", "i"."price", "i"."unit_label",
           "i"."image_url", "i"."is_available", "i"."created_at", "i"."updated_at"
    FROM "menu_item" AS "i"
    JOIN "menu_category" AS "c" ON "i"."id_category" = "c"."id_category"
    WHERE ("p_include_inactive" = TRUE OR "i"."is_available" = TRUE)
    ORDER BY "c"."sort_order" ASC, "i"."title" ASC;
$$;

-- Obtener platillo por ID
DROP FUNCTION IF EXISTS "fn_menu_item_get_by_id"(INT);
CREATE OR REPLACE FUNCTION "fn_menu_item_get_by_id"("p_id_item" INT)
RETURNS TABLE (
     "id_item" INT
    ,"id_category" INT
    ,"category_name" VARCHAR
    ,"title" VARCHAR
    ,"description" TEXT
    ,"price" NUMERIC
    ,"unit_label" VARCHAR
    ,"image_url" TEXT
    ,"is_available" BOOLEAN
    ,"created_at" TIMESTAMP
    ,"updated_at" TIMESTAMP
)
LANGUAGE sql
STABLE
AS $$
    SELECT "i"."id_item", "i"."id_category", "c"."name" AS "category_name",
           "i"."title", "i"."description", "i"."price", "i"."unit_label",
           "i"."image_url", "i"."is_available", "i"."created_at", "i"."updated_at"
    FROM "menu_item" AS "i"
    JOIN "menu_category" AS "c" ON "i"."id_category" = "c"."id_category"
    WHERE "i"."id_item" = "p_id_item"
    LIMIT 1;
$$;

-- Crear platillo usando table_sequence
DROP FUNCTION IF EXISTS "fn_menu_item_create"(INT, VARCHAR, TEXT, NUMERIC, VARCHAR, TEXT, BOOLEAN);
CREATE OR REPLACE FUNCTION "fn_menu_item_create"(
     "p_id_category" INT
    ,"p_title" VARCHAR
    ,"p_description" TEXT
    ,"p_price" NUMERIC
    ,"p_unit_label" VARCHAR
    ,"p_image_url" TEXT
    ,"p_is_available" BOOLEAN
)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    "v_id_item" INT;
BEGIN
    INSERT INTO "table_sequence" ("table_name", "last_id")
    VALUES ('menu_item', 1)
    ON CONFLICT ("table_name") DO UPDATE
        SET "last_id" = "table_sequence"."last_id" + 1
           ,"updated_at" = CURRENT_TIMESTAMP
    RETURNING "table_sequence"."last_id" INTO "v_id_item";

    INSERT INTO "menu_item" (
        "id_item", "id_category", "title", "description", 
        "price", "unit_label", "image_url", "is_available"
    )
    VALUES (
        "v_id_item", "p_id_category", TRIM("p_title"), "p_description",
        "p_price", COALESCE("p_unit_label", 'por persona'), "p_image_url", "p_is_available"
    );

    RETURN "v_id_item";
END;
$$;

-- Actualizar platillo
DROP PROCEDURE IF EXISTS "sp_menu_item_update"(INT, INT, VARCHAR, TEXT, NUMERIC, VARCHAR, TEXT, BOOLEAN);
CREATE OR REPLACE PROCEDURE "sp_menu_item_update"(
     "p_id_item" INT
    ,"p_id_category" INT
    ,"p_title" VARCHAR
    ,"p_description" TEXT
    ,"p_price" NUMERIC
    ,"p_unit_label" VARCHAR
    ,"p_image_url" TEXT
    ,"p_is_available" BOOLEAN
)
LANGUAGE sql
AS $$
    UPDATE "menu_item"
    SET "id_category" = "p_id_category"
       ,"title" = TRIM("p_title")
       ,"description" = "p_description"
       ,"price" = "p_price"
       ,"unit_label" = "p_unit_label"
       ,"image_url" = "p_image_url"
       ,"is_available" = "p_is_available"
       ,"updated_at" = CURRENT_TIMESTAMP
    WHERE "id_item" = "p_id_item";
$$;

-- Eliminar platillo
DROP PROCEDURE IF EXISTS "sp_menu_item_delete"(INT);
CREATE OR REPLACE PROCEDURE "sp_menu_item_delete"("p_id_item" INT)
LANGUAGE sql
AS $$
    DELETE FROM "menu_item" WHERE "id_item" = "p_id_item";
$$;
