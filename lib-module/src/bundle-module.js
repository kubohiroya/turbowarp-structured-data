import { PARSE_LIMITS, parseValue, serializeValue } from "@kubohiroya/turbowarp-yaml-json/codec";
import { validateAgainstSchema, validateSchemaDefinition } from "@kubohiroya/turbowarp-named-functions/composition";
import { documentTreeErrorCodes, getDocumentTreeRegistry } from "@kubohiroya/turbowarp-document-data/composition";
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
/** Read once by the extension constructor; pure source adapters remain explicit opt-in APIs. */
function isStructuredDocumentSourceEnabled(source = globalThis) {
	const value = source.STRUCTURED_DOCUMENT_SOURCE;
	return value === void 0 ? false : value === true || value === "true";
}
/** Read once by the extension constructor; the document tree copy block needs MVP and this flag. */
function isStructuredDocumentTreeEnabled(source = globalThis) {
	const value = source.STRUCTURED_DOCUMENT_TREE;
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
/**
* Renders a value for the text reporters. A string is returned as is, without JSON quotes or
* escapes; a number or boolean uses its canonical JSON text. Null, arrays, and objects have no
* text form and fail instead of becoming an empty or JSON string.
*/
function scalarToText(value) {
	if (typeof value === "string") return value;
	if (typeof value === "number" || typeof value === "boolean") return stringifyJson(value);
	return typeMismatch(`Text requires a string, number, or boolean; found ${value === null ? "null" : Array.isArray(value) ? "an array" : "an object"}.`);
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
var PARSE_LIMITS$1 = {
	maxInputBytes: PARSE_LIMITS.maxInputBytes,
	maxDepth: PARSE_LIMITS.maxDepth,
	maxNodes: PARSE_LIMITS.maxNodes
};
function parse(source, format) {
	const parsed = parseValue(source, format);
	if (parsed.success) return parsed.value;
	const diagnostic = parsed.diagnostic;
	if (diagnostic.code === "MAX_INPUT_BYTES_EXCEEDED") throw new StructuredDataError("PARSE_LIMIT_EXCEEDED", `Input is ${new TextEncoder().encode(source).byteLength} bytes; maximum is ${PARSE_LIMITS$1.maxInputBytes}.`);
	if (diagnostic.code === "MAX_DEPTH_EXCEEDED") throw new StructuredDataError("PARSE_LIMIT_EXCEEDED", `Data exceeds maximum nesting depth ${PARSE_LIMITS$1.maxDepth}.`);
	if (diagnostic.code === "MAX_NODES_EXCEEDED") throw new StructuredDataError("PARSE_LIMIT_EXCEEDED", `Data exceeds maximum node count ${PARSE_LIMITS$1.maxNodes}.`);
	if (format === "json") throw new StructuredDataError("INVALID_JSON", diagnostic.code === "INVALID_JSON_VALUE" ? "JSON contains an unsupported value." : "Input must be valid JSON.");
	const ownerMessage = {
		YAML_ALIAS_NOT_ALLOWED: "YAML aliases are not allowed.",
		YAML_NON_STRING_KEY: "YAML map keys must be strings."
	};
	if (ownerMessage[diagnostic.code]) throw new StructuredDataError("INVALID_YAML", ownerMessage[diagnostic.code]);
	if (diagnostic.code === "INVALID_YAML_VALUE") throw new StructuredDataError("INVALID_YAML", diagnostic.message.replace(/^Parsed YAML/, "YAML"));
	throw new StructuredDataError("INVALID_YAML", `${diagnostic.code} at line ${diagnostic.line}, column ${diagnostic.column}: ${diagnostic.message}`);
}
function parseJsonDocument(source) {
	return parse(source, "json");
}
function parseYamlDocument(source) {
	return parse(source, "yaml");
}
function renderJsonDocument(value) {
	return serializeValue(value, {
		format: "json",
		keyOrder: "unicode",
		indent: 0,
		trailingNewline: false,
		enforceValueLimits: false
	});
}
function renderYamlDocument(value) {
	return serializeValue(value, {
		format: "yaml",
		keyOrder: "unicode",
		trailingNewline: false,
		enforceValueLimits: false
	});
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
/** An explicit one-way projection. It never prepares, commits or serializes source documents. */
function createDocumentSourceProjection({ documents, runtime, publish }) {
	let values = /* @__PURE__ */ new WeakMap();
	let disposed = false;
	let generation = 0;
	const clear = () => {
		values = /* @__PURE__ */ new WeakMap();
		generation++;
	};
	const stop = () => clear();
	const close = () => {
		if (disposed) return;
		disposed = true;
		clear();
		runtime?.off?.("PROJECT_STOP_ALL", stop);
		runtime?.off?.("RUNTIME_DISPOSED", stop);
		runtime?.off?.("PROJECT_LOADED", stop);
	};
	runtime?.on("PROJECT_STOP_ALL", stop);
	runtime?.on("RUNTIME_DISPOSED", stop);
	runtime?.on("PROJECT_LOADED", stop);
	return Object.freeze({
		project(target, name, reference) {
			if (disposed) throw new StructuredDataError("DATA_NOT_FOUND", "The source projection session has ended.");
			if (target === null || typeof target !== "object" && typeof target !== "function") throw new StructuredDataError("TYPE_MISMATCH", "A runtime target is required.");
			if (typeof name !== "string" || !name.trim()) throw new StructuredDataError("INVALID_NAME", "Structured data name cannot be empty.");
			const identity = Object.freeze({ ...reference });
			const metadata = documents.list().find((item) => item.reference.providerId === identity.providerId && item.reference.documentId === identity.documentId);
			if (!metadata) throw new StructuredDataError("DATA_NOT_FOUND", "The source document does not exist.");
			const format = metadata.format;
			if (format !== "json" && format !== "yaml") throw new StructuredDataError("TYPE_MISMATCH", "A source document must declare JSON or YAML format.");
			const current = generation;
			const adapter = documents.open(identity);
			let value;
			try {
				const captured = adapter.capture();
				value = format === "json" ? parseJsonDocument(captured.source) : parseYamlDocument(captured.source);
			} finally {
				adapter.dispose();
			}
			if (disposed || current !== generation) throw new StructuredDataError("DATA_NOT_FOUND", "The runtime session changed during source projection.");
			const candidate = freeze({
				reference: identity,
				filename: metadata.filename,
				format,
				value: cloneJson(value)
			});
			publish?.(target, name.trim(), cloneJson(value), format);
			let bindings = values.get(target);
			if (!bindings) {
				bindings = /* @__PURE__ */ new Map();
				values.set(target, bindings);
			}
			bindings.set(name.trim(), candidate);
			return candidate;
		},
		get(target, name) {
			return values.get(target)?.get(name.trim());
		},
		clearTarget(target) {
			values.delete(target);
			generation++;
		},
		clear,
		dispose: close
	});
}
function freeze(value) {
	if (value && typeof value === "object" && !Object.isFrozen(value)) {
		for (const child of Object.values(value)) freeze(child);
		Object.freeze(value);
	}
	return value;
}
/** The legacy runtime subset is identified explicitly; this is not a full JSON Schema engine. */
function createReadonlySchemaResolver(lookup) {
	const resolve = (reference) => {
		const exact = parseSchemaReference(reference.id, reference.version);
		const entry = lookup(exact);
		if (!entry || entry.reference.id !== exact.id || entry.reference.version !== exact.version) throw new StructuredDataError("SCHEMA_NOT_FOUND", `Schema does not exist: ${schemaKey(exact)}`, {
			schemaId: exact.id,
			schemaVersion: exact.version
		});
		return freeze(JSON.parse(JSON.stringify(entry)));
	};
	return Object.freeze({
		profile: "structured-subset",
		resolve,
		inline(reference) {
			const entry = resolve(reference);
			return Object.freeze({
				profile: "structured-subset",
				reference: entry.reference,
				document: entry.document
			});
		}
	});
}
/** `POSITIONS` menu values; the saved value is the visible text. */
var DOCUMENT_TREE_POSITIONS = ["without positions", "with positions"];
/** The depth and value limits `parse JSON` applies. No text is parsed, so no byte limit applies. */
var DOCUMENT_TREE_LIMITS = Object.freeze({
	maxDepth: PARSE_LIMITS$1.maxDepth,
	maxNodes: PARSE_LIMITS$1.maxNodes
});
/**
* Document Data failures expressed with the existing structured-data codes. The caller-side
* `DOCUMENT_TREE_OPTIONS_INVALID` is deliberately absent: only a bug in this module could cause it,
* so it is rethrown unchanged instead of being shown as a user error.
*/
var ERROR_CODES = {
	DOCUMENT_TREE_UNAVAILABLE: "DATA_NOT_FOUND",
	DOCUMENT_NOT_FOUND: "DATA_NOT_FOUND",
	DOCUMENT_TREE_PROVIDER_INVALID: "DATA_NOT_FOUND",
	REGISTRY_SCOPE_INVALID: "DATA_NOT_FOUND",
	REGISTRY_INCOMPATIBLE: "DATA_NOT_FOUND",
	INVALID_LOCATION: "INVALID_PATH",
	LOCATION_NOT_FOUND: "PATH_NOT_FOUND",
	DOCUMENT_LIMIT_EXCEEDED: "PARSE_LIMIT_EXCEEDED"
};
function parseDocumentTreePositions(value) {
	if (value === DOCUMENT_TREE_POSITIONS[0]) return false;
	if (value === DOCUMENT_TREE_POSITIONS[1]) return true;
	throw new StructuredDataError("TYPE_MISMATCH", `POSITIONS must be "${DOCUMENT_TREE_POSITIONS[0]}" or "${DOCUMENT_TREE_POSITIONS[1]}".`);
}
/**
* Copies a Document Data subtree as a plain JSON value. The shared registry is looked up on every
* call, so it does not matter which extension loads first; when structured-data is first, this
* creates the empty registry that Document Data registers into later.
*/
function copyDocumentTree(request) {
	const details = {
		documentName: request.documentName,
		location: request.location
	};
	let root;
	try {
		root = getDocumentTreeRegistry(request.scope).capture(request.target, request.documentName, {
			location: request.location,
			positions: request.positions,
			limits: DOCUMENT_TREE_LIMITS
		}).root;
	} catch (error) {
		throw mapDocumentTreeError(error, details);
	}
	return ownCapturedJson(root, details);
}
/** Maps a Document Data error to a structured-data error; anything else is returned unchanged. */
function mapDocumentTreeError(error, details = {}) {
	const originalCode = documentTreeErrorCode(error);
	if (originalCode === void 0) return error;
	const code = ERROR_CODES[originalCode];
	if (code === void 0) return error;
	return new StructuredDataError(code, error.message, {
		...details,
		originalCode
	});
}
function documentTreeErrorCode(error) {
	if (typeof error !== "object" || error === null) return void 0;
	const { name, code } = error;
	return name === "DocumentTreeError" && documentTreeErrorCodes.includes(code) ? code : void 0;
}
/**
* The registry answers with whichever provider registered last, so the answer is rebuilt into plain
* arrays and objects this extension owns, within the same limits, before it can become a binding.
* Values are counted like the shared codec counts parsed JSON: each value once, the root at depth 0,
* depth checked first. A cycle therefore fails as too deep.
*/
function ownCapturedJson(root, details) {
	let count = 0;
	const copy = (value, depth) => {
		if (depth > DOCUMENT_TREE_LIMITS.maxDepth || ++count > DOCUMENT_TREE_LIMITS.maxNodes) throw new StructuredDataError("PARSE_LIMIT_EXCEEDED", `The copied tree exceeds depth ${DOCUMENT_TREE_LIMITS.maxDepth} or ${DOCUMENT_TREE_LIMITS.maxNodes} values.`, {
			...details,
			originalCode: "DOCUMENT_LIMIT_EXCEEDED"
		});
		if (value === null || typeof value === "string" || typeof value === "boolean") return value;
		if (typeof value === "number" && Number.isFinite(value)) return value;
		if (Array.isArray(value)) return Array.from(value, (item) => copy(item, depth + 1));
		if (typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, copy(item, depth + 1)]));
		throw new StructuredDataError("DATA_NOT_FOUND", "The document tree provider returned a value that is not plain JSON.", {
			...details,
			originalCode: "DOCUMENT_TREE_PROVIDER_INVALID"
		});
	};
	return copy(root, 0);
}
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
	menus: { "documentTreePositions": {
		"acceptReporters": false,
		"items": ["without positions", "with positions"]
	} },
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
			"opcode": "copyDocumentTree",
			"blockType": "COMMAND",
			"text": "copy document [DOCUMENT] at [LOCATION] [POSITIONS] as [NAME]",
			"description": "Copy a Document Data document, or the part at a location, into the target-local structured data namespace.",
			"arguments": {
				"DOCUMENT": {
					"type": "STRING",
					"defaultValue": "page"
				},
				"LOCATION": {
					"type": "STRING",
					"defaultValue": "$"
				},
				"POSITIONS": {
					"type": "STRING",
					"defaultValue": "without positions",
					"menu": "documentTreePositions"
				},
				"NAME": {
					"type": "STRING",
					"defaultValue": "tree"
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
				"PARSE_LIMIT_EXCEEDED"
			],
			"server": { "supported": false }
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
			"opcode": "getTextAtPath",
			"blockType": "REPORTER",
			"text": "text from [NAME] at path [PATH]",
			"description": "Return a string, number, or boolean at a path as text; strings have no JSON quotes.",
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
			"resultType": "string",
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
				"irOperation": "structuredData.getText"
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
			"opcode": "currentJsonAtPath",
			"blockType": "REPORTER",
			"text": "current value at path [PATH]",
			"description": "Return the value at a path inside the current iteration value as JSON.",
			"arguments": { "PATH": {
				"type": "STRING",
				"defaultValue": "$",
				"normalizesTo": "pathSegments"
			} },
			"resultType": "jsonText",
			"effect": "control",
			"immutable": true,
			"errors": [
				"ITERATION_CONTEXT_REQUIRED",
				"INVALID_PATH",
				"PATH_NOT_FOUND",
				"TYPE_MISMATCH",
				"INDEX_OUT_OF_RANGE"
			],
			"server": {
				"supported": true,
				"irOperation": "structuredData.currentGet"
			}
		},
		{
			"opcode": "currentTextAtPath",
			"blockType": "REPORTER",
			"text": "current text at path [PATH]",
			"description": "Return a string, number, or boolean at a path inside the current iteration value as text.",
			"arguments": { "PATH": {
				"type": "STRING",
				"defaultValue": "$",
				"normalizesTo": "pathSegments"
			} },
			"resultType": "string",
			"effect": "control",
			"immutable": true,
			"errors": [
				"ITERATION_CONTEXT_REQUIRED",
				"INVALID_PATH",
				"PATH_NOT_FOUND",
				"TYPE_MISMATCH",
				"INDEX_OUT_OF_RANGE"
			],
			"server": {
				"supported": true,
				"irOperation": "structuredData.currentGetText"
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
var menuDefinitions = block_definitions_default.menus;
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
/** Blocks that only appear while the startup-fixed document tree flag is on. */
var DOCUMENT_TREE_OPCODES = /* @__PURE__ */ new Set(["copyDocumentTree"]);
var StructuredDataExtension = class {
	constructor(scratch, enabled = isStructuredDataMvpEnabled(), namedDataEnabled = isNamedDataRegistryMvpEnabled(), schemaEnabled = isStructuredSchemaEnabled(), documentSourceEnabled = isStructuredDocumentSourceEnabled(), documentTreeEnabled = isStructuredDocumentTreeEnabled()) {
		this.scratch = scratch;
		this.schemaEnabled = schemaEnabled;
		this.documentSourceEnabled = documentSourceEnabled;
		this.documentTreeEnabled = documentTreeEnabled;
		this.disposed = false;
		this.sourceProjections = /* @__PURE__ */ new Set();
		this.registries = /* @__PURE__ */ new WeakMap();
		this.schemaRegistries = /* @__PURE__ */ new WeakMap();
		this.schemaDrafts = /* @__PURE__ */ new WeakMap();
		this.iterationStacks = /* @__PURE__ */ new WeakMap();
		this.nextRevision = 1;
		this.enabled = enabled;
		this.unregisterSourceEditors = registerSourceEditors(this.scratch, enabled ? sourceEditorDefinitions : []);
		const runtime = this.scratch.vm?.runtime;
		const onDispose = () => this.clearRuntimeState();
		const onStop = () => this.clearRuntimeState();
		this.releaseRuntimeListeners = () => {
			runtime?.off?.("RUNTIME_DISPOSED", onDispose);
			runtime?.off?.("PROJECT_STOP_ALL", onStop);
			runtime?.off?.("PROJECT_LOADED", onStop);
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
			if (this.documentSourceEnabled && !namedDataEnabled) runtime?.on?.("RUNTIME_DISPOSED", onDispose);
			if (this.documentSourceEnabled || namedDataEnabled) runtime?.on?.("PROJECT_LOADED", onStop);
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
	/** Explicitly project preserved source into this extension's transient target bindings. */
	createSourceProjection(documents) {
		if (this.disposed || !this.enabled || !this.documentSourceEnabled) throw new StructuredDataError("DATA_NOT_FOUND", "Structured data is unavailable.");
		const projection = createDocumentSourceProjection({
			documents,
			publish: (target, name, value, format) => this.store(target, name, value, format)
		});
		this.sourceProjections.add(projection);
		return projection;
	}
	getSchemaResolver(target) {
		this.requireSchemaSupport();
		return createReadonlySchemaResolver((reference) => this.disposed ? void 0 : this.schemaRegistries.get(target)?.get(schemaKey(reference)));
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
		for (const projection of this.sourceProjections) projection.dispose();
		this.sourceProjections.clear();
		this.releaseRuntimeListeners();
		this.unregisterFixedInputEditors();
		this.unregisterSourceEditors();
		await this.namedDataRegistration?.unregister();
		this.unbindNamedDataRegistryLifecycle?.();
	}
	getInfo() {
		const visible = this.enabled ? blockDefinitions.filter((block) => (this.schemaEnabled || !SCHEMA_OPCODES.has(block.opcode)) && (this.documentTreeEnabled || !DOCUMENT_TREE_OPCODES.has(block.opcode))) : [];
		const menuIds = new Set(visible.flatMap((block) => Object.values(block.arguments).flatMap((argument) => argument.menu ?? [])));
		return {
			id: extensionConfig.id,
			name: this.scratch.translate(block_definitions_default.extensionName),
			docsURI: extensionConfig.docsURI,
			blockIconURI: extensionConfig.blockIconURI,
			blocks: visible.map((block) => this.toScratchBlock(block)),
			menus: Object.fromEntries([...menuIds].map((id) => {
				const menu = menuDefinitions[id];
				if (!menu) throw new Error(`Unknown menu: ${id}`);
				return [id, {
					acceptReporters: menu.acceptReporters,
					items: [...menu.items]
				}];
			}))
		};
	}
	parseJson(args, util) {
		this.store(util.target, args.NAME, parseJsonDocument(this.scratch.Cast.toString(args.TEXT)), "json");
	}
	parseYaml(args, util) {
		this.store(util.target, args.NAME, parseYamlDocument(this.scratch.Cast.toString(args.TEXT)), "yaml");
	}
	/**
	* Copies a Document Data subtree into a named value exactly as `parse JSON` binds one: the same
	* target-local name, replacement, stop-time clearing, and a schema the old value carried is dropped.
	* Every check and the copy finish before the binding changes, so a failure keeps the old value.
	*/
	copyDocumentTree(args, util) {
		this.requireDocumentTreeSupport();
		const name = this.name(args.NAME);
		const documentName = this.scratch.Cast.toString(args.DOCUMENT).trim();
		if (documentName.length === 0) throw new StructuredDataError("INVALID_NAME", "Document name cannot be empty.");
		const value = copyDocumentTree({
			scope: this.scratch.vm,
			target: util.target,
			documentName,
			location: this.scratch.Cast.toString(args.LOCATION),
			positions: parseDocumentTreePositions(this.scratch.Cast.toString(args.POSITIONS))
		});
		this.setBinding(util.target, name, value, "json");
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
	getTextAtPath(args, util) {
		return scalarToText(getAtPath(this.requireData(util.target, args.NAME), this.path(args.PATH)));
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
	currentJsonAtPath(args, util) {
		return stringifyJson(this.currentValueAt(util.thread, args.PATH));
	}
	currentTextAtPath(args, util) {
		return scalarToText(this.currentValueAt(util.thread, args.PATH));
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
	requireDocumentTreeSupport() {
		if (this.enabled && this.documentTreeEnabled) return;
		throw new StructuredDataError("DATA_NOT_FOUND", "Copying document trees is off; set STRUCTURED_DATA_MVP and STRUCTURED_DOCUMENT_TREE before the extension loads.");
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
	/** Reads a path relative to the innermost entry; the loop context is checked before the path. */
	currentValueAt(thread, rawPath) {
		const { value } = this.currentIteration(thread);
		return getAtPath(value, this.path(rawPath));
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
		for (const projection of this.sourceProjections) projection.clear();
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
				defaultValue: argument.defaultValue,
				...argument.menu === void 0 ? {} : { menu: argument.menu }
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
