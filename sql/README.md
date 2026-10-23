# Repositorio de Migraciones Flyway

Esta carpeta contendrá las migraciones gestionadas por Flyway para PostgreSQL en Supabase.

### Convenciones Flyway:
- **Migraciones versionadas**: `V{numero}__{descripcion}.sql` (ej. `V001__init_schema.sql`). Se ejecutan una sola vez en orden ascendente y son inmutables.
- **Migraciones repetibles**: `R__{descripcion}.sql` o `R__010_fn_{nombre}.sql`. Se ejecutan cada vez que su contenido/checksum cambia (ideales para vistas, funciones o stored procedures).
