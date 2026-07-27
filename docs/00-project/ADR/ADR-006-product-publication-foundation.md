# ADR-006 — Review-gated Product publication foundation

**Статус:** Accepted

**Дата:** 25 июля 2026 года

**Принято:** 27 июля 2026 года после independent review и controlled staging migration

**Владельцы:** владелец продукта и технический руководитель CyberMedica

## Context

Cloud Catalog хранит импортированные и прошедшие quality review товары, но
состояние Product до настоящего решения не было связано с неизменяемой
publication revision, точным approval и обратимым publication batch. Это не
позволяет безопасно считать `publication_status = published` самостоятельным
доказательством контролируемой публикации в Production.

Существующие `ProductService`, `CatalogRepository` и Storefront repository
boundary менять не требуется. Structured Product Detail fields используют
собственный принятый contract ADR-005. Нужен недостающий базовый слой между
review Product и будущей published-only Storefront projection.

## Decision

- Сохранить существующий enum Product: `draft`, `in_review`, `approved`,
  `published`, `archived`. Бизнес-состояние **Imported** представлено
  `draft`-товаром с воспроизводимой import lineage; новая параллельная модель
  статусов не создаётся.
- Создавать immutable `product_publication_revision` до approval. Revision
  фиксирует schema version, Product identity, канонический candidate payload и
  SHA-256 checksums.
- Привязывать approval к точной current revision, payload checksum, identity
  checksum, authenticated reviewer identity и существующему immutable review
  decision. Reviewer определяется через `auth.uid()`; service consumer не
  передаёт reviewer UUID или rationale. Изменённый Product требует новой
  revision и нового approval, а previous evidence superseded current pointers.
- Разрешать publication только для `approved` Product при опубликованных
  manufacturer, assignable category и application areas, статусе качества
  `READY`, заполненной модели и отсутствии unresolved import blocking errors.
- Создавать human review decision через authenticated RPC для reviewer/admin.
  Выполнять create revision, approval consumption, publish, archive и rollback
  только через service-role RPC. Service actor выводится database из единственного
  trusted `service` profile и не принимается от caller. Browser Storefront write
  surface не создаётся.
- Сериализовать действия per Product advisory lock и row lock. Каждое действие
  является одной PostgreSQL transaction/statement: либо сохраняются Product,
  batch и audit trail, либо не сохраняется ничего.
- Делать publish/archive/rollback append-only actions в immutable
  `product_publication_batches`. Idempotency key возвращает исходный result без
  повторной мутации.
- Разрешать rollback только для текущего применённого action. Batch хранит
  полный before/after Product state; rollback создаёт новый batch и точно
  восстанавливает предыдущее состояние без удаления import, review или audit
  history.
- Блокировать mandatory reference rows в deterministic order во время
  publication и запрещать unpublish/archive reference либо изменение application
  area links, пока от них зависит published Product.
- Считать Published только Product, у которого статус `published` связан с
  активным publication batch. Неизвестное или неконсистентное состояние
  трактуется как unpublished.
- Оставить ADR-005 и structured fields publication независимыми: базовая
  публикация Product не публикует Advantages/Specifications и не обходит их
  field-level Human Review.

## Alternatives

1. Считать `approved` публичным автоматически — отклонено: approval и
   publication имеют разную ответственность, отсутствуют явное действие и
   rollback target.
2. Использовать только mutable `products.publication_status` — отклонено:
   невозможно доказать, какая ревизия была опубликована и кем.
3. Создать новый Storefront repository вместе с writer — отклонено: это смешало
   publication boundary с read boundary и расширило Release Gate scope.
4. Объединить базовый Product и Structured Fields в один payload — отклонено:
   structured fields имеют отдельные provenance и field-level decisions,
   утверждённые ADR-005.

## Consequences

- Product publication получает воспроизводимый state machine и audit trail.
- Прямая мутация publication state или base content после approval блокируется
  database trigger; контролируемые transitions выполняет только writer.
- Future `CloudPublishedCatalogRepository` может читать published projection,
  не меняя `CatalogRepository` или `ProductService` contract.
- Применение migration само по себе ничего не публикует и не изменяет Product
  Data; существующие товары остаются в прежнем состоянии.
- Review decision API является authenticated internal boundary, а approval API
  service-only потребляет его immutable ID. Caller-asserted human identity не
  существует; публичный HTTP endpoint этим решением не создаётся.
- Связанные сущности проверяются и блокируются перед revision/approval/publication.
  Их independent publication workflows остаются источником published state, но
  persistent dependency guards не позволяют нарушить contract published Product.
- Изменения дочерних Product rows после базовой публикации должны проходить через
  соответствующий publication owner. В этой задаче не создаётся общий writer
  для Structured Fields или Reference Data.

## Security and data impact

- `anon` и `authenticated` не имеют доступа к revision, approval, batch или
  write RPC.
- `service_role` может читать immutable evidence и вызывать RPC, но не может
  напрямую вставлять, обновлять или удалять publication evidence.
- Public Product RLS остаётся fail-closed и выдаёт только точный статус
  `published`; дополнительный state constraint требует active batch.
- Checksums рассчитываются на database boundary. Approval проверяется повторно
  непосредственно перед publication.
- Product хранит canonical current revision/current approval pointers; publish
  batch обязан совпадать с обоими pointers и Product identity.
- Migration не содержит backfill, approval, publication, Product enrichment,
  remote connection или environment-specific values.

## Migration and rollback

Forward-only migration:
`202607250001_product_publication_foundation_v1.sql`, hardening:
`202607260001_product_publication_foundation_corrective_v1.sql`.

Она создаёт immutable evidence tables, state guards и service-only RPC.
Independent review и controlled staging migration завершены успешно; решение
принято без автоматической публикации Product Data. Schema rollback выполняется
только отдельной forward migration;
операционный rollback отдельной публикации выполняется
`rollback_product_publication_v1` и не удаляет историю.

## References

- [PROJECT_GUIDE.md](../PROJECT_GUIDE.md)
- [ADR-001 — Cloud First](./ADR-001-cloud-first-source-of-truth.md)
- [ADR-002 — Storefront repository boundary](./ADR-002-storefront-repository-boundary.md)
- [ADR-005 — Structured Product Detail publication](./ADR-005-structured-product-detail-publication.md)
- [Product Publication Foundation v1](../../04-data/product-publication-foundation-v1.md)
