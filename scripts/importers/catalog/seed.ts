import { execFile } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { access, mkdir, rename, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

import {
  CATALOG_SEED_WARNING,
  type CatalogImportReport,
  type CatalogSeed,
  type CatalogSeedItem,
} from "./types.ts";

const execFileAsync = promisify(execFile);
const OUTPUT_PATH = resolve(
  process.cwd(),
  "data/catalog-seed.generated.json",
);
const REPORT_PATH = resolve(
  process.cwd(),
  "data/catalog-import-report.generated.json",
);

const CATEGORY_LABELS = new Map([
  ["АКУШЕРСТВО И ГИНЕКОЛОГИЯ", "Акушерство и гинекология"],
  ["ГИБКАЯ ЭНДОСКОПИЯ", "Гибкая эндоскопия"],
  ["РЕАНИМАЦИОННОЕ ОБОРУДОВАНИЕ", "Реанимационное оборудование"],
  ["ФУНКЦИОНАЛЬНАЯ ДИАГНОСТИКА", "Функциональная диагностика"],
  ["ПРОЧЕЕ ОБОРУДОВАНИЕ", "Прочее оборудование"],
]);

const TITLE_PREFIX =
  /^(?:Инкубатор|Аппарат|Открытая реанимационная система|Фетальный монитор|Монитор матери плода|Электрический аспиратор|Анализатор|Система отоакустической эмиссии|Портативный аспиратор|Устройства обогрева|Кольпоскоп|Видеоэндоскопическая система|Гастрофиброскоп|Бронхофиброскоп|Наркозно-дыхательный аппарат|Монитор пациента|Светильник смотровой|Монитор МИТАР|Портативный УЗИ аппарат|Экспертный узи-аппарат|Гемодиализный аппарат|Рентгенодиагностический комплекс|Экспресс-анализатор|Электрокардиограф|Холтер|[CС]пирометра?|Энцефалограф|УФ-установка|Одноразовый эндоскоп|Аэрозольный распылитель|Видеоларингоскоп|Кровать функциональная|Видеобронхоскоп|Шприцевой насос|Концентратор кислорода|Стол общехирургический|Центральная станция мониторинга)/i;

const BRAND_RULES: Array<[RegExp, string]> = [
  [/УОМЗ/i, "УОМЗ"],
  [/\bSLE\b/i, "SLE"],
  [/\bHamilton\b/i, "Hamilton Medical"],
  [/\bGE\b|\bCorometrics\b|\bLogiq\b/i, "GE Healthcare"],
  [/\bGeneral Meditech\b/i, "General Meditech"],
  [/\bDixion\b/i, "DIXION"],
  [/\bSonoScape\b/i, "SonoScape"],
  [/\bPentax\b/i, "Pentax Medical"],
  [/\bMindray\b|\bBeneVision\b|\bWATO\b|\bHyLED\b/i, "Mindray"],
  [/\bComen\b/i, "Comen"],
  [/\bB\.?\s*Braun\b|\bBBraun\b/i, "B. Braun"],
  [/Электрон/i, "НИПК «Электрон»"],
  [/Медиком/i, "Медиком"],
  [/\bMIR\b/i, "MIR"],
  [/\bAmbu\b|\baScope\b/i, "Ambu"],
  [/\bAirtraq\b/i, "Airtraq"],
  [/\bFresenius Kabi\b|\bAgilia\b/i, "Fresenius Kabi"],
  [/\bLongfian\b|\bJAY-\d+\b/i, "Longfian"],
];

const MODEL_RULES = [
  /ИДН-\d+\s*«Данио»/i,
  /SLE\s*6000/i,
  /Phoenix\s*CIC\s*101/i,
  /Hamilton\s*[CT][-\s]?\d/i,
  /Уникос-\d+/i,
  /Corometrics\s*259\s*CX/i,
  /\bG6B\b/i,
  /Vacus\s*\d+/i,
  /АПДН-\d+/i,
  /Билитест/i,
  /\bOtoRead\b/i,
  /РТ300СИ/i,
  /КС-\d+-\d+(?:\s+Zoom\s+Комфорт)?/i,
  /HD-\d+/i,
  /F[GB]-\d+V/i,
  /WATO\s*EX-\d+/i,
  /SV\d+(?:\/SV\d+)?/i,
  /Авента-У/i,
  /Фаза-\d+/i,
  /BeneVision\s*N\d+(?:\/N\d+)*/i,
  /HyLED\s*\d+/i,
  /Mindray\s*A\d+/i,
  /МИТАР-\d+\s*[-–]?\s*«Р-Д»/i,
  /Comen\s*N\d+/i,
  /Mindray\s*M\d+/i,
  /Logiq\s*E\d+/i,
  /Dialog\+/i,
  /\bКРТ\b/i,
  /Nano-Checker\s*\d+/i,
  /ЭК12Т-\d+\s*[-–]?\s*«Р-Д»\/\d+/i,
  /ИН-\d+/i,
  /MIR\s*Spirolab/i,
  /Нейрон-Спектр-\d+/i,
  /Альфа-\d+/i,
  /aScope\s*4\s*Broncho/i,
  /Ультраспрейер\s*Р/i,
  /\bAirtraq\b/i,
  /MB-\d+/i,
  /VME-\d+B/i,
  /Agilia\s*SP\s*MC/i,
  /JAY-\d+/i,
  /ОМ-ДЕЛЬТА\s*ПЛЮС\s*\d+/i,
  /Comen\s*CMS/i,
];

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh",
  з: "z", и: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts",
  ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu",
  я: "ya",
};

function cleanLine(value: string) {
  return value.normalize("NFKC").replace(/\s+/g, " ").trim();
}

export function normalizeCatalogTitle(value: string) {
  return cleanLine(value)
    .replace(/интенсвиной/gi, "интенсивной")
    .replace(/^Cпирометра?(?=\s|$)/i, "Спирометр")
    .replace(/\bBBraun\b/g, "B. Braun")
    .replace(/ИДН-\s+(\d+)/g, "ИДН-$1")
    .replace(/-\s*«/g, " «")
    .replace(/»\s*«УОМЗ»/g, "» УОМЗ")
    .replace(/Hamilton\s+C-1/gi, "Hamilton C1")
    .replace(/Hamilton\s+Т-1/gi, "Hamilton T1");
}

export function stableCatalogSlug(value: string) {
  const transliterated = value
    .normalize("NFKC")
    .toLocaleLowerCase("ru-RU")
    .split("")
    .map((character) => CYRILLIC_TO_LATIN[character] ?? character)
    .join("");

  return (
    transliterated
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 100) ||
    `catalog-item-${createHash("sha256").update(value).digest("hex").slice(0, 12)}`
  );
}

function extractBrandCandidate(title: string) {
  return BRAND_RULES.find(([pattern]) => pattern.test(title))?.[1] ?? null;
}

function extractModelCandidate(title: string) {
  return MODEL_RULES.map((pattern) => title.match(pattern)?.[0] ?? null).find(
    Boolean,
  ) ?? null;
}

function canonicalProductKey(item: CatalogSeedItem) {
  if (item.brandCandidate && item.modelCandidate) {
    return `${item.brandCandidate}:${item.modelCandidate}`
      .toLocaleLowerCase("ru-RU")
      .replace(/[^a-zа-яё0-9+]+/gi, "");
  }
  return item.normalizedTitle
    .toLocaleLowerCase("ru-RU")
    .replace(/[^a-zа-яё0-9+]+/gi, "");
}

export function parseCatalogSeedText(text: string, fileName: string) {
  const pages = text.split("\f");
  const extracted: CatalogSeedItem[] = [];

  pages.forEach((pageText, pageIndex) => {
    const page = pageIndex + 1;
    const lines = pageText.split(/\r?\n/).map(cleanLine).filter(Boolean);
    const category =
      lines.map((line) => CATEGORY_LABELS.get(line)).find(Boolean) ?? null;
    if (!category) return;

    for (const line of lines) {
      if (!TITLE_PREFIX.test(line) || line.includes(":")) continue;
      const normalizedTitle = normalizeCatalogTitle(line);
      extracted.push({
        titleFromCatalog: line,
        normalizedTitle,
        brandCandidate: extractBrandCandidate(normalizedTitle),
        modelCandidate: extractModelCandidate(normalizedTitle),
        category,
        catalogPage: page,
        slug: stableCatalogSlug(normalizedTitle),
        status: "seed_only",
        needsIndependentResearch: true,
      });
    }
  });

  const unique: CatalogSeedItem[] = [];
  const seen = new Map<string, CatalogSeedItem>();
  const suspectedDuplicates: CatalogImportReport["suspectedDuplicates"] = [];

  for (const item of extracted) {
    const key = canonicalProductKey(item);
    const existing = seen.get(key);
    if (existing) {
      suspectedDuplicates.push({
        canonicalKey: key,
        kept: { title: existing.normalizedTitle, page: existing.catalogPage },
        duplicate: { title: item.normalizedTitle, page: item.catalogPage },
      });
      continue;
    }
    seen.set(key, item);
    unique.push(item);
  }

  const uncertainRecognitions =
    unique.flatMap((item) => {
      const reasons = [
        ...(item.brandCandidate ? [] : ["brand_candidate_missing"]),
        ...(item.modelCandidate ? [] : ["model_candidate_missing"]),
      ];
      return reasons.length
        ? [{ title: item.normalizedTitle, page: item.catalogPage, reasons }]
        : [];
    });

  const seed: CatalogSeed = {
    source: {
      fileName,
      sourceType: "catalog_seed_only",
      warning: CATALOG_SEED_WARNING,
    },
    items: unique,
  };
  const report: CatalogImportReport = {
    generatedAt: new Date().toISOString(),
    sourceFile: fileName,
    extractedPositions: extracted.length,
    uniqueProducts: unique.length,
    successfullyNormalized: unique.filter((item) => item.slug).length,
    requiresManualReview: unique.length,
    independentSourcesFound: 0,
    productsWithoutSources: unique.length,
    suspectedDuplicates,
    uncertainRecognitions,
    warnings: [CATALOG_SEED_WARNING],
  };

  return { seed, report, extracted };
}

async function pathExists(path: string) {
  return access(path).then(() => true).catch(() => false);
}

async function resolveInputPath(value: string) {
  const candidates = [
    resolve(value),
    resolve(process.cwd(), value),
    resolve(homedir(), "Downloads", value),
  ];
  for (const candidate of candidates) {
    if (await pathExists(candidate)) return candidate;
  }
  throw new Error(`Catalog PDF was not found: ${value}`);
}

async function extractPdfText(path: string) {
  const executables = [
    process.env.PDFTOTEXT_PATH,
    "pdftotext",
    "/opt/homebrew/bin/pdftotext",
    "/usr/local/bin/pdftotext",
  ].filter((value): value is string => Boolean(value));

  for (const executable of executables) {
    try {
      const { stdout } = await execFileAsync(
        executable,
        ["-layout", path, "-"],
        { maxBuffer: 20 * 1024 * 1024 },
      );
      if (stdout.trim()) return stdout;
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        continue;
      }
      throw error;
    }
  }

  const pythonExecutables = [
    process.env.PYTHON_PATH,
    "python3",
    resolve(
      homedir(),
      ".cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3",
    ),
  ].filter((value): value is string => Boolean(value));
  const pythonScript = [
    "from pypdf import PdfReader",
    "import sys",
    "reader = PdfReader(sys.argv[1])",
    "sys.stdout.write('\\f'.join((page.extract_text() or '') for page in reader.pages))",
  ].join("; ");
  for (const executable of pythonExecutables) {
    try {
      const { stdout } = await execFileAsync(
        executable,
        ["-c", pythonScript, path],
        { maxBuffer: 20 * 1024 * 1024 },
      );
      if (stdout.trim()) return stdout;
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        continue;
      }
    }
  }

  throw new Error(
    "PDF extraction requires Poppler pdftotext or Python with pypdf. Set PDFTOTEXT_PATH or PYTHON_PATH.",
  );
}

async function writeJsonAtomic(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true });
  const partPath = `${path}.${randomUUID()}.part`;
  await writeFile(partPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(partPath, path);
}

export async function importCatalogSeed(input: string) {
  const inputPath = await resolveInputPath(input);
  const text = await extractPdfText(inputPath);
  const result = parseCatalogSeedText(text, basename(inputPath));
  await writeJsonAtomic(OUTPUT_PATH, result.seed);
  await writeJsonAtomic(REPORT_PATH, result.report);
  return {
    seedPath: OUTPUT_PATH,
    reportPath: REPORT_PATH,
    ...result,
  };
}

async function main() {
  const input = process.argv.slice(2).join(" ").trim();
  if (!input) {
    throw new Error(
      'Pass a PDF path, for example: npm run import:catalog-seed -- "Каталог Кибермедика.pdf"',
    );
  }
  const output = await importCatalogSeed(input);
  process.stdout.write(
    `${JSON.stringify(
      {
        seedPath: output.seedPath,
        reportPath: output.reportPath,
        extractedPositions: output.report.extractedPositions,
        uniqueProducts: output.report.uniqueProducts,
        suspectedDuplicates: output.report.suspectedDuplicates.length,
        uncertainRecognitions: output.report.uncertainRecognitions.length,
      },
      null,
      2,
    )}\n`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  void main().catch((error) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : "Catalog import failed."}\n`,
    );
    process.exitCode = 1;
  });
}
