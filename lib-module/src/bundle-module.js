import { LineCounter, isAlias, isMap, isScalar, isSeq, parseDocument } from "yaml";
import { NamedDataError, bindNamedDataRegistryLifecycle, installNamedDataRegistry } from "@kubohiroya/turbowarp-named-data/composition";
function isNamedDataSchemaRefEnabled(source = globalThis) {
	const value = source.__TW_NAMED_DATA_FEATURE_FLAGS__?.NAMED_DATA_SCHEMA_REF;
	return value === void 0 ? false : value === true || value === "true";
}
function isStructuredDataMvpEnabled(source = globalThis) {
	const value = source.STRUCTURED_DATA_MVP;
	return value === void 0 ? false : value === true || value === "true";
}
function isNamedDataRegistryMvpEnabled(source = globalThis) {
	const value = source.NAMED_DATA_REGISTRY_MVP;
	return value === void 0 ? false : value === true || value === "true";
}
function isStructuredSchemaEnabled(source = globalThis) {
	const value = source.STRUCTURED_SCHEMA;
	return value === void 0 ? false : value === true || value === "true";
}
var extensionConfig = {
	id: "kubohiroyastructureddata",
	slug: "structured-data",
	name: "Structured Data",
	description: "Named structured data with JSON/YAML codecs for TurboWarp and server compilation.",
	author: "Hiroya Kubo",
	license: "MPL-2.0",
	unsandboxed: true,
	docsURI: "https://kubohiroya.github.io/turbowarp-structured-data/",
	blockIconURI: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCI+PHJlY3QgeD0iNCIgeT0iOCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjMyIiByeD0iNiIgZmlsbD0iIzhBNTVENyIvPjxwYXRoIGQ9Ik0xOSAxNWMtMyAwLTIgNy01IDkgMyAyIDIgOSA1IDkiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48cGF0aCBkPSJNMjkgMTVjMyAwIDIgNyA1IDktMyAyLTIgOS01IDkiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48Y2lyY2xlIGN4PSIyNCIgY3k9IjI0IiByPSIyLjIiIGZpbGw9IiNmZmYiLz48L3N2Zz4="
};
var numberToken = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?$/u;
var invalidNumber = Object.freeze({
	kind: "invalid",
	code: "fixed-number-input-invalid"
});
/**
* Parse a NEW numeric draft according to NP-finite-new-input-v1.
* Never apply this to opening/no-op raw values or use it as an owner validator.
* Keep the validated token so negative zero, precision and exponent spelling survive.
*/
function parseFixedNumberInput(input) {
	if (typeof input === "number") {
		if (!Number.isFinite(input)) return invalidNumber;
		return Object.freeze({
			kind: "valid",
			token: Object.is(input, -0) ? "-0" : String(input),
			value: input
		});
	}
	if (typeof input !== "string") return invalidNumber;
	const token = input.trim();
	if (!numberToken.test(token)) return invalidNumber;
	const value = Number(token);
	return Number.isFinite(value) ? Object.freeze({
		kind: "valid",
		token,
		value
	}) : invalidNumber;
}
var block_editor_fixed_inputs_schema_default = {
	$schema: "https://json-schema.org/draft/2020-12/schema",
	$id: "https://kubohiroya.github.io/turbowarp-structured-data/schemas/block-editor-fixed-inputs.schema.json",
	$defs: { "forEachAtPath": {
		"type": "object",
		"properties": { "MAX": {
			"type": "integer",
			"minimum": 1,
			"maximum": 1e3
		} },
		"required": ["MAX"],
		"additionalProperties": true
	} }
};
var source$1 = {
	repository: "turbowarp-structured-data",
	path: "schemas/block-editor-fixed-inputs.schema.json",
	symbol: "#/$defs/forEachAtPath/properties/MAX"
};
/** The on-disk owner Schema is canonical; this is its single-field projection. */
var fixedInputSchemaBundle = {
	identity: {
		ownerId: "turbowarp-structured-data",
		contractId: "forEachAtPath.MAX",
		revision: "fixed-inputs-v1",
		variantId: "default"
	},
	dialect: "2020-12",
	root: {
		retrievalUri: "https://kubohiroya.github.io/turbowarp-structured-data/schemas/forEachAtPath-MAX.schema.json",
		document: block_editor_fixed_inputs_schema_default.$defs.forEachAtPath.properties.MAX,
		artifact: {
			role: "canonical-schema",
			source: source$1
		}
	},
	resources: [],
	provenance: {
		canonicalSources: [source$1, {
			repository: "turbowarp-structured-data",
			path: "src/core.ts",
			symbol: "iterationEntries"
		}],
		generatedFiles: [{
			repository: "turbowarp-structured-data",
			path: "docs/schemas/block-editor-fixed-inputs.schema.json"
		}],
		referenceSchemas: [],
		generationSources: [{
			repository: "turbowarp-structured-data",
			path: "scripts/generate-fixed-input-docs.mjs"
		}]
	}
};
var fixedInputEditorDefinitions = [{
	apiVersion: 1,
	extensionId: extensionConfig.id,
	editorId: "forEachAtPath-fixed-inputs",
	opcodes: [`${extensionConfig.id}_forEachAtPath`],
	contractId: "turbowarp-structured-data:forEachAtPath.MAX",
	contractRevision: "fixed-inputs-v1",
	bindings: [{
		argument: "MAX",
		schemaBundle: fixedInputSchemaBundle,
		control: {
			kind: "number",
			label: "MAX"
		},
		read(value) {
			if (typeof value !== "string" && typeof value !== "number") throw new TypeError("Expected a literal maximum.");
			if (typeof value === "string" && value.trim() === "") throw new TypeError("Blank maximum stays readonly.");
			const number = Number(value);
			if (!Number.isFinite(number)) throw new TypeError("Maximum must be finite.");
			return number;
		},
		encode(value) {
			const parsed = parseFixedNumberInput(value);
			if (parsed.kind !== "valid") throw new TypeError("Expected a finite numeric token.");
			return parsed.token;
		},
		validateCandidate(value) {
			const parsed = parseFixedNumberInput(value);
			return parsed.kind === "valid" && Number.isInteger(parsed.value) && parsed.value >= 1 && parsed.value <= 1e3 ? [] : [{
				path: "/inputs/MAX",
				message: "Maximum must be an integer from 1 to 1000."
			}];
		}
	}],
	validationContext: () => ({
		consumerId: extensionConfig.id,
		nowMs: Date.now(),
		settings: null
	})
}];
/** Register metadata only; the GUI startup capability owns editor activation. */
function registerFixedInputEditors(scratch, definitions, runtimeOverride) {
	const host = scratch;
	const api = host.gui?.blockEditors;
	if (!definitions.length || api?.apiVersion !== 1 || typeof api.registerFixedInputEditor !== "function") return () => {};
	const runtime = runtimeOverride ?? host.vm?.runtime;
	const removers = [];
	let active = true;
	const dispose = () => {
		if (!active) return;
		active = false;
		runtime?.off?.("RUNTIME_DISPOSED", dispose);
		for (const remove of removers.splice(0).reverse()) remove();
	};
	try {
		for (const definition of definitions) {
			const remove = api.registerFixedInputEditor.call(api, definition);
			if (typeof remove !== "function") throw new TypeError("Invalid fixed input registration disposer.");
			removers.push(remove);
		}
		runtime?.on?.("RUNTIME_DISPOSED", dispose);
	} catch (error) {
		dispose();
		throw error;
	}
	return dispose;
}
function sourceBinding(argument, bundle, read, check = read, format = "json", uiSchema) {
	return {
		argument,
		variants: [{
			variantId: "default",
			format,
			schemaBundle: bundle,
			...uiSchema ? { uiSchema } : {}
		}],
		decode(source) {
			return {
				source,
				format,
				variantId: "default",
				data: read(source)
			};
		},
		validateSource(source, context) {
			try {
				read(source);
			} catch {
				return {
					source,
					result: {
						kind: "invalid",
						diagnostics: [{ code: "source-decode-invalid" }]
					}
				};
			}
			try {
				const descriptors = Object.getOwnPropertyDescriptors(context);
				if (typeof descriptors.consumerId?.value !== "string" || typeof descriptors.nowMs?.value !== "number" || !Number.isFinite(descriptors.nowMs.value) || !descriptors.settings || !("value" in descriptors.settings)) return {
					source,
					result: {
						kind: "execution-error",
						diagnostics: [{ code: "owner-context-invalid" }]
					}
				};
			} catch {
				return {
					source,
					result: {
						kind: "execution-error",
						diagnostics: [{ code: "owner-context-invalid" }]
					}
				};
			}
			try {
				check(source);
			} catch {
				return {
					source,
					result: {
						kind: "invalid",
						diagnostics: [{ code: "source-owner-invalid" }]
					}
				};
			}
			return {
				source,
				result: {
					kind: "valid",
					diagnostics: []
				}
			};
		}
	};
}
/** The optional capability keeps legacy hosts and the startup flag safely inactive. */
function registerSourceEditors(scratch, definitions) {
	const host = scratch;
	const api = host.gui?.blockEditors;
	if (api?.apiVersion !== 1 || typeof api.registerSourceEditor !== "function") return () => {};
	const removers = [];
	let active = true;
	const dispose = () => {
		if (!active) return;
		active = false;
		host.vm?.runtime?.off?.("RUNTIME_DISPOSED", dispose);
		for (const remove of removers.splice(0).reverse()) remove();
	};
	try {
		for (const definition of definitions) removers.push(api.registerSourceEditor.call(api, definition));
		host.vm?.runtime?.on?.("RUNTIME_DISPOSED", dispose);
	} catch (error) {
		dispose();
		throw error;
	}
	return dispose;
}
var source = {
	repository: "https://github.com/kubohiroya/turbowarp-extension-data-editor",
	path: "src/json-value.ts",
	symbol: "jsonValueSchema"
};
var jsonValueSchemaBundle = Object.freeze({
	identity: {
		ownerId: "@kubohiroya/turbowarp-extension-data-editor",
		contractId: "json-value",
		revision: "1",
		variantId: "json-value"
	},
	dialect: "2020-12",
	root: {
		retrievalUri: "https://kubohiroya.github.io/turbowarp-extension-data-editor/schemas/json-value",
		document: true,
		artifact: {
			role: "canonical-schema",
			source
		}
	},
	resources: [],
	provenance: {
		canonicalSources: [source],
		generatedFiles: [],
		referenceSchemas: [],
		generationSources: []
	}
});
var StructuredDataError = class extends Error {
	constructor(code, message, details = {}) {
		super(`${code}: ${message}`);
		this.name = "StructuredDataError";
		this.code = code;
		this.details = details;
	}
};
function parseJson(text) {
	try {
		const value = JSON.parse(String(text));
		assertJsonValue(value);
		return value;
	} catch (error) {
		if (error instanceof StructuredDataError) throw error;
		throw new StructuredDataError("INVALID_JSON", "Input must be valid JSON.");
	}
}
function stringifyJson(value) {
	if (Array.isArray(value)) return `[${value.map(stringifyJson).join(",")}]`;
	if (isJsonObject(value)) return `{${Object.keys(value).sort(compareUnicodeCodePoints).map((key) => `${JSON.stringify(key)}:${stringifyJson(value[key])}`).join(",")}}`;
	return JSON.stringify(value);
}
function parsePath(input) {
	const path = String(input);
	if (!path.startsWith("$")) invalidPath();
	const segments = [];
	let cursor = 1;
	while (cursor < path.length) {
		if (path[cursor] === ".") {
			const match = /^[A-Za-z_][A-Za-z0-9_]*/u.exec(path.slice(cursor + 1));
			if (!match) invalidPath();
			segments.push({
				kind: "key",
				value: match[0]
			});
			cursor += match[0].length + 1;
			continue;
		}
		if (path[cursor] !== "[") invalidPath();
		cursor += 1;
		if (path[cursor] === "\"") {
			const end = scanJsonString(path, cursor);
			let key;
			try {
				key = JSON.parse(path.slice(cursor, end));
			} catch {
				invalidPath();
			}
			if (typeof key !== "string" || path[end] !== "]") invalidPath();
			segments.push({
				kind: "key",
				value: key
			});
			cursor = end + 1;
			continue;
		}
		const match = /^(0|[1-9][0-9]*)\]/u.exec(path.slice(cursor));
		if (!match) invalidPath();
		const index = Number(match[1]);
		if (!Number.isSafeInteger(index)) invalidPath();
		segments.push({
			kind: "index",
			value: index
		});
		cursor += match[0].length;
	}
	return segments;
}
function getAtPath(root, segments) {
	let current = root;
	for (const segment of segments) current = readSegment(current, segment);
	return current;
}
function hasAtPath(root, segments) {
	try {
		getAtPath(root, segments);
		return true;
	} catch (error) {
		if (error instanceof StructuredDataError && (error.code === "PATH_NOT_FOUND" || error.code === "INDEX_OUT_OF_RANGE")) return false;
		throw error;
	}
}
function setAtPath(root, segments, replacement) {
	if (segments.length === 0) return cloneJson(replacement);
	return updateParent(root, segments, (parent, segment) => {
		if (segment.kind === "key") {
			if (!isJsonObject(parent)) typeMismatch("Object path segment requires an object.");
			return {
				...parent,
				[segment.value]: cloneJson(replacement)
			};
		}
		if (!Array.isArray(parent)) typeMismatch("Index path segment requires an array.");
		if (segment.value >= parent.length) indexOutOfRange();
		const result = parent.slice();
		result[segment.value] = cloneJson(replacement);
		return result;
	});
}
function deleteAtPath(root, segments) {
	if (segments.length === 0) throw new StructuredDataError("INVALID_PATH", "The root value cannot be deleted.");
	return updateParent(root, segments, (parent, segment) => {
		if (segment.kind === "key") {
			if (!isJsonObject(parent)) typeMismatch("Object path segment requires an object.");
			if (!Object.hasOwn(parent, segment.value)) pathNotFound();
			const result = { ...parent };
			delete result[segment.value];
			return result;
		}
		if (!Array.isArray(parent)) typeMismatch("Index path segment requires an array.");
		if (segment.value >= parent.length) indexOutOfRange();
		const result = parent.slice();
		result.splice(segment.value, 1);
		return result;
	});
}
function keysAtPath(root, segments) {
	const value = getAtPath(root, segments);
	if (!isJsonObject(value)) typeMismatch("Keys require an object.");
	return Object.keys(value).sort(compareUnicodeCodePoints);
}
function lengthAtPath(root, segments) {
	const value = getAtPath(root, segments);
	if (!Array.isArray(value)) typeMismatch("Length requires an array.");
	return value.length;
}
function iterationEntries(root, segments, maximum) {
	if (!Number.isInteger(maximum) || maximum < 1 || maximum > 1e3) throw new StructuredDataError("ITERATION_LIMIT_EXCEEDED", "Maximum must be from 1 to 1000.");
	const value = getAtPath(root, segments);
	const entries = Array.isArray(value) ? value.map((item, index) => ({
		key: String(index),
		value: item
	})) : isJsonObject(value) ? Object.keys(value).sort(compareUnicodeCodePoints).map((key) => ({
		key,
		value: value[key]
	})) : typeMismatch("Iteration requires an array or object.");
	if (entries.length > maximum) throw new StructuredDataError("ITERATION_LIMIT_EXCEEDED", `Collection contains ${entries.length} items, above maximum ${maximum}.`);
	return entries;
}
function updateParent(root, segments, update) {
	const [segment, ...remaining] = segments;
	if (!segment) return root;
	if (remaining.length === 0) return update(root, segment);
	const next = updateParent(readSegment(root, segment), remaining, update);
	if (segment.kind === "key") {
		if (!isJsonObject(root)) typeMismatch("Object path segment requires an object.");
		return {
			...root,
			[segment.value]: next
		};
	}
	if (!Array.isArray(root)) typeMismatch("Index path segment requires an array.");
	const result = root.slice();
	result[segment.value] = next;
	return result;
}
function readSegment(value, segment) {
	if (segment.kind === "key") {
		if (!isJsonObject(value)) typeMismatch("Object path segment requires an object.");
		if (!Object.hasOwn(value, segment.value)) pathNotFound();
		return value[segment.value];
	}
	if (!Array.isArray(value)) typeMismatch("Index path segment requires an array.");
	if (segment.value >= value.length) indexOutOfRange();
	return value[segment.value];
}
function cloneJson(value) {
	if (Array.isArray(value)) return value.map(cloneJson);
	if (isJsonObject(value)) return Object.fromEntries(Object.keys(value).map((key) => [key, cloneJson(value[key])]));
	return value;
}
function assertJsonValue(value) {
	if (value === null || typeof value === "string" || typeof value === "boolean") return;
	if (typeof value === "number" && Number.isFinite(value)) return;
	if (Array.isArray(value)) {
		for (const item of value) assertJsonValue(item);
		return;
	}
	if (typeof value === "object") {
		for (const item of Object.values(value)) assertJsonValue(item);
		return;
	}
	throw new StructuredDataError("INVALID_JSON", "JSON contains an unsupported value.");
}
function isJsonObject(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function scanJsonString(path, start) {
	let escaped = false;
	for (let index = start + 1; index < path.length; index += 1) {
		const character = path[index];
		if (escaped) escaped = false;
		else if (character === "\\") escaped = true;
		else if (character === "\"") return index + 1;
	}
	invalidPath();
}
function compareUnicodeCodePoints(left, right) {
	const leftPoints = Array.from(left, (character) => character.codePointAt(0));
	const rightPoints = Array.from(right, (character) => character.codePointAt(0));
	const length = Math.min(leftPoints.length, rightPoints.length);
	for (let index = 0; index < length; index += 1) {
		const difference = leftPoints[index] - rightPoints[index];
		if (difference !== 0) return difference;
	}
	return leftPoints.length - rightPoints.length;
}
function invalidPath() {
	throw new StructuredDataError("INVALID_PATH", "Path does not match the supported syntax.");
}
function pathNotFound() {
	throw new StructuredDataError("PATH_NOT_FOUND", "Path does not exist.");
}
function typeMismatch(message) {
	throw new StructuredDataError("TYPE_MISMATCH", message);
}
function indexOutOfRange() {
	throw new StructuredDataError("INDEX_OUT_OF_RANGE", "Array index is out of range.");
}
var PARSE_LIMITS = {
	maxInputBytes: 262144,
	maxDepth: 64,
	maxNodes: 5e4
};
var SIMPLE_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_-]*$/u;
function parseJsonDocument(source) {
	validateInputSize(source);
	const value = parseJson(source);
	validateValueBudget(value, { nodes: 0 }, 0);
	return value;
}
function parseYamlDocument(source) {
	validateInputSize(source);
	const lineCounter = new LineCounter();
	const document = parseDocument(source, {
		lineCounter,
		prettyErrors: false,
		schema: "core",
		uniqueKeys: true
	});
	const problem = document.errors[0] ?? document.warnings[0];
	if (problem) {
		const { line, column } = yamlPosition(lineCounter, problem.pos[0]);
		throw new StructuredDataError("INVALID_YAML", `${problem.code} at line ${line}, column ${column}: ${problem.message}`);
	}
	try {
		return valueFromYamlNode(document.contents, { nodes: 0 }, 0, lineCounter);
	} catch (error) {
		if (error instanceof StructuredDataError) throw error;
		throw new StructuredDataError("INVALID_YAML", error instanceof Error ? error.message : String(error));
	}
}
function renderJsonDocument(value) {
	return stringifyJson(value);
}
function renderYamlDocument(value) {
	return renderYamlValue(value, 0);
}
function valueFromYamlNode(node, budget, depth, lineCounter) {
	consumeBudget(budget, depth);
	if (node === null) return null;
	if (isAlias(node)) throw new StructuredDataError("INVALID_YAML", "YAML aliases are not allowed.");
	if (isScalar(node)) {
		const value = node.value;
		if (value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number" && Number.isFinite(value)) return value;
		throw new StructuredDataError("INVALID_YAML", "YAML contains an unsupported scalar value.");
	}
	if (isSeq(node)) return node.items.map((item) => valueFromYamlNode(item, budget, depth + 1, lineCounter));
	if (isMap(node)) return Object.fromEntries(node.items.map((item) => yamlPairToEntry(item, budget, depth, lineCounter)));
	throw new StructuredDataError("INVALID_YAML", "YAML contains an unsupported node type.");
}
function yamlPairToEntry(pair, budget, depth, lineCounter) {
	if (!isScalar(pair.key) || typeof pair.key.value !== "string") throw new StructuredDataError("INVALID_YAML", "YAML map keys must be strings.");
	return [pair.key.value, valueFromYamlNode(pair.value, budget, depth + 1, lineCounter)];
}
function validateValueBudget(value, budget, depth) {
	consumeBudget(budget, depth);
	if (Array.isArray(value)) for (const item of value) validateValueBudget(item, budget, depth + 1);
	else if (typeof value === "object" && value !== null) for (const item of Object.values(value)) validateValueBudget(item, budget, depth + 1);
}
function consumeBudget(budget, depth) {
	if (depth > PARSE_LIMITS.maxDepth) throw new StructuredDataError("PARSE_LIMIT_EXCEEDED", `Data exceeds maximum nesting depth ${PARSE_LIMITS.maxDepth}.`);
	budget.nodes += 1;
	if (budget.nodes > PARSE_LIMITS.maxNodes) throw new StructuredDataError("PARSE_LIMIT_EXCEEDED", `Data exceeds maximum node count ${PARSE_LIMITS.maxNodes}.`);
}
function validateInputSize(source) {
	const bytes = new TextEncoder().encode(source).byteLength;
	if (bytes > PARSE_LIMITS.maxInputBytes) throw new StructuredDataError("PARSE_LIMIT_EXCEEDED", `Input is ${bytes} bytes; maximum is ${PARSE_LIMITS.maxInputBytes}.`);
}
function renderYamlValue(value, indent) {
	if (isObject(value)) {
		const entries = Object.keys(value).sort(compareUnicodeCodePoints);
		if (entries.length === 0) return `${spaces(indent)}{}`;
		return entries.map((key) => renderValuePair(key, value[key], indent)).join("\n");
	}
	if (Array.isArray(value)) {
		if (value.length === 0) return `${spaces(indent)}[]`;
		return value.map((item) => renderSequenceItem(item, indent)).join("\n");
	}
	return `${spaces(indent)}${renderScalar(value)}`;
}
function renderValuePair(key, value, indent) {
	const prefix = `${spaces(indent)}${renderKey(key)}:`;
	if (!isObject(value) && !Array.isArray(value)) return `${prefix} ${renderScalar(value)}`;
	return `${prefix}\n${renderYamlValue(value, indent + 2)}`;
}
function renderSequenceItem(value, indent) {
	const prefix = `${spaces(indent)}-`;
	if (!isObject(value) && !Array.isArray(value)) return `${prefix} ${renderScalar(value)}`;
	return `${prefix}\n${renderYamlValue(value, indent + 2)}`;
}
function renderKey(key) {
	return SIMPLE_KEY_PATTERN.test(key) ? key : JSON.stringify(key);
}
function renderScalar(value) {
	if (value === null) return "null";
	if (typeof value === "boolean") return value ? "true" : "false";
	if (typeof value === "number") return String(value);
	return JSON.stringify(value);
}
function isObject(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function yamlPosition(counter, offset) {
	const position = counter.linePos(offset);
	return {
		line: position.line,
		column: position.col
	};
}
function spaces(count) {
	return " ".repeat(count);
}
var sourceEditorDefinitions = [
	{
		editorId: "json-document-source",
		opcodes: ["parseJson"],
		bindings: [sourceBinding("TEXT", jsonValueSchemaBundle, parseJsonDocument)]
	},
	{
		editorId: "yaml-document-source",
		opcodes: ["parseYaml"],
		bindings: [sourceBinding("TEXT", jsonValueSchemaBundle, parseYamlDocument, parseYamlDocument, "yaml")]
	},
	{
		editorId: "json-path-value-source",
		opcodes: ["setJsonAtPath"],
		bindings: [sourceBinding("VALUE", jsonValueSchemaBundle, parseJson)]
	}
].map(({ editorId, opcodes, bindings }) => ({
	apiVersion: 1,
	extensionId: extensionConfig.id,
	editorId,
	opcodes: opcodes.map((opcode) => `${extensionConfig.id}_${opcode}`),
	bindings,
	validationContext: () => ({
		consumerId: extensionConfig.id,
		nowMs: Date.now(),
		settings: null
	})
}));
var block_definitions_default = {
	extensionName: "Structured Data",
	blocks: [
		{
			"opcode": "parseJson",
			"blockType": "COMMAND",
			"text": "parse JSON [TEXT] as [NAME]",
			"description": "Parse JSON text into the target-local structured data namespace.",
			"arguments": {
				"TEXT": {
					"type": "STRING",
					"defaultValue": "{\"name\":\"TurboWarp\"}"
				},
				"NAME": {
					"type": "STRING",
					"defaultValue": "data"
				}
			},
			"resultType": "void",
			"effect": "state",
			"immutable": true,
			"errors": [
				"INVALID_JSON",
				"INVALID_NAME",
				"PARSE_LIMIT_EXCEEDED"
			],
			"server": {
				"supported": true,
				"irOperation": "structuredData.parseJson"
			}
		},
		{
			"opcode": "parseYaml",
			"blockType": "COMMAND",
			"text": "parse YAML [TEXT] as [NAME]",
			"description": "Parse safe YAML text into the target-local structured data namespace.",
			"arguments": {
				"TEXT": {
					"type": "STRING",
					"defaultValue": "name: TurboWarp"
				},
				"NAME": {
					"type": "STRING",
					"defaultValue": "data"
				}
			},
			"resultType": "void",
			"effect": "state",
			"immutable": true,
			"errors": [
				"INVALID_YAML",
				"INVALID_NAME",
				"PARSE_LIMIT_EXCEEDED"
			],
			"server": {
				"supported": true,
				"irOperation": "structuredData.parseYaml"
			}
		},
		{
			"opcode": "toJson",
			"blockType": "REPORTER",
			"text": "to JSON [NAME]",
			"description": "Render named structured data as canonical JSON.",
			"arguments": { "NAME": {
				"type": "STRING",
				"defaultValue": "data"
			} },
			"resultType": "jsonText",
			"effect": "pure",
			"immutable": true,
			"errors": ["INVALID_NAME", "DATA_NOT_FOUND"],
			"server": {
				"supported": true,
				"irOperation": "structuredData.toJson"
			}
		},
		{
			"opcode": "toYaml",
			"blockType": "REPORTER",
			"text": "to YAML [NAME]",
			"description": "Render named structured data as deterministic YAML.",
			"arguments": { "NAME": {
				"type": "STRING",
				"defaultValue": "data"
			} },
			"resultType": "yamlText",
			"effect": "pure",
			"immutable": true,
			"errors": ["INVALID_NAME", "DATA_NOT_FOUND"],
			"server": {
				"supported": true,
				"irOperation": "structuredData.toYaml"
			}
		},
		{
			"opcode": "hasStructuredData",
			"blockType": "BOOLEAN",
			"text": "structured data [NAME] exists?",
			"description": "Report whether the current target has named structured data.",
			"arguments": { "NAME": {
				"type": "STRING",
				"defaultValue": "data"
			} },
			"resultType": "boolean",
			"effect": "pure",
			"immutable": true,
			"errors": ["INVALID_NAME"],
			"server": {
				"supported": true,
				"irOperation": "structuredData.hasData"
			}
		},
		{
			"opcode": "deleteStructuredData",
			"blockType": "COMMAND",
			"text": "delete structured data [NAME]",
			"description": "Delete named structured data from the current target.",
			"arguments": { "NAME": {
				"type": "STRING",
				"defaultValue": "data"
			} },
			"resultType": "void",
			"effect": "state",
			"immutable": true,
			"errors": ["INVALID_NAME", "DATA_NOT_FOUND"],
			"server": {
				"supported": true,
				"irOperation": "structuredData.deleteData"
			}
		},
		{
			"opcode": "getJsonAtPath",
			"blockType": "REPORTER",
			"text": "get JSON from [NAME] at path [PATH]",
			"description": "Return a named value at a path as JSON.",
			"arguments": {
				"NAME": {
					"type": "STRING",
					"defaultValue": "data"
				},
				"PATH": {
					"type": "STRING",
					"defaultValue": "$.name",
					"normalizesTo": "pathSegments"
				}
			},
			"resultType": "jsonText",
			"effect": "pure",
			"immutable": true,
			"errors": [
				"INVALID_NAME",
				"DATA_NOT_FOUND",
				"INVALID_PATH",
				"PATH_NOT_FOUND",
				"TYPE_MISMATCH",
				"INDEX_OUT_OF_RANGE"
			],
			"server": {
				"supported": true,
				"irOperation": "structuredData.get"
			}
		},
		{
			"opcode": "hasPath",
			"blockType": "BOOLEAN",
			"text": "structured data [NAME] has path [PATH]?",
			"description": "Report whether a path exists in named structured data.",
			"arguments": {
				"NAME": {
					"type": "STRING",
					"defaultValue": "data"
				},
				"PATH": {
					"type": "STRING",
					"defaultValue": "$.name",
					"normalizesTo": "pathSegments"
				}
			},
			"resultType": "boolean",
			"effect": "pure",
			"immutable": true,
			"errors": [
				"INVALID_NAME",
				"DATA_NOT_FOUND",
				"INVALID_PATH",
				"TYPE_MISMATCH"
			],
			"server": {
				"supported": true,
				"irOperation": "structuredData.has"
			}
		},
		{
			"opcode": "setJsonAtPath",
			"blockType": "COMMAND",
			"text": "set [NAME] at path [PATH] to JSON [VALUE]",
			"description": "Immutably update a named value and replace its binding.",
			"arguments": {
				"NAME": {
					"type": "STRING",
					"defaultValue": "data"
				},
				"PATH": {
					"type": "STRING",
					"defaultValue": "$.name",
					"normalizesTo": "pathSegments"
				},
				"VALUE": {
					"type": "STRING",
					"defaultValue": "\"Scratch\""
				}
			},
			"resultType": "void",
			"effect": "state",
			"immutable": true,
			"errors": [
				"INVALID_NAME",
				"DATA_NOT_FOUND",
				"INVALID_JSON",
				"INVALID_PATH",
				"PATH_NOT_FOUND",
				"TYPE_MISMATCH",
				"INDEX_OUT_OF_RANGE",
				"SCHEMA_VALIDATION_FAILED"
			],
			"server": {
				"supported": true,
				"irOperation": "structuredData.set"
			}
		},
		{
			"opcode": "deleteAtPath",
			"blockType": "COMMAND",
			"text": "delete path [PATH] from [NAME]",
			"description": "Immutably delete a path and replace its named binding.",
			"arguments": {
				"NAME": {
					"type": "STRING",
					"defaultValue": "data"
				},
				"PATH": {
					"type": "STRING",
					"defaultValue": "$.name",
					"normalizesTo": "pathSegments"
				}
			},
			"resultType": "void",
			"effect": "state",
			"immutable": true,
			"errors": [
				"INVALID_NAME",
				"DATA_NOT_FOUND",
				"INVALID_PATH",
				"PATH_NOT_FOUND",
				"TYPE_MISMATCH",
				"INDEX_OUT_OF_RANGE",
				"SCHEMA_VALIDATION_FAILED"
			],
			"server": {
				"supported": true,
				"irOperation": "structuredData.delete"
			}
		},
		{
			"opcode": "keysAtPath",
			"blockType": "REPORTER",
			"text": "keys in [NAME] at path [PATH]",
			"description": "Return sorted object keys as JSON.",
			"arguments": {
				"NAME": {
					"type": "STRING",
					"defaultValue": "data"
				},
				"PATH": {
					"type": "STRING",
					"defaultValue": "$",
					"normalizesTo": "pathSegments"
				}
			},
			"resultType": "jsonText",
			"effect": "pure",
			"immutable": true,
			"errors": [
				"INVALID_NAME",
				"DATA_NOT_FOUND",
				"INVALID_PATH",
				"PATH_NOT_FOUND",
				"TYPE_MISMATCH",
				"INDEX_OUT_OF_RANGE"
			],
			"server": {
				"supported": true,
				"irOperation": "structuredData.keys"
			}
		},
		{
			"opcode": "lengthAtPath",
			"blockType": "REPORTER",
			"text": "length of array in [NAME] at path [PATH]",
			"description": "Return the array length.",
			"arguments": {
				"NAME": {
					"type": "STRING",
					"defaultValue": "data"
				},
				"PATH": {
					"type": "STRING",
					"defaultValue": "$",
					"normalizesTo": "pathSegments"
				}
			},
			"resultType": "number",
			"effect": "pure",
			"immutable": true,
			"errors": [
				"INVALID_NAME",
				"DATA_NOT_FOUND",
				"INVALID_PATH",
				"PATH_NOT_FOUND",
				"TYPE_MISMATCH",
				"INDEX_OUT_OF_RANGE"
			],
			"server": {
				"supported": true,
				"irOperation": "structuredData.length"
			}
		},
		{
			"opcode": "forEachAtPath",
			"blockType": "LOOP",
			"text": "for each in [NAME] at path [PATH] max [MAX]",
			"description": "Iterate named data deterministically with a static maximum.",
			"arguments": {
				"NAME": {
					"type": "STRING",
					"defaultValue": "data"
				},
				"PATH": {
					"type": "STRING",
					"defaultValue": "$",
					"normalizesTo": "pathSegments"
				},
				"MAX": {
					"type": "NUMBER",
					"defaultValue": 100,
					"staticLiteral": true,
					"minimum": 1,
					"maximum": 1e3
				}
			},
			"resultType": "void",
			"effect": "control",
			"immutable": true,
			"errors": [
				"INVALID_NAME",
				"DATA_NOT_FOUND",
				"INVALID_PATH",
				"PATH_NOT_FOUND",
				"TYPE_MISMATCH",
				"INDEX_OUT_OF_RANGE",
				"ITERATION_LIMIT_EXCEEDED"
			],
			"server": {
				"supported": true,
				"irOperation": "structuredData.forEach"
			}
		},
		{
			"opcode": "currentKey",
			"blockType": "REPORTER",
			"text": "current key",
			"description": "Return the current object key or array index string.",
			"arguments": {},
			"resultType": "string",
			"effect": "control",
			"immutable": true,
			"errors": ["ITERATION_CONTEXT_REQUIRED"],
			"server": {
				"supported": true,
				"irOperation": "structuredData.currentKey"
			}
		},
		{
			"opcode": "currentIndex",
			"blockType": "REPORTER",
			"text": "current index",
			"description": "Return the zero-based iteration number.",
			"arguments": {},
			"resultType": "number",
			"effect": "control",
			"immutable": true,
			"errors": ["ITERATION_CONTEXT_REQUIRED"],
			"server": {
				"supported": true,
				"irOperation": "structuredData.currentIndex"
			}
		},
		{
			"opcode": "currentValueJson",
			"blockType": "REPORTER",
			"text": "current value JSON",
			"description": "Return the current iteration value as JSON.",
			"arguments": {},
			"resultType": "jsonText",
			"effect": "control",
			"immutable": true,
			"errors": ["ITERATION_CONTEXT_REQUIRED"],
			"server": {
				"supported": true,
				"irOperation": "structuredData.currentValue"
			}
		},
		{
			"opcode": "defineSchema",
			"blockType": "COMMAND",
			"text": "define schema [SCHEMA_ID] version [VERSION] from JSON [TEXT]",
			"description": "Register a reusable Schema document from JSON text under a stable id and version.",
			"arguments": {
				"SCHEMA_ID": {
					"type": "STRING",
					"defaultValue": "sensor.reading"
				},
				"VERSION": {
					"type": "STRING",
					"defaultValue": "1.0.0"
				},
				"TEXT": {
					"type": "STRING",
					"defaultValue": "{\"type\":\"object\",\"properties\":{\"name\":{\"type\":\"string\"}},\"required\":[\"name\"]}"
				}
			},
			"resultType": "void",
			"effect": "state",
			"immutable": true,
			"errors": ["INVALID_SCHEMA"],
			"server": {
				"supported": true,
				"irOperation": "structuredData.defineSchema"
			}
		},
		{
			"opcode": "beginSchema",
			"blockType": "COMMAND",
			"text": "begin schema [SCHEMA_ID] version [VERSION] extra properties [EXTRA]",
			"description": "Start a visual Schema definition for an object, replacing any open draft.",
			"arguments": {
				"SCHEMA_ID": {
					"type": "STRING",
					"defaultValue": "sensor.reading"
				},
				"VERSION": {
					"type": "STRING",
					"defaultValue": "1.0.0"
				},
				"EXTRA": {
					"type": "STRING",
					"defaultValue": "reject"
				}
			},
			"resultType": "void",
			"effect": "state",
			"immutable": true,
			"errors": ["INVALID_SCHEMA"],
			"server": {
				"supported": true,
				"irOperation": "structuredData.beginSchema"
			}
		},
		{
			"opcode": "addSchemaProperty",
			"blockType": "COMMAND",
			"text": "add property [PROPERTY] type [TYPE] [REQUIRED]",
			"description": "Add one property of the subset types to the open visual Schema draft.",
			"arguments": {
				"PROPERTY": {
					"type": "STRING",
					"defaultValue": "name"
				},
				"TYPE": {
					"type": "STRING",
					"defaultValue": "string"
				},
				"REQUIRED": {
					"type": "STRING",
					"defaultValue": "required"
				}
			},
			"resultType": "void",
			"effect": "state",
			"immutable": true,
			"errors": ["INVALID_SCHEMA"],
			"server": {
				"supported": true,
				"irOperation": "structuredData.addSchemaProperty"
			}
		},
		{
			"opcode": "commitSchema",
			"blockType": "COMMAND",
			"text": "commit schema",
			"description": "Register the open visual draft as the same canonical Schema a text definition produces.",
			"arguments": {},
			"resultType": "void",
			"effect": "state",
			"immutable": true,
			"errors": ["INVALID_SCHEMA"],
			"server": {
				"supported": true,
				"irOperation": "structuredData.commitSchema"
			}
		},
		{
			"opcode": "hasSchema",
			"blockType": "BOOLEAN",
			"text": "schema [SCHEMA_ID] version [VERSION] exists?",
			"description": "Report whether the current target has that Schema registered.",
			"arguments": {
				"SCHEMA_ID": {
					"type": "STRING",
					"defaultValue": "sensor.reading"
				},
				"VERSION": {
					"type": "STRING",
					"defaultValue": "1.0.0"
				}
			},
			"resultType": "boolean",
			"effect": "pure",
			"immutable": true,
			"errors": ["INVALID_SCHEMA"],
			"server": {
				"supported": true,
				"irOperation": "structuredData.hasSchema"
			}
		},
		{
			"opcode": "deleteSchema",
			"blockType": "COMMAND",
			"text": "delete schema [SCHEMA_ID] version [VERSION]",
			"description": "Delete a registered Schema; bindings already validated against it keep their values.",
			"arguments": {
				"SCHEMA_ID": {
					"type": "STRING",
					"defaultValue": "sensor.reading"
				},
				"VERSION": {
					"type": "STRING",
					"defaultValue": "1.0.0"
				}
			},
			"resultType": "void",
			"effect": "state",
			"immutable": true,
			"errors": ["INVALID_SCHEMA", "SCHEMA_NOT_FOUND"],
			"server": {
				"supported": true,
				"irOperation": "structuredData.deleteSchema"
			}
		},
		{
			"opcode": "parseJsonWithSchema",
			"blockType": "COMMAND",
			"text": "parse JSON [TEXT] as [NAME] with schema [SCHEMA_ID] version [VERSION]",
			"description": "Parse JSON text and bind it only when it matches the named Schema.",
			"arguments": {
				"TEXT": {
					"type": "STRING",
					"defaultValue": "{\"name\":\"TurboWarp\"}"
				},
				"NAME": {
					"type": "STRING",
					"defaultValue": "data"
				},
				"SCHEMA_ID": {
					"type": "STRING",
					"defaultValue": "sensor.reading"
				},
				"VERSION": {
					"type": "STRING",
					"defaultValue": "1.0.0"
				}
			},
			"resultType": "void",
			"effect": "state",
			"immutable": true,
			"errors": [
				"INVALID_JSON",
				"INVALID_NAME",
				"PARSE_LIMIT_EXCEEDED",
				"INVALID_SCHEMA",
				"SCHEMA_NOT_FOUND",
				"SCHEMA_VALIDATION_FAILED"
			],
			"server": {
				"supported": true,
				"irOperation": "structuredData.parseJsonWithSchema"
			}
		},
		{
			"opcode": "parseYamlWithSchema",
			"blockType": "COMMAND",
			"text": "parse YAML [TEXT] as [NAME] with schema [SCHEMA_ID] version [VERSION]",
			"description": "Parse safe YAML text and bind it only when it matches the named Schema.",
			"arguments": {
				"TEXT": {
					"type": "STRING",
					"defaultValue": "name: TurboWarp"
				},
				"NAME": {
					"type": "STRING",
					"defaultValue": "data"
				},
				"SCHEMA_ID": {
					"type": "STRING",
					"defaultValue": "sensor.reading"
				},
				"VERSION": {
					"type": "STRING",
					"defaultValue": "1.0.0"
				}
			},
			"resultType": "void",
			"effect": "state",
			"immutable": true,
			"errors": [
				"INVALID_YAML",
				"INVALID_NAME",
				"PARSE_LIMIT_EXCEEDED",
				"INVALID_SCHEMA",
				"SCHEMA_NOT_FOUND",
				"SCHEMA_VALIDATION_FAILED"
			],
			"server": {
				"supported": true,
				"irOperation": "structuredData.parseYamlWithSchema"
			}
		},
		{
			"opcode": "schemaOf",
			"blockType": "REPORTER",
			"text": "schema of [NAME]",
			"description": "Return the schemaRef bound to named data as JSON, or an empty object when it has none.",
			"arguments": { "NAME": {
				"type": "STRING",
				"defaultValue": "data"
			} },
			"resultType": "jsonText",
			"effect": "pure",
			"immutable": true,
			"errors": ["INVALID_NAME", "DATA_NOT_FOUND"],
			"server": {
				"supported": true,
				"irOperation": "structuredData.schemaOf"
			}
		}
	]
};
/**
* A small JSON Schema validator for function arguments and returns. It interprets the schema at run time and
* never generates code, so it also works where `eval` is unavailable (for example Cloudflare Workers).
*
* Supported keywords: type, properties, required, additionalProperties (boolean), items, enum,
* const, minimum, maximum, minLength, maxLength, minItems, maxItems. Other keywords, such as
* description and title, are ignored.
*/
function validateAgainstSchema(value, schema, path = "$") {
	const rule = asRecord(schema);
	if (!rule) throw new Error(`${path} must be a JSON Schema object`);
	assertSchemaNode(rule, path);
	return validateValue(value, rule, path);
}
/** Reject malformed schemas before a function definition or call can use them. */
function validateSchemaDefinition(schema, label = "schema") {
	const rule = asRecord(schema);
	if (!rule) throw new Error(`${label} must be a JSON object`);
	assertSchemaNode(rule, label);
}
function validateValue(value, rule, path) {
	const errors = [];
	if (rule.type !== void 0) {
		const types = Array.isArray(rule.type) ? rule.type : [rule.type];
		if (!types.some((type) => matchesType(value, type))) return [`${path} must be ${types.join(" or ")}`];
	}
	if (Array.isArray(rule.enum) && !rule.enum.some((candidate) => deepEqual(candidate, value))) errors.push(`${path} must be one of ${rule.enum.map((item) => JSON.stringify(item)).join(", ")}`);
	if ("const" in rule && !deepEqual(rule.const, value)) errors.push(`${path} must be ${JSON.stringify(rule.const)}`);
	if (typeof value === "number") {
		if (typeof rule.minimum === "number" && value < rule.minimum) errors.push(`${path} must be >= ${rule.minimum}`);
		if (typeof rule.maximum === "number" && value > rule.maximum) errors.push(`${path} must be <= ${rule.maximum}`);
	}
	if (typeof value === "string") {
		const length = [...value].length;
		if (typeof rule.minLength === "number" && length < rule.minLength) errors.push(`${path} must have at least ${rule.minLength} characters`);
		if (typeof rule.maxLength === "number" && length > rule.maxLength) errors.push(`${path} must have at most ${rule.maxLength} characters`);
	}
	if (Array.isArray(value)) {
		if (typeof rule.minItems === "number" && value.length < rule.minItems) errors.push(`${path} must have at least ${rule.minItems} items`);
		if (typeof rule.maxItems === "number" && value.length > rule.maxItems) errors.push(`${path} must have at most ${rule.maxItems} items`);
		if (rule.items !== void 0) value.forEach((item, index) => errors.push(...validateValue(item, rule.items, `${path}[${index}]`)));
	}
	const object = asRecord(value);
	if (object) {
		const properties = asRecord(rule.properties) ?? {};
		if (Array.isArray(rule.required)) {
			for (const name of rule.required) if (typeof name === "string" && !Object.hasOwn(object, name)) errors.push(`${path}.${name} is required`);
		}
		for (const [name, child] of Object.entries(object)) if (Object.hasOwn(properties, name)) errors.push(...validateValue(child, properties[name], `${path}.${name}`));
		else if (rule.additionalProperties === false) errors.push(`${path}.${name} is not allowed`);
	}
	return errors;
}
function assertSchemaNode(rule, path) {
	const validTypes = /* @__PURE__ */ new Set([
		"object",
		"array",
		"string",
		"number",
		"integer",
		"boolean",
		"null"
	]);
	if (rule.type !== void 0) {
		const types = Array.isArray(rule.type) ? rule.type : [rule.type];
		if (types.length === 0 || types.some((type) => typeof type !== "string" || !validTypes.has(type))) throw new Error(`${path}.type must be a supported JSON Schema type or non-empty type array`);
	}
	if (rule.properties !== void 0) {
		const properties = asRecord(rule.properties);
		if (!properties) throw new Error(`${path}.properties must be an object`);
		for (const [name, child] of Object.entries(properties)) {
			const childRule = asRecord(child);
			if (!childRule) throw new Error(`${path}.properties.${name} must be a JSON Schema object`);
			assertSchemaNode(childRule, `${path}.properties.${name}`);
		}
	}
	if (rule.required !== void 0 && (!Array.isArray(rule.required) || rule.required.some((name) => typeof name !== "string"))) throw new Error(`${path}.required must be an array of strings`);
	if (rule.additionalProperties !== void 0 && typeof rule.additionalProperties !== "boolean") throw new Error(`${path}.additionalProperties must be a boolean`);
	if (rule.items !== void 0) {
		const items = asRecord(rule.items);
		if (!items) throw new Error(`${path}.items must be a JSON Schema object`);
		assertSchemaNode(items, `${path}.items`);
	}
	if (rule.enum !== void 0 && (!Array.isArray(rule.enum) || rule.enum.length === 0)) throw new Error(`${path}.enum must be a non-empty array`);
	for (const keyword of ["minimum", "maximum"]) if (rule[keyword] !== void 0 && (typeof rule[keyword] !== "number" || !Number.isFinite(rule[keyword]))) throw new Error(`${path}.${keyword} must be a finite number`);
	for (const keyword of [
		"minLength",
		"maxLength",
		"minItems",
		"maxItems"
	]) {
		const value = rule[keyword];
		if (value !== void 0 && (typeof value !== "number" || !Number.isInteger(value) || value < 0)) throw new Error(`${path}.${keyword} must be a non-negative integer`);
	}
	if (typeof rule.minimum === "number" && typeof rule.maximum === "number" && rule.minimum > rule.maximum) throw new Error(`${path}.minimum cannot exceed maximum`);
	if (typeof rule.minLength === "number" && typeof rule.maxLength === "number" && rule.minLength > rule.maxLength) throw new Error(`${path}.minLength cannot exceed maxLength`);
	if (typeof rule.minItems === "number" && typeof rule.maxItems === "number" && rule.minItems > rule.maxItems) throw new Error(`${path}.minItems cannot exceed maxItems`);
}
function matchesType(value, type) {
	switch (type) {
		case "object": return asRecord(value) !== null;
		case "array": return Array.isArray(value);
		case "string": return typeof value === "string";
		case "number": return typeof value === "number" && Number.isFinite(value);
		case "integer": return typeof value === "number" && Number.isInteger(value);
		case "boolean": return typeof value === "boolean";
		case "null": return value === null;
		default: return false;
	}
}
function deepEqual(left, right) {
	return JSON.stringify(left) === JSON.stringify(right);
}
function asRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value) ? value : null;
}
var SCHEMA_PROPERTY_TYPES = [
	"object",
	"array",
	"string",
	"number",
	"integer",
	"boolean",
	"null"
];
var SCHEMA_ID_PATTERN = /^[a-z][a-z0-9.-]{0,127}$/u;
/** Complete Semantic Version, matching the named-data schemaRef contract. */
var SCHEMA_VERSION_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][\dA-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][\dA-Za-z-]*))*))?(?:\+([\dA-Za-z-]+(?:\.[\dA-Za-z-]+)*))?$/u;
function schemaKey(reference) {
	return `${reference.id}@${reference.version}`;
}
function parseSchemaReference(rawId, rawVersion) {
	const id = String(rawId).trim();
	const version = String(rawVersion).trim();
	if (!SCHEMA_ID_PATTERN.test(id)) throw new StructuredDataError("INVALID_SCHEMA", `Schema id must match ${SCHEMA_ID_PATTERN.source}: ${id}`, { schemaId: id });
	if (!SCHEMA_VERSION_PATTERN.test(version)) throw new StructuredDataError("INVALID_SCHEMA", `Schema version must be a complete Semantic Version: ${version}`, {
		schemaId: id,
		schemaVersion: version
	});
	return {
		id,
		version
	};
}
/** Reads a Schema document from JSON text and refuses malformed schemas before they are stored. */
function parseSchemaDocument(text, reference) {
	let document;
	try {
		document = parseJson(text);
	} catch {
		throw new StructuredDataError("INVALID_SCHEMA", "Schema must be valid JSON.", {
			schemaId: reference.id,
			schemaVersion: reference.version
		});
	}
	return assertSchemaDocument(document, reference);
}
function assertSchemaDocument(document, reference) {
	try {
		validateSchemaDefinition(document, "schema");
	} catch (error) {
		throw new StructuredDataError("INVALID_SCHEMA", error instanceof Error ? error.message : String(error), {
			schemaId: reference.id,
			schemaVersion: reference.version
		});
	}
	return document;
}
function schemaEntry(reference, document) {
	return {
		reference,
		canonical: stringifyJson(document),
		document
	};
}
/**
* Checks a whole candidate value and reports the first failure with the schema identity, the data
* name, the failing path and the expectation. Callers validate the complete candidate before they
* replace a binding, so a rejected update leaves the previous value in place.
*/
function assertValueMatchesSchema(value, entry, dataName) {
	const [first] = validateAgainstSchema(value, entry.document);
	if (first === void 0) return;
	const { path, expected } = splitDiagnostic(first);
	throw new StructuredDataError("SCHEMA_VALIDATION_FAILED", `Structured data ${dataName} does not match schema ${schemaKey(entry.reference)}: ${first}`, {
		dataName,
		schemaId: entry.reference.id,
		schemaVersion: entry.reference.version,
		path,
		expected
	});
}
function beginSchemaDraft(reference, additionalProperties) {
	return {
		reference,
		additionalProperties,
		properties: /* @__PURE__ */ new Map(),
		required: /* @__PURE__ */ new Set()
	};
}
function addDraftProperty(draft, rawProperty, rawType, required) {
	const property = String(rawProperty).trim();
	if (property.length === 0) throw new StructuredDataError("INVALID_SCHEMA", "Property name cannot be empty.", {
		schemaId: draft.reference.id,
		schemaVersion: draft.reference.version
	});
	const type = String(rawType).trim();
	if (!SCHEMA_PROPERTY_TYPES.includes(type)) throw new StructuredDataError("INVALID_SCHEMA", `Property type must be one of ${SCHEMA_PROPERTY_TYPES.join(", ")}: ${type}`, {
		schemaId: draft.reference.id,
		schemaVersion: draft.reference.version,
		path: `$.${property}`,
		expected: SCHEMA_PROPERTY_TYPES.join(" or ")
	});
	draft.properties.set(property, type);
	if (required) draft.required.add(property);
	else draft.required.delete(property);
}
/**
* Converts a draft to the same canonical document a text definition of the same shape produces.
* Property order never matters: object keys are canonicalized and `required` is sorted.
*/
function draftToSchemaDocument(draft) {
	const properties = {};
	for (const [property, type] of draft.properties) properties[property] = { type };
	const document = {
		type: "object",
		properties,
		additionalProperties: draft.additionalProperties
	};
	if (draft.required.size > 0) document.required = [...draft.required].sort();
	return document;
}
function parseAdditionalProperties(raw, reference) {
	const value = String(raw).trim();
	if (value === "allow") return true;
	if (value === "reject") return false;
	throw new StructuredDataError("INVALID_SCHEMA", `Extra properties must be allow or reject: ${value}`, {
		schemaId: reference.id,
		schemaVersion: reference.version,
		expected: "allow or reject"
	});
}
function parseRequiredFlag(raw, reference) {
	const value = String(raw).trim();
	if (value === "required") return true;
	if (value === "optional") return false;
	throw new StructuredDataError("INVALID_SCHEMA", `Property requirement must be required or optional: ${value}`, {
		schemaId: reference.id,
		schemaVersion: reference.version,
		expected: "required or optional"
	});
}
var DIAGNOSTIC_PREDICATES = [
	" must be ",
	" must have ",
	" is required",
	" is not allowed"
];
/**
* Splits a shared-validator diagnostic into its path and expectation. The message text itself is
* kept verbatim so a failure reads the same here as it does for a named function argument.
*/
function splitDiagnostic(message) {
	const boundary = DIAGNOSTIC_PREDICATES.map((predicate) => message.indexOf(predicate)).filter((index) => index >= 0).sort((left, right) => left - right)[0];
	if (boundary === void 0) return {
		path: "$",
		expected: message
	};
	return {
		path: message.slice(0, boundary),
		expected: message.slice(boundary + 1).replace(/^(?:must be|must have|is) /u, "")
	};
}
var STRUCTURED_DATA_NAMESPACE = "structured";
var STRUCTURED_BODY_MAX_BYTES = 262144;
var StructuredDataNamedDataProvider = class {
	constructor(store, maxBodyBytes = STRUCTURED_BODY_MAX_BYTES, schemaRefEnabled = isNamedDataSchemaRefEnabled()) {
		this.store = store;
		this.maxBodyBytes = maxBodyBytes;
		this.schemaRefEnabled = schemaRefEnabled;
		this.namespace = STRUCTURED_DATA_NAMESPACE;
		this.kind = "structured";
		this.openBodies = /* @__PURE__ */ new Set();
		this.released = false;
	}
	canResolve(reference, representation) {
		return reference.namespace === this.namespace && reference.kind === this.kind && reference.scope === "target" && (representation === "json" || representation === "yaml");
	}
	stat(reference, representation, context) {
		const resolved = this.resolve(reference, representation, context);
		return this.metadata(reference, resolved.nativeRepresentation, representation, resolved.bytes.byteLength, resolved.revision, resolved.schemaRef);
	}
	openBody(reference, representation, context) {
		const resolved = this.resolve(reference, representation, context);
		const handle = Symbol("structured-body");
		this.openBodies.add(handle);
		let released = false;
		return {
			...this.metadata(reference, resolved.nativeRepresentation, representation, resolved.bytes.byteLength, resolved.revision, resolved.schemaRef),
			body: resolved.bytes,
			release: () => {
				if (released) return;
				released = true;
				this.openBodies.delete(handle);
			}
		};
	}
	release() {
		this.released = true;
		this.openBodies.clear();
	}
	clearSession() {
		this.openBodies.clear();
	}
	resolve(reference, representation, context) {
		if (this.released) throw new NamedDataError("NAMED_DATA_PROVIDER_RELEASED", "The structured provider was released.");
		this.validateReference(reference, context);
		this.throwIfAborted(context.signal);
		const binding = this.store.get(context.target, reference.name);
		if (!binding) throw new NamedDataError("NAMED_DATA_NOT_FOUND", `Structured data does not exist: ${reference.name}`);
		const requestedSchemaRef = reference.schemaRef;
		if (requestedSchemaRef !== void 0 && !this.schemaRefEnabled) throw new NamedDataError("NAMED_DATA_SCHEMA_UNRESOLVED", "Schema reference resolution is disabled.");
		if (requestedSchemaRef !== void 0 && (binding.schemaRef?.id !== requestedSchemaRef.id || binding.schemaRef?.version !== requestedSchemaRef.version)) throw new NamedDataError("NAMED_DATA_SCHEMA_VERSION_MISMATCH", "Binding schemaRef does not match the requested reference.");
		const text = this.render(binding.value, representation);
		const bytes = new TextEncoder().encode(text);
		if (bytes.byteLength > this.maxBodyBytes) throw new NamedDataError("NAMED_DATA_BODY_TOO_LARGE", `Encoded body is ${bytes.byteLength} bytes; maximum is ${this.maxBodyBytes}.`);
		this.throwIfAborted(context.signal);
		return {
			bytes,
			revision: binding.revision,
			nativeRepresentation: binding.nativeRepresentation,
			...requestedSchemaRef === void 0 ? {} : { schemaRef: binding.schemaRef }
		};
	}
	validateReference(reference, context) {
		if (reference.namespace !== this.namespace || reference.name.trim().length === 0) throw new NamedDataError("NAMED_DATA_INVALID_REF", "Invalid structured data reference.");
		if (reference.kind !== this.kind) throw new NamedDataError("NAMED_DATA_KIND_MISMATCH", `Expected ${this.kind}, received ${reference.kind}.`);
		if (reference.scope !== "target" || !context.target) throw new NamedDataError("NAMED_DATA_SCOPE_MISMATCH", "Structured data currently requires a target scope and target context.");
	}
	render(value, representation) {
		if (representation === "json") return renderJsonDocument(value);
		if (representation === "yaml") return renderYamlDocument(value);
		throw new NamedDataError("NAMED_DATA_REPRESENTATION_UNSUPPORTED", `Structured data cannot be rendered as ${representation}.`);
	}
	metadata(reference, nativeRepresentation, representation, byteLength, revision, schemaRef) {
		return {
			reference: { ...reference },
			nativeRepresentation,
			representation,
			mediaType: representation === "json" ? "application/json; charset=utf-8" : "application/yaml; charset=utf-8",
			byteLength,
			revision: String(revision),
			replayable: true,
			...schemaRef === void 0 ? {} : { schemaRef }
		};
	}
	throwIfAborted(signal) {
		if (signal?.aborted) throw new NamedDataError("NAMED_DATA_ABORTED", "Body resolution was aborted.");
	}
};
var LOOP_STATE = "structuredDataLoopState";
var blockDefinitions = block_definitions_default.blocks;
/** Blocks that only appear while the startup-fixed schema flag is on. */
var SCHEMA_OPCODES = /* @__PURE__ */ new Set([
	"defineSchema",
	"beginSchema",
	"addSchemaProperty",
	"commitSchema",
	"hasSchema",
	"deleteSchema",
	"parseJsonWithSchema",
	"parseYamlWithSchema",
	"schemaOf"
]);
var StructuredDataExtension = class {
	constructor(scratch, enabled = isStructuredDataMvpEnabled(), namedDataEnabled = isNamedDataRegistryMvpEnabled(), schemaEnabled = isStructuredSchemaEnabled()) {
		this.scratch = scratch;
		this.schemaEnabled = schemaEnabled;
		this.disposed = false;
		this.registries = /* @__PURE__ */ new WeakMap();
		this.schemaRegistries = /* @__PURE__ */ new WeakMap();
		this.schemaDrafts = /* @__PURE__ */ new WeakMap();
		this.iterationStacks = /* @__PURE__ */ new WeakMap();
		this.nextRevision = 1;
		this.enabled = enabled;
		this.unregisterSourceEditors = registerSourceEditors(this.scratch, enabled ? sourceEditorDefinitions : []);
		const runtime = this.scratch.vm?.runtime;
		const onDispose = () => {
			this.dispose();
		};
		const onStop = () => this.clearRuntimeState();
		this.releaseRuntimeListeners = () => {
			runtime?.off?.("RUNTIME_DISPOSED", onDispose);
			runtime?.off?.("PROJECT_STOP_ALL", onStop);
		};
		let unregisterFixed = () => {};
		try {
			unregisterFixed = registerFixedInputEditors(this.scratch, enabled ? fixedInputEditorDefinitions : []);
			this.unregisterFixedInputEditors = unregisterFixed;
			if (namedDataEnabled) {
				this.namedDataProvider = new StructuredDataNamedDataProvider({ get: (target, name) => this.registries.get(target)?.get(name) });
				const runtime = this.scratch.vm?.runtime;
				if (runtime) {
					this.namedDataRegistry = installNamedDataRegistry(runtime);
					this.namedDataRegistration = this.namedDataRegistry.registerProvider(this.namedDataProvider, { lifetime: "persistent" });
					this.unbindNamedDataRegistryLifecycle = bindNamedDataRegistryLifecycle(runtime, this.namedDataRegistry);
					runtime.on?.("RUNTIME_DISPOSED", onDispose);
				}
			}
			runtime?.on?.("PROJECT_STOP_ALL", onStop);
		} catch (error) {
			this.releaseRuntimeListeners();
			unregisterFixed();
			this.unregisterSourceEditors();
			this.unbindNamedDataRegistryLifecycle?.();
			this.namedDataRegistration?.unregister().catch(() => {});
			throw error;
		}
	}
	getNamedDataProvider() {
		return this.namedDataProvider;
	}
	getNamedDataRegistry() {
		return this.namedDataRegistry;
	}
	async dispose() {
		if (this.disposed) return;
		this.disposed = true;
		this.releaseRuntimeListeners();
		this.unregisterFixedInputEditors();
		this.unregisterSourceEditors();
		await this.namedDataRegistration?.unregister();
		this.unbindNamedDataRegistryLifecycle?.();
	}
	getInfo() {
		return {
			id: extensionConfig.id,
			name: this.scratch.translate(block_definitions_default.extensionName),
			docsURI: extensionConfig.docsURI,
			blockIconURI: extensionConfig.blockIconURI,
			blocks: this.enabled ? blockDefinitions.filter((block) => this.schemaEnabled || !SCHEMA_OPCODES.has(block.opcode)).map((block) => this.toScratchBlock(block)) : []
		};
	}
	parseJson(args, util) {
		this.store(util.target, args.NAME, parseJsonDocument(this.scratch.Cast.toString(args.TEXT)), "json");
	}
	parseYaml(args, util) {
		this.store(util.target, args.NAME, parseYamlDocument(this.scratch.Cast.toString(args.TEXT)), "yaml");
	}
	toJson(args, util) {
		return renderJsonDocument(this.requireData(util.target, args.NAME));
	}
	toYaml(args, util) {
		return renderYamlDocument(this.requireData(util.target, args.NAME));
	}
	hasStructuredData(args, util) {
		return this.registryFor(util.target).has(this.name(args.NAME));
	}
	deleteStructuredData(args, util) {
		const registry = this.registryFor(util.target);
		const name = this.name(args.NAME);
		if (!registry.delete(name)) this.dataNotFound(name);
	}
	getJsonAtPath(args, util) {
		return stringifyJson(getAtPath(this.requireData(util.target, args.NAME), this.path(args.PATH)));
	}
	hasPath(args, util) {
		return hasAtPath(this.requireData(util.target, args.NAME), this.path(args.PATH));
	}
	setJsonAtPath(args, util) {
		const name = this.name(args.NAME);
		const updated = setAtPath(this.requireDataByName(util.target, name), this.path(args.PATH), parseJson(this.scratch.Cast.toString(args.VALUE)));
		this.assertCandidate(util.target, name, updated);
		this.setBinding(util.target, name, updated);
	}
	deleteAtPath(args, util) {
		const name = this.name(args.NAME);
		const updated = deleteAtPath(this.requireDataByName(util.target, name), this.path(args.PATH));
		this.assertCandidate(util.target, name, updated);
		this.setBinding(util.target, name, updated);
	}
	keysAtPath(args, util) {
		return JSON.stringify(keysAtPath(this.requireData(util.target, args.NAME), this.path(args.PATH)));
	}
	lengthAtPath(args, util) {
		return lengthAtPath(this.requireData(util.target, args.NAME), this.path(args.PATH));
	}
	forEachAtPath(args, util) {
		let state = util.stackFrame[LOOP_STATE];
		const stack = this.stackFor(util.thread);
		if (!state) {
			state = {
				entries: iterationEntries(this.requireData(util.target, args.NAME), this.path(args.PATH), this.scratch.Cast.toNumber(args.MAX)),
				cursor: 0,
				active: false
			};
			util.stackFrame[LOOP_STATE] = state;
		} else if (state.active) {
			if (stack.at(-1)?.index === state.cursor) stack.pop();
			state.cursor += 1;
			state.active = false;
		}
		const entry = state.entries[state.cursor];
		if (!entry) {
			delete util.stackFrame[LOOP_STATE];
			if (stack.length === 0) this.iterationStacks.delete(util.thread);
			return;
		}
		stack.push({
			...entry,
			index: state.cursor
		});
		state.active = true;
		util.startBranch(1, true);
	}
	currentKey(_args, util) {
		return this.currentIteration(util.thread).key;
	}
	currentIndex(_args, util) {
		return this.currentIteration(util.thread).index;
	}
	currentValueJson(_args, util) {
		return stringifyJson(this.currentIteration(util.thread).value);
	}
	defineSchema(args, util) {
		this.requireSchemaSupport();
		const reference = parseSchemaReference(args.SCHEMA_ID, args.VERSION);
		const document = parseSchemaDocument(this.scratch.Cast.toString(args.TEXT), reference);
		this.schemaRegistryFor(util.target).set(schemaKey(reference), schemaEntry(reference, document));
	}
	beginSchema(args, util) {
		this.requireSchemaSupport();
		const reference = parseSchemaReference(args.SCHEMA_ID, args.VERSION);
		const additionalProperties = parseAdditionalProperties(this.scratch.Cast.toString(args.EXTRA), reference);
		this.schemaDrafts.set(util.target, beginSchemaDraft(reference, additionalProperties));
	}
	addSchemaProperty(args, util) {
		this.requireSchemaSupport();
		const draft = this.requireDraft(util.target);
		addDraftProperty(draft, this.scratch.Cast.toString(args.PROPERTY), this.scratch.Cast.toString(args.TYPE), parseRequiredFlag(this.scratch.Cast.toString(args.REQUIRED), draft.reference));
	}
	commitSchema(_args, util) {
		this.requireSchemaSupport();
		const draft = this.requireDraft(util.target);
		const entry = schemaEntry(draft.reference, draftToSchemaDocument(draft));
		this.schemaRegistryFor(util.target).set(schemaKey(draft.reference), entry);
		this.schemaDrafts.delete(util.target);
	}
	hasSchema(args, util) {
		this.requireSchemaSupport();
		return this.schemaRegistryFor(util.target).has(schemaKey(parseSchemaReference(args.SCHEMA_ID, args.VERSION)));
	}
	deleteSchema(args, util) {
		this.requireSchemaSupport();
		const reference = parseSchemaReference(args.SCHEMA_ID, args.VERSION);
		if (!this.schemaRegistryFor(util.target).delete(schemaKey(reference))) this.schemaNotFound(reference);
	}
	parseJsonWithSchema(args, util) {
		this.storeWithSchema(args, util, parseJsonDocument, "json");
	}
	parseYamlWithSchema(args, util) {
		this.storeWithSchema(args, util, parseYamlDocument, "yaml");
	}
	schemaOf(args, util) {
		this.requireSchemaSupport();
		const name = this.name(args.NAME);
		const binding = this.registryFor(util.target).get(name);
		if (binding === void 0) this.dataNotFound(name);
		const reference = binding.schemaRef;
		return stringifyJson(reference === void 0 ? {} : {
			id: reference.id,
			version: reference.version
		});
	}
	/** Parses a document and binds it only when the whole value matches the referenced Schema. */
	storeWithSchema(args, util, decode, nativeRepresentation) {
		this.requireSchemaSupport();
		const reference = parseSchemaReference(args.SCHEMA_ID, args.VERSION);
		const entry = this.requireSchema(util.target, reference);
		const name = this.name(args.NAME);
		const candidate = decode(this.scratch.Cast.toString(args.TEXT));
		assertValueMatchesSchema(candidate, entry, name);
		this.setBinding(util.target, name, candidate, nativeRepresentation, entry.reference);
	}
	/**
	* Checks a candidate for a schema-bound binding before it replaces the stored value. Every path
	* writer builds its candidate immutably, so a rejection leaves the previous binding untouched.
	*/
	assertCandidate(target, name, candidate) {
		const reference = this.registryFor(target).get(name)?.schemaRef;
		if (reference === void 0) return;
		assertValueMatchesSchema(candidate, this.requireSchema(target, reference), name);
	}
	requireSchema(target, reference) {
		const entry = this.schemaRegistryFor(target).get(schemaKey(reference));
		if (entry === void 0) this.schemaNotFound(reference);
		return entry;
	}
	requireDraft(target) {
		const draft = this.schemaDrafts.get(target);
		if (!draft) throw new StructuredDataError("INVALID_SCHEMA", "No schema definition is open; use the begin schema block first.");
		return draft;
	}
	schemaRegistryFor(target) {
		let registry = this.schemaRegistries.get(target);
		if (!registry) {
			registry = /* @__PURE__ */ new Map();
			this.schemaRegistries.set(target, registry);
		}
		return registry;
	}
	requireSchemaSupport() {
		if (this.schemaEnabled) return;
		throw new StructuredDataError("INVALID_SCHEMA", "Schema support is off; set STRUCTURED_SCHEMA before the extension loads.");
	}
	schemaNotFound(reference) {
		throw new StructuredDataError("SCHEMA_NOT_FOUND", `Schema does not exist: ${schemaKey(reference)}`, {
			schemaId: reference.id,
			schemaVersion: reference.version
		});
	}
	store(target, rawName, value, nativeRepresentation) {
		this.setBinding(target, this.name(rawName), value, nativeRepresentation);
	}
	requireData(target, rawName) {
		return this.requireDataByName(target, this.name(rawName));
	}
	requireDataByName(target, name) {
		const binding = this.registryFor(target).get(name);
		if (binding === void 0) this.dataNotFound(name);
		return binding.value;
	}
	registryFor(target) {
		let registry = this.registries.get(target);
		if (!registry) {
			registry = /* @__PURE__ */ new Map();
			this.registries.set(target, registry);
		}
		return registry;
	}
	setBinding(target, name, value, nativeRepresentation, schemaRef) {
		const registry = this.registryFor(target);
		const previous = registry.get(name);
		const retainedRepresentation = nativeRepresentation ?? previous?.nativeRepresentation ?? "json";
		const retainedSchemaRef = schemaRef ?? (nativeRepresentation === void 0 ? previous?.schemaRef : void 0);
		registry.set(name, {
			value,
			revision: this.nextRevision,
			nativeRepresentation: retainedRepresentation,
			...retainedSchemaRef === void 0 ? {} : { schemaRef: retainedSchemaRef }
		});
		this.nextRevision += 1;
	}
	name(value) {
		const name = this.scratch.Cast.toString(value).trim();
		if (name.length === 0) throw new StructuredDataError("INVALID_NAME", "Structured data name cannot be empty.");
		return name;
	}
	dataNotFound(name) {
		throw new StructuredDataError("DATA_NOT_FOUND", `Structured data does not exist: ${name}`);
	}
	currentIteration(thread) {
		const current = this.iterationStacks.get(thread)?.at(-1);
		if (!current) throw new StructuredDataError("ITERATION_CONTEXT_REQUIRED", "This reporter is only valid inside an active iteration.");
		return current;
	}
	stackFor(thread) {
		let stack = this.iterationStacks.get(thread);
		if (!stack) {
			stack = [];
			this.iterationStacks.set(thread, stack);
		}
		return stack;
	}
	path(value) {
		return parsePath(this.scratch.Cast.toString(value));
	}
	clearRuntimeState() {
		this.namedDataProvider?.clearSession();
		this.registries = /* @__PURE__ */ new WeakMap();
		this.schemaRegistries = /* @__PURE__ */ new WeakMap();
		this.schemaDrafts = /* @__PURE__ */ new WeakMap();
		this.iterationStacks = /* @__PURE__ */ new WeakMap();
		this.nextRevision = 1;
	}
	toScratchBlock(block) {
		return {
			opcode: block.opcode,
			blockType: this.scratch.BlockType[block.blockType],
			text: this.scratch.translate(block.text),
			arguments: Object.fromEntries(Object.entries(block.arguments).map(([name, argument]) => [name, {
				type: this.scratch.ArgumentType[argument.type],
				defaultValue: argument.defaultValue
			}]))
		};
	}
};
/** Static contract: importing this entry never creates or registers an extension. */
var bundleModuleMetadata = Object.freeze({
	formatVersion: 1,
	id: extensionConfig.id,
	unsandboxed: extensionConfig.unsandboxed ? "required" : "not-needed"
});
/** The caller supplies the member host and owns registration and lifetime. */
function createExtension(scratch) {
	return new StructuredDataExtension(scratch);
}
export { bundleModuleMetadata, createExtension };
