import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_TIMEOUT_MS = 10_000;
const PROTECTED_PREVIEW_PATTERN =
  /authentication required|vercel security checkpoint|deployment protection/i;

const PUBLIC_ROUTES = [
  "/",
  "/catalog",
  "/products/fs510",
  "/search",
  "/compare",
  "/tender",
  "/workspace",
  "/request",
  "/thanks",
] as const;

const INTERNAL_ROUTES = [
  { path: "/admin", markers: ["CyberMedica CMS", "Прототип редактора"] },
  {
    path: "/internal/review-queue",
    markers: ["Граница безопасности", "Всего фактов"],
  },
  {
    path: "/internal/reviewer",
    markers: ["Профессиональный центр проверки", "draft decisions"],
  },
  {
    path: "/internal/import-center",
    markers: ["Read-only dashboard", "review handoff"],
  },
  {
    path: "/internal/wave2",
    markers: ["Progress across planned manufacturers", "Internal · Read only"],
  },
] as const;

const REQUIRED_SECURITY_HEADERS = {
  "content-security-policy": "default-src 'self'",
  "cross-origin-opener-policy": "same-origin",
  "permissions-policy": "camera=()",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
} as const;

export type PreviewSmokeStatus = "passed" | "failed" | "protected_preview";
export type SmokeErrorClassification = "timeout" | "network_error";

export interface PreviewSmokeCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface PreviewSmokeResult {
  status: PreviewSmokeStatus;
  baseUrl: string;
  checks: PreviewSmokeCheck[];
  passed: number;
  failed: number;
}

interface SmokeOptions {
  timeoutMs?: number;
  validateRequestApi?: boolean;
  fetchImpl?: typeof fetch;
}

interface SmokeResponse {
  status: number;
  headers: Headers;
  body: string;
}

export function normalizePreviewBaseUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("BASE_URL is required");
  const url = new URL(trimmed);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("BASE_URL must use http or https");
  }
  if (url.username || url.password) {
    throw new Error("BASE_URL must not contain credentials");
  }
  if (url.search || url.hash) {
    throw new Error("BASE_URL must not contain query parameters or a fragment");
  }
  if (url.pathname !== "/") {
    throw new Error("BASE_URL must contain only an origin, without a path");
  }
  return url.origin;
}

export function classifySmokeError(error: unknown): SmokeErrorClassification {
  if (
    (error instanceof DOMException &&
      (error.name === "AbortError" || error.name === "TimeoutError")) ||
    (error instanceof Error && /abort|timeout/i.test(`${error.name} ${error.message}`))
  ) {
    return "timeout";
  }
  return "network_error";
}

async function request(
  fetchImpl: typeof fetch,
  url: URL,
  timeoutMs: number,
  init: RequestInit = {},
): Promise<SmokeResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      redirect: "manual",
      ...init,
      signal: controller.signal,
      headers: {
        "user-agent": "CyberMedica-Preview-Smoke/1.0",
        ...init.headers,
      },
    });
    return {
      status: response.status,
      headers: response.headers,
      body: init.method === "HEAD" ? "" : await response.text(),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function protectedPreview(response: SmokeResponse) {
  return (
    response.status === 401 ||
    response.status === 403 ||
    response.headers.get("x-vercel-mitigated") === "challenge" ||
    PROTECTED_PREVIEW_PATTERN.test(response.body)
  );
}

function hasNoIndex(body: string) {
  return /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(
    body,
  );
}

function notFoundBody(body: string) {
  return /Страница не найдена|This page could not be found/i.test(body);
}

function makeResult(
  status: PreviewSmokeStatus,
  baseUrl: string,
  checks: PreviewSmokeCheck[],
): PreviewSmokeResult {
  return {
    status,
    baseUrl,
    checks,
    passed: checks.filter((check) => check.passed).length,
    failed: checks.filter((check) => !check.passed).length,
  };
}

export async function runPreviewSmoke(
  input: string,
  options: SmokeOptions = {},
): Promise<PreviewSmokeResult> {
  const baseUrl = normalizePreviewBaseUrl(input);
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 60_000) {
    throw new Error("timeoutMs must be an integer between 100 and 60000");
  }
  const fetchImpl = options.fetchImpl ?? fetch;
  const checks: PreviewSmokeCheck[] = [];
  const add = (name: string, passed: boolean, detail: string) =>
    checks.push({ name, passed, detail });

  let root: SmokeResponse;
  try {
    root = await request(fetchImpl, new URL("/", baseUrl), timeoutMs);
  } catch (error) {
    add("GET /", false, classifySmokeError(error));
    return makeResult("failed", baseUrl, checks);
  }

  if (protectedPreview(root)) {
    add(
      "Deployment Protection",
      true,
      `protected preview detected (HTTP ${root.status})`,
    );
    return makeResult("protected_preview", baseUrl, checks);
  }

  add("GET /", root.status === 200, `HTTP ${root.status}`);
  for (const [header, expected] of Object.entries(REQUIRED_SECURITY_HEADERS)) {
    const value = root.headers.get(header) ?? "";
    add(
      `Header ${header}`,
      value.includes(expected),
      value ? value : "missing",
    );
  }
  add(
    "X-Powered-By disabled",
    !root.headers.has("x-powered-by"),
    root.headers.get("x-powered-by") ?? "not present",
  );

  for (const path of PUBLIC_ROUTES.slice(1)) {
    try {
      const response = await request(fetchImpl, new URL(path, baseUrl), timeoutMs);
      add(`GET ${path}`, response.status === 200, `HTTP ${response.status}`);
      if (path === "/thanks") {
        add("/thanks noindex", hasNoIndex(response.body), "robots metadata");
        add(
          "/thanks canonical",
          /<link[^>]+rel=["']canonical["'][^>]+href=["'][^"']*\/thanks["']/i.test(
            response.body,
          ),
          "canonical /thanks",
        );
      }
    } catch (error) {
      add(`GET ${path}`, false, classifySmokeError(error));
    }
  }

  try {
    const robots = await request(
      fetchImpl,
      new URL("/robots.txt", baseUrl),
      timeoutMs,
    );
    add("GET /robots.txt", robots.status === 200, `HTTP ${robots.status}`);
    add(
      "Preview indexing disabled",
      /Disallow:\s*\//i.test(robots.body),
      "robots Disallow: /",
    );
  } catch (error) {
    add("GET /robots.txt", false, classifySmokeError(error));
  }

  try {
    const sitemap = await request(
      fetchImpl,
      new URL("/sitemap.xml", baseUrl),
      timeoutMs,
    );
    add("GET /sitemap.xml", sitemap.status === 200, `HTTP ${sitemap.status}`);
    add(
      "Sitemap excludes private routes",
      !/(\/internal\/|\/admin(?:<|\/)|\/thanks(?:<|\/))/i.test(sitemap.body),
      "no internal/admin/thanks URLs",
    );
  } catch (error) {
    add("GET /sitemap.xml", false, classifySmokeError(error));
  }

  for (const route of INTERNAL_ROUTES) {
    try {
      const response = await request(
        fetchImpl,
        new URL(route.path, baseUrl),
        timeoutMs,
      );
      const leaked = route.markers.some((marker) => response.body.includes(marker));
      const disabled =
        response.status === 404 ||
        (response.status === 200 &&
          notFoundBody(response.body) &&
          hasNoIndex(response.body));
      add(
        `Disabled ${route.path}`,
        disabled && !leaked,
        `HTTP ${response.status}; sensitive markers ${leaked ? "found" : "absent"}`,
      );
    } catch (error) {
      add(`Disabled ${route.path}`, false, classifySmokeError(error));
    }
  }

  try {
    const missing = await request(
      fetchImpl,
      new URL("/__cybermedica_preview_smoke_missing__", baseUrl),
      timeoutMs,
    );
    add("Unknown route 404", missing.status === 404, `HTTP ${missing.status}`);
  } catch (error) {
    add("Unknown route 404", false, classifySmokeError(error));
  }

  if (options.validateRequestApi) {
    try {
      const response = await request(
        fetchImpl,
        new URL("/api/request", baseUrl),
        timeoutMs,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{}",
        },
      );
      add(
        "Request API rejects non-form validation probe",
        response.status === 400 || response.status === 415,
        `HTTP ${response.status}; no lead submitted`,
      );
    } catch (error) {
      add("Request API validation probe", false, classifySmokeError(error));
    }
  }

  return makeResult(
    checks.every((check) => check.passed) ? "passed" : "failed",
    baseUrl,
    checks,
  );
}

function parseCliArguments(arguments_: string[]) {
  const validateRequestApi = arguments_.includes("--validate-request-api");
  const timeoutArgument = arguments_.find((argument) =>
    argument.startsWith("--timeout-ms="),
  );
  const baseUrl = arguments_.find((argument) => !argument.startsWith("--"));
  if (!baseUrl) {
    throw new Error(
      "Usage: npm run qa:preview-smoke -- <BASE_URL> [--timeout-ms=10000] [--validate-request-api]",
    );
  }
  const timeoutMs = timeoutArgument
    ? Number.parseInt(timeoutArgument.slice("--timeout-ms=".length), 10)
    : DEFAULT_TIMEOUT_MS;
  return { baseUrl, timeoutMs, validateRequestApi };
}

async function main() {
  const options = parseCliArguments(process.argv.slice(2));
  const result = await runPreviewSmoke(options.baseUrl, options);
  console.log(`Preview smoke: ${result.status}`);
  console.log(`Base URL: ${result.baseUrl}`);
  for (const check of result.checks) {
    console.log(`${check.passed ? "PASS" : "FAIL"} ${check.name}: ${check.detail}`);
  }
  console.log(`Summary: ${result.passed} passed, ${result.failed} failed`);
  if (result.status === "failed") process.exitCode = 1;
}

const isDirectRun =
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isDirectRun) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
