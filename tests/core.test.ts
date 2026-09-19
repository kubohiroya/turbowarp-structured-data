import {describe, expect, it} from 'vitest';
import {
  deleteAtPath, getAtPath, hasAtPath, iterationEntries, keysAtPath, normalizeJson,
  parseJson, parsePath, setAtPath, stringifyJson
} from '../src/core.js';

describe('structured data core', () => {
  it('normalizes keys recursively by Unicode code point order', () => {
    expect(normalizeJson('{"":1,"𐀀":2,"b":{"z":0,"a":1}}')).toBe(
      '{"b":{"a":1,"z":0},"":1,"𐀀":2}'
    );
    expect(normalizeJson('{"2":2,"10":1,"01":3}')).toBe('{"01":3,"10":1,"2":2}');
  });

  it('parses only the supported path grammar', () => {
    expect(parsePath('$.users[0]["key.with.dots"]')).toEqual([
      {kind: 'key', value: 'users'}, {kind: 'index', value: 0},
      {kind: 'key', value: 'key.with.dots'}
    ]);
    for (const path of ['', '$.', '$[-1]', '$[01]', '$[*]', '$["x"]tail']) {
      expect(() => parsePath(path)).toThrowError(expect.objectContaining({code: 'INVALID_PATH'}));
    }
  });

  it('gets, detects, sets, and deletes without mutating the input', () => {
    const source = parseJson('{"items":[1,2],"nullable":null}');
    expect(getAtPath(source, parsePath('$.nullable'))).toBeNull();
    expect(hasAtPath(source, parsePath('$.nullable'))).toBe(true);
    expect(hasAtPath(source, parsePath('$.missing'))).toBe(false);
    expect(stringifyJson(setAtPath(source, parsePath('$.added'), parseJson('true')))).toBe(
      '{"added":true,"items":[1,2],"nullable":null}'
    );
    expect(stringifyJson(deleteAtPath(source, parsePath('$.items[0]')))).toBe(
      '{"items":[2],"nullable":null}'
    );
    expect(stringifyJson(source)).toBe('{"items":[1,2],"nullable":null}');
  });

  it('supports root replacement but rejects root deletion, implicit containers, and append', () => {
    expect(stringifyJson(setAtPath(parseJson('{"old":1}'), [], parseJson('[2]')))).toBe('[2]');
    expect(() => deleteAtPath(parseJson('{}'), [])).toThrowError(
      expect.objectContaining({code: 'INVALID_PATH'})
    );
    expect(() =>
      setAtPath(parseJson('{}'), parsePath('$.missing.value'), parseJson('1'))
    ).toThrowError(expect.objectContaining({code: 'PATH_NOT_FOUND'}));
    expect(() => setAtPath(parseJson('[1]'), parsePath('$[1]'), parseJson('2'))).toThrowError(
      expect.objectContaining({code: 'INDEX_OUT_OF_RANGE'})
    );
  });

  it('uses stable ordering for keys and iteration', () => {
    const value = parseJson('{"z":0,"a":1}');
    expect(keysAtPath(value, [])).toEqual(['a', 'z']);
    expect(iterationEntries(value, [], 2).map((entry) => entry.key)).toEqual(['a', 'z']);
  });

  it.each([
    ['$..x', 'INVALID_PATH'],
    ['$.missing', 'PATH_NOT_FOUND'],
    ['$.items.name', 'TYPE_MISMATCH'],
    ['$.items[9]', 'INDEX_OUT_OF_RANGE']
  ])('maps %s to %s', (path, code) => {
    expect(() => getAtPath(parseJson('{"items":[1]}'), parsePath(path))).toThrowError(
      expect.objectContaining({code})
    );
  });
});
