import type { Filters } from "../../types";
import type { DataFrameDescription } from "pret";

// Convert table filter text to expressions used by PRET queries
type Predicate = {
  kind: "predicate";
  column: string;
  operator: string;
  value?: unknown;
};

function parseLiteral(text: string, type: string): unknown {
  const value = text.trim().replace(/^(['"])(.*)\1$/, "$2");
  if (/bool/i.test(type)) {
    if (/^(true|t)$/i.test(value)) return true;
    if (/^(false|f)$/i.test(value)) return false;
    throw new Error("Boolean filters require true or false, or t or f");
  }
  if (/int|float|double|decimal/i.test(type) && value !== "") {
    const number = Number(value);
    // Send large integer and decimal filter values as text so JavaScript does not round them
    if (/decimal/i.test(type) || (/int/i.test(type) && !Number.isSafeInteger(number))) return value;
    if (Number.isFinite(number)) return number;
  }
  return value;
}

function parseFilter(column: { name: string; type: string }, text: string): Predicate | null {
  const input = text.trim();
  if (!input) return null;
  if (/^is\s+null$/i.test(input)) {
    return { kind: "predicate", column: column.name, operator: "is_null" };
  }
  if (/^is\s+not\s+null$/i.test(input)) {
    return { kind: "predicate", column: column.name, operator: "is_not_null" };
  }
  const inMatch = input.match(/^in\s*\((.*)\)$/i);
  if (inMatch) {
    return {
      kind: "predicate",
      column: column.name,
      operator: "in",
      value: inMatch[1].split(",").map((value) => parseLiteral(value, column.type)),
    };
  }
  const named = input.match(/^(contains|starts\s+with|ends\s+with)\s+(.+)$/i);
  if (named) {
    return {
      kind: "predicate",
      column: column.name,
      operator: named[1].toLowerCase().replace(/\s+/g, "_"),
      value: parseLiteral(named[2], column.type),
    };
  }
  const comparison = input.match(/^(==|!=|<>|<=|>=|=|<|>)\s*(.+)$/);
  if (!comparison) {
    // Bare text searches text columns and matches other values exactly
    return {
      kind: "predicate",
      column: column.name,
      operator: /string|utf8/i.test(column.type) ? "contains" : "eq",
      value: parseLiteral(input, column.type),
    };
  }
  const operators: Record<string, string> = {
    "=": "eq",
    "==": "eq",
    "!=": "ne",
    "<>": "ne",
    "<": "lt",
    "<=": "lte",
    ">": "gt",
    ">=": "gte",
  };
  return {
    kind: "predicate",
    column: column.name,
    operator: operators[comparison[1]],
    value: parseLiteral(comparison[2], column.type),
  };
}

export function filterAst(description: DataFrameDescription, filters: Filters): unknown {
  const values = description.columns
    .map((column) => parseFilter(column, String(filters?.[column.name] ?? "")))
    .filter((value): value is Predicate => value !== null);
  if (values.length === 0) return null;
  return values.length === 1 ? values[0] : { kind: "and", children: values };
}
