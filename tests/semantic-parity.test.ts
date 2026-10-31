import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import * as namedFunctions from '@kubohiroya/turbowarp-named-functions/composition';
import fixture from './fixtures/semantic-parity.json';
import schemaFixture from './fixtures/schema-parity.json';
import definitions from '../src/block-definitions.json';
import {StructuredDataExtension} from '../src/extension.js';
import {renderYamlDocument} from '../src/codecs.js';
import {parsePath, stringifyJson, type JsonValue} from '../src/core.js';
import {SCHEMA_SUBSET_KEYWORDS} from '../src/schema.js';
import type {ScratchBlockUtility} from '../src/runtime-api.js';

/** A reporter read after parsing and, optionally, after entering nested loops at given entries. */
interface ReadCase {
  name: string;
  format: string;
  text: string;
  dataName: string;
  loops?: Array<{path: string; entry: number}>;
  operation: string;
  readName?: string;
  path: string;
  expectedJson?: string;
  expectedText?: string;
  error?: string;
}

const blockByOperation = new Map(
  definitions.blocks
    .filter((block) => block.server.supported)
    .map((block) => [block.server.irOperation, block])
);

beforeEach(() => {
  vi.stubGlobal('Scratch', {
    Cast: {toString: String, toNumber: Number},
    BlockType: {}, ArgumentType: {}, translate: String,
    vm: {runtime: {on: vi.fn()}}
  });
});
afterEach(() => vi.unstubAllGlobals());

describe('browser/server semantic parity fixture', () => {
  it('matches namespace, codec, typed path, and error semantics', () => {
    for (const testCase of fixture.cases) {
      const extension = new StructuredDataExtension(Scratch, true);
      const util = {target: {}, thread: {}, stackFrame: {}, startBranch: vi.fn()};
      const invoke = () => {
        if (testCase.format === 'json') {
          extension.parseJson({TEXT: testCase.text, NAME: testCase.dataName}, util);
        } else {
          extension.parseYaml({TEXT: testCase.text, NAME: testCase.dataName}, util);
        }
        if ('normalizedPath' in testCase) {
          expect(parsePath(testCase.path)).toEqual(testCase.normalizedPath);
          extension.setJsonAtPath(
            {NAME: testCase.dataName, PATH: testCase.path, VALUE: testCase.setJson},
            util
          );
        }
        return extension.toJson({NAME: testCase.dataName}, util);
      };
      if ('error' in testCase) {
        expect(invoke).toThrowError(expect.objectContaining({code: testCase.error}));
      } else {
        expect(invoke()).toBe(testCase.expectedJson);
      }
    }
  });

  it('reads text and current-entry paths with the same results and errors', () => {
    for (const testCase of fixture.readCases as readonly ReadCase[]) {
      const label = testCase.name;
      const extension = new StructuredDataExtension(Scratch, true);
      const target = {};
      const thread = {};
      const util = () => ({target, thread, stackFrame: {}, startBranch: vi.fn()});
      const setup = util();
      if (testCase.format === 'json') {
        extension.parseJson({TEXT: testCase.text, NAME: testCase.dataName}, setup);
      } else {
        extension.parseYaml({TEXT: testCase.text, NAME: testCase.dataName}, setup);
      }
      // Each loop level keeps its own frame on the shared thread, as nested TurboWarp loops do.
      for (const loop of testCase.loops ?? []) {
        const frame = util();
        for (let step = 0; step <= loop.entry; step += 1) {
          extension.forEachAtPath({NAME: testCase.dataName, PATH: loop.path, MAX: 100}, frame);
        }
        expect(frame.startBranch, label).toHaveBeenCalledTimes(loop.entry + 1);
      }
      const block = blockByOperation.get(testCase.operation);
      if (!block) throw new Error(`${label}: unknown operation ${testCase.operation}`);
      const read = () =>
        readAt(
          extension,
          block.opcode,
          {NAME: testCase.readName ?? testCase.dataName, PATH: testCase.path},
          util()
        );
      if (testCase.error !== undefined) {
        expect(block.errors, label).toContain(testCase.error);
        expect(read, label).toThrowError(expect.objectContaining({code: testCase.error}));
      } else {
        const expected = block.resultType === 'string' ? testCase.expectedText : testCase.expectedJson;
        expect(expected, label).toBeTypeOf('string');
        expect(read(), label).toBe(expected);
      }
    }
  });

  it('names the browser-only blocks a server adapter must reject', () => {
    const unsupported = definitions.blocks.filter((block) => !block.server.supported);

    // Document Data runs only in the browser, so the server cannot copy document trees.
    expect(fixture.serverUnsupportedOpcodes).toEqual(unsupported.map((block) => block.opcode));
    for (const block of unsupported) expect(block.server, block.opcode).toEqual({supported: false});
    for (const testCase of fixture.readCases) {
      expect(fixture.serverUnsupportedOpcodes, testCase.name).not.toContain(
        blockByOperation.get(testCase.operation)?.opcode
      );
    }
  });
});

function readAt(
  extension: StructuredDataExtension,
  opcode: string,
  args: {NAME: string; PATH: string},
  util: ScratchBlockUtility
): string {
  switch (opcode) {
    case 'getJsonAtPath':
      return extension.getJsonAtPath(args, util);
    case 'getTextAtPath':
      return extension.getTextAtPath(args, util);
    case 'currentValueJson':
      return extension.currentValueJson({}, util);
    case 'currentJsonAtPath':
      return extension.currentJsonAtPath({PATH: args.PATH}, util);
    case 'currentTextAtPath':
      return extension.currentTextAtPath({PATH: args.PATH}, util);
    default:
      throw new Error(`No browser reader for ${opcode}`);
  }
}

describe('browser/server schema parity fixture', () => {
  it('reads the same Schema subset as named function arguments and returns', () => {
    const {validateAgainstSchema} = namedFunctions;
    for (const keyword of schemaFixture.sharedSubset.keywords) {
      expect(SCHEMA_SUBSET_KEYWORDS).toContain(keyword);
    }
    expect(typeof validateAgainstSchema).toBe('function');
    expect(schemaFixture.sharedSubset.entry).toBe(
      '@kubohiroya/turbowarp-named-functions/composition'
    );
  });

  it('accepts and rejects every subset case identically through JSON and YAML', () => {
    for (const testCase of schemaFixture.cases) {
      const extension = new StructuredDataExtension(Scratch, true, false, true);
      const util = {target: {}, thread: {}, stackFrame: {}, startBranch: vi.fn()};
      for (const schema of schemaFixture.schemas) {
        extension.defineSchema(
          {
            SCHEMA_ID: schema.id,
            VERSION: schema.version,
            TEXT: stringifyJson(schema.document as JsonValue)
          },
          util
        );
      }
      const [id, version] = testCase.schema.split('@') as [string, string];
      const value = testCase.value as JsonValue;
      const codecs = [
        {
          name: 'json',
          run: () =>
            extension.parseJsonWithSchema(
              {TEXT: stringifyJson(value), NAME: 'parity', SCHEMA_ID: id, VERSION: version},
              util
            )
        },
        {
          name: 'yaml',
          run: () =>
            extension.parseYamlWithSchema(
              {
                TEXT: renderYamlDocument(value),
                NAME: 'parity',
                SCHEMA_ID: id,
                VERSION: version
              },
              util
            )
        }
      ];

      for (const codec of codecs) {
        const label = `${testCase.name} (${codec.name})`;
        if (testCase.accepted) {
          expect(codec.run, label).not.toThrow();
          expect(extension.toJson({NAME: 'parity'}, util), label).toBe(stringifyJson(value));
          expect(extension.schemaOf({NAME: 'parity'}, util), label).toBe(
            stringifyJson({id, version})
          );
          extension.deleteStructuredData({NAME: 'parity'}, util);
        } else {
          expect(codec.run, label).toThrowError(
            expect.objectContaining({
              code: 'SCHEMA_VALIDATION_FAILED',
              details: expect.objectContaining({
                dataName: 'parity',
                schemaId: id,
                schemaVersion: version,
                path: testCase.path,
                expected: testCase.expected
              })
            })
          );
          expect(extension.hasStructuredData({NAME: 'parity'}, util), label).toBe(false);
        }
      }
    }
  });
});
