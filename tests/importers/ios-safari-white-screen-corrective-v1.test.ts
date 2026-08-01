import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
  return readFile(path, "utf8");
}

test("root layout keeps the server-rendered shell visible when catalog transport fails", async () => {
  const layout = await source("app/layout.tsx");

  assert.match(layout, /loadHomepageOverviewSources/u);
  assert.match(layout, /products=\{products \?\? \[\]\}/u);
  assert.match(layout, /manufacturers=\{manufacturers \?\? \[\]\}/u);
  assert.match(layout, /categories=\{categories \?\? \[\]\}/u);
  assert.doesNotMatch(layout, /const \[products, manufacturers, categories\] = await Promise\.all/u);
});

test("route and root errors are fail-visible and expose only sanitized telemetry", async () => {
  const [routeError, globalError] = await Promise.all([
    source("app/error.tsx"),
    source("app/global-error.tsx"),
  ]);

  assert.match(routeError, /unstable_retry/u);
  assert.match(routeError, /digest: error\.digest \?\? "unavailable"/u);
  assert.doesNotMatch(routeError, /console\.error\([^\n]*error\)/u);

  assert.match(globalError, /^"use client";/u);
  assert.match(globalError, /<html lang="ru">/u);
  assert.match(globalError, /<body/u);
  assert.match(globalError, /Не удалось открыть страницу/u);
  assert.match(globalError, /unstable_retry/u);
  assert.match(globalError, /digest: error\.digest \?\? "unavailable"/u);
  assert.doesNotMatch(globalError, /error\.message|error\.stack/u);
});

test("public shell does not access browser-only APIs during SSR", async () => {
  const [layout, loading, globalError] = await Promise.all([
    source("app/layout.tsx"),
    source("app/loading.tsx"),
    source("app/global-error.tsx"),
  ]);
  const serverShell = `${layout}\n${loading}`;

  assert.doesNotMatch(
    serverShell,
    /\b(?:window|document|navigator|localStorage|sessionStorage|matchMedia|visualViewport)\s*[.(]/u,
  );
  assert.match(globalError, /"use client"/u);
});

test("WebKit smoke covers the public shell and prevents a stuck streaming fallback", async () => {
  const [smoke, packageJson, globalStyles] = await Promise.all([
    source("scripts/qa/ios-webkit-smoke.ts"),
    source("package.json"),
    source("app/globals.css"),
  ]);

  assert.match(smoke, /import \{ webkit \} from "playwright-core"/u);
  assert.match(smoke, /width: 390, height: 844/u);
  assert.match(smoke, /width: 844, height: 390/u);
  assert.match(smoke, /desktop Safari\/WebKit/u);
  assert.match(smoke, /CriOS/u);
  assert.match(smoke, /\/internal\/login/u);
  assert.match(smoke, /aria-label="Загрузка страницы"/u);
  assert.match(smoke, /runtimeErrors/u);
  assert.match(packageJson, /"qa:ios-webkit-smoke"/u);
  assert.doesNotMatch(globalStyles, /fonts\.googleapis\.com/u);
});
