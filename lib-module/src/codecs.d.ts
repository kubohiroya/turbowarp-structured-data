import { type JsonValue } from './core.js';
export declare const PARSE_LIMITS: {
    readonly maxInputBytes: number;
    readonly maxDepth: 64;
    readonly maxNodes: 50000;
};
export declare function parseJsonDocument(source: string): JsonValue;
export declare function parseYamlDocument(source: string): JsonValue;
export declare function renderJsonDocument(value: JsonValue): string;
export declare function renderYamlDocument(value: JsonValue): string;
