import {
  documentTreeErrorCodes,
  getDocumentTreeRegistry,
  type DocumentTreeErrorCode,
  type DocumentTreeLimits
} from '@kubohiroya/turbowarp-document-data/composition';
import {PARSE_LIMITS} from './codecs.js';
import {
  StructuredDataError,
  type JsonValue,
  type StructuredDataErrorCode,
  type StructuredDataErrorDetails
} from './core.js';

/** `POSITIONS` menu values; the saved value is the visible text. */
export const DOCUMENT_TREE_POSITIONS = ['without positions', 'with positions'] as const;

/** The depth and value limits `parse JSON` applies. No text is parsed, so no byte limit applies. */
export const DOCUMENT_TREE_LIMITS: DocumentTreeLimits = Object.freeze({
  maxDepth: PARSE_LIMITS.maxDepth,
  maxNodes: PARSE_LIMITS.maxNodes
});

/**
 * Document Data failures expressed with the existing structured-data codes. The caller-side
 * `DOCUMENT_TREE_OPTIONS_INVALID` is deliberately absent: only a bug in this module could cause it,
 * so it is rethrown unchanged instead of being shown as a user error.
 */
const ERROR_CODES: Readonly<Partial<Record<DocumentTreeErrorCode, StructuredDataErrorCode>>> = {
  DOCUMENT_TREE_UNAVAILABLE: 'DATA_NOT_FOUND',
  DOCUMENT_NOT_FOUND: 'DATA_NOT_FOUND',
  DOCUMENT_TREE_PROVIDER_INVALID: 'DATA_NOT_FOUND',
  REGISTRY_SCOPE_INVALID: 'DATA_NOT_FOUND',
  REGISTRY_INCOMPATIBLE: 'DATA_NOT_FOUND',
  INVALID_LOCATION: 'INVALID_PATH',
  LOCATION_NOT_FOUND: 'PATH_NOT_FOUND',
  DOCUMENT_LIMIT_EXCEEDED: 'PARSE_LIMIT_EXCEEDED'
};

export interface DocumentTreeCopyRequest {
  /** The TurboWarp VM Document Data registers under; an absent VM reports `REGISTRY_SCOPE_INVALID`. */
  readonly scope: object | undefined;
  readonly target: object;
  readonly documentName: string;
  readonly location: string;
  readonly positions: boolean;
}

export function parseDocumentTreePositions(value: string): boolean {
  if (value === DOCUMENT_TREE_POSITIONS[0]) return false;
  if (value === DOCUMENT_TREE_POSITIONS[1]) return true;
  throw new StructuredDataError(
    'TYPE_MISMATCH',
    `POSITIONS must be "${DOCUMENT_TREE_POSITIONS[0]}" or "${DOCUMENT_TREE_POSITIONS[1]}".`
  );
}

/**
 * Copies a Document Data subtree as a plain JSON value. The shared registry is looked up on every
 * call, so it does not matter which extension loads first; when structured-data is first, this
 * creates the empty registry that Document Data registers into later.
 */
export function copyDocumentTree(request: DocumentTreeCopyRequest): JsonValue {
  const details = {documentName: request.documentName, location: request.location};
  let root: unknown;
  try {
    root = getDocumentTreeRegistry(request.scope as object).capture(
      request.target,
      request.documentName,
      {location: request.location, positions: request.positions, limits: DOCUMENT_TREE_LIMITS}
    ).root;
  } catch (error) {
    throw mapDocumentTreeError(error, details);
  }
  return ownCapturedJson(root, details);
}

/** Maps a Document Data error to a structured-data error; anything else is returned unchanged. */
export function mapDocumentTreeError(
  error: unknown,
  details: StructuredDataErrorDetails = {}
): unknown {
  const originalCode = documentTreeErrorCode(error);
  if (originalCode === undefined) return error;
  const code = ERROR_CODES[originalCode];
  if (code === undefined) return error;
  return new StructuredDataError(code, (error as Error).message, {...details, originalCode});
}

function documentTreeErrorCode(error: unknown): DocumentTreeErrorCode | undefined {
  // Each bundle (and, in tests, each realm) has its own DocumentTreeError class, so match the
  // shape instead of using instanceof.
  if (typeof error !== 'object' || error === null) return undefined;
  const {name, code} = error as {name?: unknown; code?: unknown};
  return name === 'DocumentTreeError' && (documentTreeErrorCodes as readonly unknown[]).includes(code)
    ? (code as DocumentTreeErrorCode)
    : undefined;
}

/**
 * The registry answers with whichever provider registered last, so the answer is rebuilt into plain
 * arrays and objects this extension owns, within the same limits, before it can become a binding.
 * Values are counted like the shared codec counts parsed JSON: each value once, the root at depth 0,
 * depth checked first. A cycle therefore fails as too deep.
 */
function ownCapturedJson(root: unknown, details: StructuredDataErrorDetails): JsonValue {
  let count = 0;
  const copy = (value: unknown, depth: number): JsonValue => {
    if (depth > DOCUMENT_TREE_LIMITS.maxDepth || ++count > DOCUMENT_TREE_LIMITS.maxNodes) {
      throw new StructuredDataError(
        'PARSE_LIMIT_EXCEEDED',
        `The copied tree exceeds depth ${DOCUMENT_TREE_LIMITS.maxDepth} or ${DOCUMENT_TREE_LIMITS.maxNodes} values.`,
        {...details, originalCode: 'DOCUMENT_LIMIT_EXCEEDED'}
      );
    }
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (Array.isArray(value)) return Array.from(value as unknown[], (item) => copy(item, depth + 1));
    if (typeof value === 'object') {
      // fromEntries defines own data properties, so a key such as `__proto__` stays ordinary data.
      return Object.fromEntries(
        Object.entries(value as object).map(([key, item]) => [key, copy(item, depth + 1)])
      );
    }
    throw new StructuredDataError(
      'DATA_NOT_FOUND',
      'The document tree provider returned a value that is not plain JSON.',
      {...details, originalCode: 'DOCUMENT_TREE_PROVIDER_INVALID'}
    );
  };
  return copy(root, 0);
}
