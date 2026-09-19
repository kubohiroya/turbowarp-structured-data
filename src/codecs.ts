import {
  isAlias,
  isMap,
  isScalar,
  isSeq,
  LineCounter,
  parseDocument,
  type Node as YamlNode,
  type Pair as YamlPair
} from 'yaml';
import {
  compareUnicodeCodePoints,
  parseJson,
  stringifyJson,
  StructuredDataError,
  type JsonValue
} from './core.js';

export const PARSE_LIMITS = {
  maxInputBytes: 256 * 1024,
  maxDepth: 64,
  maxNodes: 50_000
} as const;

interface ParseBudget {
  nodes: number;
}

const SIMPLE_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_-]*$/u;

export function parseJsonDocument(source: string): JsonValue {
  validateInputSize(source);
  const value = parseJson(source);
  validateValueBudget(value, {nodes: 0}, 0);
  return value;
}

export function parseYamlDocument(source: string): JsonValue {
  validateInputSize(source);
  const lineCounter = new LineCounter();
  const document = parseDocument(source, {
    lineCounter,
    prettyErrors: false,
    schema: 'core',
    uniqueKeys: true
  });
  const problem = document.errors[0] ?? document.warnings[0];
  if (problem) {
    const {line, column} = yamlPosition(lineCounter, problem.pos[0]);
    throw new StructuredDataError(
      'INVALID_YAML',
      `${problem.code} at line ${line}, column ${column}: ${problem.message}`
    );
  }
  try {
    return valueFromYamlNode(document.contents, {nodes: 0}, 0, lineCounter);
  } catch (error) {
    if (error instanceof StructuredDataError) throw error;
    throw new StructuredDataError(
      'INVALID_YAML',
      error instanceof Error ? error.message : String(error)
    );
  }
}

export function renderJsonDocument(value: JsonValue): string {
  return stringifyJson(value);
}

export function renderYamlDocument(value: JsonValue): string {
  return renderYamlValue(value, 0);
}

function valueFromYamlNode(
  node: YamlNode<unknown> | null | unknown,
  budget: ParseBudget,
  depth: number,
  lineCounter: LineCounter
): JsonValue {
  consumeBudget(budget, depth);
  if (node === null) return null;
  if (isAlias(node)) {
    throw new StructuredDataError('INVALID_YAML', 'YAML aliases are not allowed.');
  }
  if (isScalar(node)) {
    const value = node.value;
    if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'boolean' ||
      (typeof value === 'number' && Number.isFinite(value))
    ) {
      return value;
    }
    throw new StructuredDataError('INVALID_YAML', 'YAML contains an unsupported scalar value.');
  }
  if (isSeq(node)) {
    return node.items.map((item) => valueFromYamlNode(item, budget, depth + 1, lineCounter));
  }
  if (isMap(node)) {
    return Object.fromEntries(
      node.items.map((item) => yamlPairToEntry(item, budget, depth, lineCounter))
    );
  }
  throw new StructuredDataError('INVALID_YAML', 'YAML contains an unsupported node type.');
}

function yamlPairToEntry(
  pair: YamlPair,
  budget: ParseBudget,
  depth: number,
  lineCounter: LineCounter
): [string, JsonValue] {
  if (!isScalar(pair.key) || typeof pair.key.value !== 'string') {
    throw new StructuredDataError('INVALID_YAML', 'YAML map keys must be strings.');
  }
  return [pair.key.value, valueFromYamlNode(pair.value, budget, depth + 1, lineCounter)];
}

function validateValueBudget(value: JsonValue, budget: ParseBudget, depth: number): void {
  consumeBudget(budget, depth);
  if (Array.isArray(value)) {
    for (const item of value) validateValueBudget(item, budget, depth + 1);
  } else if (typeof value === 'object' && value !== null) {
    for (const item of Object.values(value)) validateValueBudget(item, budget, depth + 1);
  }
}

function consumeBudget(budget: ParseBudget, depth: number): void {
  if (depth > PARSE_LIMITS.maxDepth) {
    throw new StructuredDataError(
      'PARSE_LIMIT_EXCEEDED',
      `Data exceeds maximum nesting depth ${PARSE_LIMITS.maxDepth}.`
    );
  }
  budget.nodes += 1;
  if (budget.nodes > PARSE_LIMITS.maxNodes) {
    throw new StructuredDataError(
      'PARSE_LIMIT_EXCEEDED',
      `Data exceeds maximum node count ${PARSE_LIMITS.maxNodes}.`
    );
  }
}

function validateInputSize(source: string): void {
  const bytes = new TextEncoder().encode(source).byteLength;
  if (bytes > PARSE_LIMITS.maxInputBytes) {
    throw new StructuredDataError(
      'PARSE_LIMIT_EXCEEDED',
      `Input is ${bytes} bytes; maximum is ${PARSE_LIMITS.maxInputBytes}.`
    );
  }
}

function renderYamlValue(value: JsonValue, indent: number): string {
  if (isObject(value)) {
    const entries = Object.keys(value).sort(compareUnicodeCodePoints);
    if (entries.length === 0) return `${spaces(indent)}{}`;
    return entries
      .map((key) => renderValuePair(key, value[key] as JsonValue, indent))
      .join('\n');
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return `${spaces(indent)}[]`;
    return value.map((item) => renderSequenceItem(item, indent)).join('\n');
  }
  return `${spaces(indent)}${renderScalar(value)}`;
}

function renderValuePair(key: string, value: JsonValue, indent: number): string {
  const prefix = `${spaces(indent)}${renderKey(key)}:`;
  if (!isObject(value) && !Array.isArray(value)) return `${prefix} ${renderScalar(value)}`;
  return `${prefix}\n${renderYamlValue(value, indent + 2)}`;
}

function renderSequenceItem(value: JsonValue, indent: number): string {
  const prefix = `${spaces(indent)}-`;
  if (!isObject(value) && !Array.isArray(value)) return `${prefix} ${renderScalar(value)}`;
  return `${prefix}\n${renderYamlValue(value, indent + 2)}`;
}

function renderKey(key: string): string {
  return SIMPLE_KEY_PATTERN.test(key) ? key : JSON.stringify(key);
}

function renderScalar(value: null | boolean | number | string): string {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  return JSON.stringify(value);
}

function isObject(value: JsonValue): value is {[key: string]: JsonValue} {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function yamlPosition(counter: LineCounter, offset: number): {line: number; column: number} {
  const position = counter.linePos(offset);
  return {line: position.line, column: position.col};
}

function spaces(count: number): string {
  return ' '.repeat(count);
}
