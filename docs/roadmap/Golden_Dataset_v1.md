# Golden Dataset v1

**Status:** MVP-019 planning baseline  
**Scope:** first curated collection of real medical device candidates  
**Non-goal:** mass import, automatic verification, automatic publication

## Purpose

Golden Dataset v1 is the first curated product collection for CyberMedica. It is
the quality benchmark for future importers, Review Queue, Product Compare and AI
Assistants.

These products are target candidates for evidence collection and review. A
product appearing here is not a verified CyberMedica fact.

## Selection Rules

- high clinical or procurement relevance;
- frequent comparison or substitution risk;
- likely availability of official documents;
- coverage across priority categories;
- useful test cases for compatibility, documents and characteristics;
- no automatic publication.

## Priority

| Priority | Meaning |
| --- | --- |
| Critical | High-risk category, strong procurement demand, review should start first. |
| High | Important category coverage, good importer/review test case. |
| Medium | Useful for breadth, templates and future importer validation. |

## Wave 1 Product Targets

### Аппараты ИВЛ

| Manufacturer | Model | Category | Priority |
| --- | --- | --- | --- |
| Hamilton Medical | HAMILTON-C1 | Аппарат ИВЛ | Critical |
| Hamilton Medical | HAMILTON-C3 | Аппарат ИВЛ | Critical |
| Hamilton Medical | HAMILTON-T1 | Транспортный ИВЛ | Critical |
| Hamilton Medical | HAMILTON-C6 | Аппарат ИВЛ | High |
| Dräger | Evita V500 | Аппарат ИВЛ | Critical |
| Dräger | Savina 300 | Аппарат ИВЛ | High |
| Mindray | SV300 | Аппарат ИВЛ | Critical |
| Mindray | SV600 | Аппарат ИВЛ | High |
| Mindray | SV800 | Аппарат ИВЛ | High |
| SLE | SLE6000 | Неонатальный ИВЛ | Critical |

### Мониторы пациента

| Manufacturer | Model | Category | Priority |
| --- | --- | --- | --- |
| Mindray | BeneVision N12 | Монитор пациента | Critical |
| Mindray | BeneVision N15 | Монитор пациента | Critical |
| Mindray | BeneVision N17 | Монитор пациента | High |
| Mindray | ePM 12M | Монитор пациента | High |
| GE HealthCare | CARESCAPE B450 | Монитор пациента | Critical |
| GE HealthCare | CARESCAPE B650 | Монитор пациента | High |
| Philips | IntelliVue MX450 | Монитор пациента | Critical |
| Philips | IntelliVue MX700 | Монитор пациента | High |

### Наркозные станции

| Manufacturer | Model | Category | Priority |
| --- | --- | --- | --- |
| Dräger | Perseus A500 | Наркозная станция | Critical |
| Dräger | Primus | Наркозная станция | High |
| Dräger | Fabius Plus | Наркозная станция | High |
| Mindray | A7 | Наркозная станция | Critical |
| Mindray | A8 | Наркозная станция | High |
| Mindray | WATO EX-65 | Наркозная станция | Medium |
| GE HealthCare | Aisys CS2 | Наркозная станция | Critical |

### УЗИ

| Manufacturer | Model | Category | Priority |
| --- | --- | --- | --- |
| SonoScape | X5 | УЗИ | High |
| SonoScape | S9 | УЗИ | High |
| SonoScape | P60 | УЗИ | Medium |
| Mindray | Resona 7 | УЗИ | Critical |
| Mindray | DC-80 | УЗИ | High |
| GE HealthCare | LOGIQ E10 | УЗИ | Critical |
| GE HealthCare | Voluson E10 | УЗИ | High |
| Philips | EPIQ CVx | УЗИ | High |

### Эндоскопия

| Manufacturer | Model | Category | Priority |
| --- | --- | --- | --- |
| Ambu | aScope 4 Broncho | Одноразовый бронхоскоп | Critical |
| Ambu | aScope 5 Broncho | Одноразовый бронхоскоп | High |
| Ambu | aView 2 Advance | Эндоскопический монитор | High |
| Karl Storz | C-MAC | Видеоларингоскоп | Critical |
| Karl Storz | IMAGE1 S | Эндоскопическая система | High |
| Olympus | EVIS X1 | Эндоскопическая система | Critical |
| Olympus | GIF-HQ190 | Гастроскоп | High |

### Освещение

| Manufacturer | Model | Category | Priority |
| --- | --- | --- | --- |
| Dräger | Polaris 600 | Операционный светильник | High |
| Getinge / Maquet | PowerLED II | Операционный светильник | High |
| Merivaara | Q-Flow | Операционный светильник | Medium |
| Dixion | Convelar | Операционный светильник | Medium |

### Инкубаторы и неонатальное оборудование

| Manufacturer | Model | Category | Priority |
| --- | --- | --- | --- |
| Dräger | Babyleo TN500 | Неонатальный инкубатор | Critical |
| Dräger | Isolette 8000 | Неонатальный инкубатор | High |
| Atom Medical | Incu i | Неонатальный инкубатор | High |
| Danio | IDN-03 | Инкубатор интенсивной терапии | High |
| Danio | IDN-02 | Инкубатор для новорожденных | Medium |

### Инфузия и аспирация

| Manufacturer | Model | Category | Priority |
| --- | --- | --- | --- |
| Fresenius Kabi | Agilia SP MC | Шприцевой насос | High |
| B. Braun | Perfusor Space | Шприцевой насос | High |
| Dixion | Vacus 7308 | Электрический аспиратор | Medium |

## Category Distribution

| Category | Products |
| --- | ---: |
| Аппараты ИВЛ | 10 |
| Мониторы пациента | 8 |
| Наркозные станции | 7 |
| УЗИ | 8 |
| Эндоскопия | 7 |
| Освещение | 4 |
| Инкубаторы и неонатальное оборудование | 5 |
| Инфузия и аспирация | 3 |
| **Total** | **52** |

## Safety

Even for speed, never:

- publish a product because it is in this list;
- use brochure as the primary source for critical characteristics;
- use marketing copy instead of IFU;
- treat a PDF as evidence before document identity is checked;
- fill characteristics from LLM output;
- infer compatibility from connector appearance;
- publish analog equivalence without reviewer approval.
