# Backend documentation

> Главный регламент: [PROJECT_GUIDE.md](../00-project/PROJECT_GUIDE.md).

Раздел маршрутизирует server boundaries, Supabase, APIs и internal workflows.

- [Cloud First Data Architecture](../cloud-first-data-architecture-v1.md)
- [Cloud Foundation Migration](../cloud-foundation-migration-v1.md)
- [Supabase Integration](../supabase-integration-v1.md)
- [Catalog Admin](../catalog-admin-v1.md)
- [Architecture library](../architecture/)

Backend change не должен ослаблять RLS, server-only secrets, RPC grants или public/internal boundary.
