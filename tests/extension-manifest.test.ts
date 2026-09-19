import {describe, expect, it} from 'vitest';
import definitions from '../src/block-definitions.json';
import schema from '../schemas/extension-manifest.schema.json';
import {extensionConfig} from '../src/config.js';
import {
  createExtensionManifest, EXTENSION_MANIFEST_FORMAT_VERSION, serializeExtensionManifest
} from '../src/extension-manifest.js';

describe('extension compiler manifest', () => {
  it('publishes every opcode with its type, effect, errors, and IR v2 operation', () => {
    const manifest = createExtensionManifest(extensionConfig.id, definitions);
    expect(manifest.blocks).toHaveLength(16);
    for (const block of manifest.blocks) {
      expect(block.resultType).toBeTruthy();
      expect(['pure', 'immutable', 'state', 'control']).toContain(block.effect);
      expect(block.server.supported).toBe(true);
      expect(block.server.irOperation).toMatch(/^structuredData\./u);
      expect(block.errors).toEqual(expect.any(Array));
    }
    expect(manifest.pathSegmentType.variants).toEqual([
      {kind: 'key', valueType: 'string'},
      {kind: 'index', valueType: 'nonNegativeInteger'}
    ]);
    expect(manifest.dataReferenceType).toEqual({
      kind: 'named',
      scope: 'target',
      lifetime: 'untilProjectStop',
      valueType: 'jsonValue'
    });
    expect(serializeExtensionManifest(extensionConfig.id, definitions)).toBe(
      `${JSON.stringify(manifest, null, 2)}\n`
    );
  });

  it('marks path normalization and the loop static maximum requirement', () => {
    const manifest = createExtensionManifest(extensionConfig.id, definitions);
    const get = manifest.blocks.find((block) => block.opcode === 'getJsonAtPath');
    expect(get?.arguments.find((argument) => argument.id === 'PATH')?.normalizesTo).toBe(
      'pathSegments'
    );
    const loop = manifest.blocks.find((block) => block.opcode === 'forEachAtPath');
    expect(loop?.arguments.find((argument) => argument.id === 'MAX')).toMatchObject({
      staticLiteral: true, minimum: 1, maximum: 1000
    });
  });

  it('keeps the JSON Schema format version aligned', () => {
    expect(schema.properties.formatVersion.const).toBe(EXTENSION_MANIFEST_FORMAT_VERSION);
    expect(schema.$defs.argument.additionalProperties).toBe(false);
    expect(schema.$defs.argument.required).toEqual(['id', 'type']);
    expect(schema.$defs.block.properties.errors.items.enum).toContain(
      'ITERATION_CONTEXT_REQUIRED'
    );
    expect(schema.properties.pathSegmentType.properties.variants.maxItems).toBe(2);
  });

  it('rejects duplicate opcodes', () => {
    const block = definitions.blocks[0];
    expect(() => createExtensionManifest(extensionConfig.id, {blocks: [block, block]})).toThrow(
      'Duplicate block opcode'
    );
  });
});
