export const STRUCTURED_DATA_ERROR_CODES = [
  'INVALID_JSON',
  'INVALID_YAML',
  'INVALID_NAME',
  'DATA_NOT_FOUND',
  'INVALID_PATH',
  'PATH_NOT_FOUND',
  'TYPE_MISMATCH',
  'INDEX_OUT_OF_RANGE',
  'ITERATION_LIMIT_EXCEEDED',
  'ITERATION_CONTEXT_REQUIRED',
  'PARSE_LIMIT_EXCEEDED'
] as const;

export type StructuredDataErrorCode = (typeof STRUCTURED_DATA_ERROR_CODES)[number];
export type JsonPrimitive = null | boolean | number | string;
export type JsonValue = JsonPrimitive | JsonValue[] | {[key: string]: JsonValue};
export type PathSegment = {kind: 'key'; value: string} | {kind: 'index'; value: number};

export class StructuredDataError extends Error {
  public readonly code: StructuredDataErrorCode;

  public constructor(code: StructuredDataErrorCode, message: string) {
    super(`${code}: ${message}`);
    this.name = 'StructuredDataError';
    this.code = code;
  }
}

export function parseJson(text: unknown): JsonValue {
  try {
    const value: unknown = JSON.parse(String(text));
    assertJsonValue(value);
    return value;
  } catch (error) {
    if (error instanceof StructuredDataError) throw error;
    throw new StructuredDataError('INVALID_JSON', 'Input must be valid JSON.');
  }
}

export function isValidJson(text: unknown): boolean {
  try {
    parseJson(text);
    return true;
  } catch {
    return false;
  }
}

export function normalizeJson(text: unknown): string {
  return stringifyJson(parseJson(text));
}

export function stringifyJson(value: JsonValue): string {
  if (Array.isArray(value)) return `[${value.map(stringifyJson).join(',')}]`;
  if (isJsonObject(value)) {
    return `{${Object.keys(value)
      .sort(compareUnicodeCodePoints)
      .map((key) => `${JSON.stringify(key)}:${stringifyJson(value[key] as JsonValue)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export function parsePath(input: unknown): PathSegment[] {
  const path = String(input);
  if (!path.startsWith('$')) invalidPath();
  const segments: PathSegment[] = [];
  let cursor = 1;

  while (cursor < path.length) {
    if (path[cursor] === '.') {
      const match = /^[A-Za-z_][A-Za-z0-9_]*/u.exec(path.slice(cursor + 1));
      if (!match) invalidPath();
      segments.push({kind: 'key', value: match[0]});
      cursor += match[0].length + 1;
      continue;
    }

    if (path[cursor] !== '[') invalidPath();
    cursor += 1;
    if (path[cursor] === '"') {
      const end = scanJsonString(path, cursor);
      let key: unknown;
      try {
        key = JSON.parse(path.slice(cursor, end));
      } catch {
        invalidPath();
      }
      if (typeof key !== 'string' || path[end] !== ']') invalidPath();
      segments.push({kind: 'key', value: key});
      cursor = end + 1;
      continue;
    }

    const match = /^(0|[1-9][0-9]*)\]/u.exec(path.slice(cursor));
    if (!match) invalidPath();
    const index = Number(match[1]);
    if (!Number.isSafeInteger(index)) invalidPath();
    segments.push({kind: 'index', value: index});
    cursor += match[0].length;
  }

  return segments;
}

export function getAtPath(root: JsonValue, segments: readonly PathSegment[]): JsonValue {
  let current = root;
  for (const segment of segments) current = readSegment(current, segment);
  return current;
}

export function hasAtPath(root: JsonValue, segments: readonly PathSegment[]): boolean {
  try {
    getAtPath(root, segments);
    return true;
  } catch (error) {
    if (
      error instanceof StructuredDataError &&
      (error.code === 'PATH_NOT_FOUND' || error.code === 'INDEX_OUT_OF_RANGE')
    ) {
      return false;
    }
    throw error;
  }
}

export function setAtPath(
  root: JsonValue,
  segments: readonly PathSegment[],
  replacement: JsonValue
): JsonValue {
  if (segments.length === 0) return cloneJson(replacement);
  return updateParent(root, segments, (parent, segment) => {
    if (segment.kind === 'key') {
      if (!isJsonObject(parent)) typeMismatch('Object path segment requires an object.');
      return {...parent, [segment.value]: cloneJson(replacement)};
    }
    if (!Array.isArray(parent)) typeMismatch('Index path segment requires an array.');
    if (segment.value >= parent.length) indexOutOfRange();
    const result = parent.slice();
    result[segment.value] = cloneJson(replacement);
    return result;
  });
}

export function deleteAtPath(root: JsonValue, segments: readonly PathSegment[]): JsonValue {
  if (segments.length === 0) {
    throw new StructuredDataError('INVALID_PATH', 'The root value cannot be deleted.');
  }
  return updateParent(root, segments, (parent, segment) => {
    if (segment.kind === 'key') {
      if (!isJsonObject(parent)) typeMismatch('Object path segment requires an object.');
      if (!Object.hasOwn(parent, segment.value)) pathNotFound();
      const result = {...parent};
      delete result[segment.value];
      return result;
    }
    if (!Array.isArray(parent)) typeMismatch('Index path segment requires an array.');
    if (segment.value >= parent.length) indexOutOfRange();
    const result = parent.slice();
    result.splice(segment.value, 1);
    return result;
  });
}

export function keysAtPath(root: JsonValue, segments: readonly PathSegment[]): string[] {
  const value = getAtPath(root, segments);
  if (!isJsonObject(value)) typeMismatch('Keys require an object.');
  return Object.keys(value).sort(compareUnicodeCodePoints);
}

export function lengthAtPath(root: JsonValue, segments: readonly PathSegment[]): number {
  const value = getAtPath(root, segments);
  if (!Array.isArray(value)) typeMismatch('Length requires an array.');
  return value.length;
}

export interface IterationEntry {
  key: string;
  value: JsonValue;
}

export function iterationEntries(
  root: JsonValue,
  segments: readonly PathSegment[],
  maximum: number
): IterationEntry[] {
  if (!Number.isInteger(maximum) || maximum < 1 || maximum > 1000) {
    throw new StructuredDataError('ITERATION_LIMIT_EXCEEDED', 'Maximum must be from 1 to 1000.');
  }
  const value = getAtPath(root, segments);
  const entries = Array.isArray(value)
    ? value.map((item, index) => ({key: String(index), value: item}))
    : isJsonObject(value)
      ? Object.keys(value)
          .sort(compareUnicodeCodePoints)
          .map((key) => ({key, value: value[key] as JsonValue}))
      : typeMismatch('Iteration requires an array or object.');
  if (entries.length > maximum) {
    throw new StructuredDataError(
      'ITERATION_LIMIT_EXCEEDED',
      `Collection contains ${entries.length} items, above maximum ${maximum}.`
    );
  }
  return entries;
}

function updateParent(
  root: JsonValue,
  segments: readonly PathSegment[],
  update: (parent: JsonValue, segment: PathSegment) => JsonValue
): JsonValue {
  const [segment, ...remaining] = segments;
  if (!segment) return root;
  if (remaining.length === 0) return update(root, segment);
  const child = readSegment(root, segment);
  const next = updateParent(child, remaining, update);
  if (segment.kind === 'key') {
    if (!isJsonObject(root)) typeMismatch('Object path segment requires an object.');
    return {...root, [segment.value]: next};
  }
  if (!Array.isArray(root)) typeMismatch('Index path segment requires an array.');
  const result = root.slice();
  result[segment.value] = next;
  return result;
}

function readSegment(value: JsonValue, segment: PathSegment): JsonValue {
  if (segment.kind === 'key') {
    if (!isJsonObject(value)) typeMismatch('Object path segment requires an object.');
    if (!Object.hasOwn(value, segment.value)) pathNotFound();
    return value[segment.value] as JsonValue;
  }
  if (!Array.isArray(value)) typeMismatch('Index path segment requires an array.');
  if (segment.value >= value.length) indexOutOfRange();
  return value[segment.value] as JsonValue;
}

function cloneJson(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(cloneJson);
  if (isJsonObject(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .map((key) => [key, cloneJson(value[key] as JsonValue)])
    );
  }
  return value;
}

function assertJsonValue(value: unknown): asserts value is JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number' && Number.isFinite(value)) return;
  if (Array.isArray(value)) {
    for (const item of value) assertJsonValue(item);
    return;
  }
  if (typeof value === 'object') {
    for (const item of Object.values(value)) assertJsonValue(item);
    return;
  }
  throw new StructuredDataError('INVALID_JSON', 'JSON contains an unsupported value.');
}

function isJsonObject(value: JsonValue): value is {[key: string]: JsonValue} {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function scanJsonString(path: string, start: number): number {
  let escaped = false;
  for (let index = start + 1; index < path.length; index += 1) {
    const character = path[index];
    if (escaped) {
      escaped = false;
    } else if (character === '\\') {
      escaped = true;
    } else if (character === '"') {
      return index + 1;
    }
  }
  invalidPath();
}

export function compareUnicodeCodePoints(left: string, right: string): number {
  const leftPoints = Array.from(left, (character) => character.codePointAt(0) as number);
  const rightPoints = Array.from(right, (character) => character.codePointAt(0) as number);
  const length = Math.min(leftPoints.length, rightPoints.length);
  for (let index = 0; index < length; index += 1) {
    const difference = (leftPoints[index] as number) - (rightPoints[index] as number);
    if (difference !== 0) return difference;
  }
  return leftPoints.length - rightPoints.length;
}

function invalidPath(): never {
  throw new StructuredDataError('INVALID_PATH', 'Path does not match the supported syntax.');
}

function pathNotFound(): never {
  throw new StructuredDataError('PATH_NOT_FOUND', 'Path does not exist.');
}

function typeMismatch(message: string): never {
  throw new StructuredDataError('TYPE_MISMATCH', message);
}

function indexOutOfRange(): never {
  throw new StructuredDataError('INDEX_OUT_OF_RANGE', 'Array index is out of range.');
}
