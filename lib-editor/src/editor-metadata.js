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
	blockIconURI: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCI+PHJlY3QgeD0iNCIgeT0iOCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjMyIiByeD0iNiIgZmlsbD0iIzhBNTVENyIvPjxwYXRoIGQ9Ik0xOSAxNWMtMyAwLTIgNy01IDkgMyAyIDIgOSA1IDkiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48cGF0aCBkPSJNMjkgMTVjMyAwIDIgNyA1IDktMyAyLTIgOS01IDkiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48Y2lyY2xlIGN4PSIyNCIgY3k9IjI0IiByPSIyLjIiIGZpbGw9IiNmZmYiLz48L3N2Zz4="
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
/**
* Creates a JSON scanner on the given text.
* If ignoreTrivia is set, whitespaces or comments are ignored.
*/
function createScanner(text, ignoreTrivia = false) {
	const len = text.length;
	let pos = 0, value = "", tokenOffset = 0, token = 16, lineNumber = 0, lineStartOffset = 0, tokenLineStartOffset = 0, prevTokenLineStartOffset = 0, scanError = 0;
	function scanHexDigits(count, exact) {
		let digits = 0;
		let value = 0;
		while (digits < count || !exact) {
			let ch = text.charCodeAt(pos);
			if (ch >= 48 && ch <= 57) value = value * 16 + ch - 48;
			else if (ch >= 65 && ch <= 70) value = value * 16 + ch - 65 + 10;
			else if (ch >= 97 && ch <= 102) value = value * 16 + ch - 97 + 10;
			else break;
			pos++;
			digits++;
		}
		if (digits < count) value = -1;
		return value;
	}
	function setPosition(newPosition) {
		pos = newPosition;
		value = "";
		tokenOffset = 0;
		token = 16;
		scanError = 0;
	}
	function scanNumber() {
		let start = pos;
		if (text.charCodeAt(pos) === 48) pos++;
		else {
			pos++;
			while (pos < text.length && isDigit(text.charCodeAt(pos))) pos++;
		}
		if (pos < text.length && text.charCodeAt(pos) === 46) {
			pos++;
			if (pos < text.length && isDigit(text.charCodeAt(pos))) {
				pos++;
				while (pos < text.length && isDigit(text.charCodeAt(pos))) pos++;
			} else {
				scanError = 3;
				return text.substring(start, pos);
			}
		}
		let end = pos;
		if (pos < text.length && (text.charCodeAt(pos) === 69 || text.charCodeAt(pos) === 101)) {
			pos++;
			if (pos < text.length && text.charCodeAt(pos) === 43 || text.charCodeAt(pos) === 45) pos++;
			if (pos < text.length && isDigit(text.charCodeAt(pos))) {
				pos++;
				while (pos < text.length && isDigit(text.charCodeAt(pos))) pos++;
				end = pos;
			} else scanError = 3;
		}
		return text.substring(start, end);
	}
	function scanString() {
		let result = "", start = pos;
		while (true) {
			if (pos >= len) {
				result += text.substring(start, pos);
				scanError = 2;
				break;
			}
			const ch = text.charCodeAt(pos);
			if (ch === 34) {
				result += text.substring(start, pos);
				pos++;
				break;
			}
			if (ch === 92) {
				result += text.substring(start, pos);
				pos++;
				if (pos >= len) {
					scanError = 2;
					break;
				}
				switch (text.charCodeAt(pos++)) {
					case 34:
						result += "\"";
						break;
					case 92:
						result += "\\";
						break;
					case 47:
						result += "/";
						break;
					case 98:
						result += "\b";
						break;
					case 102:
						result += "\f";
						break;
					case 110:
						result += "\n";
						break;
					case 114:
						result += "\r";
						break;
					case 116:
						result += "	";
						break;
					case 117:
						const ch3 = scanHexDigits(4, true);
						if (ch3 >= 0) result += String.fromCharCode(ch3);
						else scanError = 4;
						break;
					default: scanError = 5;
				}
				start = pos;
				continue;
			}
			if (ch >= 0 && ch <= 31) {
				if (isLineBreak(ch)) {
					result += text.substring(start, pos);
					scanError = 2;
					break;
				} else scanError = 6;
			}
			pos++;
		}
		return result;
	}
	function scanNext() {
		value = "";
		scanError = 0;
		tokenOffset = pos;
		lineStartOffset = lineNumber;
		prevTokenLineStartOffset = tokenLineStartOffset;
		if (pos >= len) {
			tokenOffset = len;
			return token = 17;
		}
		let code = text.charCodeAt(pos);
		if (isWhiteSpace(code)) {
			do {
				pos++;
				value += String.fromCharCode(code);
				code = text.charCodeAt(pos);
			} while (isWhiteSpace(code));
			return token = 15;
		}
		if (isLineBreak(code)) {
			pos++;
			value += String.fromCharCode(code);
			if (code === 13 && text.charCodeAt(pos) === 10) {
				pos++;
				value += "\n";
			}
			lineNumber++;
			tokenLineStartOffset = pos;
			return token = 14;
		}
		switch (code) {
			case 123:
				pos++;
				return token = 1;
			case 125:
				pos++;
				return token = 2;
			case 91:
				pos++;
				return token = 3;
			case 93:
				pos++;
				return token = 4;
			case 58:
				pos++;
				return token = 6;
			case 44:
				pos++;
				return token = 5;
			case 34:
				pos++;
				value = scanString();
				return token = 10;
			case 47:
				const start = pos - 1;
				if (text.charCodeAt(pos + 1) === 47) {
					pos += 2;
					while (pos < len) {
						if (isLineBreak(text.charCodeAt(pos))) break;
						pos++;
					}
					value = text.substring(start, pos);
					return token = 12;
				}
				if (text.charCodeAt(pos + 1) === 42) {
					pos += 2;
					const safeLength = len - 1;
					let commentClosed = false;
					while (pos < safeLength) {
						const ch = text.charCodeAt(pos);
						if (ch === 42 && text.charCodeAt(pos + 1) === 47) {
							pos += 2;
							commentClosed = true;
							break;
						}
						pos++;
						if (isLineBreak(ch)) {
							if (ch === 13 && text.charCodeAt(pos) === 10) pos++;
							lineNumber++;
							tokenLineStartOffset = pos;
						}
					}
					if (!commentClosed) {
						pos++;
						scanError = 1;
					}
					value = text.substring(start, pos);
					return token = 13;
				}
				value += String.fromCharCode(code);
				pos++;
				return token = 16;
			case 45:
				value += String.fromCharCode(code);
				pos++;
				if (pos === len || !isDigit(text.charCodeAt(pos))) return token = 16;
			case 48:
			case 49:
			case 50:
			case 51:
			case 52:
			case 53:
			case 54:
			case 55:
			case 56:
			case 57:
				value += scanNumber();
				return token = 11;
			default:
				while (pos < len && isUnknownContentCharacter(code)) {
					pos++;
					code = text.charCodeAt(pos);
				}
				if (tokenOffset !== pos) {
					value = text.substring(tokenOffset, pos);
					switch (value) {
						case "true": return token = 8;
						case "false": return token = 9;
						case "null": return token = 7;
					}
					return token = 16;
				}
				value += String.fromCharCode(code);
				pos++;
				return token = 16;
		}
	}
	function isUnknownContentCharacter(code) {
		if (isWhiteSpace(code) || isLineBreak(code)) return false;
		switch (code) {
			case 125:
			case 93:
			case 123:
			case 91:
			case 34:
			case 58:
			case 44:
			case 47: return false;
		}
		return true;
	}
	function scanNextNonTrivia() {
		let result;
		do
			result = scanNext();
		while (result >= 12 && result <= 15);
		return result;
	}
	return {
		setPosition,
		getPosition: () => pos,
		scan: ignoreTrivia ? scanNextNonTrivia : scanNext,
		getToken: () => token,
		getTokenValue: () => value,
		getTokenOffset: () => tokenOffset,
		getTokenLength: () => pos - tokenOffset,
		getTokenStartLine: () => lineStartOffset,
		getTokenStartCharacter: () => tokenOffset - prevTokenLineStartOffset,
		getTokenError: () => scanError
	};
}
function isWhiteSpace(ch) {
	return ch === 32 || ch === 9;
}
function isLineBreak(ch) {
	return ch === 10 || ch === 13;
}
function isDigit(ch) {
	return ch >= 48 && ch <= 57;
}
var CharacterCodes;
(function(CharacterCodes) {
	CharacterCodes[CharacterCodes["lineFeed"] = 10] = "lineFeed";
	CharacterCodes[CharacterCodes["carriageReturn"] = 13] = "carriageReturn";
	CharacterCodes[CharacterCodes["space"] = 32] = "space";
	CharacterCodes[CharacterCodes["_0"] = 48] = "_0";
	CharacterCodes[CharacterCodes["_1"] = 49] = "_1";
	CharacterCodes[CharacterCodes["_2"] = 50] = "_2";
	CharacterCodes[CharacterCodes["_3"] = 51] = "_3";
	CharacterCodes[CharacterCodes["_4"] = 52] = "_4";
	CharacterCodes[CharacterCodes["_5"] = 53] = "_5";
	CharacterCodes[CharacterCodes["_6"] = 54] = "_6";
	CharacterCodes[CharacterCodes["_7"] = 55] = "_7";
	CharacterCodes[CharacterCodes["_8"] = 56] = "_8";
	CharacterCodes[CharacterCodes["_9"] = 57] = "_9";
	CharacterCodes[CharacterCodes["a"] = 97] = "a";
	CharacterCodes[CharacterCodes["b"] = 98] = "b";
	CharacterCodes[CharacterCodes["c"] = 99] = "c";
	CharacterCodes[CharacterCodes["d"] = 100] = "d";
	CharacterCodes[CharacterCodes["e"] = 101] = "e";
	CharacterCodes[CharacterCodes["f"] = 102] = "f";
	CharacterCodes[CharacterCodes["g"] = 103] = "g";
	CharacterCodes[CharacterCodes["h"] = 104] = "h";
	CharacterCodes[CharacterCodes["i"] = 105] = "i";
	CharacterCodes[CharacterCodes["j"] = 106] = "j";
	CharacterCodes[CharacterCodes["k"] = 107] = "k";
	CharacterCodes[CharacterCodes["l"] = 108] = "l";
	CharacterCodes[CharacterCodes["m"] = 109] = "m";
	CharacterCodes[CharacterCodes["n"] = 110] = "n";
	CharacterCodes[CharacterCodes["o"] = 111] = "o";
	CharacterCodes[CharacterCodes["p"] = 112] = "p";
	CharacterCodes[CharacterCodes["q"] = 113] = "q";
	CharacterCodes[CharacterCodes["r"] = 114] = "r";
	CharacterCodes[CharacterCodes["s"] = 115] = "s";
	CharacterCodes[CharacterCodes["t"] = 116] = "t";
	CharacterCodes[CharacterCodes["u"] = 117] = "u";
	CharacterCodes[CharacterCodes["v"] = 118] = "v";
	CharacterCodes[CharacterCodes["w"] = 119] = "w";
	CharacterCodes[CharacterCodes["x"] = 120] = "x";
	CharacterCodes[CharacterCodes["y"] = 121] = "y";
	CharacterCodes[CharacterCodes["z"] = 122] = "z";
	CharacterCodes[CharacterCodes["A"] = 65] = "A";
	CharacterCodes[CharacterCodes["B"] = 66] = "B";
	CharacterCodes[CharacterCodes["C"] = 67] = "C";
	CharacterCodes[CharacterCodes["D"] = 68] = "D";
	CharacterCodes[CharacterCodes["E"] = 69] = "E";
	CharacterCodes[CharacterCodes["F"] = 70] = "F";
	CharacterCodes[CharacterCodes["G"] = 71] = "G";
	CharacterCodes[CharacterCodes["H"] = 72] = "H";
	CharacterCodes[CharacterCodes["I"] = 73] = "I";
	CharacterCodes[CharacterCodes["J"] = 74] = "J";
	CharacterCodes[CharacterCodes["K"] = 75] = "K";
	CharacterCodes[CharacterCodes["L"] = 76] = "L";
	CharacterCodes[CharacterCodes["M"] = 77] = "M";
	CharacterCodes[CharacterCodes["N"] = 78] = "N";
	CharacterCodes[CharacterCodes["O"] = 79] = "O";
	CharacterCodes[CharacterCodes["P"] = 80] = "P";
	CharacterCodes[CharacterCodes["Q"] = 81] = "Q";
	CharacterCodes[CharacterCodes["R"] = 82] = "R";
	CharacterCodes[CharacterCodes["S"] = 83] = "S";
	CharacterCodes[CharacterCodes["T"] = 84] = "T";
	CharacterCodes[CharacterCodes["U"] = 85] = "U";
	CharacterCodes[CharacterCodes["V"] = 86] = "V";
	CharacterCodes[CharacterCodes["W"] = 87] = "W";
	CharacterCodes[CharacterCodes["X"] = 88] = "X";
	CharacterCodes[CharacterCodes["Y"] = 89] = "Y";
	CharacterCodes[CharacterCodes["Z"] = 90] = "Z";
	CharacterCodes[CharacterCodes["asterisk"] = 42] = "asterisk";
	CharacterCodes[CharacterCodes["backslash"] = 92] = "backslash";
	CharacterCodes[CharacterCodes["closeBrace"] = 125] = "closeBrace";
	CharacterCodes[CharacterCodes["closeBracket"] = 93] = "closeBracket";
	CharacterCodes[CharacterCodes["colon"] = 58] = "colon";
	CharacterCodes[CharacterCodes["comma"] = 44] = "comma";
	CharacterCodes[CharacterCodes["dot"] = 46] = "dot";
	CharacterCodes[CharacterCodes["doubleQuote"] = 34] = "doubleQuote";
	CharacterCodes[CharacterCodes["minus"] = 45] = "minus";
	CharacterCodes[CharacterCodes["openBrace"] = 123] = "openBrace";
	CharacterCodes[CharacterCodes["openBracket"] = 91] = "openBracket";
	CharacterCodes[CharacterCodes["plus"] = 43] = "plus";
	CharacterCodes[CharacterCodes["slash"] = 47] = "slash";
	CharacterCodes[CharacterCodes["formFeed"] = 12] = "formFeed";
	CharacterCodes[CharacterCodes["tab"] = 9] = "tab";
})(CharacterCodes || (CharacterCodes = {}));
new Array(20).fill(0).map((_, index) => {
	return " ".repeat(index);
});
var maxCachedValues = 200;
new Array(maxCachedValues).fill(0).map((_, index) => {
	return "\n" + " ".repeat(index);
}), new Array(maxCachedValues).fill(0).map((_, index) => {
	return "\r" + " ".repeat(index);
}), new Array(maxCachedValues).fill(0).map((_, index) => {
	return "\r\n" + " ".repeat(index);
}), new Array(maxCachedValues).fill(0).map((_, index) => {
	return "\n" + "	".repeat(index);
}), new Array(maxCachedValues).fill(0).map((_, index) => {
	return "\r" + "	".repeat(index);
}), new Array(maxCachedValues).fill(0).map((_, index) => {
	return "\r\n" + "	".repeat(index);
});
var ParseOptions;
(function(ParseOptions) {
	ParseOptions.DEFAULT = { allowTrailingComma: false };
})(ParseOptions || (ParseOptions = {}));
/**
* Parses the given text and returns the object the JSON content represents. On invalid input, the parser tries to be as fault tolerant as possible, but still return a result.
* Therefore always check the errors list to find out if the input was valid.
*/
function parse$2(text, errors = [], options = ParseOptions.DEFAULT) {
	let currentProperty = null;
	let currentParent = [];
	const previousParents = [];
	function onValue(value) {
		if (Array.isArray(currentParent)) currentParent.push(value);
		else if (currentProperty !== null) currentParent[currentProperty] = value;
	}
	visit(text, {
		onObjectBegin: () => {
			const object = {};
			onValue(object);
			previousParents.push(currentParent);
			currentParent = object;
			currentProperty = null;
		},
		onObjectProperty: (name) => {
			currentProperty = name;
		},
		onObjectEnd: () => {
			currentParent = previousParents.pop();
		},
		onArrayBegin: () => {
			const array = [];
			onValue(array);
			previousParents.push(currentParent);
			currentParent = array;
			currentProperty = null;
		},
		onArrayEnd: () => {
			currentParent = previousParents.pop();
		},
		onLiteralValue: onValue,
		onError: (error, offset, length) => {
			errors.push({
				error,
				offset,
				length
			});
		}
	}, options);
	return currentParent[0];
}
/**
* Parses the given text and invokes the visitor functions for each object, array and literal reached.
*/
function visit(text, visitor, options = ParseOptions.DEFAULT) {
	const _scanner = createScanner(text, false);
	const _jsonPath = [];
	let suppressedCallbacks = 0;
	function toNoArgVisit(visitFunction) {
		return visitFunction ? () => suppressedCallbacks === 0 && visitFunction(_scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter()) : () => true;
	}
	function toOneArgVisit(visitFunction) {
		return visitFunction ? (arg) => suppressedCallbacks === 0 && visitFunction(arg, _scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter()) : () => true;
	}
	function toOneArgVisitWithPath(visitFunction) {
		return visitFunction ? (arg) => suppressedCallbacks === 0 && visitFunction(arg, _scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter(), () => _jsonPath.slice()) : () => true;
	}
	function toBeginVisit(visitFunction) {
		return visitFunction ? () => {
			if (suppressedCallbacks > 0) suppressedCallbacks++;
			else if (visitFunction(_scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter(), () => _jsonPath.slice()) === false) suppressedCallbacks = 1;
		} : () => true;
	}
	function toEndVisit(visitFunction) {
		return visitFunction ? () => {
			if (suppressedCallbacks > 0) suppressedCallbacks--;
			if (suppressedCallbacks === 0) visitFunction(_scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter());
		} : () => true;
	}
	const onObjectBegin = toBeginVisit(visitor.onObjectBegin), onObjectProperty = toOneArgVisitWithPath(visitor.onObjectProperty), onObjectEnd = toEndVisit(visitor.onObjectEnd), onArrayBegin = toBeginVisit(visitor.onArrayBegin), onArrayEnd = toEndVisit(visitor.onArrayEnd), onLiteralValue = toOneArgVisitWithPath(visitor.onLiteralValue), onSeparator = toOneArgVisit(visitor.onSeparator), onComment = toNoArgVisit(visitor.onComment), onError = toOneArgVisit(visitor.onError);
	const disallowComments = options && options.disallowComments;
	const allowTrailingComma = options && options.allowTrailingComma;
	function scanNext() {
		while (true) {
			const token = _scanner.scan();
			switch (_scanner.getTokenError()) {
				case 4:
					handleError(14);
					break;
				case 5:
					handleError(15);
					break;
				case 3:
					handleError(13);
					break;
				case 1:
					if (!disallowComments) handleError(11);
					break;
				case 2:
					handleError(12);
					break;
				case 6: handleError(16);
			}
			switch (token) {
				case 12:
				case 13:
					if (disallowComments) handleError(10);
					else onComment();
					break;
				case 16:
					handleError(1);
					break;
				case 15:
				case 14: break;
				default: return token;
			}
		}
	}
	function handleError(error, skipUntilAfter = [], skipUntil = []) {
		onError(error);
		if (skipUntilAfter.length + skipUntil.length > 0) {
			let token = _scanner.getToken();
			while (token !== 17) {
				if (skipUntilAfter.indexOf(token) !== -1) {
					scanNext();
					break;
				} else if (skipUntil.indexOf(token) !== -1) break;
				token = scanNext();
			}
		}
	}
	function parseString(isValue) {
		const value = _scanner.getTokenValue();
		if (isValue) onLiteralValue(value);
		else {
			onObjectProperty(value);
			_jsonPath.push(value);
		}
		scanNext();
		return true;
	}
	function parseLiteral() {
		switch (_scanner.getToken()) {
			case 11:
				const tokenValue = _scanner.getTokenValue();
				let value = Number(tokenValue);
				if (isNaN(value)) {
					handleError(2);
					value = 0;
				}
				onLiteralValue(value);
				break;
			case 7:
				onLiteralValue(null);
				break;
			case 8:
				onLiteralValue(true);
				break;
			case 9:
				onLiteralValue(false);
				break;
			default: return false;
		}
		scanNext();
		return true;
	}
	function parseProperty() {
		if (_scanner.getToken() !== 10) {
			handleError(3, [], [2, 5]);
			return false;
		}
		parseString(false);
		if (_scanner.getToken() === 6) {
			onSeparator(":");
			scanNext();
			if (!parseValue()) handleError(4, [], [2, 5]);
		} else handleError(5, [], [2, 5]);
		_jsonPath.pop();
		return true;
	}
	function parseObject() {
		onObjectBegin();
		scanNext();
		let needsComma = false;
		while (_scanner.getToken() !== 2 && _scanner.getToken() !== 17) {
			if (_scanner.getToken() === 5) {
				if (!needsComma) handleError(4, [], []);
				onSeparator(",");
				scanNext();
				if (_scanner.getToken() === 2 && allowTrailingComma) break;
			} else if (needsComma) handleError(6, [], []);
			if (!parseProperty()) handleError(4, [], [2, 5]);
			needsComma = true;
		}
		onObjectEnd();
		if (_scanner.getToken() !== 2) handleError(7, [2], []);
		else scanNext();
		return true;
	}
	function parseArray() {
		onArrayBegin();
		scanNext();
		let isFirstElement = true;
		let needsComma = false;
		while (_scanner.getToken() !== 4 && _scanner.getToken() !== 17) {
			if (_scanner.getToken() === 5) {
				if (!needsComma) handleError(4, [], []);
				onSeparator(",");
				scanNext();
				if (_scanner.getToken() === 4 && allowTrailingComma) break;
			} else if (needsComma) handleError(6, [], []);
			if (isFirstElement) {
				_jsonPath.push(0);
				isFirstElement = false;
			} else _jsonPath[_jsonPath.length - 1]++;
			if (!parseValue()) handleError(4, [], [4, 5]);
			needsComma = true;
		}
		onArrayEnd();
		if (!isFirstElement) _jsonPath.pop();
		if (_scanner.getToken() !== 4) handleError(8, [4], []);
		else scanNext();
		return true;
	}
	function parseValue() {
		switch (_scanner.getToken()) {
			case 3: return parseArray();
			case 1: return parseObject();
			case 10: return parseString(true);
			default: return parseLiteral();
		}
	}
	scanNext();
	if (_scanner.getToken() === 17) {
		if (options.allowEmptyContent) return true;
		handleError(4, [], []);
		return false;
	}
	if (!parseValue()) {
		handleError(4, [], []);
		return false;
	}
	if (_scanner.getToken() !== 17) handleError(9, [], []);
	return true;
}
var ScanError;
(function(ScanError) {
	ScanError[ScanError["None"] = 0] = "None";
	ScanError[ScanError["UnexpectedEndOfComment"] = 1] = "UnexpectedEndOfComment";
	ScanError[ScanError["UnexpectedEndOfString"] = 2] = "UnexpectedEndOfString";
	ScanError[ScanError["UnexpectedEndOfNumber"] = 3] = "UnexpectedEndOfNumber";
	ScanError[ScanError["InvalidUnicode"] = 4] = "InvalidUnicode";
	ScanError[ScanError["InvalidEscapeCharacter"] = 5] = "InvalidEscapeCharacter";
	ScanError[ScanError["InvalidCharacter"] = 6] = "InvalidCharacter";
})(ScanError || (ScanError = {}));
var SyntaxKind;
(function(SyntaxKind) {
	SyntaxKind[SyntaxKind["OpenBraceToken"] = 1] = "OpenBraceToken";
	SyntaxKind[SyntaxKind["CloseBraceToken"] = 2] = "CloseBraceToken";
	SyntaxKind[SyntaxKind["OpenBracketToken"] = 3] = "OpenBracketToken";
	SyntaxKind[SyntaxKind["CloseBracketToken"] = 4] = "CloseBracketToken";
	SyntaxKind[SyntaxKind["CommaToken"] = 5] = "CommaToken";
	SyntaxKind[SyntaxKind["ColonToken"] = 6] = "ColonToken";
	SyntaxKind[SyntaxKind["NullKeyword"] = 7] = "NullKeyword";
	SyntaxKind[SyntaxKind["TrueKeyword"] = 8] = "TrueKeyword";
	SyntaxKind[SyntaxKind["FalseKeyword"] = 9] = "FalseKeyword";
	SyntaxKind[SyntaxKind["StringLiteral"] = 10] = "StringLiteral";
	SyntaxKind[SyntaxKind["NumericLiteral"] = 11] = "NumericLiteral";
	SyntaxKind[SyntaxKind["LineCommentTrivia"] = 12] = "LineCommentTrivia";
	SyntaxKind[SyntaxKind["BlockCommentTrivia"] = 13] = "BlockCommentTrivia";
	SyntaxKind[SyntaxKind["LineBreakTrivia"] = 14] = "LineBreakTrivia";
	SyntaxKind[SyntaxKind["Trivia"] = 15] = "Trivia";
	SyntaxKind[SyntaxKind["Unknown"] = 16] = "Unknown";
	SyntaxKind[SyntaxKind["EOF"] = 17] = "EOF";
})(SyntaxKind || (SyntaxKind = {}));
/**
* Parses the given text and returns the object the JSON content represents. On invalid input, the parser tries to be as fault tolerant as possible, but still return a result.
* Therefore, always check the errors list to find out if the input was valid.
*/
var parse$1 = parse$2;
var ParseErrorCode;
(function(ParseErrorCode) {
	ParseErrorCode[ParseErrorCode["InvalidSymbol"] = 1] = "InvalidSymbol";
	ParseErrorCode[ParseErrorCode["InvalidNumberFormat"] = 2] = "InvalidNumberFormat";
	ParseErrorCode[ParseErrorCode["PropertyNameExpected"] = 3] = "PropertyNameExpected";
	ParseErrorCode[ParseErrorCode["ValueExpected"] = 4] = "ValueExpected";
	ParseErrorCode[ParseErrorCode["ColonExpected"] = 5] = "ColonExpected";
	ParseErrorCode[ParseErrorCode["CommaExpected"] = 6] = "CommaExpected";
	ParseErrorCode[ParseErrorCode["CloseBraceExpected"] = 7] = "CloseBraceExpected";
	ParseErrorCode[ParseErrorCode["CloseBracketExpected"] = 8] = "CloseBracketExpected";
	ParseErrorCode[ParseErrorCode["EndOfFileExpected"] = 9] = "EndOfFileExpected";
	ParseErrorCode[ParseErrorCode["InvalidCommentToken"] = 10] = "InvalidCommentToken";
	ParseErrorCode[ParseErrorCode["UnexpectedEndOfComment"] = 11] = "UnexpectedEndOfComment";
	ParseErrorCode[ParseErrorCode["UnexpectedEndOfString"] = 12] = "UnexpectedEndOfString";
	ParseErrorCode[ParseErrorCode["UnexpectedEndOfNumber"] = 13] = "UnexpectedEndOfNumber";
	ParseErrorCode[ParseErrorCode["InvalidUnicode"] = 14] = "InvalidUnicode";
	ParseErrorCode[ParseErrorCode["InvalidEscapeCharacter"] = 15] = "InvalidEscapeCharacter";
	ParseErrorCode[ParseErrorCode["InvalidCharacter"] = 16] = "InvalidCharacter";
})(ParseErrorCode || (ParseErrorCode = {}));
function printParseErrorCode(code) {
	switch (code) {
		case 1: return "InvalidSymbol";
		case 2: return "InvalidNumberFormat";
		case 3: return "PropertyNameExpected";
		case 4: return "ValueExpected";
		case 5: return "ColonExpected";
		case 6: return "CommaExpected";
		case 7: return "CloseBraceExpected";
		case 8: return "CloseBracketExpected";
		case 9: return "EndOfFileExpected";
		case 10: return "InvalidCommentToken";
		case 11: return "UnexpectedEndOfComment";
		case 12: return "UnexpectedEndOfString";
		case 13: return "UnexpectedEndOfNumber";
		case 14: return "InvalidUnicode";
		case 15: return "InvalidEscapeCharacter";
		case 16: return "InvalidCharacter";
	}
	return "<unknown ParseErrorCode>";
}
var PARSE_LIMITS$1 = {
	maxInputBytes: 262144,
	maxDepth: 64,
	maxNodes: 5e4,
	maxAliases: 0
};
function nullValue() {
	return {
		kind: "scalar",
		value: null
	};
}
function toValue(fragment) {
	switch (fragment.kind) {
		case "empty": return null;
		case "scalar": return fragment.value;
		case "pair": return { [fragment.key]: toValue(fragment.value) };
		case "map": return Object.fromEntries(fragment.entries.map((entry) => [entry.key, toValue(entry.value)]));
		case "sequence": return fragment.items.map(toValue);
		case "concat": return mergeTopLevelValues(fragment.children);
	}
}
function parseData(source, format = "auto", { jsonObjects = "legacy-fragment" } = {}) {
	const selectedFormat = resolveFormat(source, format);
	const inputDiagnostic = validateInputSize(source);
	if (inputDiagnostic !== null) return failure(selectedFormat, inputDiagnostic);
	return selectedFormat === "json" ? parseJson$1(source, jsonObjects === "json") : parseYaml(source);
}
function mergeTopLevelValues(children) {
	const values = children.filter((child) => child.kind !== "empty").map(toValue);
	if (values.length === 0) return null;
	if (values.every(isPlainObject)) return Object.assign({}, ...values);
	return values;
}
function formatErrorMessage(error) {
	return error instanceof Error ? error.message : String(error);
}
function parseJson$1(source, nativeJsonObjects = false) {
	const errors = [];
	const value = parse$1(source, errors, {
		allowEmptyContent: false,
		allowTrailingComma: false,
		disallowComments: true
	});
	const syntaxError = errors[0];
	if (syntaxError !== void 0) return failure("json", {
		code: "INVALID_JSON",
		message: printParseErrorCode(syntaxError.error),
		...positionAt(source, syntaxError.offset)
	});
	try {
		return {
			success: true,
			format: "json",
			fragment: fragmentFromUnknown(nativeJsonObjects ? JSON.parse(source) : value, { nodes: 0 }, 0),
			diagnostic: null
		};
	} catch (error) {
		if (error instanceof ParseLimitError) return failure("json", error.diagnostic);
		return failure("json", {
			code: nativeJsonObjects && error instanceof SyntaxError ? "INVALID_JSON" : "INVALID_JSON_VALUE",
			message: formatErrorMessage(error),
			line: 0,
			column: 0
		});
	}
}
function parseYaml(source) {
	const lineCounter = new LineCounter();
	const document = parseDocument(source, {
		lineCounter,
		prettyErrors: false,
		schema: "core",
		uniqueKeys: true
	});
	const error = document.errors[0];
	if (error !== void 0) {
		const offset = error.pos[0];
		return failure("yaml", {
			code: error.code,
			message: error.message,
			...yamlPosition(lineCounter, offset)
		});
	}
	const warning = document.warnings[0];
	if (warning !== void 0) return failure("yaml", {
		code: warning.code,
		message: warning.message,
		...yamlPosition(lineCounter, warning.pos[0])
	});
	try {
		return {
			success: true,
			format: "yaml",
			fragment: fragmentFromYamlNode(document.contents, { nodes: 0 }, 0, lineCounter),
			diagnostic: null
		};
	} catch (caught) {
		if (caught instanceof ParseLimitError) return failure("yaml", caught.diagnostic);
		return failure("yaml", {
			code: "INVALID_YAML_VALUE",
			message: formatErrorMessage(caught),
			line: 0,
			column: 0
		});
	}
}
function fragmentFromUnknown(value, budget, depth) {
	consumeBudget(budget, depth);
	if (value === null || typeof value === "string" || typeof value === "boolean") return {
		kind: "scalar",
		value
	};
	if (typeof value === "number" && Number.isFinite(value)) return {
		kind: "scalar",
		value
	};
	if (Array.isArray(value)) return {
		kind: "sequence",
		items: value.map((item) => fragmentFromUnknown(item, budget, depth + 1))
	};
	if (typeof value === "object") return {
		kind: "map",
		entries: Object.entries(value).map(([key, item]) => ({
			kind: "pair",
			key,
			value: fragmentFromUnknown(item, budget, depth + 1)
		}))
	};
	throw new TypeError("Parsed data contains an unsupported value.");
}
function fragmentFromYamlNode(node, budget, depth, lineCounter) {
	consumeBudget(budget, depth, nodePosition(node, lineCounter));
	if (node === null) return nullValue();
	if (isAlias(node)) throw new ParseLimitError({
		code: "YAML_ALIAS_NOT_ALLOWED",
		message: `YAML aliases are disabled (maximum ${PARSE_LIMITS$1.maxAliases}).`,
		...nodePosition(node, lineCounter)
	});
	if (isScalar(node)) {
		const value = node.value;
		if (value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number" && Number.isFinite(value)) return {
			kind: "scalar",
			value
		};
		throw new TypeError("Parsed YAML contains an unsupported scalar value.");
	}
	if (isSeq(node)) return {
		kind: "sequence",
		items: node.items.map((item) => fragmentFromYamlNode(item, budget, depth + 1, lineCounter))
	};
	if (isMap(node)) return {
		kind: "map",
		entries: node.items.map((item) => yamlPairToFragment(item, budget, depth, lineCounter))
	};
	throw new TypeError("Parsed YAML contains an unsupported node type.");
}
function yamlPairToFragment(item, budget, depth, lineCounter) {
	if (!isScalar(item.key) || typeof item.key.value !== "string") throw new ParseLimitError({
		code: "YAML_NON_STRING_KEY",
		message: "YAML map keys must be strings.",
		...nodePosition(item.key, lineCounter)
	});
	return {
		kind: "pair",
		key: item.key.value,
		value: fragmentFromYamlNode(item.value, budget, depth + 1, lineCounter)
	};
}
function consumeBudget(budget, depth, position = {
	line: 0,
	column: 0
}) {
	if (budget.limited !== false && depth > PARSE_LIMITS$1.maxDepth) throw new ParseLimitError({
		code: "MAX_DEPTH_EXCEEDED",
		message: `Parsed data exceeds the maximum nesting depth of ${PARSE_LIMITS$1.maxDepth}.`,
		...position
	});
	budget.nodes += 1;
	if (budget.limited !== false && budget.nodes > PARSE_LIMITS$1.maxNodes) throw new ParseLimitError({
		code: "MAX_NODES_EXCEEDED",
		message: `Parsed data exceeds the maximum node count of ${PARSE_LIMITS$1.maxNodes}.`,
		...position
	});
}
function validateInputSize(source) {
	const bytes = new TextEncoder().encode(source).byteLength;
	if (bytes <= PARSE_LIMITS$1.maxInputBytes) return null;
	return {
		code: "MAX_INPUT_BYTES_EXCEEDED",
		message: `Input is ${bytes} bytes; the maximum is ${PARSE_LIMITS$1.maxInputBytes} bytes.`,
		line: 0,
		column: 0
	};
}
function resolveFormat(source, format) {
	if (format === "json" || format === "yaml") return format;
	const errors = [];
	parse$1(source, errors, {
		allowEmptyContent: false,
		allowTrailingComma: false,
		disallowComments: true
	});
	return errors.length === 0 ? "json" : "yaml";
}
function failure(format, diagnostic) {
	return {
		success: false,
		format,
		fragment: null,
		diagnostic
	};
}
function positionAt(source, offset) {
	const lines = source.slice(0, Math.max(0, offset)).split("\n");
	return {
		line: lines.length,
		column: (lines.at(-1)?.length ?? 0) + 1
	};
}
function nodePosition(node, lineCounter) {
	if (typeof node !== "object" || node === null || !("range" in node)) return {
		line: 0,
		column: 0
	};
	const range = node.range;
	const offset = Array.isArray(range) && typeof range[0] === "number" ? range[0] : void 0;
	return offset === void 0 ? {
		line: 0,
		column: 0
	} : yamlPosition(lineCounter, offset);
}
function yamlPosition(lineCounter, offset) {
	const { line, col } = lineCounter.linePos(offset);
	return {
		line,
		column: col
	};
}
var ParseLimitError = class extends Error {
	constructor(diagnostic) {
		super(diagnostic.message);
		this.diagnostic = diagnostic;
		this.name = "ParseLimitError";
	}
};
function isPlainObject(value) {
	return typeof value === "object" && value !== null && !isDataArray(value);
}
function isDataArray(value) {
	return Array.isArray(value);
}
/** Parse through the existing bounded fragment parser; source text remains the owner's data. */
function parseValue(source, format = "auto") {
	const parsed = parseData(source, format, { jsonObjects: "json" });
	return parsed.success ? {
		success: true,
		format: parsed.format,
		value: toValue(parsed.fragment),
		diagnostic: null
	} : {
		success: false,
		format: parsed.format,
		value: null,
		diagnostic: parsed.diagnostic
	};
}
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
	maxInputBytes: PARSE_LIMITS$1.maxInputBytes,
	maxDepth: PARSE_LIMITS$1.maxDepth,
	maxNodes: PARSE_LIMITS$1.maxNodes
};
function parse(source, format) {
	const parsed = parseValue(source, format);
	if (parsed.success) return parsed.value;
	const diagnostic = parsed.diagnostic;
	if (diagnostic.code === "MAX_INPUT_BYTES_EXCEEDED") throw new StructuredDataError("PARSE_LIMIT_EXCEEDED", `Input is ${new TextEncoder().encode(source).byteLength} bytes; maximum is ${PARSE_LIMITS.maxInputBytes}.`);
	if (diagnostic.code === "MAX_DEPTH_EXCEEDED") throw new StructuredDataError("PARSE_LIMIT_EXCEEDED", `Data exceeds maximum nesting depth ${PARSE_LIMITS.maxDepth}.`);
	if (diagnostic.code === "MAX_NODES_EXCEEDED") throw new StructuredDataError("PARSE_LIMIT_EXCEEDED", `Data exceeds maximum node count ${PARSE_LIMITS.maxNodes}.`);
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
