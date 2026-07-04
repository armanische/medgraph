-- CyberMedica FS510 MVP fixture.
-- Run after supabase/migrations/202607020001_fs510_vertical_slice.sql.
-- Safe to run repeatedly: existing identity, document and publication rows are reused.

do $fixture$
declare
  v_organization_id uuid;
  v_regulator_organization_id uuid;
  v_product_id uuid;
  v_manual_document_id uuid;
  v_manual_version_id uuid;
  v_manual_evidence_id uuid;
  v_ru_document_id uuid;
  v_ru_version_id uuid;
  v_ru_evidence_id uuid;
  v_filtration_revision_id uuid;
  v_filtration_verification_id uuid;
  v_filtration_publication_id uuid;
  v_filtration_verified_at timestamptz;
  v_filtration_published_at timestamptz;
  v_registration_revision_id uuid;
  v_registration_verification_id uuid;
  v_registration_publication_id uuid;
  v_registration_verified_at timestamptz;
  v_registration_published_at timestamptz;
begin
  select organization_id
    into v_organization_id
    from core.organizations
   where lower(canonical_name) = lower('Alba Healthcare')
     and country_code = 'US'
   limit 1;

  if v_organization_id is null then
    v_organization_id := factory_api.create_organization('Alba Healthcare', 'US');
  end if;

  select organization_id
    into v_regulator_organization_id
    from core.organizations
   where lower(canonical_name) = lower('Росздравнадзор')
     and country_code = 'RU'
   limit 1;

  if v_regulator_organization_id is null then
    v_regulator_organization_id := factory_api.create_organization(
      'Росздравнадзор',
      'RU'
    );
  end if;

  select product_id
    into v_product_id
    from catalog.products
   where manufacturer_organization_id = v_organization_id
     and lower(model_designation) = lower('FS510')
   limit 1;

  if v_product_id is null then
    v_product_id := factory_api.create_product(v_organization_id, 'FS510');
  end if;

  select document_id
    into v_manual_document_id
    from source.documents
   where source_organization_id = v_organization_id
     and external_document_id = 'FS510-IFU-RU'
   limit 1;

  if v_manual_document_id is null then
    v_manual_document_id := factory_api.create_document(
      v_organization_id,
      'ifu',
      'Инструкция по применению FS510',
      'FS510-IFU-RU'
    );
  end if;

  select document_version_id
    into v_manual_version_id
    from source.document_versions
   where document_id = v_manual_document_id
     and sha256 = decode(
       '22ceccf03f3435c1f1b2e29a134781a4ce47921d5f6bbc6bc38e6a0f6c1662fe',
       'hex'
     )
   limit 1;

  if v_manual_version_id is null then
    v_manual_version_id := factory_api.add_document_version(
      v_manual_document_id,
      'repository-2024-12-19',
      '2024-12-19 00:00:00+03'::timestamptz,
      'repository://public/products/fs510/manual.pdf',
      'products/fs510/manual.pdf',
      '22ceccf03f3435c1f1b2e29a134781a4ce47921d5f6bbc6bc38e6a0f6c1662fe',
      'application/pdf',
      2310695,
      null
    );
  end if;

  select evidence_id
    into v_manual_evidence_id
    from source.evidence
   where document_version_id = v_manual_version_id
     and quoted_text = 'Эффективность фильтрации ≥99,999%'
   limit 1;

  if v_manual_evidence_id is null then
    v_manual_evidence_id := factory_api.add_evidence(
      v_manual_version_id,
      'section',
      null,
      null,
      'Технические характеристики',
      'Эффективность фильтрации ≥99,999%',
      '{"source":"repository fixture","review_required_for_page_locator":true}'::jsonb
    );
  end if;

  select document_id
    into v_ru_document_id
    from source.documents
   where source_organization_id = v_regulator_organization_id
     and external_document_id = 'ФСЗ 2009/04992'
   limit 1;

  if v_ru_document_id is null then
    v_ru_document_id := factory_api.create_document(
      v_regulator_organization_id,
      'registration',
      'Регистрационное удостоверение ФСЗ 2009/04992',
      'ФСЗ 2009/04992'
    );
  end if;

  select document_version_id
    into v_ru_version_id
    from source.document_versions
   where document_id = v_ru_document_id
     and sha256 = decode(
       '761e576deb22d72c7948df828dc91922422e11b154cc61ed8e400ac27319e928',
       'hex'
     )
   limit 1;

  if v_ru_version_id is null then
    v_ru_version_id := factory_api.add_document_version(
      v_ru_document_id,
      'repository-current',
      null,
      'repository://public/products/fs510/ru.pdf',
      'products/fs510/ru.pdf',
      '761e576deb22d72c7948df828dc91922422e11b154cc61ed8e400ac27319e928',
      'application/pdf',
      2754512,
      null
    );
  end if;

  select evidence_id
    into v_ru_evidence_id
    from source.evidence
   where document_version_id = v_ru_version_id
     and quoted_text = 'ФСЗ 2009/04992'
   limit 1;

  if v_ru_evidence_id is null then
    v_ru_evidence_id := factory_api.add_evidence(
      v_ru_version_id,
      'registry_record',
      null,
      null,
      'Регистрационные сведения',
      'ФСЗ 2009/04992',
      '{"source":"repository fixture"}'::jsonb
    );
  end if;

  select rr.result_revision_id
    into v_filtration_revision_id
    from knowledge.results r
    join knowledge.claim_types ct on ct.claim_type_id = r.claim_type_id
    join knowledge.result_revisions rr on rr.result_id = r.result_id
   where r.subject_entity_id = v_product_id
     and ct.stable_code = 'product.filtration_efficiency'
   order by rr.revision_no desc
   limit 1;

  if v_filtration_revision_id is null then
    v_filtration_revision_id := factory_api.create_claim_revision(
      v_product_id,
      'product.filtration_efficiency',
      '{"operator":">=","number":99.999,"unit":"%"}'::jsonb,
      jsonb_build_object(
        'product_id', v_product_id::text,
        'method', null,
        'conditions', null
      ),
      'Для FS510 указана эффективность фильтрации не менее 99,999%.',
      array[v_manual_evidence_id]
    );
  end if;

  select verification_id, verified_at
    into v_filtration_verification_id, v_filtration_verified_at
    from knowledge.verifications
   where result_revision_id = v_filtration_revision_id
     and decision_code in ('confirmed', 'confirmed_with_limitations')
   order by verified_at desc
   limit 1;

  if v_filtration_verification_id is null then
    v_filtration_verification_id := factory_api.verify_result_revision(
      v_filtration_revision_id,
      'confirmed_with_limitations',
      '{"scope":"MVP fixture; page-level Evidence locator requires editorial confirmation"}'::jsonb,
      'FS510 MVP publication fixture',
      now() + interval '180 days'
    );

    select verified_at
      into v_filtration_verified_at
      from knowledge.verifications
     where verification_id = v_filtration_verification_id;
  end if;

  select pr.publication_id
    into v_filtration_publication_id
    from publication.records pr
    join publication.channels pc on pc.channel_id = pr.channel_id
    join publication.current_state pcs on pcs.publication_id = pr.publication_id
    join knowledge.result_revisions rr
      on rr.result_revision_id = pcs.active_result_revision_id
   where rr.result_revision_id = v_filtration_revision_id
     and pc.stable_code = 'public_web'
     and pcs.status_code = 'active'
   limit 1;

  if v_filtration_publication_id is null then
    v_filtration_publication_id := factory_api.activate_publication(
      v_filtration_revision_id,
      v_filtration_verification_id,
      'fs510-filtration-efficiency',
      'FS510 MVP publication'
    );
  end if;

  select effective_since
    into v_filtration_published_at
    from publication.current_state
   where publication_id = v_filtration_publication_id
     and status_code = 'active';

  select rr.result_revision_id
    into v_registration_revision_id
    from knowledge.results r
    join knowledge.claim_types ct on ct.claim_type_id = r.claim_type_id
    join knowledge.result_revisions rr on rr.result_id = r.result_id
   where r.subject_entity_id = v_product_id
     and ct.stable_code = 'product.registration_number'
   order by rr.revision_no desc
   limit 1;

  if v_registration_revision_id is null then
    v_registration_revision_id := factory_api.create_claim_revision(
      v_product_id,
      'product.registration_number',
      '{"number":"ФСЗ 2009/04992"}'::jsonb,
      jsonb_build_object('product_id', v_product_id::text),
      'Для FS510 указано регистрационное удостоверение ФСЗ 2009/04992.',
      array[v_ru_evidence_id]
    );
  end if;

  select verification_id, verified_at
    into v_registration_verification_id, v_registration_verified_at
    from knowledge.verifications
   where result_revision_id = v_registration_revision_id
     and decision_code in ('confirmed', 'confirmed_with_limitations')
   order by verified_at desc
   limit 1;

  if v_registration_verification_id is null then
    v_registration_verification_id := factory_api.verify_result_revision(
      v_registration_revision_id,
      'confirmed',
      '{"scope":"FS510 MVP registration document"}'::jsonb,
      'FS510 registration publication fixture',
      now() + interval '180 days'
    );

    select verified_at
      into v_registration_verified_at
      from knowledge.verifications
     where verification_id = v_registration_verification_id;
  end if;

  select pr.publication_id
    into v_registration_publication_id
    from publication.records pr
    join publication.channels pc on pc.channel_id = pr.channel_id
    join publication.current_state pcs on pcs.publication_id = pr.publication_id
    join knowledge.result_revisions rr
      on rr.result_revision_id = pcs.active_result_revision_id
   where rr.result_revision_id = v_registration_revision_id
     and pc.stable_code = 'public_web'
     and pcs.status_code = 'active'
   limit 1;

  if v_registration_publication_id is null then
    v_registration_publication_id := factory_api.activate_publication(
      v_registration_revision_id,
      v_registration_verification_id,
      'fs510-registration-number',
      'FS510 registration publication'
    );
  end if;

  select effective_since
    into v_registration_published_at
    from publication.current_state
   where publication_id = v_registration_publication_id
     and status_code = 'active';

  perform factory_api.upsert_product_page(
    v_product_id,
    'ru-RU',
    jsonb_build_object(
      'slug', 'fs510',
      'name', 'Тепловлагообменный фильтр HMEF FS510',
      'manufacturer', 'Alba Healthcare',
      'category', 'Анестезиология и реанимация',
      'description',
        'Тепловлагообменный фильтр HMEF для использования в дыхательном контуре со стороны пациента.',
      'heroImage', jsonb_build_object(
        'src', '/products/fs510/photo.jpg',
        'alt', 'Тепловлагообменный фильтр HMEF FS510'
      ),
      'registration', jsonb_build_object(
        'number', 'ФСЗ 2009/04992',
        'status', 'Активное РУ'
      ),
      'publication', jsonb_build_object(
        'status', 'Опубликовано · проверено с ограничениями',
        'verifiedAt', to_char(
          greatest(v_filtration_verified_at, v_registration_verified_at)
            at time zone 'UTC',
          'YYYY-MM-DD'
        ),
        'publishedAt', to_char(
          greatest(v_filtration_published_at, v_registration_published_at)
            at time zone 'UTC',
          'YYYY-MM-DD'
        )
      ),
      'characteristics', jsonb_build_array(
        jsonb_build_object('label', 'Фильтрация', 'value', '≥99,999%'),
        jsonb_build_object('label', 'Дыхательный объём', 'value', '100–2000 мл'),
        jsonb_build_object('label', 'Вес изделия', 'value', '27 г'),
        jsonb_build_object('label', 'Сопротивление', 'value', '<1,8 см H₂O')
      ),
      'claims', jsonb_build_array(
        jsonb_build_object(
          'code', 'product.filtration_efficiency',
          'displayName', 'Эффективность фильтрации',
          'formattedValue', '≥99,999%',
          'publicationKey', 'fs510-filtration-efficiency',
          'sourceId', 'fs510-ifu',
          'scope', jsonb_build_object(
            'summary',
              'Заявленная производителем характеристика модели FS510.',
            'appliesTo', jsonb_build_array(
              'Модель FS510',
              'Тепловлагообменный фильтр HMEF',
              'Условия применения согласно инструкции'
            )
          ),
          'limitations', jsonb_build_array(
            'Метод и условия испытания не детализированы в текущей проекции.',
            'Локатор страницы требует редакционной сверки с оригиналом документа.'
          )
        ),
        jsonb_build_object(
          'code', 'product.registration_number',
          'displayName', 'Регистрационное удостоверение',
          'formattedValue', 'ФСЗ 2009/04992',
          'publicationKey', 'fs510-registration-number',
          'sourceId', 'fs510-registration',
          'scope', jsonb_build_object(
            'summary',
              'Регистрационная запись изделия FS510 для обращения на территории РФ.',
            'appliesTo', jsonb_build_array(
              'Изделие FS510',
              'Российская Федерация',
              'Текущая опубликованная версия документа'
            )
          ),
          'limitations', jsonb_build_array(
            'Статус регистрационной записи необходимо сверять на дату закупки.',
            'РУ не подтверждает совместимость с конкретным медицинским оборудованием.'
          )
        )
      ),
      'keySummary', jsonb_build_array(
        'FS510 относится к классу тепловлагообменных фильтров HMEF.',
        'Опубликованная характеристика фильтрации: ≥99,999%.',
        'Перед применением сверяйте модель, параметры пациента и актуальную инструкцию.'
      ),
      'sources', jsonb_build_array(
        jsonb_build_object(
          'id', 'fs510-ifu',
          'source', jsonb_build_object(
            'name', 'Alba Healthcare',
            'type', 'Производитель'
          ),
          'document', jsonb_build_object(
            'title', 'Инструкция по применению FS510',
            'type', 'Инструкция производителя',
            'url', '/products/fs510/manual.pdf'
          ),
          'documentVersion', jsonb_build_object(
            'label', 'repository-2024-12-19'
          ),
          'evidence', jsonb_build_object(
            'locator', 'Раздел «Технические характеристики»',
            'excerpt', 'Эффективность фильтрации ≥99,999%'
          ),
          'verification', jsonb_build_object(
            'status', 'Подтверждено с ограничениями',
            'verifiedAt', to_char(
              v_filtration_verified_at at time zone 'UTC',
              'YYYY-MM-DD'
            )
          ),
          'publication', jsonb_build_object(
            'status', 'Активна',
            'publicKey', 'fs510-filtration-efficiency',
            'publishedAt', to_char(
              v_filtration_published_at at time zone 'UTC',
              'YYYY-MM-DD'
            )
          )
        ),
        jsonb_build_object(
          'id', 'fs510-registration',
          'source', jsonb_build_object(
            'name', 'Росздравнадзор',
            'type', 'Регулятор'
          ),
          'document', jsonb_build_object(
            'title', 'Регистрационное удостоверение ФСЗ 2009/04992',
            'type', 'Регистрационный документ',
            'url', '/products/fs510/ru.pdf'
          ),
          'documentVersion', jsonb_build_object(
            'label', 'repository-current'
          ),
          'evidence', jsonb_build_object(
            'locator', 'Регистрационные сведения',
            'excerpt', 'ФСЗ 2009/04992'
          ),
          'verification', jsonb_build_object(
            'status', 'Подтверждено',
            'verifiedAt', to_char(
              v_registration_verified_at at time zone 'UTC',
              'YYYY-MM-DD'
            )
          ),
          'publication', jsonb_build_object(
            'status', 'Активна',
            'publicKey', 'fs510-registration-number',
            'publishedAt', to_char(
              v_registration_published_at at time zone 'UTC',
              'YYYY-MM-DD'
            )
          )
        )
      ),
      'publicationHistory', jsonb_build_array(
        jsonb_build_object(
          'event', 'publication_activated',
          'effectiveAt', to_char(
            v_filtration_published_at at time zone 'UTC',
            'YYYY-MM-DD'
          ),
          'title', 'Опубликована характеристика фильтрации',
          'description',
            'В публичную карточку включён проверенный Claim об эффективности фильтрации.',
          'publicationKey', 'fs510-filtration-efficiency'
        ),
        jsonb_build_object(
          'event', 'publication_activated',
          'effectiveAt', to_char(
            v_registration_published_at at time zone 'UTC',
            'YYYY-MM-DD'
          ),
          'title', 'Опубликованы регистрационные сведения',
          'description',
            'В публичную карточку включён проверенный номер регистрационного удостоверения.',
          'publicationKey', 'fs510-registration-number'
        )
      )
    ),
    array[v_filtration_publication_id, v_registration_publication_id]
  );

  raise notice 'FS510 MVP projection published for product %', v_product_id;
end
$fixture$;
