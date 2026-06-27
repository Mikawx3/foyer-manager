const MAX_AMOUNT = 999_999_999.99;

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatAmountForInput(value: number): string {
  if (!Number.isFinite(value)) {
    return "";
  }
  return String(roundMoney(value));
}

/** True when the input contains arithmetic operators (not just a plain number). */
export function hasAmountExpression(input: string): boolean {
  const compact = input.replace(/\s+/g, "");
  if (/[+*/]/.test(compact)) {
    return true;
  }
  return /\d[\d.]*\s*-\s*\d/.test(input);
}

export function evaluateAmountExpression(input: string): number | null {
  const compact = input.trim().replace(/\s+/g, "");
  if (!compact) {
    return null;
  }

  if (!/^[\d.+\-*/()]+$/.test(compact)) {
    return null;
  }

  try {
    const { value, index } = parseExpression(compact, 0);
    if (index !== compact.length) {
      return null;
    }
    if (!Number.isFinite(value) || value <= 0 || value > MAX_AMOUNT) {
      return null;
    }
    return roundMoney(value);
  } catch {
    return null;
  }
}

type ParseResult = { value: number; index: number };

function parseExpression(src: string, index: number): ParseResult {
  let left = parseTerm(src, index);
  let cursor = left.index;

  while (cursor < src.length) {
    const operator = src[cursor];
    if (operator !== "+" && operator !== "-") {
      break;
    }
    const right = parseTerm(src, cursor + 1);
    left = {
      value: operator === "+" ? left.value + right.value : left.value - right.value,
      index: right.index,
    };
    cursor = left.index;
  }

  return left;
}

function parseTerm(src: string, index: number): ParseResult {
  let left = parseFactor(src, index);
  let cursor = left.index;

  while (cursor < src.length) {
    const operator = src[cursor];
    if (operator !== "*" && operator !== "/") {
      break;
    }
    const right = parseFactor(src, cursor + 1);
    if (operator === "/" && right.value === 0) {
      throw new Error("division by zero");
    }
    left = {
      value: operator === "*" ? left.value * right.value : left.value / right.value,
      index: right.index,
    };
    cursor = left.index;
  }

  return left;
}

function parseFactor(src: string, index: number): ParseResult {
  if (src[index] === "-") {
    const inner = parseFactor(src, index + 1);
    return { value: -inner.value, index: inner.index };
  }

  if (src[index] === "(") {
    const inner = parseExpression(src, index + 1);
    if (src[inner.index] !== ")") {
      throw new Error("missing closing parenthesis");
    }
    return { value: inner.value, index: inner.index + 1 };
  }

  return parseNumber(src, index);
}

function parseNumber(src: string, index: number): ParseResult {
  let cursor = index;
  let dotCount = 0;

  while (cursor < src.length && /[\d.]/.test(src[cursor])) {
    if (src[cursor] === ".") {
      dotCount += 1;
      if (dotCount > 1) {
        throw new Error("invalid number");
      }
    }
    cursor += 1;
  }

  if (cursor === index) {
    throw new Error("expected number");
  }

  const value = Number(src.slice(index, cursor));
  if (!Number.isFinite(value)) {
    throw new Error("invalid number");
  }

  return { value, index: cursor };
}
