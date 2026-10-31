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
    expect(manifest.blocks).toHaveLength(28);
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

  it('declares the text and current-path reporters beside their JSON counterparts', () => {
    const manifest = createExtensionManifest(extensionConfig.id, source, options);
    const block = (opcode: string) => {
      const found = manifest.blocks.find((candidate) => candidate.opcode === opcode);
      if (!found) throw new Error(`Missing ${opcode}`);
      return found;
    };
    const path = {id: 'PATH', type: 'STRING', normalizesTo: 'pathSegments'};
    const pathErrors = ['INVALID_PATH', 'PATH_NOT_FOUND', 'TYPE_MISMATCH', 'INDEX_OUT_OF_RANGE'];

    expect(block('getTextAtPath')).toMatchObject({
      blockType: 'REPORTER',
      arguments: block('getJsonAtPath').arguments,
      resultType: 'string',
      effect: 'pure',
      immutable: true,
      errors: block('getJsonAtPath').errors,
      server: {supported: true, irOperation: 'structuredData.getText'}
    });
    for (const [opcode, resultType, irOperation] of [
      ['currentJsonAtPath', 'jsonText', 'structuredData.currentGet'],
      ['currentTextAtPath', 'string', 'structuredData.currentGetText']
    ] as const) {
      expect(block(opcode)).toMatchObject({
        blockType: 'REPORTER',
        arguments: [path],
        resultType,
        effect: block('currentValueJson').effect,
        immutable: true,
        errors: ['ITERATION_CONTEXT_REQUIRED', ...pathErrors],
        server: {supported: true, irOperation}
      });
    }
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
