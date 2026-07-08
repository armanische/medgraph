# Mindray Playbook

**Status:** MVP-019 playbook  
**Scope:** enrichment guidance for Mindray products

## Official Sites

- Global site: `https://www.mindray.com`
- Product pages: patient monitoring, life support, anesthesia and ultrasound sections
- Local/regional pages may have different document availability

## Where To Look For Documents

- global product detail pages;
- regional product pages;
- datasheets and brochures;
- user manuals when publicly available;
- regulator records;
- accessory/module lists.

## RU Notes

- RU may group several models or configurations;
- monitor and ultrasound products can have module/probe/software variants;
- anesthesia and ventilator products require exact model mapping.

## Typical Problems

- same model may appear across regional sites with different document sets;
- datasheets may omit clinical and service details;
- monitor module compatibility can be separate from base unit data;
- ultrasound probe compatibility is often not in the main brochure.

## Commonly Missing

- service manual;
- full module compatibility;
- probe list for ultrasound;
- software/options matrix.

## Importer Recommendations

- keep region and language metadata for documents;
- separate base device characteristics from module/probe/accessory data;
- prefer IFU/user manual for intended use and safety notes;
- flag product families with many options for reviewer attention;
- do not treat brochure tables as complete technical evidence.

## Safety

Do not publish measured parameters, probe compatibility, ventilation modes or
anesthesia compatibility without official document evidence and review.
