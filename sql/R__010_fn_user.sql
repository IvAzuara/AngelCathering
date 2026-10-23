-- ============================================================
-- R__010: Funciones y Procedimientos de "user"
-- ============================================================

DROP FUNCTION IF EXISTS "fn_user_get_by_username"(VARCHAR);
CREATE OR REPLACE FUNCTION "fn_user_get_by_username"("p_username" VARCHAR)
RETURNS TABLE (
     "id_user" INT
    ,"username" VARCHAR
    ,"password_hash" VARCHAR
    ,"full_name" VARCHAR
    ,"is_active" BOOLEAN
    ,"created_at" TIMESTAMP
)
LANGUAGE sql
STABLE
AS $$
    SELECT "u"."id_user", "u"."username", "u"."password_hash", "u"."full_name", "u"."is_active", "u"."created_at"
    FROM "user" AS "u"
    WHERE LOWER("u"."username") = LOWER(TRIM("p_username")) AND "u"."is_active" = TRUE
    LIMIT 1;
$$;

DROP FUNCTION IF EXISTS "fn_user_get_by_id"(INT);
CREATE OR REPLACE FUNCTION "fn_user_get_by_id"("p_id_user" INT)
RETURNS TABLE (
     "id_user" INT
    ,"username" VARCHAR
    ,"password_hash" VARCHAR
    ,"full_name" VARCHAR
    ,"is_active" BOOLEAN
    ,"created_at" TIMESTAMP
)
LANGUAGE sql
STABLE
AS $$
    SELECT "u"."id_user", "u"."username", "u"."password_hash", "u"."full_name", "u"."is_active", "u"."created_at"
    FROM "user" AS "u"
    WHERE "u"."id_user" = "p_id_user"
    LIMIT 1;
$$;
