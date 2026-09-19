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
