import { parseValue, serializeValue, PARSE_LIMITS as CODEC_LIMITS } from '@kubohiroya/turbowarp-yaml-json/codec';
import { StructuredDataError } from './core.js';
export const PARSE_LIMITS = {
    maxInputBytes: CODEC_LIMITS.maxInputBytes,
    maxDepth: CODEC_LIMITS.maxDepth,
    maxNodes: CODEC_LIMITS.maxNodes
};
function parse(source, format) {
    const parsed = parseValue(source, format);
    if (parsed.success)
        return parsed.value;
    const diagnostic = parsed.diagnostic;
    if (diagnostic.code === 'MAX_INPUT_BYTES_EXCEEDED')
        throw new StructuredDataError('PARSE_LIMIT_EXCEEDED', `Input is ${new TextEncoder().encode(source).byteLength} bytes; maximum is ${PARSE_LIMITS.maxInputBytes}.`);
    if (diagnostic.code === 'MAX_DEPTH_EXCEEDED')
        throw new StructuredDataError('PARSE_LIMIT_EXCEEDED', `Data exceeds maximum nesting depth ${PARSE_LIMITS.maxDepth}.`);
    if (diagnostic.code === 'MAX_NODES_EXCEEDED')
        throw new StructuredDataError('PARSE_LIMIT_EXCEEDED', `Data exceeds maximum node count ${PARSE_LIMITS.maxNodes}.`);
    if (format === 'json')
        throw new StructuredDataError('INVALID_JSON', diagnostic.code === 'INVALID_JSON_VALUE'
            ? 'JSON contains an unsupported value.'
            : 'Input must be valid JSON.');
    const ownerMessage = {
        YAML_ALIAS_NOT_ALLOWED: 'YAML aliases are not allowed.',
        YAML_NON_STRING_KEY: 'YAML map keys must be strings.'
    };
    if (ownerMessage[diagnostic.code])
        throw new StructuredDataError('INVALID_YAML', ownerMessage[diagnostic.code]);
    if (diagnostic.code === 'INVALID_YAML_VALUE')
        throw new StructuredDataError('INVALID_YAML', diagnostic.message.replace(/^Parsed YAML/, 'YAML'));
    throw new StructuredDataError('INVALID_YAML', `${diagnostic.code} at line ${diagnostic.line}, column ${diagnostic.column}: ${diagnostic.message}`);
}
export function parseJsonDocument(source) {
    return parse(source, 'json');
}
export function parseYamlDocument(source) {
    return parse(source, 'yaml');
}
export function renderJsonDocument(value) {
    return serializeValue(value, {
        format: 'json',
        keyOrder: 'unicode',
        indent: 0,
        trailingNewline: false,
        enforceValueLimits: false
    });
}
export function renderYamlDocument(value) {
    return serializeValue(value, {
        format: 'yaml',
        keyOrder: 'unicode',
        trailingNewline: false,
        enforceValueLimits: false
    });
}
