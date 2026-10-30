import {describe, expect, it} from 'vitest';
import {
  parseJsonDocument,
  parseYamlDocument,
  PARSE_LIMITS,
  renderJsonDocument,
  renderYamlDocument
} from '../src/codecs.js';

describe('JSON and YAML codecs', () => {
  it('round-trips the shared JSON value model deterministically', () => {
    const value = parseYamlDocument('z: 2\na:\n  name: sensor\n  enabled: true');
    expect(renderJsonDocument(value)).toBe(
      '{"a":{"enabled":true,"name":"sensor"},"z":2}'
    );
    expect(renderYamlDocument(value)).toBe('a:\n  enabled: true\n  name: "sensor"\nz: 2');
    expect(parseJsonDocument(renderJsonDocument(value))).toEqual(value);
  });

  it('retains canonical integer and supplementary-character key ordering and legacy diagnostics', () => {
    const prototypeValue = parseJsonDocument('{"__proto__":{"kept":true}}');
    expect(renderJsonDocument(prototypeValue)).toBe('{"__proto__":{"kept":true}}');
    const value = parseJsonDocument('{"2":2,"10":10,"𐀀":1,"":2}');
    expect(renderJsonDocument(value)).toBe('{"10":10,"2":2,"":2,"𐀀":1}');
    expect(renderYamlDocument(value)).toBe('"10": 10\n"2": 2\n"": 2\n"𐀀": 1');
    expect(() => parseYamlDocument('base: &x [1]\ncopy: *x')).toThrow('INVALID_YAML: YAML aliases are not allowed.');
    expect(() => parseJsonDocument('{')).toThrow('INVALID_JSON: Input must be valid JSON.');
    expect(renderJsonDocument(Array(50001).fill(1)).startsWith('[1,1')).toBe(true);
  });

  it('rejects aliases, non-string keys, invalid JSON, and excessive input', () => {
    expect(() => parseYamlDocument('base: &x [1]\ncopy: *x')).toThrowError(
      expect.objectContaining({code: 'INVALID_YAML'})
    );
    expect(() => parseYamlDocument('1: value')).toThrowError(
      expect.objectContaining({code: 'INVALID_YAML'})
    );
    expect(() => parseJsonDocument('{')).toThrowError(
      expect.objectContaining({code: 'INVALID_JSON'})
    );
    expect(() => parseYamlDocument('x'.repeat(PARSE_LIMITS.maxInputBytes + 1))).toThrowError(
      expect.objectContaining({code: 'PARSE_LIMIT_EXCEEDED'})
    );
  });
});
