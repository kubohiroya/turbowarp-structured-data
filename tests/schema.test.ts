import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {StructuredDataExtension} from '../src/extension.js';
import {stringifyJson, StructuredDataError} from '../src/core.js';
import {isStructuredSchemaEnabled} from '../src/config.js';
import {
  parseSchemaReference,
  schemaKey,
  SCHEMA_PROPERTY_TYPES,
  SCHEMA_SUBSET_KEYWORDS
} from '../src/schema.js';

const PERSON = stringifyJson({
  type: 'object',
  additionalProperties: false,
  properties: {name: {type: 'string'}, age: {type: 'integer', minimum: 0}},
  required: ['name']
});

beforeEach(() => {
  vi.stubGlobal('Scratch', {
    BlockType: {COMMAND: 'command', REPORTER: 'reporter', BOOLEAN: 'boolean', LOOP: 'loop'},
    ArgumentType: {STRING: 'string', NUMBER: 'number'},
    Cast: {toString: String, toNumber: Number},
    translate: (message: string | {default: string}) =>
      typeof message === 'string' ? message : message.default,
    vm: {runtime: {on: vi.fn()}}
  });
});

afterEach(() => vi.unstubAllGlobals());

function utility(target = {}, thread = {}) {
  return {target, thread, stackFrame: {} as Record<string, unknown>, startBranch: vi.fn()};
}

/** An extension with both the MVP and the schema flag on. */
function withSchema() {
  return new StructuredDataExtension(Scratch, true, false, true);
}

function definePerson(extension: StructuredDataExtension, util: ReturnType<typeof utility>) {
  extension.defineSchema({SCHEMA_ID: 'person', VERSION: '1.0.0', TEXT: PERSON}, util);
}

describe('schema references', () => {
  it('accepts stable ids with a complete Semantic Version', () => {
    expect(parseSchemaReference('sensor.reading', '1.2.3')).toEqual({
      id: 'sensor.reading',
      version: '1.2.3'
    });
    expect(schemaKey(parseSchemaReference('a-b.c', '0.1.0-rc.1+build.5'))).toBe(
      'a-b.c@0.1.0-rc.1+build.5'
    );
  });

  it('rejects malformed ids and partial versions', () => {
    for (const [id, version] of [
      ['Sensor', '1.0.0'],
      ['9sensor', '1.0.0'],
      ['', '1.0.0'],
      ['sensor', '1.0'],
      ['sensor', 'v1.0.0'],
      ['sensor', '1.0.0.0']
    ] as const) {
      expect(() => parseSchemaReference(id, version)).toThrowError(
        expect.objectContaining({code: 'INVALID_SCHEMA'})
      );
    }
  });
});

describe('the schema flag', () => {
  it('stays off by default and hides the schema blocks', () => {
    expect(isStructuredSchemaEnabled({})).toBe(false);
    expect(isStructuredSchemaEnabled({STRUCTURED_SCHEMA: true})).toBe(true);
    expect(isStructuredSchemaEnabled({STRUCTURED_SCHEMA: 'true'})).toBe(true);

    const opcodes = (
      new StructuredDataExtension(Scratch, true).getInfo() as {blocks: Array<{opcode: string}>}
    ).blocks.map((block) => block.opcode);
    expect(opcodes).toHaveLength(19);
    expect(opcodes).not.toContain('parseJsonWithSchema');

    const withFlag = (withSchema().getInfo() as {blocks: Array<{opcode: string}>}).blocks.map(
      (block) => block.opcode
    );
    expect(withFlag).toHaveLength(28);
    expect(withFlag.slice(19)).toEqual([
      'defineSchema', 'beginSchema', 'addSchemaProperty', 'commitSchema', 'hasSchema',
      'deleteSchema', 'parseJsonWithSchema', 'parseYamlWithSchema', 'schemaOf'
    ]);
  });

  it('refuses schema operations while off, leaving plain parsing untouched', () => {
    const extension = new StructuredDataExtension(Scratch, true);
    const util = utility();
    expect(() => definePerson(extension, util)).toThrowError(
      expect.objectContaining({code: 'INVALID_SCHEMA'})
    );
    extension.parseJson({TEXT: '{"a":1}', NAME: 'data'}, util);
    expect(extension.toJson({NAME: 'data'}, util)).toBe('{"a":1}');
  });
});

describe('schema definitions', () => {
  it('registers, reports, and deletes reusable schemas per target', () => {
    const extension = withSchema();
    const util = utility();
    const other = utility();

    definePerson(extension, util);
    expect(extension.hasSchema({SCHEMA_ID: 'person', VERSION: '1.0.0'}, util)).toBe(true);
    expect(extension.hasSchema({SCHEMA_ID: 'person', VERSION: '2.0.0'}, util)).toBe(false);
    expect(extension.hasSchema({SCHEMA_ID: 'person', VERSION: '1.0.0'}, other)).toBe(false);

    extension.deleteSchema({SCHEMA_ID: 'person', VERSION: '1.0.0'}, util);
    expect(extension.hasSchema({SCHEMA_ID: 'person', VERSION: '1.0.0'}, util)).toBe(false);
    expect(() =>
      extension.deleteSchema({SCHEMA_ID: 'person', VERSION: '1.0.0'}, util)
    ).toThrowError(expect.objectContaining({code: 'SCHEMA_NOT_FOUND'}));
  });

  it('reuses one schema for several named values', () => {
    const extension = withSchema();
    const util = utility();
    definePerson(extension, util);
    const bind = (name: string) =>
      extension.parseJsonWithSchema(
        {TEXT: '{"name":"Ada"}', NAME: name, SCHEMA_ID: 'person', VERSION: '1.0.0'},
        util
      );
    bind('first');
    bind('second');
    expect(extension.schemaOf({NAME: 'first'}, util)).toBe(
      '{"id":"person","version":"1.0.0"}'
    );
    expect(extension.schemaOf({NAME: 'second'}, util)).toBe(
      '{"id":"person","version":"1.0.0"}'
    );
  });

  it('refuses malformed schema documents before they are stored', () => {
    const extension = withSchema();
    const util = utility();
    for (const text of [
      'not json',
      '[]',
      '{"type":"decimal"}',
      '{"properties":[]}',
      '{"required":"name"}',
      '{"additionalProperties":"no"}',
      '{"items":3}',
      '{"enum":[]}',
      '{"minimum":"1"}'
    ]) {
      expect(() =>
        extension.defineSchema({SCHEMA_ID: 'bad', VERSION: '1.0.0', TEXT: text}, util)
      ).toThrowError(expect.objectContaining({code: 'INVALID_SCHEMA'}));
    }
    expect(extension.hasSchema({SCHEMA_ID: 'bad', VERSION: '1.0.0'}, util)).toBe(false);
  });

  it('documents the subset it interprets', () => {
    expect(SCHEMA_SUBSET_KEYWORDS).toContain('additionalProperties');
    expect(SCHEMA_SUBSET_KEYWORDS).not.toContain('$ref');
    expect(SCHEMA_PROPERTY_TYPES).toEqual([
      'object', 'array', 'string', 'number', 'integer', 'boolean', 'null'
    ]);
  });
});

describe('visual schema definitions', () => {
  it('produces the same canonical schema as the equivalent text definition', () => {
    const extension = withSchema();
    const util = utility();

    extension.defineSchema(
      {
        SCHEMA_ID: 'person',
        VERSION: '1.0.0',
        TEXT: stringifyJson({
          type: 'object',
          additionalProperties: false,
          properties: {name: {type: 'string'}, age: {type: 'integer'}},
          required: ['name']
        })
      },
      util
    );

    // The same shape, stacked as blocks and in a different property order.
    extension.beginSchema({SCHEMA_ID: 'person', VERSION: '2.0.0', EXTRA: 'reject'}, util);
    extension.addSchemaProperty({PROPERTY: 'age', TYPE: 'integer', REQUIRED: 'optional'}, util);
    extension.addSchemaProperty({PROPERTY: 'name', TYPE: 'string', REQUIRED: 'required'}, util);
    extension.commitSchema({}, util);

    extension.parseJsonWithSchema(
      {TEXT: '{"name":"Ada","age":36}', NAME: 'fromText', SCHEMA_ID: 'person', VERSION: '1.0.0'},
      util
    );
    extension.parseJsonWithSchema(
      {TEXT: '{"name":"Ada","age":36}', NAME: 'fromBlocks', SCHEMA_ID: 'person', VERSION: '2.0.0'},
      util
    );
    expect(extension.toJson({NAME: 'fromBlocks'}, util)).toBe(
      extension.toJson({NAME: 'fromText'}, util)
    );

    // And both reject the same value for the same reason.
    const reject = (version: string) => () =>
      extension.parseJsonWithSchema(
        {TEXT: '{"age":36}', NAME: 'rejected', SCHEMA_ID: 'person', VERSION: version},
        util
      );
    expect(reject('1.0.0')).toThrowError(
      expect.objectContaining({details: expect.objectContaining({path: '$.name', expected: 'required'})})
    );
    expect(reject('2.0.0')).toThrowError(
      expect.objectContaining({details: expect.objectContaining({path: '$.name', expected: 'required'})})
    );
  });

  it('survives a re-run of the definition blocks after a reload', () => {
    const extension = withSchema();
    const util = utility();
    const define = () => {
      extension.beginSchema({SCHEMA_ID: 'person', VERSION: '1.0.0', EXTRA: 'allow'}, util);
      extension.addSchemaProperty({PROPERTY: 'name', TYPE: 'string', REQUIRED: 'required'}, util);
      extension.commitSchema({}, util);
    };
    define();
    extension.parseJsonWithSchema(
      {TEXT: '{"name":"Ada"}', NAME: 'data', SCHEMA_ID: 'person', VERSION: '1.0.0'},
      util
    );
    const before = extension.toJson({NAME: 'data'}, util);

    // A reload re-runs the same stacked blocks on a fresh runtime.
    const reloaded = withSchema();
    const reloadedUtil = utility();
    reloaded.beginSchema({SCHEMA_ID: 'person', VERSION: '1.0.0', EXTRA: 'allow'}, reloadedUtil);
    reloaded.addSchemaProperty(
      {PROPERTY: 'name', TYPE: 'string', REQUIRED: 'required'},
      reloadedUtil
    );
    reloaded.commitSchema({}, reloadedUtil);
    reloaded.parseJsonWithSchema(
      {TEXT: '{"name":"Ada"}', NAME: 'data', SCHEMA_ID: 'person', VERSION: '1.0.0'},
      reloadedUtil
    );
    expect(reloaded.toJson({NAME: 'data'}, reloadedUtil)).toBe(before);
  });

  it('rejects an unsupported property type, an unopened draft, and bad keywords', () => {
    const extension = withSchema();
    const util = utility();
    expect(() =>
      extension.addSchemaProperty({PROPERTY: 'name', TYPE: 'string', REQUIRED: 'required'}, util)
    ).toThrowError(expect.objectContaining({code: 'INVALID_SCHEMA'}));
    expect(() => extension.commitSchema({}, util)).toThrowError(
      expect.objectContaining({code: 'INVALID_SCHEMA'})
    );

    extension.beginSchema({SCHEMA_ID: 'person', VERSION: '1.0.0', EXTRA: 'reject'}, util);
    expect(() =>
      extension.addSchemaProperty({PROPERTY: 'name', TYPE: 'decimal', REQUIRED: 'required'}, util)
    ).toThrowError(expect.objectContaining({code: 'INVALID_SCHEMA'}));
    expect(() =>
      extension.addSchemaProperty({PROPERTY: ' ', TYPE: 'string', REQUIRED: 'required'}, util)
    ).toThrowError(expect.objectContaining({code: 'INVALID_SCHEMA'}));
    expect(() =>
      extension.addSchemaProperty({PROPERTY: 'name', TYPE: 'string', REQUIRED: 'maybe'}, util)
    ).toThrowError(expect.objectContaining({code: 'INVALID_SCHEMA'}));
    expect(() =>
      extension.beginSchema({SCHEMA_ID: 'person', VERSION: '1.0.0', EXTRA: 'perhaps'}, util)
    ).toThrowError(expect.objectContaining({code: 'INVALID_SCHEMA'}));
  });
});

describe('schema-bound parsing', () => {
  it('binds conforming JSON and YAML to the same value and schemaRef', () => {
    const extension = withSchema();
    const util = utility();
    definePerson(extension, util);

    extension.parseJsonWithSchema(
      {TEXT: '{"age":36,"name":"Ada"}', NAME: 'json', SCHEMA_ID: 'person', VERSION: '1.0.0'},
      util
    );
    extension.parseYamlWithSchema(
      {TEXT: 'name: Ada\nage: 36', NAME: 'yaml', SCHEMA_ID: 'person', VERSION: '1.0.0'},
      util
    );

    expect(extension.toJson({NAME: 'yaml'}, util)).toBe(extension.toJson({NAME: 'json'}, util));
    expect(extension.toJson({NAME: 'json'}, util)).toBe('{"age":36,"name":"Ada"}');
    expect(extension.schemaOf({NAME: 'yaml'}, util)).toBe('{"id":"person","version":"1.0.0"}');
    expect(extension.schemaOf({NAME: 'json'}, util)).toBe('{"id":"person","version":"1.0.0"}');
  });

  it('never registers a non-conforming value, in either codec', () => {
    const extension = withSchema();
    const util = utility();
    definePerson(extension, util);

    expect(() =>
      extension.parseJsonWithSchema(
        {TEXT: '{"name":42}', NAME: 'json', SCHEMA_ID: 'person', VERSION: '1.0.0'},
        util
      )
    ).toThrowError(expect.objectContaining({code: 'SCHEMA_VALIDATION_FAILED'}));
    expect(() =>
      extension.parseYamlWithSchema(
        {TEXT: 'name: 42', NAME: 'yaml', SCHEMA_ID: 'person', VERSION: '1.0.0'},
        util
      )
    ).toThrowError(expect.objectContaining({code: 'SCHEMA_VALIDATION_FAILED'}));

    expect(extension.hasStructuredData({NAME: 'json'}, util)).toBe(false);
    expect(extension.hasStructuredData({NAME: 'yaml'}, util)).toBe(false);
  });

  it('rejects JSON and YAML alike for the same schema reason', () => {
    const extension = withSchema();
    const util = utility();
    definePerson(extension, util);
    const details = (run: () => void) => {
      try {
        run();
      } catch (error) {
        return (error as StructuredDataError).details;
      }
      throw new Error('expected a schema failure');
    };

    expect(
      details(() =>
        extension.parseJsonWithSchema(
          {TEXT: '{"name":"Ada","age":-1}', NAME: 'd', SCHEMA_ID: 'person', VERSION: '1.0.0'},
          util
        )
      )
    ).toEqual(
      details(() =>
        extension.parseYamlWithSchema(
          {TEXT: 'name: Ada\nage: -1', NAME: 'd', SCHEMA_ID: 'person', VERSION: '1.0.0'},
          util
        )
      )
    );
  });

  it('reports an unresolved schema reference explicitly', () => {
    const extension = withSchema();
    const util = utility();
    expect(() =>
      extension.parseJsonWithSchema(
        {TEXT: '{"name":"Ada"}', NAME: 'data', SCHEMA_ID: 'person', VERSION: '1.0.0'},
        util
      )
    ).toThrowError(
      expect.objectContaining({
        code: 'SCHEMA_NOT_FOUND',
        details: {schemaId: 'person', schemaVersion: '1.0.0'}
      })
    );
    expect(extension.hasStructuredData({NAME: 'data'}, util)).toBe(false);
  });

  it('carries the code, data name, path, and expectation on a failure', () => {
    const extension = withSchema();
    const util = utility();
    extension.defineSchema(
      {
        SCHEMA_ID: 'reading',
        VERSION: '1.4.2',
        TEXT: stringifyJson({
          type: 'object',
          properties: {samples: {type: 'array', items: {type: 'number'}}}
        })
      },
      util
    );

    let error: StructuredDataError | undefined;
    try {
      extension.parseJsonWithSchema(
        {TEXT: '{"samples":[1,"two"]}', NAME: 'sensor', SCHEMA_ID: 'reading', VERSION: '1.4.2'},
        util
      );
    } catch (thrown) {
      error = thrown as StructuredDataError;
    }

    expect(error?.code).toBe('SCHEMA_VALIDATION_FAILED');
    expect(error?.details).toEqual({
      dataName: 'sensor',
      schemaId: 'reading',
      schemaVersion: '1.4.2',
      path: '$.samples[1]',
      expected: 'number'
    });
    expect(error?.message).toContain('SCHEMA_VALIDATION_FAILED');
    expect(error?.message).toContain('sensor');
    expect(error?.message).toContain('reading@1.4.2');
    expect(error?.message).toContain('$.samples[1] must be number');
  });
});

describe('schema-bound path updates', () => {
  it('accepts a conforming candidate and keeps the schemaRef', () => {
    const extension = withSchema();
    const util = utility();
    definePerson(extension, util);
    extension.parseJsonWithSchema(
      {TEXT: '{"name":"Ada","age":36}', NAME: 'data', SCHEMA_ID: 'person', VERSION: '1.0.0'},
      util
    );

    extension.setJsonAtPath({NAME: 'data', PATH: '$.name', VALUE: '"Grace"'}, util);
    extension.deleteAtPath({NAME: 'data', PATH: '$.age'}, util);
    expect(extension.toJson({NAME: 'data'}, util)).toBe('{"name":"Grace"}');
    expect(extension.schemaOf({NAME: 'data'}, util)).toBe('{"id":"person","version":"1.0.0"}');
  });

  it('rejects a non-conforming candidate atomically and keeps the stored value', () => {
    const extension = withSchema();
    const util = utility();
    definePerson(extension, util);
    extension.parseJsonWithSchema(
      {TEXT: '{"name":"Ada","age":36}', NAME: 'data', SCHEMA_ID: 'person', VERSION: '1.0.0'},
      util
    );
    const original = extension.toJson({NAME: 'data'}, util);

    expect(() =>
      extension.setJsonAtPath({NAME: 'data', PATH: '$.name', VALUE: '42'}, util)
    ).toThrowError(
      expect.objectContaining({
        code: 'SCHEMA_VALIDATION_FAILED',
        details: expect.objectContaining({dataName: 'data', path: '$.name', expected: 'string'})
      })
    );
    expect(() =>
      extension.setJsonAtPath({NAME: 'data', PATH: '$.age', VALUE: '-1'}, util)
    ).toThrowError(expect.objectContaining({code: 'SCHEMA_VALIDATION_FAILED'}));
    expect(() =>
      extension.setJsonAtPath({NAME: 'data', PATH: '$.nickname', VALUE: '"Ada"'}, util)
    ).toThrowError(
      expect.objectContaining({
        details: expect.objectContaining({path: '$.nickname', expected: 'not allowed'})
      })
    );
    expect(() => extension.deleteAtPath({NAME: 'data', PATH: '$.name'}, util)).toThrowError(
      expect.objectContaining({code: 'SCHEMA_VALIDATION_FAILED'})
    );

    expect(extension.toJson({NAME: 'data'}, util)).toBe(original);
    expect(extension.schemaOf({NAME: 'data'}, util)).toBe('{"id":"person","version":"1.0.0"}');
  });

  it('refuses to update a binding whose schema was deleted', () => {
    const extension = withSchema();
    const util = utility();
    definePerson(extension, util);
    extension.parseJsonWithSchema(
      {TEXT: '{"name":"Ada"}', NAME: 'data', SCHEMA_ID: 'person', VERSION: '1.0.0'},
      util
    );
    extension.deleteSchema({SCHEMA_ID: 'person', VERSION: '1.0.0'}, util);

    expect(extension.toJson({NAME: 'data'}, util)).toBe('{"name":"Ada"}');
    expect(() =>
      extension.setJsonAtPath({NAME: 'data', PATH: '$.name', VALUE: '"Grace"'}, util)
    ).toThrowError(expect.objectContaining({code: 'SCHEMA_NOT_FOUND'}));
    expect(extension.toJson({NAME: 'data'}, util)).toBe('{"name":"Ada"}');
  });

  it('leaves unbound data free of schema checks, and re-parsing drops the schema', () => {
    const extension = withSchema();
    const util = utility();
    definePerson(extension, util);

    extension.parseJson({TEXT: '{"name":"Ada"}', NAME: 'free'}, util);
    extension.setJsonAtPath({NAME: 'free', PATH: '$.name', VALUE: '42'}, util);
    expect(extension.toJson({NAME: 'free'}, util)).toBe('{"name":42}');
    expect(extension.schemaOf({NAME: 'free'}, util)).toBe('{}');

    extension.parseJsonWithSchema(
      {TEXT: '{"name":"Ada"}', NAME: 'bound', SCHEMA_ID: 'person', VERSION: '1.0.0'},
      util
    );
    extension.parseJson({TEXT: '{"name":42}', NAME: 'bound'}, util);
    expect(extension.schemaOf({NAME: 'bound'}, util)).toBe('{}');
    expect(extension.toJson({NAME: 'bound'}, util)).toBe('{"name":42}');
  });

  it('clears schemas and open drafts when the project stops', () => {
    const extension = withSchema();
    const util = utility();
    definePerson(extension, util);
    extension.beginSchema({SCHEMA_ID: 'draft', VERSION: '1.0.0', EXTRA: 'allow'}, util);

    const on = Scratch.vm?.runtime?.on as ReturnType<typeof vi.fn>;
    for (const [event, listener] of on.mock.calls) {
      if (event === 'PROJECT_STOP_ALL') (listener as () => void)();
    }

    expect(extension.hasSchema({SCHEMA_ID: 'person', VERSION: '1.0.0'}, util)).toBe(false);
    expect(() => extension.commitSchema({}, util)).toThrowError(
      expect.objectContaining({code: 'INVALID_SCHEMA'})
    );
  });
});
