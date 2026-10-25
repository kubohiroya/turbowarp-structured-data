import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import * as namedFunctions from '@kubohiroya/turbowarp-named-functions/composition';
import fixture from './fixtures/semantic-parity.json';
import schemaFixture from './fixtures/schema-parity.json';
import {StructuredDataExtension} from '../src/extension.js';
import {renderYamlDocument} from '../src/codecs.js';
import {parsePath, stringifyJson, type JsonValue} from '../src/core.js';
import {SCHEMA_SUBSET_KEYWORDS} from '../src/schema.js';

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
});

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
