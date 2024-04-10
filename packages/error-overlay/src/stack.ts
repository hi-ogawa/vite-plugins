// copied from
// https://github.com/vitest-dev/vitest/blame/d4003882a05b65754f7000280cef2884e957d333/packages/utils/src/source-map.ts#L22-L31

interface ParsedStack {
  method: string;
  file: string;
  line: number;
  column: number;
}

const CHROME_IE_STACK_REGEXP = /^\s*at .*(\S+:\d+|\(native\))/m;
const SAFARI_NATIVE_CODE_REGEXP = /^(eval@)?(\[native code])?$/;

function extractLocation(urlLike: string) {
  // Fail-fast but return locations like "(native)"
  if (!urlLike.includes(":")) return [urlLike];

  const regExp = /(.+?)(?::(\d+))?(?::(\d+))?$/;
  const parts = regExp.exec(urlLike.replace(/^\(|\)$/g, ""));
  if (!parts) return [urlLike];
  let url = parts[1]!;
  if (url.startsWith("http:") || url.startsWith("https:")) {
    const urlObj = new URL(url);
    url = urlObj.pathname;
  }
  if (url.startsWith("/@fs/")) {
    url = url.slice(
      typeof process !== "undefined" && process.platform === "win32" ? 5 : 4,
    );
  }
  return [url, parts[2] || undefined, parts[3] || undefined];
}

function parseSingleFFOrSafariStack(raw: string): ParsedStack | null {
  let line = raw.trim();

  if (SAFARI_NATIVE_CODE_REGEXP.test(line)) return null;

  if (line.includes(" > eval"))
    line = line.replace(
      / line (\d+)(?: > eval line \d+)* > eval:\d+:\d+/g,
      ":$1",
    );

  if (!line.includes("@") && !line.includes(":")) return null;

  const functionNameRegex = /((.*".+"[^@]*)?[^@]*)(?:@)/;
  const matches = line.match(functionNameRegex);
  const functionName = matches && matches[1] ? matches[1] : undefined;
  const [url, lineNumber, columnNumber] = extractLocation(
    line.replace(functionNameRegex, ""),
  );

  if (!url || !lineNumber || !columnNumber) return null;

  return {
    file: url,
    method: functionName || "",
    line: Number.parseInt(lineNumber),
    column: Number.parseInt(columnNumber),
  };
}

// Based on https://github.com/stacktracejs/error-stack-parser
// Credit to stacktracejs
function parseSingleV8Stack(raw: string): ParsedStack | null {
  let line = raw.trim();

  if (!CHROME_IE_STACK_REGEXP.test(line)) return null;

  if (line.includes("(eval "))
    line = line
      .replace(/eval code/g, "eval")
      .replace(/(\(eval at [^()]*)|(,.*$)/g, "");

  let sanitizedLine = line
    .replace(/^\s+/, "")
    .replace(/\(eval code/g, "(")
    .replace(/^.*?\s+/, "");

  // capture and preserve the parenthesized location "(/foo/my bar.js:12:87)" in
  // case it has spaces in it, as the string is split on \s+ later on
  const location = sanitizedLine.match(/ (\(.+\)$)/);

  // remove the parenthesized location from the line, if it was matched
  sanitizedLine = location
    ? sanitizedLine.replace(location[0], "")
    : sanitizedLine;

  // if a location was matched, pass it to extractLocation() otherwise pass all sanitizedLine
  // because this line doesn't have function name
  const [url, lineNumber, columnNumber] = extractLocation(
    location ? location[1]! : sanitizedLine,
  );
  let method = (location && sanitizedLine) || "";
  let file = url && ["eval", "<anonymous>"].includes(url) ? undefined : url;

  if (!file || !lineNumber || !columnNumber) return null;

  if (method.startsWith("async ")) method = method.slice(6);

  if (file.startsWith("file://")) file = file.slice(7);

  return {
    method,
    file,
    line: Number.parseInt(lineNumber),
    column: Number.parseInt(columnNumber),
  };
}

export function parseStacktrace(stack: string): ParsedStack[] {
  return !CHROME_IE_STACK_REGEXP.test(stack)
    ? parseFFOrSafariStackTrace(stack)
    : parseV8Stacktrace(stack);
}

function parseFFOrSafariStackTrace(stack: string): ParsedStack[] {
  return stack
    .split("\n")
    .map((line) => parseSingleFFOrSafariStack(line))
    .filter(typedBoolean);
}

function parseV8Stacktrace(stack: string): ParsedStack[] {
  return stack
    .split("\n")
    .map((line) => parseSingleV8Stack(line))
    .filter(typedBoolean);
}

const typedBoolean = Boolean as unknown as <T>(
  value: T,
) => value is Exclude<T, null | undefined>;
