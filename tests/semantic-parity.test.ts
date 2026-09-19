import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import fixture from './fixtures/semantic-parity.json';
import {StructuredDataExtension} from '../src/extension.js';
import {parsePath} from '../src/core.js';

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
      const extension = new StructuredDataExtension(true);
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
