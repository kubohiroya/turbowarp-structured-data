import { LineCounter, isAlias, isMap, isScalar, isSeq, parseDocument } from "yaml";
var extensionConfig = {
	id: "kubohiroyastructureddata",
	slug: "structured-data",
	name: "Structured Data",
	description: "Named structured data with JSON/YAML codecs for TurboWarp and server compilation.",
	author: "Hiroya Kubo",
	license: "MPL-2.0",
	unsandboxed: true,
	docsURI: "https://kubohiroya.github.io/turbowarp-structured-data/",
	blockIconURI: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCI+PHJlY3QgeD0iNCIgeT0iOCIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE0IiByeD0iMyIgZmlsbD0iIzRDOTdGRiIvPjxyZWN0IHg9IjI2IiB5PSI4IiB3aWR0aD0iMTgiIGhlaWdodD0iMTQiIHJ4PSIzIiBmaWxsPSIjNTlDMDU5Ii8+PHJlY3QgeD0iMTUiIHk9IjI2IiB3aWR0aD0iMTgiIGhlaWdodD0iMTQiIHJ4PSIzIiBmaWxsPSIjRkZBQjE5Ii8+PC9zdmc+"
};
function canonicalBundle(ownerId, contractId, document, ownerSource) {
	const source = {
		repository: ownerId,
		path: `schemas/${contractId}.schema.json`
	};
	return {
		identity: {
			ownerId,
			contractId,
			revision: "source-forms-v1",
			variantId: "default"
		},
		dialect: "2020-12",
		root: {
			retrievalUri: `https://kubohiroya.github.io/${ownerId}/schemas/${contractId}.schema.json`,
			document,
			artifact: {
				role: "canonical-schema",
				source
			}
		},
		resources: [],
		provenance: {
			canonicalSources: [source, {
				repository: ownerId,
				...ownerSource
			}],
			generatedFiles: [],
			referenceSchemas: [],
			generationSources: []
		}
	};
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
var source$1 = {
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
			source: source$1
		}
	},
	resources: [],
	provenance: {
		canonicalSources: [source$1],
		generatedFiles: [],
		referenceSchemas: [],
		generationSources: []
	}
});
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
var StructuredDataError = class extends Error {
	constructor(code, message) {
		super(`${code}: ${message}`);
		this.name = "StructuredDataError";
		this.code = code;
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
var PARSE_LIMITS = {
	maxInputBytes: 262144,
	maxDepth: 64,
	maxNodes: 5e4
};
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
function yamlPosition(counter, offset) {
	const position = counter.linePos(offset);
	return {
		line: position.line,
		column: position.col
	};
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
var source = {
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
			source
		}
	},
	resources: [],
	provenance: {
		canonicalSources: [source, {
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
export { canonicalBundle, fixedInputEditorDefinitions, fixedInputSchemaBundle, registerFixedInputEditors, registerSourceEditors, sourceBinding, sourceEditorDefinitions };
