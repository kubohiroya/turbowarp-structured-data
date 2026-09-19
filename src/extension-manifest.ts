import type {Plugin} from 'vite';

export const EXTENSION_MANIFEST_FORMAT_VERSION = 3 as const;

export interface ExtensionManifestArgument {
  id: string;
  type: string;
  normalizesTo?: 'pathSegments';
  staticLiteral?: boolean;
  minimum?: number;
  maximum?: number;
}

export interface ExtensionManifestBlock {
  opcode: string;
  blockType: string;
  arguments: ExtensionManifestArgument[];
  resultType: string;
  effect: 'pure' | 'immutable' | 'state' | 'control';
  immutable: boolean;
  errors: string[];
  server: {supported: boolean; irOperation: string};
}

export interface ExtensionManifest {
  formatVersion: typeof EXTENSION_MANIFEST_FORMAT_VERSION;
  id: string;
  pathSegmentType: {
    kind: 'discriminatedUnion';
    variants: Array<{kind: 'key' | 'index'; valueType: 'string' | 'nonNegativeInteger'}>;
  };
  dataReferenceType: {
    kind: 'named';
    scope: 'target';
    lifetime: 'untilProjectStop';
    valueType: 'jsonValue';
  };
  blocks: ExtensionManifestBlock[];
}

export interface ExtensionManifestPluginOptions {
  id: string;
  definitions: unknown;
  fileName?: string;
}

export function createExtensionManifest(id: string, definitions: unknown): ExtensionManifest {
  if (!/^[a-z0-9]+$/.test(id)) {
    throw new TypeError('Extension manifest ID must contain only lowercase letters and numbers.');
  }
  const source = requireRecord(definitions, 'Block definitions');
  if (!Array.isArray(source.blocks)) {
    throw new TypeError('Block definitions must contain a blocks array.');
  }
  const seenOpcodes = new Set<string>();
  const blocks = source.blocks.map((block, index) => {
    const normalized = normalizeBlock(block, index);
    if (seenOpcodes.has(normalized.opcode)) {
      throw new TypeError(`Duplicate block opcode: ${normalized.opcode}`);
    }
    seenOpcodes.add(normalized.opcode);
    return normalized;
  });
  return {
    formatVersion: EXTENSION_MANIFEST_FORMAT_VERSION,
    id,
    pathSegmentType: {
      kind: 'discriminatedUnion',
      variants: [
        {kind: 'key', valueType: 'string'},
        {kind: 'index', valueType: 'nonNegativeInteger'}
      ]
    },
    dataReferenceType: {
      kind: 'named',
      scope: 'target',
      lifetime: 'untilProjectStop',
      valueType: 'jsonValue'
    },
    blocks: blocks.sort((left, right) => compareIds(left.opcode, right.opcode))
  };
}

export function serializeExtensionManifest(id: string, definitions: unknown): string {
  return `${JSON.stringify(createExtensionManifest(id, definitions), null, 2)}\n`;
}

export function extensionManifestPlugin(options: ExtensionManifestPluginOptions): Plugin {
  return {
    name: 'extension-api-manifest',
    apply: 'build',
    enforce: 'post',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: options.fileName ?? 'extension-manifest.json',
        source: serializeExtensionManifest(options.id, options.definitions)
      });
    }
  };
}

function normalizeBlock(value: unknown, index: number): ExtensionManifestBlock {
  const block = requireRecord(value, `Block at index ${index}`);
  const opcode = requireNonEmptyString(block.opcode, `Block at index ${index} opcode`);
  const argumentRecord = requireRecord(block.arguments ?? {}, `Block ${opcode} arguments`);
  const argumentsList = Object.entries(argumentRecord).map(([id, value]) => {
    const argument = requireRecord(value, `Block ${opcode} argument ${id}`);
    const result: ExtensionManifestArgument = {
      id: requireNonEmptyString(id, `Block ${opcode} argument ID`),
      type: requireNonEmptyString(argument.type, `Block ${opcode} argument ${id} type`)
    };
    if (argument.normalizesTo !== undefined) {
      if (argument.normalizesTo !== 'pathSegments') {
        throw new TypeError(`Block ${opcode} argument ${id} has an unknown normalized type.`);
      }
      result.normalizesTo = argument.normalizesTo;
    }
    if (argument.staticLiteral !== undefined) result.staticLiteral = requireBoolean(argument.staticLiteral, `${opcode}.${id}.staticLiteral`);
    if (argument.minimum !== undefined) result.minimum = requireNumber(argument.minimum, `${opcode}.${id}.minimum`);
    if (argument.maximum !== undefined) result.maximum = requireNumber(argument.maximum, `${opcode}.${id}.maximum`);
    return result;
  });
  const server = requireRecord(block.server, `Block ${opcode} server contract`);
  const effect = block.effect;
  if (
    effect !== 'pure' &&
    effect !== 'immutable' &&
    effect !== 'state' &&
    effect !== 'control'
  ) {
    throw new TypeError(`Block ${opcode} must define a supported effect.`);
  }
  if (!Array.isArray(block.errors) || !block.errors.every((code) => typeof code === 'string')) {
    throw new TypeError(`Block ${opcode} errors must be an array of strings.`);
  }
  return {
    opcode,
    blockType: requireNonEmptyString(block.blockType, `Block ${opcode} blockType`),
    arguments: argumentsList.sort((left, right) => compareIds(left.id, right.id)),
    resultType: requireNonEmptyString(block.resultType, `Block ${opcode} resultType`),
    effect,
    immutable: requireBoolean(block.immutable, `Block ${opcode} immutable`),
    errors: [...block.errors],
    server: {
      supported: requireBoolean(server.supported, `Block ${opcode} server.supported`),
      irOperation: requireNonEmptyString(server.irOperation, `Block ${opcode} server.irOperation`)
    }
  };
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function requireNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0) throw new TypeError(`${label} must be a non-empty string.`);
  return value;
}

function requireBoolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') throw new TypeError(`${label} must be a boolean.`);
  return value;
}

function requireNumber(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(`${label} must be a finite number.`);
  return value;
}

function compareIds(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
