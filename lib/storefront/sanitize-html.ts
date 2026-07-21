const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li",
  "h2", "h3", "h4", "blockquote", "table", "thead", "tbody", "tr", "th", "td",
]);

const VOID_TAGS = new Set(["br"]);

function escapeText(value: string) {
  return value.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function sanitizeStorefrontHtml(value: string): string {
  const withoutDangerousBlocks = value
    .replace(/<!--[^]*?-->/gu, "")
    .replace(/<(script|style|iframe|object|embed|svg|math|form|template)\b[^>]*>[^]*?<\/\1\s*>/giu, "");

  const sanitized = withoutDangerousBlocks
    .split(/(<[^>]*>)/gu)
    .map((token) => {
      if (!token.startsWith("<")) return escapeText(token);
      const match = token.match(/^<\s*(\/?)\s*([a-z0-9]+)(?:\s[^>]*)?\s*\/?>$/iu);
      if (!match) return "";
      const [, closing, rawTag] = match;
      const tag = rawTag.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) return "";
      if (VOID_TAGS.has(tag)) return `<${tag}>`;
      return closing ? `</${tag}>` : `<${tag}>`;
    })
    .join("")
    .replace(/<b>/giu, "<strong>")
    .replace(/<\/b>/giu, "</strong>")
    .replace(/<strong>\s*<strong>/giu, "<strong>")
    .replace(/<\/strong>\s*<\/strong>/giu, "</strong>")
    .replace(/<p>(?:\s|&nbsp;|<br>)*<\/p>/giu, "")
    .replace(/<li>(?:\s|&nbsp;|<br>)*<\/li>/giu, "")
    .replace(/<(ul|ol)>(?:\s|<br>)*<\/\1>/giu, "");

  return removeAdjacentDuplicateHeadings(sanitized).trim();
}

function removeAdjacentDuplicateHeadings(value: string) {
  return value.replace(
    /(<h([2-4])>([^]*?)<\/h\2>)(?:\s|<br>)*(<h\2>\3<\/h\2>)/giu,
    "$1",
  );
}
