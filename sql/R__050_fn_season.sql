-- ============================================================
-- R__050: Funciones y Procedimientos de "season" (Temporadas Dinámicas)
-- Prohibido SERIAL / autoincrement. table_sequence controla los IDs.
-- ============================================================

-- Listar temporadas activas (para menú público y filtros)
DROP FUNCTION IF EXISTS "fn_season_list_active"();
CREATE OR REPLACE FUNCTION "fn_season_list_active"()
RETURNS TABLE (
     "id_season" INT
    ,"name" VARCHAR
    ,"slug" VARCHAR
    ,"badge_text" VARCHAR
    ,"description" TEXT
    ,"banner_url" TEXT
    ,"is_active" BOOLEAN
)
LANGUAGE sql
STABLE
AS $$
    SELECT "s"."id_season", "s"."name", "s"."slug", "s"."badge_text",
           "s"."description", "s"."banner_url", "s"."is_active"
    FROM "season" AS "s"
    WHERE "s"."is_active" = TRUE
    ORDER BY "s"."id_season" ASC;
$$;

-- Listar todas las temporadas (para administración)
DROP FUNCTION IF EXISTS "fn_season_list_all"();
CREATE OR REPLACE FUNCTION "fn_season_list_all"()
RETURNS TABLE (
     "id_season" INT
    ,"name" VARCHAR
    ,"slug" VARCHAR
    ,"badge_text" VARCHAR
    ,"description" TEXT
    ,"banner_url" TEXT
    ,"is_active" BOOLEAN
    ,"created_at" TIMESTAMP
    ,"updated_at" TIMESTAMP
)
LANGUAGE sql
STABLE
AS $$
    SELECT "s"."id_season", "s"."name", "s"."slug", "s"."badge_text",
           "s"."description", "s"."banner_url", "s"."is_active",
           "s"."created_at", "s"."updated_at"
    FROM "season" AS "s"
    ORDER BY "s"."id_season" ASC;
$$;

-- Activar / Desactivar temporada con un clic (Toggle)
DROP PROCEDURE IF EXISTS "sp_season_toggle_active"(INT, BOOLEAN);
CREATE OR REPLACE PROCEDURE "sp_season_toggle_active"("p_id_season" INT, "p_is_active" BOOLEAN)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE "season"
    SET  "is_active" = "p_is_active"
        ,"updated_at" = CURRENT_TIMESTAMP
    WHERE "id_season" = "p_id_season";
END;
$$;

-- Crear temporada
DROP FUNCTION IF EXISTS "fn_season_create"(VARCHAR, VARCHAR, VARCHAR, TEXT, TEXT, BOOLEAN);
CREATE OR REPLACE FUNCTION "fn_season_create"(
     "p_name" VARCHAR
    ,"p_slug" VARCHAR
    ,"p_badge_text" VARCHAR
    ,"p_description" TEXT
    ,"p_banner_url" TEXT
    ,"p_is_active" BOOLEAN
)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    "v_id_season" INT;
BEGIN
    INSERT INTO "table_sequence" ("table_name", "last_id")
    VALUES ('season', 1)
    ON CONFLICT ("table_name") DO UPDATE
        SET "last_id" = "table_sequence"."last_id" + 1
           ,"updated_at" = CURRENT_TIMESTAMP
    RETURNING "table_sequence"."last_id" INTO "v_id_season";

    INSERT INTO "season" (
        "id_season", "name", "slug", "badge_text",
        "description", "banner_url", "is_active"
    )
    VALUES (
        "v_id_season", TRIM("p_name"), TRIM(LOWER("p_slug")), "p_badge_text",
        "p_description", "p_banner_url", COALESCE("p_is_active", TRUE)
    );

    RETURN "v_id_season";
END;
$$;

-- Actualizar temporada
DROP PROCEDURE IF EXISTS "sp_season_update"(INT, VARCHAR, VARCHAR, VARCHAR, TEXT, TEXT, BOOLEAN);
CREATE OR REPLACE PROCEDURE "sp_season_update"(
     "p_id_season" INT
    ,"p_name" VARCHAR
    ,"p_slug" VARCHAR
    ,"p_badge_text" VARCHAR
    ,"p_description" TEXT
    ,"p_banner_url" TEXT
    ,"p_is_active" BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE "season"
    SET  "name" = TRIM("p_name")
        ,"slug" = TRIM(LOWER("p_slug"))
        ,"badge_text" = "p_badge_text"
        ,"description" = "p_description"
        ,"banner_url" = "p_banner_url"
        ,"is_active" = COALESCE("p_is_active", TRUE)
        ,"updated_at" = CURRENT_TIMESTAMP
    WHERE "id_season" = "p_id_season";
END;
$$;
