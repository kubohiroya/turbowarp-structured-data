import {
  createExtensionManifest,
  serializeExtensionManifest
} from '@kubohiroya/turbowarp-extension-manifest';
import {describe, expect, it} from 'vitest';
import definitions from '../src/block-definitions.json';
import extensionTypes from '../src/extension-types.json';
import {extensionConfig} from '../src/config.js';

const source = {...definitions, ...extensionTypes};
const options = {formatVersion: 2} as const;

describe('extension API manifest', () => {
  it('publishes every opcode with its type, effect, errors, and IR v2 operation', () => {
    const manifest = createExtensionManifest(extensionConfig.id, source, options);

    expect(manifest.formatVersion).toBe(2);
    expect(manifest.blocks).toHaveLength(16);
    for (const block of manifest.blocks) {
      expect(block.resultType).toBeDefined();
      expect(block.effect).toBeDefined();
      expect(block.errors).toBeDefined();
      expect(block.server?.irOperation).toMatch(/^structuredData\./u);
    }
  });

  it('describes how a compiler should read paths and data references', () => {
    const manifest = createExtensionManifest(extensionConfig.id, source, options);

    expect(manifest.pathSegmentType).toEqual(extensionTypes.pathSegmentType);
    expect(manifest.dataReferenceType).toEqual(extensionTypes.dataReferenceType);
  });

  it('marks path normalization and the loop static maximum requirement', () => {
    const manifest = createExtensionManifest(extensionConfig.id, source, options);
    const withPath = manifest.blocks.flatMap((block) =>
      block.arguments.filter((argument) => argument.normalizesTo === 'pathSegments')
    );

    expect(withPath.length).toBeGreaterThan(0);
    expect(
      manifest.blocks.flatMap((block) =>
        block.arguments.filter((argument) => argument.staticLiteral === true)
      ).length
    ).toBeGreaterThan(0);
  });

  it('serializes deterministically', () => {
    expect(serializeExtensionManifest(extensionConfig.id, source, options)).toBe(
      serializeExtensionManifest(extensionConfig.id, structuredClone(source), options)
    );
  });

  it('rejects duplicate opcodes', () => {
    expect(() =>
      createExtensionManifest(extensionConfig.id, {
        blocks: [
          {opcode: 'same', blockType: 'COMMAND'},
          {opcode: 'same', blockType: 'REPORTER'}
        ]
      })
    ).toThrow('Duplicate block opcode: same');
  });
});
