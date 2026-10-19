// Name: Structured Data
// ID: kubohiroyastructureddata
// Description: Named structured data with JSON/YAML codecs for TurboWarp and server compilation.
// By: Hiroya Kubo
// License: MPL-2.0

(function (Scratch) {
  'use strict';

  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esmMin = (fn, res, err) => () => {
  	if (err) throw err[0];
  	try {
  		return fn && (res = fn(fn = 0)), res;
  	} catch (e) {
  		throw err = [e], e;
  	}
  };
  var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
  var __exportAll = (all, no_symbols) => {
  	let target = {};
  	for (var name in all) __defProp(target, name, {
  		get: all[name],
  		enumerable: true
  	});
  	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
  	return target;
  };
  var __copyProps = (to, from, except, desc) => {
  	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
  		key = keys[i];
  		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
  			get: ((k) => from[k]).bind(null, key),
  			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
  		});
  	}
  	return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
  	value: mod,
  	enumerable: true
  }) : target, mod));
  var __toCommonJS = (mod) => __hasOwnProp.call(mod, "module.exports") ? mod["module.exports"] : __copyProps(__defProp({}, "__esModule", { value: true }), mod);
  function isStructuredDataMvpEnabled(source = globalThis) {
  	const value = source.STRUCTURED_DATA_MVP;
  	return value === void 0 ? false : value === true || value === "true";
  }
  function isNamedDataRegistryMvpEnabled(source = globalThis) {
  	const value = source.NAMED_DATA_REGISTRY_MVP;
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
  	blockIconURI: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCI+PHJlY3QgeD0iNCIgeT0iOCIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE0IiByeD0iMyIgZmlsbD0iIzRDOTdGRiIvPjxyZWN0IHg9IjI2IiB5PSI4IiB3aWR0aD0iMTgiIGhlaWdodD0iMTQiIHJ4PSIzIiBmaWxsPSIjNTlDMDU5Ii8+PHJlY3QgeD0iMTUiIHk9IjI2IiB3aWR0aD0iMTgiIGhlaWdodD0iMTQiIHJ4PSIzIiBmaWxsPSIjRkZBQjE5Ii8+PC9zdmc+"
  };
  var JsonSnapshotError = class extends Error {
  	constructor(kind, dataPath) {
  		super("JSON snapshot failed.");
  		this.kind = kind;
  		this.dataPath = dataPath;
  	}
  };
  function appendPointer(path, key) {
  	return `${path}/${key.replace(/~/g, "~0").replace(/\//g, "~1")}`;
  }
  /** Copy JSON values without invoking accessors, toJSON, or input iterators. */
  function snapshotJson(value) {
  	const active = /* @__PURE__ */ new WeakSet();
  	let remaining = 1e5;
  	const visit = (input, path, depth) => {
  		if (--remaining < 0 || depth > 128) throw new JsonSnapshotError("limit", path);
  		if (input === null || typeof input === "string" || typeof input === "boolean") return input;
  		if (typeof input === "number" && Number.isFinite(input)) return input;
  		if (typeof input !== "object" || input === null || active.has(input)) throw new JsonSnapshotError("invalid", path);
  		const array = Array.isArray(input);
  		const prototype = Object.getPrototypeOf(input);
  		if (!array && prototype !== null && prototype !== Object.prototype) throw new JsonSnapshotError("invalid", path);
  		if (Object.getOwnPropertySymbols(input).length) throw new JsonSnapshotError("invalid", path);
  		active.add(input);
  		try {
  			if (array) {
  				const length = input.length;
  				if (!Number.isSafeInteger(length) || length > remaining) throw new JsonSnapshotError("limit", path);
  				const result = [];
  				for (let i = 0; i < length; i++) {
  					const child = appendPointer(path, String(i));
  					const descriptor = Object.getOwnPropertyDescriptor(input, i);
  					if (!descriptor || !("value" in descriptor)) throw new JsonSnapshotError("invalid", child);
  					result.push(visit(descriptor.value, child, depth + 1));
  				}
  				for (const key of Object.keys(input)) if (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= length) throw new JsonSnapshotError("invalid", appendPointer(path, key));
  				return result;
  			}
  			const result = {};
  			for (const key of Object.keys(input)) {
  				const child = appendPointer(path, key);
  				const descriptor = Object.getOwnPropertyDescriptor(input, key);
  				if (!descriptor || !("value" in descriptor)) throw new JsonSnapshotError("invalid", child);
  				Object.defineProperty(result, key, {
  					value: visit(descriptor.value, child, depth + 1),
  					enumerable: true,
  					writable: true,
  					configurable: true
  				});
  			}
  			return result;
  		} finally {
  			active.delete(input);
  		}
  	};
  	return visit(value, "", 0);
  }
  function isJsonRecord(value) {
  	return value !== null && typeof value === "object" && !Array.isArray(value);
  }
  var require_code$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.regexpCode = exports.getEsmExportName = exports.getProperty = exports.safeStringify = exports.stringify = exports.strConcat = exports.addCodeArg = exports.str = exports._ = exports.nil = exports._Code = exports.Name = exports.IDENTIFIER = exports._CodeOrName = void 0;
  	var _CodeOrName = class {};
  	exports._CodeOrName = _CodeOrName;
  	exports.IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;
  	var Name = class extends _CodeOrName {
  		constructor(s) {
  			super();
  			if (!exports.IDENTIFIER.test(s)) throw new Error("CodeGen: name must be a valid identifier");
  			this.str = s;
  		}
  		toString() {
  			return this.str;
  		}
  		emptyStr() {
  			return false;
  		}
  		get names() {
  			return { [this.str]: 1 };
  		}
  	};
  	exports.Name = Name;
  	var _Code = class extends _CodeOrName {
  		constructor(code) {
  			super();
  			this._items = typeof code === "string" ? [code] : code;
  		}
  		toString() {
  			return this.str;
  		}
  		emptyStr() {
  			if (this._items.length > 1) return false;
  			const item = this._items[0];
  			return item === "" || item === "\"\"";
  		}
  		get str() {
  			var _a;
  			return (_a = this._str) !== null && _a !== void 0 ? _a : this._str = this._items.reduce((s, c) => `${s}${c}`, "");
  		}
  		get names() {
  			var _a;
  			return (_a = this._names) !== null && _a !== void 0 ? _a : this._names = this._items.reduce((names, c) => {
  				if (c instanceof Name) names[c.str] = (names[c.str] || 0) + 1;
  				return names;
  			}, {});
  		}
  	};
  	exports._Code = _Code;
  	exports.nil = new _Code("");
  	function _(strs, ...args) {
  		const code = [strs[0]];
  		let i = 0;
  		while (i < args.length) {
  			addCodeArg(code, args[i]);
  			code.push(strs[++i]);
  		}
  		return new _Code(code);
  	}
  	exports._ = _;
  	var plus = new _Code("+");
  	function str(strs, ...args) {
  		const expr = [safeStringify(strs[0])];
  		let i = 0;
  		while (i < args.length) {
  			expr.push(plus);
  			addCodeArg(expr, args[i]);
  			expr.push(plus, safeStringify(strs[++i]));
  		}
  		optimize(expr);
  		return new _Code(expr);
  	}
  	exports.str = str;
  	function addCodeArg(code, arg) {
  		if (arg instanceof _Code) code.push(...arg._items);
  		else if (arg instanceof Name) code.push(arg);
  		else code.push(interpolate(arg));
  	}
  	exports.addCodeArg = addCodeArg;
  	function optimize(expr) {
  		let i = 1;
  		while (i < expr.length - 1) {
  			if (expr[i] === plus) {
  				const res = mergeExprItems(expr[i - 1], expr[i + 1]);
  				if (res !== void 0) {
  					expr.splice(i - 1, 3, res);
  					continue;
  				}
  				expr[i++] = "+";
  			}
  			i++;
  		}
  	}
  	function mergeExprItems(a, b) {
  		if (b === "\"\"") return a;
  		if (a === "\"\"") return b;
  		if (typeof a == "string") {
  			if (b instanceof Name || a[a.length - 1] !== "\"") return;
  			if (typeof b != "string") return `${a.slice(0, -1)}${b}"`;
  			if (b[0] === "\"") return a.slice(0, -1) + b.slice(1);
  			return;
  		}
  		if (typeof b == "string" && b[0] === "\"" && !(a instanceof Name)) return `"${a}${b.slice(1)}`;
  	}
  	function strConcat(c1, c2) {
  		return c2.emptyStr() ? c1 : c1.emptyStr() ? c2 : str`${c1}${c2}`;
  	}
  	exports.strConcat = strConcat;
  	function interpolate(x) {
  		return typeof x == "number" || typeof x == "boolean" || x === null ? x : safeStringify(Array.isArray(x) ? x.join(",") : x);
  	}
  	function stringify(x) {
  		return new _Code(safeStringify(x));
  	}
  	exports.stringify = stringify;
  	function safeStringify(x) {
  		return JSON.stringify(x).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  	}
  	exports.safeStringify = safeStringify;
  	function getProperty(key) {
  		return typeof key == "string" && exports.IDENTIFIER.test(key) ? new _Code(`.${key}`) : _`[${key}]`;
  	}
  	exports.getProperty = getProperty;
  	function getEsmExportName(key) {
  		if (typeof key == "string" && exports.IDENTIFIER.test(key)) return new _Code(`${key}`);
  		throw new Error(`CodeGen: invalid export name: ${key}, use explicit $id name mapping`);
  	}
  	exports.getEsmExportName = getEsmExportName;
  	function regexpCode(rx) {
  		return new _Code(rx.toString());
  	}
  	exports.regexpCode = regexpCode;
  }));
  var require_scope = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.ValueScope = exports.ValueScopeName = exports.Scope = exports.varKinds = exports.UsedValueState = void 0;
  	var code_1 = require_code$1();
  	var ValueError = class extends Error {
  		constructor(name) {
  			super(`CodeGen: "code" for ${name} not defined`);
  			this.value = name.value;
  		}
  	};
  	var UsedValueState;
  	(function(UsedValueState) {
  		UsedValueState[UsedValueState["Started"] = 0] = "Started";
  		UsedValueState[UsedValueState["Completed"] = 1] = "Completed";
  	})(UsedValueState || (exports.UsedValueState = UsedValueState = {}));
  	exports.varKinds = {
  		const: new code_1.Name("const"),
  		let: new code_1.Name("let"),
  		var: new code_1.Name("var")
  	};
  	var Scope = class {
  		constructor({ prefixes, parent } = {}) {
  			this._names = {};
  			this._prefixes = prefixes;
  			this._parent = parent;
  		}
  		toName(nameOrPrefix) {
  			return nameOrPrefix instanceof code_1.Name ? nameOrPrefix : this.name(nameOrPrefix);
  		}
  		name(prefix) {
  			return new code_1.Name(this._newName(prefix));
  		}
  		_newName(prefix) {
  			const ng = this._names[prefix] || this._nameGroup(prefix);
  			return `${prefix}${ng.index++}`;
  		}
  		_nameGroup(prefix) {
  			var _a, _b;
  			if (((_b = (_a = this._parent) === null || _a === void 0 ? void 0 : _a._prefixes) === null || _b === void 0 ? void 0 : _b.has(prefix)) || this._prefixes && !this._prefixes.has(prefix)) throw new Error(`CodeGen: prefix "${prefix}" is not allowed in this scope`);
  			return this._names[prefix] = {
  				prefix,
  				index: 0
  			};
  		}
  	};
  	exports.Scope = Scope;
  	var ValueScopeName = class extends code_1.Name {
  		constructor(prefix, nameStr) {
  			super(nameStr);
  			this.prefix = prefix;
  		}
  		setValue(value, { property, itemIndex }) {
  			this.value = value;
  			this.scopePath = (0, code_1._)`.${new code_1.Name(property)}[${itemIndex}]`;
  		}
  	};
  	exports.ValueScopeName = ValueScopeName;
  	var line = (0, code_1._)`\n`;
  	var ValueScope = class extends Scope {
  		constructor(opts) {
  			super(opts);
  			this._values = {};
  			this._scope = opts.scope;
  			this.opts = {
  				...opts,
  				_n: opts.lines ? line : code_1.nil
  			};
  		}
  		get() {
  			return this._scope;
  		}
  		name(prefix) {
  			return new ValueScopeName(prefix, this._newName(prefix));
  		}
  		value(nameOrPrefix, value) {
  			var _a;
  			if (value.ref === void 0) throw new Error("CodeGen: ref must be passed in value");
  			const name = this.toName(nameOrPrefix);
  			const { prefix } = name;
  			const valueKey = (_a = value.key) !== null && _a !== void 0 ? _a : value.ref;
  			let vs = this._values[prefix];
  			if (vs) {
  				const _name = vs.get(valueKey);
  				if (_name) return _name;
  			} else vs = this._values[prefix] = /* @__PURE__ */ new Map();
  			vs.set(valueKey, name);
  			const s = this._scope[prefix] || (this._scope[prefix] = []);
  			const itemIndex = s.length;
  			s[itemIndex] = value.ref;
  			name.setValue(value, {
  				property: prefix,
  				itemIndex
  			});
  			return name;
  		}
  		getValue(prefix, keyOrRef) {
  			const vs = this._values[prefix];
  			if (!vs) return;
  			return vs.get(keyOrRef);
  		}
  		scopeRefs(scopeName, values = this._values) {
  			return this._reduceValues(values, (name) => {
  				if (name.scopePath === void 0) throw new Error(`CodeGen: name "${name}" has no value`);
  				return (0, code_1._)`${scopeName}${name.scopePath}`;
  			});
  		}
  		scopeCode(values = this._values, usedValues, getCode) {
  			return this._reduceValues(values, (name) => {
  				if (name.value === void 0) throw new Error(`CodeGen: name "${name}" has no value`);
  				return name.value.code;
  			}, usedValues, getCode);
  		}
  		_reduceValues(values, valueCode, usedValues = {}, getCode) {
  			let code = code_1.nil;
  			for (const prefix in values) {
  				const vs = values[prefix];
  				if (!vs) continue;
  				const nameSet = usedValues[prefix] = usedValues[prefix] || /* @__PURE__ */ new Map();
  				vs.forEach((name) => {
  					if (nameSet.has(name)) return;
  					nameSet.set(name, UsedValueState.Started);
  					let c = valueCode(name);
  					if (c) {
  						const def = this.opts.es5 ? exports.varKinds.var : exports.varKinds.const;
  						code = (0, code_1._)`${code}${def} ${name} = ${c};${this.opts._n}`;
  					} else if (c = getCode === null || getCode === void 0 ? void 0 : getCode(name)) code = (0, code_1._)`${code}${c}${this.opts._n}`;
  					else throw new ValueError(name);
  					nameSet.set(name, UsedValueState.Completed);
  				});
  			}
  			return code;
  		}
  	};
  	exports.ValueScope = ValueScope;
  }));
  var require_codegen = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.or = exports.and = exports.not = exports.CodeGen = exports.operators = exports.varKinds = exports.ValueScopeName = exports.ValueScope = exports.Scope = exports.Name = exports.regexpCode = exports.stringify = exports.getProperty = exports.nil = exports.strConcat = exports.str = exports._ = void 0;
  	var code_1 = require_code$1();
  	var scope_1 = require_scope();
  	var code_2 = require_code$1();
  	Object.defineProperty(exports, "_", {
  		enumerable: true,
  		get: function() {
  			return code_2._;
  		}
  	});
  	Object.defineProperty(exports, "str", {
  		enumerable: true,
  		get: function() {
  			return code_2.str;
  		}
  	});
  	Object.defineProperty(exports, "strConcat", {
  		enumerable: true,
  		get: function() {
  			return code_2.strConcat;
  		}
  	});
  	Object.defineProperty(exports, "nil", {
  		enumerable: true,
  		get: function() {
  			return code_2.nil;
  		}
  	});
  	Object.defineProperty(exports, "getProperty", {
  		enumerable: true,
  		get: function() {
  			return code_2.getProperty;
  		}
  	});
  	Object.defineProperty(exports, "stringify", {
  		enumerable: true,
  		get: function() {
  			return code_2.stringify;
  		}
  	});
  	Object.defineProperty(exports, "regexpCode", {
  		enumerable: true,
  		get: function() {
  			return code_2.regexpCode;
  		}
  	});
  	Object.defineProperty(exports, "Name", {
  		enumerable: true,
  		get: function() {
  			return code_2.Name;
  		}
  	});
  	var scope_2 = require_scope();
  	Object.defineProperty(exports, "Scope", {
  		enumerable: true,
  		get: function() {
  			return scope_2.Scope;
  		}
  	});
  	Object.defineProperty(exports, "ValueScope", {
  		enumerable: true,
  		get: function() {
  			return scope_2.ValueScope;
  		}
  	});
  	Object.defineProperty(exports, "ValueScopeName", {
  		enumerable: true,
  		get: function() {
  			return scope_2.ValueScopeName;
  		}
  	});
  	Object.defineProperty(exports, "varKinds", {
  		enumerable: true,
  		get: function() {
  			return scope_2.varKinds;
  		}
  	});
  	exports.operators = {
  		GT: new code_1._Code(">"),
  		GTE: new code_1._Code(">="),
  		LT: new code_1._Code("<"),
  		LTE: new code_1._Code("<="),
  		EQ: new code_1._Code("==="),
  		NEQ: new code_1._Code("!=="),
  		NOT: new code_1._Code("!"),
  		OR: new code_1._Code("||"),
  		AND: new code_1._Code("&&"),
  		ADD: new code_1._Code("+")
  	};
  	var Node = class {
  		optimizeNodes() {
  			return this;
  		}
  		optimizeNames(_names, _constants) {
  			return this;
  		}
  	};
  	var Def = class extends Node {
  		constructor(varKind, name, rhs) {
  			super();
  			this.varKind = varKind;
  			this.name = name;
  			this.rhs = rhs;
  		}
  		render({ es5, _n }) {
  			const varKind = es5 ? scope_1.varKinds.var : this.varKind;
  			const rhs = this.rhs === void 0 ? "" : ` = ${this.rhs}`;
  			return `${varKind} ${this.name}${rhs};` + _n;
  		}
  		optimizeNames(names, constants) {
  			if (!names[this.name.str]) return;
  			if (this.rhs) this.rhs = optimizeExpr(this.rhs, names, constants);
  			return this;
  		}
  		get names() {
  			return this.rhs instanceof code_1._CodeOrName ? this.rhs.names : {};
  		}
  	};
  	var Assign = class extends Node {
  		constructor(lhs, rhs, sideEffects) {
  			super();
  			this.lhs = lhs;
  			this.rhs = rhs;
  			this.sideEffects = sideEffects;
  		}
  		render({ _n }) {
  			return `${this.lhs} = ${this.rhs};` + _n;
  		}
  		optimizeNames(names, constants) {
  			if (this.lhs instanceof code_1.Name && !names[this.lhs.str] && !this.sideEffects) return;
  			this.rhs = optimizeExpr(this.rhs, names, constants);
  			return this;
  		}
  		get names() {
  			return addExprNames(this.lhs instanceof code_1.Name ? {} : { ...this.lhs.names }, this.rhs);
  		}
  	};
  	var AssignOp = class extends Assign {
  		constructor(lhs, op, rhs, sideEffects) {
  			super(lhs, rhs, sideEffects);
  			this.op = op;
  		}
  		render({ _n }) {
  			return `${this.lhs} ${this.op}= ${this.rhs};` + _n;
  		}
  	};
  	var Label = class extends Node {
  		constructor(label) {
  			super();
  			this.label = label;
  			this.names = {};
  		}
  		render({ _n }) {
  			return `${this.label}:` + _n;
  		}
  	};
  	var Break = class extends Node {
  		constructor(label) {
  			super();
  			this.label = label;
  			this.names = {};
  		}
  		render({ _n }) {
  			return `break${this.label ? ` ${this.label}` : ""};` + _n;
  		}
  	};
  	var Throw = class extends Node {
  		constructor(error) {
  			super();
  			this.error = error;
  		}
  		render({ _n }) {
  			return `throw ${this.error};` + _n;
  		}
  		get names() {
  			return this.error.names;
  		}
  	};
  	var AnyCode = class extends Node {
  		constructor(code) {
  			super();
  			this.code = code;
  		}
  		render({ _n }) {
  			return `${this.code};` + _n;
  		}
  		optimizeNodes() {
  			return `${this.code}` ? this : void 0;
  		}
  		optimizeNames(names, constants) {
  			this.code = optimizeExpr(this.code, names, constants);
  			return this;
  		}
  		get names() {
  			return this.code instanceof code_1._CodeOrName ? this.code.names : {};
  		}
  	};
  	var ParentNode = class extends Node {
  		constructor(nodes = []) {
  			super();
  			this.nodes = nodes;
  		}
  		render(opts) {
  			return this.nodes.reduce((code, n) => code + n.render(opts), "");
  		}
  		optimizeNodes() {
  			const { nodes } = this;
  			let i = nodes.length;
  			while (i--) {
  				const n = nodes[i].optimizeNodes();
  				if (Array.isArray(n)) nodes.splice(i, 1, ...n);
  				else if (n) nodes[i] = n;
  				else nodes.splice(i, 1);
  			}
  			return nodes.length > 0 ? this : void 0;
  		}
  		optimizeNames(names, constants) {
  			const { nodes } = this;
  			let i = nodes.length;
  			while (i--) {
  				const n = nodes[i];
  				if (n.optimizeNames(names, constants)) continue;
  				subtractNames(names, n.names);
  				nodes.splice(i, 1);
  			}
  			return nodes.length > 0 ? this : void 0;
  		}
  		get names() {
  			return this.nodes.reduce((names, n) => addNames(names, n.names), {});
  		}
  	};
  	var BlockNode = class extends ParentNode {
  		render(opts) {
  			return "{" + opts._n + super.render(opts) + "}" + opts._n;
  		}
  	};
  	var Root = class extends ParentNode {};
  	var Else = class extends BlockNode {};
  	Else.kind = "else";
  	var If = class If extends BlockNode {
  		constructor(condition, nodes) {
  			super(nodes);
  			this.condition = condition;
  		}
  		render(opts) {
  			let code = `if(${this.condition})` + super.render(opts);
  			if (this.else) code += "else " + this.else.render(opts);
  			return code;
  		}
  		optimizeNodes() {
  			super.optimizeNodes();
  			const cond = this.condition;
  			if (cond === true) return this.nodes;
  			let e = this.else;
  			if (e) {
  				const ns = e.optimizeNodes();
  				e = this.else = Array.isArray(ns) ? new Else(ns) : ns;
  			}
  			if (e) {
  				if (cond === false) return e instanceof If ? e : e.nodes;
  				if (this.nodes.length) return this;
  				return new If(not(cond), e instanceof If ? [e] : e.nodes);
  			}
  			if (cond === false || !this.nodes.length) return void 0;
  			return this;
  		}
  		optimizeNames(names, constants) {
  			var _a;
  			this.else = (_a = this.else) === null || _a === void 0 ? void 0 : _a.optimizeNames(names, constants);
  			if (!(super.optimizeNames(names, constants) || this.else)) return;
  			this.condition = optimizeExpr(this.condition, names, constants);
  			return this;
  		}
  		get names() {
  			const names = super.names;
  			addExprNames(names, this.condition);
  			if (this.else) addNames(names, this.else.names);
  			return names;
  		}
  	};
  	If.kind = "if";
  	var For = class extends BlockNode {};
  	For.kind = "for";
  	var ForLoop = class extends For {
  		constructor(iteration) {
  			super();
  			this.iteration = iteration;
  		}
  		render(opts) {
  			return `for(${this.iteration})` + super.render(opts);
  		}
  		optimizeNames(names, constants) {
  			if (!super.optimizeNames(names, constants)) return;
  			this.iteration = optimizeExpr(this.iteration, names, constants);
  			return this;
  		}
  		get names() {
  			return addNames(super.names, this.iteration.names);
  		}
  	};
  	var ForRange = class extends For {
  		constructor(varKind, name, from, to) {
  			super();
  			this.varKind = varKind;
  			this.name = name;
  			this.from = from;
  			this.to = to;
  		}
  		render(opts) {
  			const varKind = opts.es5 ? scope_1.varKinds.var : this.varKind;
  			const { name, from, to } = this;
  			return `for(${varKind} ${name}=${from}; ${name}<${to}; ${name}++)` + super.render(opts);
  		}
  		get names() {
  			return addExprNames(addExprNames(super.names, this.from), this.to);
  		}
  	};
  	var ForIter = class extends For {
  		constructor(loop, varKind, name, iterable) {
  			super();
  			this.loop = loop;
  			this.varKind = varKind;
  			this.name = name;
  			this.iterable = iterable;
  		}
  		render(opts) {
  			return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(opts);
  		}
  		optimizeNames(names, constants) {
  			if (!super.optimizeNames(names, constants)) return;
  			this.iterable = optimizeExpr(this.iterable, names, constants);
  			return this;
  		}
  		get names() {
  			return addNames(super.names, this.iterable.names);
  		}
  	};
  	var Func = class extends BlockNode {
  		constructor(name, args, async) {
  			super();
  			this.name = name;
  			this.args = args;
  			this.async = async;
  		}
  		render(opts) {
  			return `${this.async ? "async " : ""}function ${this.name}(${this.args})` + super.render(opts);
  		}
  	};
  	Func.kind = "func";
  	var Return = class extends ParentNode {
  		render(opts) {
  			return "return " + super.render(opts);
  		}
  	};
  	Return.kind = "return";
  	var Try = class extends BlockNode {
  		render(opts) {
  			let code = "try" + super.render(opts);
  			if (this.catch) code += this.catch.render(opts);
  			if (this.finally) code += this.finally.render(opts);
  			return code;
  		}
  		optimizeNodes() {
  			var _a, _b;
  			super.optimizeNodes();
  			(_a = this.catch) === null || _a === void 0 || _a.optimizeNodes();
  			(_b = this.finally) === null || _b === void 0 || _b.optimizeNodes();
  			return this;
  		}
  		optimizeNames(names, constants) {
  			var _a, _b;
  			super.optimizeNames(names, constants);
  			(_a = this.catch) === null || _a === void 0 || _a.optimizeNames(names, constants);
  			(_b = this.finally) === null || _b === void 0 || _b.optimizeNames(names, constants);
  			return this;
  		}
  		get names() {
  			const names = super.names;
  			if (this.catch) addNames(names, this.catch.names);
  			if (this.finally) addNames(names, this.finally.names);
  			return names;
  		}
  	};
  	var Catch = class extends BlockNode {
  		constructor(error) {
  			super();
  			this.error = error;
  		}
  		render(opts) {
  			return `catch(${this.error})` + super.render(opts);
  		}
  	};
  	Catch.kind = "catch";
  	var Finally = class extends BlockNode {
  		render(opts) {
  			return "finally" + super.render(opts);
  		}
  	};
  	Finally.kind = "finally";
  	var CodeGen = class {
  		constructor(extScope, opts = {}) {
  			this._values = {};
  			this._blockStarts = [];
  			this._constants = {};
  			this.opts = {
  				...opts,
  				_n: opts.lines ? "\n" : ""
  			};
  			this._extScope = extScope;
  			this._scope = new scope_1.Scope({ parent: extScope });
  			this._nodes = [new Root()];
  		}
  		toString() {
  			return this._root.render(this.opts);
  		}
  		name(prefix) {
  			return this._scope.name(prefix);
  		}
  		scopeName(prefix) {
  			return this._extScope.name(prefix);
  		}
  		scopeValue(prefixOrName, value) {
  			const name = this._extScope.value(prefixOrName, value);
  			(this._values[name.prefix] || (this._values[name.prefix] = /* @__PURE__ */ new Set())).add(name);
  			return name;
  		}
  		getScopeValue(prefix, keyOrRef) {
  			return this._extScope.getValue(prefix, keyOrRef);
  		}
  		scopeRefs(scopeName) {
  			return this._extScope.scopeRefs(scopeName, this._values);
  		}
  		scopeCode() {
  			return this._extScope.scopeCode(this._values);
  		}
  		_def(varKind, nameOrPrefix, rhs, constant) {
  			const name = this._scope.toName(nameOrPrefix);
  			if (rhs !== void 0 && constant) this._constants[name.str] = rhs;
  			this._leafNode(new Def(varKind, name, rhs));
  			return name;
  		}
  		const(nameOrPrefix, rhs, _constant) {
  			return this._def(scope_1.varKinds.const, nameOrPrefix, rhs, _constant);
  		}
  		let(nameOrPrefix, rhs, _constant) {
  			return this._def(scope_1.varKinds.let, nameOrPrefix, rhs, _constant);
  		}
  		var(nameOrPrefix, rhs, _constant) {
  			return this._def(scope_1.varKinds.var, nameOrPrefix, rhs, _constant);
  		}
  		assign(lhs, rhs, sideEffects) {
  			return this._leafNode(new Assign(lhs, rhs, sideEffects));
  		}
  		add(lhs, rhs) {
  			return this._leafNode(new AssignOp(lhs, exports.operators.ADD, rhs));
  		}
  		code(c) {
  			if (typeof c == "function") c();
  			else if (c !== code_1.nil) this._leafNode(new AnyCode(c));
  			return this;
  		}
  		object(...keyValues) {
  			const code = ["{"];
  			for (const [key, value] of keyValues) {
  				if (code.length > 1) code.push(",");
  				code.push(key);
  				if (key !== value || this.opts.es5) {
  					code.push(":");
  					(0, code_1.addCodeArg)(code, value);
  				}
  			}
  			code.push("}");
  			return new code_1._Code(code);
  		}
  		if(condition, thenBody, elseBody) {
  			this._blockNode(new If(condition));
  			if (thenBody && elseBody) this.code(thenBody).else().code(elseBody).endIf();
  			else if (thenBody) this.code(thenBody).endIf();
  			else if (elseBody) throw new Error("CodeGen: \"else\" body without \"then\" body");
  			return this;
  		}
  		elseIf(condition) {
  			return this._elseNode(new If(condition));
  		}
  		else() {
  			return this._elseNode(new Else());
  		}
  		endIf() {
  			return this._endBlockNode(If, Else);
  		}
  		_for(node, forBody) {
  			this._blockNode(node);
  			if (forBody) this.code(forBody).endFor();
  			return this;
  		}
  		for(iteration, forBody) {
  			return this._for(new ForLoop(iteration), forBody);
  		}
  		forRange(nameOrPrefix, from, to, forBody, varKind = this.opts.es5 ? scope_1.varKinds.var : scope_1.varKinds.let) {
  			const name = this._scope.toName(nameOrPrefix);
  			return this._for(new ForRange(varKind, name, from, to), () => forBody(name));
  		}
  		forOf(nameOrPrefix, iterable, forBody, varKind = scope_1.varKinds.const) {
  			const name = this._scope.toName(nameOrPrefix);
  			if (this.opts.es5) {
  				const arr = iterable instanceof code_1.Name ? iterable : this.var("_arr", iterable);
  				return this.forRange("_i", 0, (0, code_1._)`${arr}.length`, (i) => {
  					this.var(name, (0, code_1._)`${arr}[${i}]`);
  					forBody(name);
  				});
  			}
  			return this._for(new ForIter("of", varKind, name, iterable), () => forBody(name));
  		}
  		forIn(nameOrPrefix, obj, forBody, varKind = this.opts.es5 ? scope_1.varKinds.var : scope_1.varKinds.const) {
  			if (this.opts.ownProperties) return this.forOf(nameOrPrefix, (0, code_1._)`Object.keys(${obj})`, forBody);
  			const name = this._scope.toName(nameOrPrefix);
  			return this._for(new ForIter("in", varKind, name, obj), () => forBody(name));
  		}
  		endFor() {
  			return this._endBlockNode(For);
  		}
  		label(label) {
  			return this._leafNode(new Label(label));
  		}
  		break(label) {
  			return this._leafNode(new Break(label));
  		}
  		return(value) {
  			const node = new Return();
  			this._blockNode(node);
  			this.code(value);
  			if (node.nodes.length !== 1) throw new Error("CodeGen: \"return\" should have one node");
  			return this._endBlockNode(Return);
  		}
  		try(tryBody, catchCode, finallyCode) {
  			if (!catchCode && !finallyCode) throw new Error("CodeGen: \"try\" without \"catch\" and \"finally\"");
  			const node = new Try();
  			this._blockNode(node);
  			this.code(tryBody);
  			if (catchCode) {
  				const error = this.name("e");
  				this._currNode = node.catch = new Catch(error);
  				catchCode(error);
  			}
  			if (finallyCode) {
  				this._currNode = node.finally = new Finally();
  				this.code(finallyCode);
  			}
  			return this._endBlockNode(Catch, Finally);
  		}
  		throw(error) {
  			return this._leafNode(new Throw(error));
  		}
  		block(body, nodeCount) {
  			this._blockStarts.push(this._nodes.length);
  			if (body) this.code(body).endBlock(nodeCount);
  			return this;
  		}
  		endBlock(nodeCount) {
  			const len = this._blockStarts.pop();
  			if (len === void 0) throw new Error("CodeGen: not in self-balancing block");
  			const toClose = this._nodes.length - len;
  			if (toClose < 0 || nodeCount !== void 0 && toClose !== nodeCount) throw new Error(`CodeGen: wrong number of nodes: ${toClose} vs ${nodeCount} expected`);
  			this._nodes.length = len;
  			return this;
  		}
  		func(name, args = code_1.nil, async, funcBody) {
  			this._blockNode(new Func(name, args, async));
  			if (funcBody) this.code(funcBody).endFunc();
  			return this;
  		}
  		endFunc() {
  			return this._endBlockNode(Func);
  		}
  		optimize(n = 1) {
  			while (n-- > 0) {
  				this._root.optimizeNodes();
  				this._root.optimizeNames(this._root.names, this._constants);
  			}
  		}
  		_leafNode(node) {
  			this._currNode.nodes.push(node);
  			return this;
  		}
  		_blockNode(node) {
  			this._currNode.nodes.push(node);
  			this._nodes.push(node);
  		}
  		_endBlockNode(N1, N2) {
  			const n = this._currNode;
  			if (n instanceof N1 || N2 && n instanceof N2) {
  				this._nodes.pop();
  				return this;
  			}
  			throw new Error(`CodeGen: not in block "${N2 ? `${N1.kind}/${N2.kind}` : N1.kind}"`);
  		}
  		_elseNode(node) {
  			const n = this._currNode;
  			if (!(n instanceof If)) throw new Error("CodeGen: \"else\" without \"if\"");
  			this._currNode = n.else = node;
  			return this;
  		}
  		get _root() {
  			return this._nodes[0];
  		}
  		get _currNode() {
  			const ns = this._nodes;
  			return ns[ns.length - 1];
  		}
  		set _currNode(node) {
  			const ns = this._nodes;
  			ns[ns.length - 1] = node;
  		}
  	};
  	exports.CodeGen = CodeGen;
  	function addNames(names, from) {
  		for (const n in from) names[n] = (names[n] || 0) + (from[n] || 0);
  		return names;
  	}
  	function addExprNames(names, from) {
  		return from instanceof code_1._CodeOrName ? addNames(names, from.names) : names;
  	}
  	function optimizeExpr(expr, names, constants) {
  		if (expr instanceof code_1.Name) return replaceName(expr);
  		if (!canOptimize(expr)) return expr;
  		return new code_1._Code(expr._items.reduce((items, c) => {
  			if (c instanceof code_1.Name) c = replaceName(c);
  			if (c instanceof code_1._Code) items.push(...c._items);
  			else items.push(c);
  			return items;
  		}, []));
  		function replaceName(n) {
  			const c = constants[n.str];
  			if (c === void 0 || names[n.str] !== 1) return n;
  			delete names[n.str];
  			return c;
  		}
  		function canOptimize(e) {
  			return e instanceof code_1._Code && e._items.some((c) => c instanceof code_1.Name && names[c.str] === 1 && constants[c.str] !== void 0);
  		}
  	}
  	function subtractNames(names, from) {
  		for (const n in from) names[n] = (names[n] || 0) - (from[n] || 0);
  	}
  	function not(x) {
  		return typeof x == "boolean" || typeof x == "number" || x === null ? !x : (0, code_1._)`!${par(x)}`;
  	}
  	exports.not = not;
  	var andCode = mappend(exports.operators.AND);
  	function and(...args) {
  		return args.reduce(andCode);
  	}
  	exports.and = and;
  	var orCode = mappend(exports.operators.OR);
  	function or(...args) {
  		return args.reduce(orCode);
  	}
  	exports.or = or;
  	function mappend(op) {
  		return (x, y) => x === code_1.nil ? y : y === code_1.nil ? x : (0, code_1._)`${par(x)} ${op} ${par(y)}`;
  	}
  	function par(x) {
  		return x instanceof code_1.Name ? x : (0, code_1._)`(${x})`;
  	}
  }));
  var require_util = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.checkStrictMode = exports.getErrorPath = exports.Type = exports.useFunc = exports.setEvaluated = exports.evaluatedPropsToName = exports.mergeEvaluated = exports.eachItem = exports.unescapeJsonPointer = exports.escapeJsonPointer = exports.escapeFragment = exports.unescapeFragment = exports.schemaRefOrVal = exports.schemaHasRulesButRef = exports.schemaHasRules = exports.checkUnknownRules = exports.alwaysValidSchema = exports.toHash = void 0;
  	var codegen_1 = require_codegen();
  	var code_1 = require_code$1();
  	function toHash(arr) {
  		const hash = {};
  		for (const item of arr) hash[item] = true;
  		return hash;
  	}
  	exports.toHash = toHash;
  	function alwaysValidSchema(it, schema) {
  		if (typeof schema == "boolean") return schema;
  		if (Object.keys(schema).length === 0) return true;
  		checkUnknownRules(it, schema);
  		return !schemaHasRules(schema, it.self.RULES.all);
  	}
  	exports.alwaysValidSchema = alwaysValidSchema;
  	function checkUnknownRules(it, schema = it.schema) {
  		const { opts, self } = it;
  		if (!opts.strictSchema) return;
  		if (typeof schema === "boolean") return;
  		const rules = self.RULES.keywords;
  		for (const key in schema) if (!rules[key]) checkStrictMode(it, `unknown keyword: "${key}"`);
  	}
  	exports.checkUnknownRules = checkUnknownRules;
  	function schemaHasRules(schema, rules) {
  		if (typeof schema == "boolean") return !schema;
  		for (const key in schema) if (rules[key]) return true;
  		return false;
  	}
  	exports.schemaHasRules = schemaHasRules;
  	function schemaHasRulesButRef(schema, RULES) {
  		if (typeof schema == "boolean") return !schema;
  		for (const key in schema) if (key !== "$ref" && RULES.all[key]) return true;
  		return false;
  	}
  	exports.schemaHasRulesButRef = schemaHasRulesButRef;
  	function schemaRefOrVal({ topSchemaRef, schemaPath }, schema, keyword, $data) {
  		if (!$data) {
  			if (typeof schema == "number" || typeof schema == "boolean") return schema;
  			if (typeof schema == "string") return (0, codegen_1._)`${schema}`;
  		}
  		return (0, codegen_1._)`${topSchemaRef}${schemaPath}${(0, codegen_1.getProperty)(keyword)}`;
  	}
  	exports.schemaRefOrVal = schemaRefOrVal;
  	function unescapeFragment(str) {
  		return unescapeJsonPointer(decodeURIComponent(str));
  	}
  	exports.unescapeFragment = unescapeFragment;
  	function escapeFragment(str) {
  		return encodeURIComponent(escapeJsonPointer(str));
  	}
  	exports.escapeFragment = escapeFragment;
  	function escapeJsonPointer(str) {
  		if (typeof str == "number") return `${str}`;
  		return str.replace(/~/g, "~0").replace(/\//g, "~1");
  	}
  	exports.escapeJsonPointer = escapeJsonPointer;
  	function unescapeJsonPointer(str) {
  		return str.replace(/~1/g, "/").replace(/~0/g, "~");
  	}
  	exports.unescapeJsonPointer = unescapeJsonPointer;
  	function eachItem(xs, f) {
  		if (Array.isArray(xs)) for (const x of xs) f(x);
  		else f(xs);
  	}
  	exports.eachItem = eachItem;
  	function makeMergeEvaluated({ mergeNames, mergeToName, mergeValues, resultToName }) {
  		return (gen, from, to, toName) => {
  			const res = to === void 0 ? from : to instanceof codegen_1.Name ? (from instanceof codegen_1.Name ? mergeNames(gen, from, to) : mergeToName(gen, from, to), to) : from instanceof codegen_1.Name ? (mergeToName(gen, to, from), from) : mergeValues(from, to);
  			return toName === codegen_1.Name && !(res instanceof codegen_1.Name) ? resultToName(gen, res) : res;
  		};
  	}
  	exports.mergeEvaluated = {
  		props: makeMergeEvaluated({
  			mergeNames: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true && ${from} !== undefined`, () => {
  				gen.if((0, codegen_1._)`${from} === true`, () => gen.assign(to, true), () => gen.assign(to, (0, codegen_1._)`${to} || {}`).code((0, codegen_1._)`Object.assign(${to}, ${from})`));
  			}),
  			mergeToName: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true`, () => {
  				if (from === true) gen.assign(to, true);
  				else {
  					gen.assign(to, (0, codegen_1._)`${to} || {}`);
  					setEvaluated(gen, to, from);
  				}
  			}),
  			mergeValues: (from, to) => from === true ? true : {
  				...from,
  				...to
  			},
  			resultToName: evaluatedPropsToName
  		}),
  		items: makeMergeEvaluated({
  			mergeNames: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true && ${from} !== undefined`, () => gen.assign(to, (0, codegen_1._)`${from} === true ? true : ${to} > ${from} ? ${to} : ${from}`)),
  			mergeToName: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true`, () => gen.assign(to, from === true ? true : (0, codegen_1._)`${to} > ${from} ? ${to} : ${from}`)),
  			mergeValues: (from, to) => from === true ? true : Math.max(from, to),
  			resultToName: (gen, items) => gen.var("items", items)
  		})
  	};
  	function evaluatedPropsToName(gen, ps) {
  		if (ps === true) return gen.var("props", true);
  		const props = gen.var("props", (0, codegen_1._)`{}`);
  		if (ps !== void 0) setEvaluated(gen, props, ps);
  		return props;
  	}
  	exports.evaluatedPropsToName = evaluatedPropsToName;
  	function setEvaluated(gen, props, ps) {
  		Object.keys(ps).forEach((p) => gen.assign((0, codegen_1._)`${props}${(0, codegen_1.getProperty)(p)}`, true));
  	}
  	exports.setEvaluated = setEvaluated;
  	var snippets = {};
  	function useFunc(gen, f) {
  		return gen.scopeValue("func", {
  			ref: f,
  			code: snippets[f.code] || (snippets[f.code] = new code_1._Code(f.code))
  		});
  	}
  	exports.useFunc = useFunc;
  	var Type;
  	(function(Type) {
  		Type[Type["Num"] = 0] = "Num";
  		Type[Type["Str"] = 1] = "Str";
  	})(Type || (exports.Type = Type = {}));
  	function getErrorPath(dataProp, dataPropType, jsPropertySyntax) {
  		if (dataProp instanceof codegen_1.Name) {
  			const isNumber = dataPropType === Type.Num;
  			return jsPropertySyntax ? isNumber ? (0, codegen_1._)`"[" + ${dataProp} + "]"` : (0, codegen_1._)`"['" + ${dataProp} + "']"` : isNumber ? (0, codegen_1._)`"/" + ${dataProp}` : (0, codegen_1._)`"/" + ${dataProp}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
  		}
  		return jsPropertySyntax ? (0, codegen_1.getProperty)(dataProp).toString() : "/" + escapeJsonPointer(dataProp);
  	}
  	exports.getErrorPath = getErrorPath;
  	function checkStrictMode(it, msg, mode = it.opts.strictSchema) {
  		if (!mode) return;
  		msg = `strict mode: ${msg}`;
  		if (mode === true) throw new Error(msg);
  		it.self.logger.warn(msg);
  	}
  	exports.checkStrictMode = checkStrictMode;
  }));
  var require_names = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var codegen_1 = require_codegen();
  	exports.default = {
  		data: new codegen_1.Name("data"),
  		valCxt: new codegen_1.Name("valCxt"),
  		instancePath: new codegen_1.Name("instancePath"),
  		parentData: new codegen_1.Name("parentData"),
  		parentDataProperty: new codegen_1.Name("parentDataProperty"),
  		rootData: new codegen_1.Name("rootData"),
  		dynamicAnchors: new codegen_1.Name("dynamicAnchors"),
  		vErrors: new codegen_1.Name("vErrors"),
  		errors: new codegen_1.Name("errors"),
  		this: new codegen_1.Name("this"),
  		self: new codegen_1.Name("self"),
  		scope: new codegen_1.Name("scope"),
  		json: new codegen_1.Name("json"),
  		jsonPos: new codegen_1.Name("jsonPos"),
  		jsonLen: new codegen_1.Name("jsonLen"),
  		jsonPart: new codegen_1.Name("jsonPart")
  	};
  }));
  var require_errors = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.extendErrors = exports.resetErrorsCount = exports.reportExtraError = exports.reportError = exports.keyword$DataError = exports.keywordError = void 0;
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	var names_1 = require_names();
  	exports.keywordError = { message: ({ keyword }) => (0, codegen_1.str)`must pass "${keyword}" keyword validation` };
  	exports.keyword$DataError = { message: ({ keyword, schemaType }) => schemaType ? (0, codegen_1.str)`"${keyword}" keyword must be ${schemaType} ($data)` : (0, codegen_1.str)`"${keyword}" keyword is invalid ($data)` };
  	function reportError(cxt, error = exports.keywordError, errorPaths, overrideAllErrors) {
  		const { it } = cxt;
  		const { gen, compositeRule, allErrors } = it;
  		const errObj = errorObjectCode(cxt, error, errorPaths);
  		if (overrideAllErrors !== null && overrideAllErrors !== void 0 ? overrideAllErrors : compositeRule || allErrors) addError(gen, errObj);
  		else returnErrors(it, (0, codegen_1._)`[${errObj}]`);
  	}
  	exports.reportError = reportError;
  	function reportExtraError(cxt, error = exports.keywordError, errorPaths) {
  		const { it } = cxt;
  		const { gen, compositeRule, allErrors } = it;
  		addError(gen, errorObjectCode(cxt, error, errorPaths));
  		if (!(compositeRule || allErrors)) returnErrors(it, names_1.default.vErrors);
  	}
  	exports.reportExtraError = reportExtraError;
  	function resetErrorsCount(gen, errsCount) {
  		gen.assign(names_1.default.errors, errsCount);
  		gen.if((0, codegen_1._)`${names_1.default.vErrors} !== null`, () => gen.if(errsCount, () => gen.assign((0, codegen_1._)`${names_1.default.vErrors}.length`, errsCount), () => gen.assign(names_1.default.vErrors, null)));
  	}
  	exports.resetErrorsCount = resetErrorsCount;
  	function extendErrors({ gen, keyword, schemaValue, data, errsCount, it }) {
  		/* istanbul ignore if */
  		if (errsCount === void 0) throw new Error("ajv implementation error");
  		const err = gen.name("err");
  		gen.forRange("i", errsCount, names_1.default.errors, (i) => {
  			gen.const(err, (0, codegen_1._)`${names_1.default.vErrors}[${i}]`);
  			gen.if((0, codegen_1._)`${err}.instancePath === undefined`, () => gen.assign((0, codegen_1._)`${err}.instancePath`, (0, codegen_1.strConcat)(names_1.default.instancePath, it.errorPath)));
  			gen.assign((0, codegen_1._)`${err}.schemaPath`, (0, codegen_1.str)`${it.errSchemaPath}/${keyword}`);
  			if (it.opts.verbose) {
  				gen.assign((0, codegen_1._)`${err}.schema`, schemaValue);
  				gen.assign((0, codegen_1._)`${err}.data`, data);
  			}
  		});
  	}
  	exports.extendErrors = extendErrors;
  	function addError(gen, errObj) {
  		const err = gen.const("err", errObj);
  		gen.if((0, codegen_1._)`${names_1.default.vErrors} === null`, () => gen.assign(names_1.default.vErrors, (0, codegen_1._)`[${err}]`), (0, codegen_1._)`${names_1.default.vErrors}.push(${err})`);
  		gen.code((0, codegen_1._)`${names_1.default.errors}++`);
  	}
  	function returnErrors(it, errs) {
  		const { gen, validateName, schemaEnv } = it;
  		if (schemaEnv.$async) gen.throw((0, codegen_1._)`new ${it.ValidationError}(${errs})`);
  		else {
  			gen.assign((0, codegen_1._)`${validateName}.errors`, errs);
  			gen.return(false);
  		}
  	}
  	var E = {
  		keyword: new codegen_1.Name("keyword"),
  		schemaPath: new codegen_1.Name("schemaPath"),
  		params: new codegen_1.Name("params"),
  		propertyName: new codegen_1.Name("propertyName"),
  		message: new codegen_1.Name("message"),
  		schema: new codegen_1.Name("schema"),
  		parentSchema: new codegen_1.Name("parentSchema")
  	};
  	function errorObjectCode(cxt, error, errorPaths) {
  		const { createErrors } = cxt.it;
  		if (createErrors === false) return (0, codegen_1._)`{}`;
  		return errorObject(cxt, error, errorPaths);
  	}
  	function errorObject(cxt, error, errorPaths = {}) {
  		const { gen, it } = cxt;
  		const keyValues = [errorInstancePath(it, errorPaths), errorSchemaPath(cxt, errorPaths)];
  		extraErrorProps(cxt, error, keyValues);
  		return gen.object(...keyValues);
  	}
  	function errorInstancePath({ errorPath }, { instancePath }) {
  		const instPath = instancePath ? (0, codegen_1.str)`${errorPath}${(0, util_1.getErrorPath)(instancePath, util_1.Type.Str)}` : errorPath;
  		return [names_1.default.instancePath, (0, codegen_1.strConcat)(names_1.default.instancePath, instPath)];
  	}
  	function errorSchemaPath({ keyword, it: { errSchemaPath } }, { schemaPath, parentSchema }) {
  		let schPath = parentSchema ? errSchemaPath : (0, codegen_1.str)`${errSchemaPath}/${keyword}`;
  		if (schemaPath) schPath = (0, codegen_1.str)`${schPath}${(0, util_1.getErrorPath)(schemaPath, util_1.Type.Str)}`;
  		return [E.schemaPath, schPath];
  	}
  	function extraErrorProps(cxt, { params, message }, keyValues) {
  		const { keyword, data, schemaValue, it } = cxt;
  		const { opts, propertyName, topSchemaRef, schemaPath } = it;
  		keyValues.push([E.keyword, keyword], [E.params, typeof params == "function" ? params(cxt) : params || (0, codegen_1._)`{}`]);
  		if (opts.messages) keyValues.push([E.message, typeof message == "function" ? message(cxt) : message]);
  		if (opts.verbose) keyValues.push([E.schema, schemaValue], [E.parentSchema, (0, codegen_1._)`${topSchemaRef}${schemaPath}`], [names_1.default.data, data]);
  		if (propertyName) keyValues.push([E.propertyName, propertyName]);
  	}
  }));
  var require_boolSchema = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.boolOrEmptySchema = exports.topBoolOrEmptySchema = void 0;
  	var errors_1 = require_errors();
  	var codegen_1 = require_codegen();
  	var names_1 = require_names();
  	var boolError = { message: "boolean schema is false" };
  	function topBoolOrEmptySchema(it) {
  		const { gen, schema, validateName } = it;
  		if (schema === false) falseSchemaError(it, false);
  		else if (typeof schema == "object" && schema.$async === true) gen.return(names_1.default.data);
  		else {
  			gen.assign((0, codegen_1._)`${validateName}.errors`, null);
  			gen.return(true);
  		}
  	}
  	exports.topBoolOrEmptySchema = topBoolOrEmptySchema;
  	function boolOrEmptySchema(it, valid) {
  		const { gen, schema } = it;
  		if (schema === false) {
  			gen.var(valid, false);
  			falseSchemaError(it);
  		} else gen.var(valid, true);
  	}
  	exports.boolOrEmptySchema = boolOrEmptySchema;
  	function falseSchemaError(it, overrideAllErrors) {
  		const { gen, data } = it;
  		const cxt = {
  			gen,
  			keyword: "false schema",
  			data,
  			schema: false,
  			schemaCode: false,
  			schemaValue: false,
  			params: {},
  			it
  		};
  		(0, errors_1.reportError)(cxt, boolError, void 0, overrideAllErrors);
  	}
  }));
  var require_rules = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.getRules = exports.isJSONType = void 0;
  	var jsonTypes = /* @__PURE__ */ new Set([
  		"string",
  		"number",
  		"integer",
  		"boolean",
  		"null",
  		"object",
  		"array"
  	]);
  	function isJSONType(x) {
  		return typeof x == "string" && jsonTypes.has(x);
  	}
  	exports.isJSONType = isJSONType;
  	function getRules() {
  		const groups = {
  			number: {
  				type: "number",
  				rules: []
  			},
  			string: {
  				type: "string",
  				rules: []
  			},
  			array: {
  				type: "array",
  				rules: []
  			},
  			object: {
  				type: "object",
  				rules: []
  			}
  		};
  		return {
  			types: {
  				...groups,
  				integer: true,
  				boolean: true,
  				null: true
  			},
  			rules: [
  				{ rules: [] },
  				groups.number,
  				groups.string,
  				groups.array,
  				groups.object
  			],
  			post: { rules: [] },
  			all: {},
  			keywords: {}
  		};
  	}
  	exports.getRules = getRules;
  }));
  var require_applicability = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.shouldUseRule = exports.shouldUseGroup = exports.schemaHasRulesForType = void 0;
  	function schemaHasRulesForType({ schema, self }, type) {
  		const group = self.RULES.types[type];
  		return group && group !== true && shouldUseGroup(schema, group);
  	}
  	exports.schemaHasRulesForType = schemaHasRulesForType;
  	function shouldUseGroup(schema, group) {
  		return group.rules.some((rule) => shouldUseRule(schema, rule));
  	}
  	exports.shouldUseGroup = shouldUseGroup;
  	function shouldUseRule(schema, rule) {
  		var _a;
  		return schema[rule.keyword] !== void 0 || ((_a = rule.definition.implements) === null || _a === void 0 ? void 0 : _a.some((kwd) => schema[kwd] !== void 0));
  	}
  	exports.shouldUseRule = shouldUseRule;
  }));
  var require_dataType = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.reportTypeError = exports.checkDataTypes = exports.checkDataType = exports.coerceAndCheckDataType = exports.getJSONTypes = exports.getSchemaTypes = exports.DataType = void 0;
  	var rules_1 = require_rules();
  	var applicability_1 = require_applicability();
  	var errors_1 = require_errors();
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	var DataType;
  	(function(DataType) {
  		DataType[DataType["Correct"] = 0] = "Correct";
  		DataType[DataType["Wrong"] = 1] = "Wrong";
  	})(DataType || (exports.DataType = DataType = {}));
  	function getSchemaTypes(schema) {
  		const types = getJSONTypes(schema.type);
  		if (types.includes("null")) {
  			if (schema.nullable === false) throw new Error("type: null contradicts nullable: false");
  		} else {
  			if (!types.length && schema.nullable !== void 0) throw new Error("\"nullable\" cannot be used without \"type\"");
  			if (schema.nullable === true) types.push("null");
  		}
  		return types;
  	}
  	exports.getSchemaTypes = getSchemaTypes;
  	function getJSONTypes(ts) {
  		const types = Array.isArray(ts) ? ts : ts ? [ts] : [];
  		if (types.every(rules_1.isJSONType)) return types;
  		throw new Error("type must be JSONType or JSONType[]: " + types.join(","));
  	}
  	exports.getJSONTypes = getJSONTypes;
  	function coerceAndCheckDataType(it, types) {
  		const { gen, data, opts } = it;
  		const coerceTo = coerceToTypes(types, opts.coerceTypes);
  		const checkTypes = types.length > 0 && !(coerceTo.length === 0 && types.length === 1 && (0, applicability_1.schemaHasRulesForType)(it, types[0]));
  		if (checkTypes) {
  			const wrongType = checkDataTypes(types, data, opts.strictNumbers, DataType.Wrong);
  			gen.if(wrongType, () => {
  				if (coerceTo.length) coerceData(it, types, coerceTo);
  				else reportTypeError(it);
  			});
  		}
  		return checkTypes;
  	}
  	exports.coerceAndCheckDataType = coerceAndCheckDataType;
  	var COERCIBLE = /* @__PURE__ */ new Set([
  		"string",
  		"number",
  		"integer",
  		"boolean",
  		"null"
  	]);
  	function coerceToTypes(types, coerceTypes) {
  		return coerceTypes ? types.filter((t) => COERCIBLE.has(t) || coerceTypes === "array" && t === "array") : [];
  	}
  	function coerceData(it, types, coerceTo) {
  		const { gen, data, opts } = it;
  		const dataType = gen.let("dataType", (0, codegen_1._)`typeof ${data}`);
  		const coerced = gen.let("coerced", (0, codegen_1._)`undefined`);
  		if (opts.coerceTypes === "array") gen.if((0, codegen_1._)`${dataType} == 'object' && Array.isArray(${data}) && ${data}.length == 1`, () => gen.assign(data, (0, codegen_1._)`${data}[0]`).assign(dataType, (0, codegen_1._)`typeof ${data}`).if(checkDataTypes(types, data, opts.strictNumbers), () => gen.assign(coerced, data)));
  		gen.if((0, codegen_1._)`${coerced} !== undefined`);
  		for (const t of coerceTo) if (COERCIBLE.has(t) || t === "array" && opts.coerceTypes === "array") coerceSpecificType(t);
  		gen.else();
  		reportTypeError(it);
  		gen.endIf();
  		gen.if((0, codegen_1._)`${coerced} !== undefined`, () => {
  			gen.assign(data, coerced);
  			assignParentData(it, coerced);
  		});
  		function coerceSpecificType(t) {
  			switch (t) {
  				case "string":
  					gen.elseIf((0, codegen_1._)`${dataType} == "number" || ${dataType} == "boolean"`).assign(coerced, (0, codegen_1._)`"" + ${data}`).elseIf((0, codegen_1._)`${data} === null`).assign(coerced, (0, codegen_1._)`""`);
  					return;
  				case "number":
  					gen.elseIf((0, codegen_1._)`${dataType} == "boolean" || ${data} === null
                || (${dataType} == "string" && ${data} && ${data} == +${data})`).assign(coerced, (0, codegen_1._)`+${data}`);
  					return;
  				case "integer":
  					gen.elseIf((0, codegen_1._)`${dataType} === "boolean" || ${data} === null
                || (${dataType} === "string" && ${data} && ${data} == +${data} && !(${data} % 1))`).assign(coerced, (0, codegen_1._)`+${data}`);
  					return;
  				case "boolean":
  					gen.elseIf((0, codegen_1._)`${data} === "false" || ${data} === 0 || ${data} === null`).assign(coerced, false).elseIf((0, codegen_1._)`${data} === "true" || ${data} === 1`).assign(coerced, true);
  					return;
  				case "null":
  					gen.elseIf((0, codegen_1._)`${data} === "" || ${data} === 0 || ${data} === false`);
  					gen.assign(coerced, null);
  					return;
  				case "array": gen.elseIf((0, codegen_1._)`${dataType} === "string" || ${dataType} === "number"
                || ${dataType} === "boolean" || ${data} === null`).assign(coerced, (0, codegen_1._)`[${data}]`);
  			}
  		}
  	}
  	function assignParentData({ gen, parentData, parentDataProperty }, expr) {
  		gen.if((0, codegen_1._)`${parentData} !== undefined`, () => gen.assign((0, codegen_1._)`${parentData}[${parentDataProperty}]`, expr));
  	}
  	function checkDataType(dataType, data, strictNums, correct = DataType.Correct) {
  		const EQ = correct === DataType.Correct ? codegen_1.operators.EQ : codegen_1.operators.NEQ;
  		let cond;
  		switch (dataType) {
  			case "null": return (0, codegen_1._)`${data} ${EQ} null`;
  			case "array":
  				cond = (0, codegen_1._)`Array.isArray(${data})`;
  				break;
  			case "object":
  				cond = (0, codegen_1._)`${data} && typeof ${data} == "object" && !Array.isArray(${data})`;
  				break;
  			case "integer":
  				cond = numCond((0, codegen_1._)`!(${data} % 1) && !isNaN(${data})`);
  				break;
  			case "number":
  				cond = numCond();
  				break;
  			default: return (0, codegen_1._)`typeof ${data} ${EQ} ${dataType}`;
  		}
  		return correct === DataType.Correct ? cond : (0, codegen_1.not)(cond);
  		function numCond(_cond = codegen_1.nil) {
  			return (0, codegen_1.and)((0, codegen_1._)`typeof ${data} == "number"`, _cond, strictNums ? (0, codegen_1._)`isFinite(${data})` : codegen_1.nil);
  		}
  	}
  	exports.checkDataType = checkDataType;
  	function checkDataTypes(dataTypes, data, strictNums, correct) {
  		if (dataTypes.length === 1) return checkDataType(dataTypes[0], data, strictNums, correct);
  		let cond;
  		const types = (0, util_1.toHash)(dataTypes);
  		if (types.array && types.object) {
  			const notObj = (0, codegen_1._)`typeof ${data} != "object"`;
  			cond = types.null ? notObj : (0, codegen_1._)`!${data} || ${notObj}`;
  			delete types.null;
  			delete types.array;
  			delete types.object;
  		} else cond = codegen_1.nil;
  		if (types.number) delete types.integer;
  		for (const t in types) cond = (0, codegen_1.and)(cond, checkDataType(t, data, strictNums, correct));
  		return cond;
  	}
  	exports.checkDataTypes = checkDataTypes;
  	var typeError = {
  		message: ({ schema }) => `must be ${schema}`,
  		params: ({ schema, schemaValue }) => typeof schema == "string" ? (0, codegen_1._)`{type: ${schema}}` : (0, codegen_1._)`{type: ${schemaValue}}`
  	};
  	function reportTypeError(it) {
  		const cxt = getTypeErrorContext(it);
  		(0, errors_1.reportError)(cxt, typeError);
  	}
  	exports.reportTypeError = reportTypeError;
  	function getTypeErrorContext(it) {
  		const { gen, data, schema } = it;
  		const schemaCode = (0, util_1.schemaRefOrVal)(it, schema, "type");
  		return {
  			gen,
  			keyword: "type",
  			data,
  			schema: schema.type,
  			schemaCode,
  			schemaValue: schemaCode,
  			parentSchema: schema,
  			params: {},
  			it
  		};
  	}
  }));
  var require_defaults = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.assignDefaults = void 0;
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	function assignDefaults(it, ty) {
  		const { properties, items } = it.schema;
  		if (ty === "object" && properties) for (const key in properties) assignDefault(it, key, properties[key].default);
  		else if (ty === "array" && Array.isArray(items)) items.forEach((sch, i) => assignDefault(it, i, sch.default));
  	}
  	exports.assignDefaults = assignDefaults;
  	function assignDefault(it, prop, defaultValue) {
  		const { gen, compositeRule, data, opts } = it;
  		if (defaultValue === void 0) return;
  		const childData = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(prop)}`;
  		if (compositeRule) {
  			(0, util_1.checkStrictMode)(it, `default is ignored for: ${childData}`);
  			return;
  		}
  		let condition = (0, codegen_1._)`${childData} === undefined`;
  		if (opts.useDefaults === "empty") condition = (0, codegen_1._)`${condition} || ${childData} === null || ${childData} === ""`;
  		gen.if(condition, (0, codegen_1._)`${childData} = ${(0, codegen_1.stringify)(defaultValue)}`);
  	}
  }));
  var require_code = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.validateUnion = exports.validateArray = exports.usePattern = exports.callValidateCode = exports.schemaProperties = exports.allSchemaProperties = exports.noPropertyInData = exports.propertyInData = exports.isOwnProperty = exports.hasPropFunc = exports.reportMissingProp = exports.checkMissingProp = exports.checkReportMissingProp = void 0;
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	var names_1 = require_names();
  	var util_2 = require_util();
  	function checkReportMissingProp(cxt, prop) {
  		const { gen, data, it } = cxt;
  		gen.if(noPropertyInData(gen, data, prop, it.opts.ownProperties), () => {
  			cxt.setParams({ missingProperty: (0, codegen_1._)`${prop}` }, true);
  			cxt.error();
  		});
  	}
  	exports.checkReportMissingProp = checkReportMissingProp;
  	function checkMissingProp({ gen, data, it: { opts } }, properties, missing) {
  		return (0, codegen_1.or)(...properties.map((prop) => (0, codegen_1.and)(noPropertyInData(gen, data, prop, opts.ownProperties), (0, codegen_1._)`${missing} = ${prop}`)));
  	}
  	exports.checkMissingProp = checkMissingProp;
  	function reportMissingProp(cxt, missing) {
  		cxt.setParams({ missingProperty: missing }, true);
  		cxt.error();
  	}
  	exports.reportMissingProp = reportMissingProp;
  	function hasPropFunc(gen) {
  		return gen.scopeValue("func", {
  			ref: Object.prototype.hasOwnProperty,
  			code: (0, codegen_1._)`Object.prototype.hasOwnProperty`
  		});
  	}
  	exports.hasPropFunc = hasPropFunc;
  	function isOwnProperty(gen, data, property) {
  		return (0, codegen_1._)`${hasPropFunc(gen)}.call(${data}, ${property})`;
  	}
  	exports.isOwnProperty = isOwnProperty;
  	function propertyInData(gen, data, property, ownProperties) {
  		const cond = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(property)} !== undefined`;
  		return ownProperties ? (0, codegen_1._)`${cond} && ${isOwnProperty(gen, data, property)}` : cond;
  	}
  	exports.propertyInData = propertyInData;
  	function noPropertyInData(gen, data, property, ownProperties) {
  		const cond = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(property)} === undefined`;
  		return ownProperties ? (0, codegen_1.or)(cond, (0, codegen_1.not)(isOwnProperty(gen, data, property))) : cond;
  	}
  	exports.noPropertyInData = noPropertyInData;
  	function allSchemaProperties(schemaMap) {
  		return schemaMap ? Object.keys(schemaMap).filter((p) => p !== "__proto__") : [];
  	}
  	exports.allSchemaProperties = allSchemaProperties;
  	function schemaProperties(it, schemaMap) {
  		return allSchemaProperties(schemaMap).filter((p) => !(0, util_1.alwaysValidSchema)(it, schemaMap[p]));
  	}
  	exports.schemaProperties = schemaProperties;
  	function callValidateCode({ schemaCode, data, it: { gen, topSchemaRef, schemaPath, errorPath }, it }, func, context, passSchema) {
  		const dataAndSchema = passSchema ? (0, codegen_1._)`${schemaCode}, ${data}, ${topSchemaRef}${schemaPath}` : data;
  		const valCxt = [
  			[names_1.default.instancePath, (0, codegen_1.strConcat)(names_1.default.instancePath, errorPath)],
  			[names_1.default.parentData, it.parentData],
  			[names_1.default.parentDataProperty, it.parentDataProperty],
  			[names_1.default.rootData, names_1.default.rootData]
  		];
  		if (it.opts.dynamicRef) valCxt.push([names_1.default.dynamicAnchors, names_1.default.dynamicAnchors]);
  		const args = (0, codegen_1._)`${dataAndSchema}, ${gen.object(...valCxt)}`;
  		return context !== codegen_1.nil ? (0, codegen_1._)`${func}.call(${context}, ${args})` : (0, codegen_1._)`${func}(${args})`;
  	}
  	exports.callValidateCode = callValidateCode;
  	var newRegExp = (0, codegen_1._)`new RegExp`;
  	function usePattern({ gen, it: { opts } }, pattern) {
  		const u = opts.unicodeRegExp ? "u" : "";
  		const { regExp } = opts.code;
  		const rx = regExp(pattern, u);
  		return gen.scopeValue("pattern", {
  			key: rx.toString(),
  			ref: rx,
  			code: (0, codegen_1._)`${regExp.code === "new RegExp" ? newRegExp : (0, util_2.useFunc)(gen, regExp)}(${pattern}, ${u})`
  		});
  	}
  	exports.usePattern = usePattern;
  	function validateArray(cxt) {
  		const { gen, data, keyword, it } = cxt;
  		const valid = gen.name("valid");
  		if (it.allErrors) {
  			const validArr = gen.let("valid", true);
  			validateItems(() => gen.assign(validArr, false));
  			return validArr;
  		}
  		gen.var(valid, true);
  		validateItems(() => gen.break());
  		return valid;
  		function validateItems(notValid) {
  			const len = gen.const("len", (0, codegen_1._)`${data}.length`);
  			gen.forRange("i", 0, len, (i) => {
  				cxt.subschema({
  					keyword,
  					dataProp: i,
  					dataPropType: util_1.Type.Num
  				}, valid);
  				gen.if((0, codegen_1.not)(valid), notValid);
  			});
  		}
  	}
  	exports.validateArray = validateArray;
  	function validateUnion(cxt) {
  		const { gen, schema, keyword, it } = cxt;
  		/* istanbul ignore if */
  		if (!Array.isArray(schema)) throw new Error("ajv implementation error");
  		if (schema.some((sch) => (0, util_1.alwaysValidSchema)(it, sch)) && !it.opts.unevaluated) return;
  		const valid = gen.let("valid", false);
  		const schValid = gen.name("_valid");
  		gen.block(() => schema.forEach((_sch, i) => {
  			const schCxt = cxt.subschema({
  				keyword,
  				schemaProp: i,
  				compositeRule: true
  			}, schValid);
  			gen.assign(valid, (0, codegen_1._)`${valid} || ${schValid}`);
  			if (!cxt.mergeValidEvaluated(schCxt, schValid)) gen.if((0, codegen_1.not)(valid));
  		}));
  		cxt.result(valid, () => cxt.reset(), () => cxt.error(true));
  	}
  	exports.validateUnion = validateUnion;
  }));
  var require_keyword = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.validateKeywordUsage = exports.validSchemaType = exports.funcKeywordCode = exports.macroKeywordCode = void 0;
  	var codegen_1 = require_codegen();
  	var names_1 = require_names();
  	var code_1 = require_code();
  	var errors_1 = require_errors();
  	function macroKeywordCode(cxt, def) {
  		const { gen, keyword, schema, parentSchema, it } = cxt;
  		const macroSchema = def.macro.call(it.self, schema, parentSchema, it);
  		const schemaRef = useKeyword(gen, keyword, macroSchema);
  		if (it.opts.validateSchema !== false) it.self.validateSchema(macroSchema, true);
  		const valid = gen.name("valid");
  		cxt.subschema({
  			schema: macroSchema,
  			schemaPath: codegen_1.nil,
  			errSchemaPath: `${it.errSchemaPath}/${keyword}`,
  			topSchemaRef: schemaRef,
  			compositeRule: true
  		}, valid);
  		cxt.pass(valid, () => cxt.error(true));
  	}
  	exports.macroKeywordCode = macroKeywordCode;
  	function funcKeywordCode(cxt, def) {
  		var _a;
  		const { gen, keyword, schema, parentSchema, $data, it } = cxt;
  		checkAsyncKeyword(it, def);
  		const validateRef = useKeyword(gen, keyword, !$data && def.compile ? def.compile.call(it.self, schema, parentSchema, it) : def.validate);
  		const valid = gen.let("valid");
  		cxt.block$data(valid, validateKeyword);
  		cxt.ok((_a = def.valid) !== null && _a !== void 0 ? _a : valid);
  		function validateKeyword() {
  			if (def.errors === false) {
  				assignValid();
  				if (def.modifying) modifyData(cxt);
  				reportErrs(() => cxt.error());
  			} else {
  				const ruleErrs = def.async ? validateAsync() : validateSync();
  				if (def.modifying) modifyData(cxt);
  				reportErrs(() => addErrs(cxt, ruleErrs));
  			}
  		}
  		function validateAsync() {
  			const ruleErrs = gen.let("ruleErrs", null);
  			gen.try(() => assignValid((0, codegen_1._)`await `), (e) => gen.assign(valid, false).if((0, codegen_1._)`${e} instanceof ${it.ValidationError}`, () => gen.assign(ruleErrs, (0, codegen_1._)`${e}.errors`), () => gen.throw(e)));
  			return ruleErrs;
  		}
  		function validateSync() {
  			const validateErrs = (0, codegen_1._)`${validateRef}.errors`;
  			gen.assign(validateErrs, null);
  			assignValid(codegen_1.nil);
  			return validateErrs;
  		}
  		function assignValid(_await = def.async ? (0, codegen_1._)`await ` : codegen_1.nil) {
  			const passCxt = it.opts.passContext ? names_1.default.this : names_1.default.self;
  			const passSchema = !("compile" in def && !$data || def.schema === false);
  			gen.assign(valid, (0, codegen_1._)`${_await}${(0, code_1.callValidateCode)(cxt, validateRef, passCxt, passSchema)}`, def.modifying);
  		}
  		function reportErrs(errors) {
  			var _a;
  			gen.if((0, codegen_1.not)((_a = def.valid) !== null && _a !== void 0 ? _a : valid), errors);
  		}
  	}
  	exports.funcKeywordCode = funcKeywordCode;
  	function modifyData(cxt) {
  		const { gen, data, it } = cxt;
  		gen.if(it.parentData, () => gen.assign(data, (0, codegen_1._)`${it.parentData}[${it.parentDataProperty}]`));
  	}
  	function addErrs(cxt, errs) {
  		const { gen } = cxt;
  		gen.if((0, codegen_1._)`Array.isArray(${errs})`, () => {
  			gen.assign(names_1.default.vErrors, (0, codegen_1._)`${names_1.default.vErrors} === null ? ${errs} : ${names_1.default.vErrors}.concat(${errs})`).assign(names_1.default.errors, (0, codegen_1._)`${names_1.default.vErrors}.length`);
  			(0, errors_1.extendErrors)(cxt);
  		}, () => cxt.error());
  	}
  	function checkAsyncKeyword({ schemaEnv }, def) {
  		if (def.async && !schemaEnv.$async) throw new Error("async keyword in sync schema");
  	}
  	function useKeyword(gen, keyword, result) {
  		if (result === void 0) throw new Error(`keyword "${keyword}" failed to compile`);
  		return gen.scopeValue("keyword", typeof result == "function" ? { ref: result } : {
  			ref: result,
  			code: (0, codegen_1.stringify)(result)
  		});
  	}
  	function validSchemaType(schema, schemaType, allowUndefined = false) {
  		return !schemaType.length || schemaType.some((st) => st === "array" ? Array.isArray(schema) : st === "object" ? schema && typeof schema == "object" && !Array.isArray(schema) : typeof schema == st || allowUndefined && typeof schema == "undefined");
  	}
  	exports.validSchemaType = validSchemaType;
  	function validateKeywordUsage({ schema, opts, self, errSchemaPath }, def, keyword) {
  		/* istanbul ignore if */
  		if (Array.isArray(def.keyword) ? !def.keyword.includes(keyword) : def.keyword !== keyword) throw new Error("ajv implementation error");
  		const deps = def.dependencies;
  		if (deps === null || deps === void 0 ? void 0 : deps.some((kwd) => !Object.prototype.hasOwnProperty.call(schema, kwd))) throw new Error(`parent schema must have dependencies of ${keyword}: ${deps.join(",")}`);
  		if (def.validateSchema) {
  			if (!def.validateSchema(schema[keyword])) {
  				const msg = `keyword "${keyword}" value is invalid at path "${errSchemaPath}": ` + self.errorsText(def.validateSchema.errors);
  				if (opts.validateSchema === "log") self.logger.error(msg);
  				else throw new Error(msg);
  			}
  		}
  	}
  	exports.validateKeywordUsage = validateKeywordUsage;
  }));
  var require_subschema = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.extendSubschemaMode = exports.extendSubschemaData = exports.getSubschema = void 0;
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	function getSubschema(it, { keyword, schemaProp, schema, schemaPath, errSchemaPath, topSchemaRef }) {
  		if (keyword !== void 0 && schema !== void 0) throw new Error("both \"keyword\" and \"schema\" passed, only one allowed");
  		if (keyword !== void 0) {
  			const sch = it.schema[keyword];
  			return schemaProp === void 0 ? {
  				schema: sch,
  				schemaPath: (0, codegen_1._)`${it.schemaPath}${(0, codegen_1.getProperty)(keyword)}`,
  				errSchemaPath: `${it.errSchemaPath}/${keyword}`
  			} : {
  				schema: sch[schemaProp],
  				schemaPath: (0, codegen_1._)`${it.schemaPath}${(0, codegen_1.getProperty)(keyword)}${(0, codegen_1.getProperty)(schemaProp)}`,
  				errSchemaPath: `${it.errSchemaPath}/${keyword}/${(0, util_1.escapeFragment)(schemaProp)}`
  			};
  		}
  		if (schema !== void 0) {
  			if (schemaPath === void 0 || errSchemaPath === void 0 || topSchemaRef === void 0) throw new Error("\"schemaPath\", \"errSchemaPath\" and \"topSchemaRef\" are required with \"schema\"");
  			return {
  				schema,
  				schemaPath,
  				topSchemaRef,
  				errSchemaPath
  			};
  		}
  		throw new Error("either \"keyword\" or \"schema\" must be passed");
  	}
  	exports.getSubschema = getSubschema;
  	function extendSubschemaData(subschema, it, { dataProp, dataPropType: dpType, data, dataTypes, propertyName }) {
  		if (data !== void 0 && dataProp !== void 0) throw new Error("both \"data\" and \"dataProp\" passed, only one allowed");
  		const { gen } = it;
  		if (dataProp !== void 0) {
  			const { errorPath, dataPathArr, opts } = it;
  			dataContextProps(gen.let("data", (0, codegen_1._)`${it.data}${(0, codegen_1.getProperty)(dataProp)}`, true));
  			subschema.errorPath = (0, codegen_1.str)`${errorPath}${(0, util_1.getErrorPath)(dataProp, dpType, opts.jsPropertySyntax)}`;
  			subschema.parentDataProperty = (0, codegen_1._)`${dataProp}`;
  			subschema.dataPathArr = [...dataPathArr, subschema.parentDataProperty];
  		}
  		if (data !== void 0) {
  			dataContextProps(data instanceof codegen_1.Name ? data : gen.let("data", data, true));
  			if (propertyName !== void 0) subschema.propertyName = propertyName;
  		}
  		if (dataTypes) subschema.dataTypes = dataTypes;
  		function dataContextProps(_nextData) {
  			subschema.data = _nextData;
  			subschema.dataLevel = it.dataLevel + 1;
  			subschema.dataTypes = [];
  			it.definedProperties = /* @__PURE__ */ new Set();
  			subschema.parentData = it.data;
  			subschema.dataNames = [...it.dataNames, _nextData];
  		}
  	}
  	exports.extendSubschemaData = extendSubschemaData;
  	function extendSubschemaMode(subschema, { jtdDiscriminator, jtdMetadata, compositeRule, createErrors, allErrors }) {
  		if (compositeRule !== void 0) subschema.compositeRule = compositeRule;
  		if (createErrors !== void 0) subschema.createErrors = createErrors;
  		if (allErrors !== void 0) subschema.allErrors = allErrors;
  		subschema.jtdDiscriminator = jtdDiscriminator;
  		subschema.jtdMetadata = jtdMetadata;
  	}
  	exports.extendSubschemaMode = extendSubschemaMode;
  }));
  var require_fast_deep_equal = /* @__PURE__ */ __commonJSMin(((exports, module) => {
  	module.exports = function equal(a, b) {
  		if (a === b) return true;
  		if (a && b && typeof a == "object" && typeof b == "object") {
  			if (a.constructor !== b.constructor) return false;
  			var length, i, keys;
  			if (Array.isArray(a)) {
  				length = a.length;
  				if (length != b.length) return false;
  				for (i = length; i-- !== 0;) if (!equal(a[i], b[i])) return false;
  				return true;
  			}
  			if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
  			if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
  			if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();
  			keys = Object.keys(a);
  			length = keys.length;
  			if (length !== Object.keys(b).length) return false;
  			for (i = length; i-- !== 0;) if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;
  			for (i = length; i-- !== 0;) {
  				var key = keys[i];
  				if (!equal(a[key], b[key])) return false;
  			}
  			return true;
  		}
  		return a !== a && b !== b;
  	};
  }));
  var require_json_schema_traverse = /* @__PURE__ */ __commonJSMin(((exports, module) => {
  	var traverse = module.exports = function(schema, opts, cb) {
  		if (typeof opts == "function") {
  			cb = opts;
  			opts = {};
  		}
  		cb = opts.cb || cb;
  		var pre = typeof cb == "function" ? cb : cb.pre || function() {};
  		var post = cb.post || function() {};
  		_traverse(opts, pre, post, schema, "", schema);
  	};
  	traverse.keywords = {
  		additionalItems: true,
  		items: true,
  		contains: true,
  		additionalProperties: true,
  		propertyNames: true,
  		not: true,
  		if: true,
  		then: true,
  		else: true
  	};
  	traverse.arrayKeywords = {
  		items: true,
  		allOf: true,
  		anyOf: true,
  		oneOf: true
  	};
  	traverse.propsKeywords = {
  		$defs: true,
  		definitions: true,
  		properties: true,
  		patternProperties: true,
  		dependencies: true
  	};
  	traverse.skipKeywords = {
  		default: true,
  		enum: true,
  		const: true,
  		required: true,
  		maximum: true,
  		minimum: true,
  		exclusiveMaximum: true,
  		exclusiveMinimum: true,
  		multipleOf: true,
  		maxLength: true,
  		minLength: true,
  		pattern: true,
  		format: true,
  		maxItems: true,
  		minItems: true,
  		uniqueItems: true,
  		maxProperties: true,
  		minProperties: true
  	};
  	function _traverse(opts, pre, post, schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex) {
  		if (schema && typeof schema == "object" && !Array.isArray(schema)) {
  			pre(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
  			for (var key in schema) {
  				var sch = schema[key];
  				if (Array.isArray(sch)) {
  					if (key in traverse.arrayKeywords) for (var i = 0; i < sch.length; i++) _traverse(opts, pre, post, sch[i], jsonPtr + "/" + key + "/" + i, rootSchema, jsonPtr, key, schema, i);
  				} else if (key in traverse.propsKeywords) {
  					if (sch && typeof sch == "object") for (var prop in sch) _traverse(opts, pre, post, sch[prop], jsonPtr + "/" + key + "/" + escapeJsonPtr(prop), rootSchema, jsonPtr, key, schema, prop);
  				} else if (key in traverse.keywords || opts.allKeys && !(key in traverse.skipKeywords)) _traverse(opts, pre, post, sch, jsonPtr + "/" + key, rootSchema, jsonPtr, key, schema);
  			}
  			post(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
  		}
  	}
  	function escapeJsonPtr(str) {
  		return str.replace(/~/g, "~0").replace(/\//g, "~1");
  	}
  }));
  var require_resolve = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.getSchemaRefs = exports.resolveUrl = exports.normalizeId = exports._getFullPath = exports.getFullPath = exports.inlineRef = void 0;
  	var util_1 = require_util();
  	var equal = require_fast_deep_equal();
  	var traverse = require_json_schema_traverse();
  	var SIMPLE_INLINED = /* @__PURE__ */ new Set([
  		"type",
  		"format",
  		"pattern",
  		"maxLength",
  		"minLength",
  		"maxProperties",
  		"minProperties",
  		"maxItems",
  		"minItems",
  		"maximum",
  		"minimum",
  		"uniqueItems",
  		"multipleOf",
  		"required",
  		"enum",
  		"const"
  	]);
  	function inlineRef(schema, limit = true) {
  		if (typeof schema == "boolean") return true;
  		if (limit === true) return !hasRef(schema);
  		if (!limit) return false;
  		return countKeys(schema) <= limit;
  	}
  	exports.inlineRef = inlineRef;
  	var REF_KEYWORDS = /* @__PURE__ */ new Set([
  		"$ref",
  		"$recursiveRef",
  		"$recursiveAnchor",
  		"$dynamicRef",
  		"$dynamicAnchor"
  	]);
  	function hasRef(schema) {
  		for (const key in schema) {
  			if (REF_KEYWORDS.has(key)) return true;
  			const sch = schema[key];
  			if (Array.isArray(sch) && sch.some(hasRef)) return true;
  			if (typeof sch == "object" && hasRef(sch)) return true;
  		}
  		return false;
  	}
  	function countKeys(schema) {
  		let count = 0;
  		for (const key in schema) {
  			if (key === "$ref") return Infinity;
  			count++;
  			if (SIMPLE_INLINED.has(key)) continue;
  			if (typeof schema[key] == "object") (0, util_1.eachItem)(schema[key], (sch) => count += countKeys(sch));
  			if (count === Infinity) return Infinity;
  		}
  		return count;
  	}
  	function getFullPath(resolver, id = "", normalize) {
  		if (normalize !== false) id = normalizeId(id);
  		return _getFullPath(resolver, resolver.parse(id));
  	}
  	exports.getFullPath = getFullPath;
  	function _getFullPath(resolver, p) {
  		return resolver.serialize(p).split("#")[0] + "#";
  	}
  	exports._getFullPath = _getFullPath;
  	var TRAILING_SLASH_HASH = /#\/?$/;
  	function normalizeId(id) {
  		return id ? id.replace(TRAILING_SLASH_HASH, "") : "";
  	}
  	exports.normalizeId = normalizeId;
  	function resolveUrl(resolver, baseId, id) {
  		id = normalizeId(id);
  		return resolver.resolve(baseId, id);
  	}
  	exports.resolveUrl = resolveUrl;
  	var ANCHOR = /^[a-z_][-a-z0-9._]*$/i;
  	function getSchemaRefs(schema, baseId) {
  		if (typeof schema == "boolean") return {};
  		const { schemaId, uriResolver } = this.opts;
  		const schId = normalizeId(schema[schemaId] || baseId);
  		const baseIds = { "": schId };
  		const pathPrefix = getFullPath(uriResolver, schId, false);
  		const localRefs = {};
  		const schemaRefs = /* @__PURE__ */ new Set();
  		traverse(schema, { allKeys: true }, (sch, jsonPtr, _, parentJsonPtr) => {
  			if (parentJsonPtr === void 0) return;
  			const fullPath = pathPrefix + jsonPtr;
  			let innerBaseId = baseIds[parentJsonPtr];
  			if (typeof sch[schemaId] == "string") innerBaseId = addRef.call(this, sch[schemaId]);
  			addAnchor.call(this, sch.$anchor);
  			addAnchor.call(this, sch.$dynamicAnchor);
  			baseIds[jsonPtr] = innerBaseId;
  			function addRef(ref) {
  				const _resolve = this.opts.uriResolver.resolve;
  				ref = normalizeId(innerBaseId ? _resolve(innerBaseId, ref) : ref);
  				if (schemaRefs.has(ref)) throw ambiguos(ref);
  				schemaRefs.add(ref);
  				let schOrRef = this.refs[ref];
  				if (typeof schOrRef == "string") schOrRef = this.refs[schOrRef];
  				if (typeof schOrRef == "object") checkAmbiguosRef(sch, schOrRef.schema, ref);
  				else if (ref !== normalizeId(fullPath)) {
  					if (ref[0] === "#") {
  						checkAmbiguosRef(sch, localRefs[ref], ref);
  						localRefs[ref] = sch;
  					} else this.refs[ref] = fullPath;
  				}
  				return ref;
  			}
  			function addAnchor(anchor) {
  				if (typeof anchor == "string") {
  					if (!ANCHOR.test(anchor)) throw new Error(`invalid anchor "${anchor}"`);
  					addRef.call(this, `#${anchor}`);
  				}
  			}
  		});
  		return localRefs;
  		function checkAmbiguosRef(sch1, sch2, ref) {
  			if (sch2 !== void 0 && !equal(sch1, sch2)) throw ambiguos(ref);
  		}
  		function ambiguos(ref) {
  			return /* @__PURE__ */ new Error(`reference "${ref}" resolves to more than one schema`);
  		}
  	}
  	exports.getSchemaRefs = getSchemaRefs;
  }));
  var require_validate = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.getData = exports.KeywordCxt = exports.validateFunctionCode = void 0;
  	var boolSchema_1 = require_boolSchema();
  	var dataType_1 = require_dataType();
  	var applicability_1 = require_applicability();
  	var dataType_2 = require_dataType();
  	var defaults_1 = require_defaults();
  	var keyword_1 = require_keyword();
  	var subschema_1 = require_subschema();
  	var codegen_1 = require_codegen();
  	var names_1 = require_names();
  	var resolve_1 = require_resolve();
  	var util_1 = require_util();
  	var errors_1 = require_errors();
  	function validateFunctionCode(it) {
  		if (isSchemaObj(it)) {
  			checkKeywords(it);
  			if (schemaCxtHasRules(it)) {
  				topSchemaObjCode(it);
  				return;
  			}
  		}
  		validateFunction(it, () => (0, boolSchema_1.topBoolOrEmptySchema)(it));
  	}
  	exports.validateFunctionCode = validateFunctionCode;
  	function validateFunction({ gen, validateName, schema, schemaEnv, opts }, body) {
  		if (opts.code.es5) gen.func(validateName, (0, codegen_1._)`${names_1.default.data}, ${names_1.default.valCxt}`, schemaEnv.$async, () => {
  			gen.code((0, codegen_1._)`"use strict"; ${funcSourceUrl(schema, opts)}`);
  			destructureValCxtES5(gen, opts);
  			gen.code(body);
  		});
  		else gen.func(validateName, (0, codegen_1._)`${names_1.default.data}, ${destructureValCxt(opts)}`, schemaEnv.$async, () => gen.code(funcSourceUrl(schema, opts)).code(body));
  	}
  	function destructureValCxt(opts) {
  		return (0, codegen_1._)`{${names_1.default.instancePath}="", ${names_1.default.parentData}, ${names_1.default.parentDataProperty}, ${names_1.default.rootData}=${names_1.default.data}${opts.dynamicRef ? (0, codegen_1._)`, ${names_1.default.dynamicAnchors}={}` : codegen_1.nil}}={}`;
  	}
  	function destructureValCxtES5(gen, opts) {
  		gen.if(names_1.default.valCxt, () => {
  			gen.var(names_1.default.instancePath, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.instancePath}`);
  			gen.var(names_1.default.parentData, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.parentData}`);
  			gen.var(names_1.default.parentDataProperty, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.parentDataProperty}`);
  			gen.var(names_1.default.rootData, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.rootData}`);
  			if (opts.dynamicRef) gen.var(names_1.default.dynamicAnchors, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.dynamicAnchors}`);
  		}, () => {
  			gen.var(names_1.default.instancePath, (0, codegen_1._)`""`);
  			gen.var(names_1.default.parentData, (0, codegen_1._)`undefined`);
  			gen.var(names_1.default.parentDataProperty, (0, codegen_1._)`undefined`);
  			gen.var(names_1.default.rootData, names_1.default.data);
  			if (opts.dynamicRef) gen.var(names_1.default.dynamicAnchors, (0, codegen_1._)`{}`);
  		});
  	}
  	function topSchemaObjCode(it) {
  		const { schema, opts, gen } = it;
  		validateFunction(it, () => {
  			if (opts.$comment && schema.$comment) commentKeyword(it);
  			checkNoDefault(it);
  			gen.let(names_1.default.vErrors, null);
  			gen.let(names_1.default.errors, 0);
  			if (opts.unevaluated) resetEvaluated(it);
  			typeAndKeywords(it);
  			returnResults(it);
  		});
  	}
  	function resetEvaluated(it) {
  		const { gen, validateName } = it;
  		it.evaluated = gen.const("evaluated", (0, codegen_1._)`${validateName}.evaluated`);
  		gen.if((0, codegen_1._)`${it.evaluated}.dynamicProps`, () => gen.assign((0, codegen_1._)`${it.evaluated}.props`, (0, codegen_1._)`undefined`));
  		gen.if((0, codegen_1._)`${it.evaluated}.dynamicItems`, () => gen.assign((0, codegen_1._)`${it.evaluated}.items`, (0, codegen_1._)`undefined`));
  	}
  	function funcSourceUrl(schema, opts) {
  		const schId = typeof schema == "object" && schema[opts.schemaId];
  		return schId && (opts.code.source || opts.code.process) ? (0, codegen_1._)`/*# sourceURL=${schId} */` : codegen_1.nil;
  	}
  	function subschemaCode(it, valid) {
  		if (isSchemaObj(it)) {
  			checkKeywords(it);
  			if (schemaCxtHasRules(it)) {
  				subSchemaObjCode(it, valid);
  				return;
  			}
  		}
  		(0, boolSchema_1.boolOrEmptySchema)(it, valid);
  	}
  	function schemaCxtHasRules({ schema, self }) {
  		if (typeof schema == "boolean") return !schema;
  		for (const key in schema) if (self.RULES.all[key]) return true;
  		return false;
  	}
  	function isSchemaObj(it) {
  		return typeof it.schema != "boolean";
  	}
  	function subSchemaObjCode(it, valid) {
  		const { schema, gen, opts } = it;
  		if (opts.$comment && schema.$comment) commentKeyword(it);
  		updateContext(it);
  		checkAsyncSchema(it);
  		const errsCount = gen.const("_errs", names_1.default.errors);
  		typeAndKeywords(it, errsCount);
  		gen.var(valid, (0, codegen_1._)`${errsCount} === ${names_1.default.errors}`);
  	}
  	function checkKeywords(it) {
  		(0, util_1.checkUnknownRules)(it);
  		checkRefsAndKeywords(it);
  	}
  	function typeAndKeywords(it, errsCount) {
  		if (it.opts.jtd) return schemaKeywords(it, [], false, errsCount);
  		const types = (0, dataType_1.getSchemaTypes)(it.schema);
  		schemaKeywords(it, types, !(0, dataType_1.coerceAndCheckDataType)(it, types), errsCount);
  	}
  	function checkRefsAndKeywords(it) {
  		const { schema, errSchemaPath, opts, self } = it;
  		if (schema.$ref && opts.ignoreKeywordsWithRef && (0, util_1.schemaHasRulesButRef)(schema, self.RULES)) self.logger.warn(`$ref: keywords ignored in schema at path "${errSchemaPath}"`);
  	}
  	function checkNoDefault(it) {
  		const { schema, opts } = it;
  		if (schema.default !== void 0 && opts.useDefaults && opts.strictSchema) (0, util_1.checkStrictMode)(it, "default is ignored in the schema root");
  	}
  	function updateContext(it) {
  		const schId = it.schema[it.opts.schemaId];
  		if (schId) it.baseId = (0, resolve_1.resolveUrl)(it.opts.uriResolver, it.baseId, schId);
  	}
  	function checkAsyncSchema(it) {
  		if (it.schema.$async && !it.schemaEnv.$async) throw new Error("async schema in sync schema");
  	}
  	function commentKeyword({ gen, schemaEnv, schema, errSchemaPath, opts }) {
  		const msg = schema.$comment;
  		if (opts.$comment === true) gen.code((0, codegen_1._)`${names_1.default.self}.logger.log(${msg})`);
  		else if (typeof opts.$comment == "function") {
  			const schemaPath = (0, codegen_1.str)`${errSchemaPath}/$comment`;
  			const rootName = gen.scopeValue("root", { ref: schemaEnv.root });
  			gen.code((0, codegen_1._)`${names_1.default.self}.opts.$comment(${msg}, ${schemaPath}, ${rootName}.schema)`);
  		}
  	}
  	function returnResults(it) {
  		const { gen, schemaEnv, validateName, ValidationError, opts } = it;
  		if (schemaEnv.$async) gen.if((0, codegen_1._)`${names_1.default.errors} === 0`, () => gen.return(names_1.default.data), () => gen.throw((0, codegen_1._)`new ${ValidationError}(${names_1.default.vErrors})`));
  		else {
  			gen.assign((0, codegen_1._)`${validateName}.errors`, names_1.default.vErrors);
  			if (opts.unevaluated) assignEvaluated(it);
  			gen.return((0, codegen_1._)`${names_1.default.errors} === 0`);
  		}
  	}
  	function assignEvaluated({ gen, evaluated, props, items }) {
  		if (props instanceof codegen_1.Name) gen.assign((0, codegen_1._)`${evaluated}.props`, props);
  		if (items instanceof codegen_1.Name) gen.assign((0, codegen_1._)`${evaluated}.items`, items);
  	}
  	function schemaKeywords(it, types, typeErrors, errsCount) {
  		const { gen, schema, data, allErrors, opts, self } = it;
  		const { RULES } = self;
  		if (schema.$ref && (opts.ignoreKeywordsWithRef || !(0, util_1.schemaHasRulesButRef)(schema, RULES))) {
  			gen.block(() => keywordCode(it, "$ref", RULES.all.$ref.definition));
  			return;
  		}
  		if (!opts.jtd) checkStrictTypes(it, types);
  		gen.block(() => {
  			for (const group of RULES.rules) groupKeywords(group);
  			groupKeywords(RULES.post);
  		});
  		function groupKeywords(group) {
  			if (!(0, applicability_1.shouldUseGroup)(schema, group)) return;
  			if (group.type) {
  				gen.if((0, dataType_2.checkDataType)(group.type, data, opts.strictNumbers));
  				iterateKeywords(it, group);
  				if (types.length === 1 && types[0] === group.type && typeErrors) {
  					gen.else();
  					(0, dataType_2.reportTypeError)(it);
  				}
  				gen.endIf();
  			} else iterateKeywords(it, group);
  			if (!allErrors) gen.if((0, codegen_1._)`${names_1.default.errors} === ${errsCount || 0}`);
  		}
  	}
  	function iterateKeywords(it, group) {
  		const { gen, schema, opts: { useDefaults } } = it;
  		if (useDefaults) (0, defaults_1.assignDefaults)(it, group.type);
  		gen.block(() => {
  			for (const rule of group.rules) if ((0, applicability_1.shouldUseRule)(schema, rule)) keywordCode(it, rule.keyword, rule.definition, group.type);
  		});
  	}
  	function checkStrictTypes(it, types) {
  		if (it.schemaEnv.meta || !it.opts.strictTypes) return;
  		checkContextTypes(it, types);
  		if (!it.opts.allowUnionTypes) checkMultipleTypes(it, types);
  		checkKeywordTypes(it, it.dataTypes);
  	}
  	function checkContextTypes(it, types) {
  		if (!types.length) return;
  		if (!it.dataTypes.length) {
  			it.dataTypes = types;
  			return;
  		}
  		types.forEach((t) => {
  			if (!includesType(it.dataTypes, t)) strictTypesError(it, `type "${t}" not allowed by context "${it.dataTypes.join(",")}"`);
  		});
  		narrowSchemaTypes(it, types);
  	}
  	function checkMultipleTypes(it, ts) {
  		if (ts.length > 1 && !(ts.length === 2 && ts.includes("null"))) strictTypesError(it, "use allowUnionTypes to allow union type keyword");
  	}
  	function checkKeywordTypes(it, ts) {
  		const rules = it.self.RULES.all;
  		for (const keyword in rules) {
  			const rule = rules[keyword];
  			if (typeof rule == "object" && (0, applicability_1.shouldUseRule)(it.schema, rule)) {
  				const { type } = rule.definition;
  				if (type.length && !type.some((t) => hasApplicableType(ts, t))) strictTypesError(it, `missing type "${type.join(",")}" for keyword "${keyword}"`);
  			}
  		}
  	}
  	function hasApplicableType(schTs, kwdT) {
  		return schTs.includes(kwdT) || kwdT === "number" && schTs.includes("integer");
  	}
  	function includesType(ts, t) {
  		return ts.includes(t) || t === "integer" && ts.includes("number");
  	}
  	function narrowSchemaTypes(it, withTypes) {
  		const ts = [];
  		for (const t of it.dataTypes) if (includesType(withTypes, t)) ts.push(t);
  		else if (withTypes.includes("integer") && t === "number") ts.push("integer");
  		it.dataTypes = ts;
  	}
  	function strictTypesError(it, msg) {
  		const schemaPath = it.schemaEnv.baseId + it.errSchemaPath;
  		msg += ` at "${schemaPath}" (strictTypes)`;
  		(0, util_1.checkStrictMode)(it, msg, it.opts.strictTypes);
  	}
  	var KeywordCxt = class {
  		constructor(it, def, keyword) {
  			(0, keyword_1.validateKeywordUsage)(it, def, keyword);
  			this.gen = it.gen;
  			this.allErrors = it.allErrors;
  			this.keyword = keyword;
  			this.data = it.data;
  			this.schema = it.schema[keyword];
  			this.$data = def.$data && it.opts.$data && this.schema && this.schema.$data;
  			this.schemaValue = (0, util_1.schemaRefOrVal)(it, this.schema, keyword, this.$data);
  			this.schemaType = def.schemaType;
  			this.parentSchema = it.schema;
  			this.params = {};
  			this.it = it;
  			this.def = def;
  			if (this.$data) this.schemaCode = it.gen.const("vSchema", getData(this.$data, it));
  			else {
  				this.schemaCode = this.schemaValue;
  				if (!(0, keyword_1.validSchemaType)(this.schema, def.schemaType, def.allowUndefined)) throw new Error(`${keyword} value must be ${JSON.stringify(def.schemaType)}`);
  			}
  			if ("code" in def ? def.trackErrors : def.errors !== false) this.errsCount = it.gen.const("_errs", names_1.default.errors);
  		}
  		result(condition, successAction, failAction) {
  			this.failResult((0, codegen_1.not)(condition), successAction, failAction);
  		}
  		failResult(condition, successAction, failAction) {
  			this.gen.if(condition);
  			if (failAction) failAction();
  			else this.error();
  			if (successAction) {
  				this.gen.else();
  				successAction();
  				if (this.allErrors) this.gen.endIf();
  			} else if (this.allErrors) this.gen.endIf();
  			else this.gen.else();
  		}
  		pass(condition, failAction) {
  			this.failResult((0, codegen_1.not)(condition), void 0, failAction);
  		}
  		fail(condition) {
  			if (condition === void 0) {
  				this.error();
  				if (!this.allErrors) this.gen.if(false);
  				return;
  			}
  			this.gen.if(condition);
  			this.error();
  			if (this.allErrors) this.gen.endIf();
  			else this.gen.else();
  		}
  		fail$data(condition) {
  			if (!this.$data) return this.fail(condition);
  			const { schemaCode } = this;
  			this.fail((0, codegen_1._)`${schemaCode} !== undefined && (${(0, codegen_1.or)(this.invalid$data(), condition)})`);
  		}
  		error(append, errorParams, errorPaths) {
  			if (errorParams) {
  				this.setParams(errorParams);
  				this._error(append, errorPaths);
  				this.setParams({});
  				return;
  			}
  			this._error(append, errorPaths);
  		}
  		_error(append, errorPaths) {
  			(append ? errors_1.reportExtraError : errors_1.reportError)(this, this.def.error, errorPaths);
  		}
  		$dataError() {
  			(0, errors_1.reportError)(this, this.def.$dataError || errors_1.keyword$DataError);
  		}
  		reset() {
  			if (this.errsCount === void 0) throw new Error("add \"trackErrors\" to keyword definition");
  			(0, errors_1.resetErrorsCount)(this.gen, this.errsCount);
  		}
  		ok(cond) {
  			if (!this.allErrors) this.gen.if(cond);
  		}
  		setParams(obj, assign) {
  			if (assign) Object.assign(this.params, obj);
  			else this.params = obj;
  		}
  		block$data(valid, codeBlock, $dataValid = codegen_1.nil) {
  			this.gen.block(() => {
  				this.check$data(valid, $dataValid);
  				codeBlock();
  			});
  		}
  		check$data(valid = codegen_1.nil, $dataValid = codegen_1.nil) {
  			if (!this.$data) return;
  			const { gen, schemaCode, schemaType, def } = this;
  			gen.if((0, codegen_1.or)((0, codegen_1._)`${schemaCode} === undefined`, $dataValid));
  			if (valid !== codegen_1.nil) gen.assign(valid, true);
  			if (schemaType.length || def.validateSchema) {
  				gen.elseIf(this.invalid$data());
  				this.$dataError();
  				if (valid !== codegen_1.nil) gen.assign(valid, false);
  			}
  			gen.else();
  		}
  		invalid$data() {
  			const { gen, schemaCode, schemaType, def, it } = this;
  			return (0, codegen_1.or)(wrong$DataType(), invalid$DataSchema());
  			function wrong$DataType() {
  				if (schemaType.length) {
  					/* istanbul ignore if */
  					if (!(schemaCode instanceof codegen_1.Name)) throw new Error("ajv implementation error");
  					const st = Array.isArray(schemaType) ? schemaType : [schemaType];
  					return (0, codegen_1._)`${(0, dataType_2.checkDataTypes)(st, schemaCode, it.opts.strictNumbers, dataType_2.DataType.Wrong)}`;
  				}
  				return codegen_1.nil;
  			}
  			function invalid$DataSchema() {
  				if (def.validateSchema) {
  					const validateSchemaRef = gen.scopeValue("validate$data", { ref: def.validateSchema });
  					return (0, codegen_1._)`!${validateSchemaRef}(${schemaCode})`;
  				}
  				return codegen_1.nil;
  			}
  		}
  		subschema(appl, valid) {
  			const subschema = (0, subschema_1.getSubschema)(this.it, appl);
  			(0, subschema_1.extendSubschemaData)(subschema, this.it, appl);
  			(0, subschema_1.extendSubschemaMode)(subschema, appl);
  			const nextContext = {
  				...this.it,
  				...subschema,
  				items: void 0,
  				props: void 0
  			};
  			subschemaCode(nextContext, valid);
  			return nextContext;
  		}
  		mergeEvaluated(schemaCxt, toName) {
  			const { it, gen } = this;
  			if (!it.opts.unevaluated) return;
  			if (it.props !== true && schemaCxt.props !== void 0) it.props = util_1.mergeEvaluated.props(gen, schemaCxt.props, it.props, toName);
  			if (it.items !== true && schemaCxt.items !== void 0) it.items = util_1.mergeEvaluated.items(gen, schemaCxt.items, it.items, toName);
  		}
  		mergeValidEvaluated(schemaCxt, valid) {
  			const { it, gen } = this;
  			if (it.opts.unevaluated && (it.props !== true || it.items !== true)) {
  				gen.if(valid, () => this.mergeEvaluated(schemaCxt, codegen_1.Name));
  				return true;
  			}
  		}
  	};
  	exports.KeywordCxt = KeywordCxt;
  	function keywordCode(it, keyword, def, ruleType) {
  		const cxt = new KeywordCxt(it, def, keyword);
  		if ("code" in def) def.code(cxt, ruleType);
  		else if (cxt.$data && def.validate) (0, keyword_1.funcKeywordCode)(cxt, def);
  		else if ("macro" in def) (0, keyword_1.macroKeywordCode)(cxt, def);
  		else if (def.compile || def.validate) (0, keyword_1.funcKeywordCode)(cxt, def);
  	}
  	var JSON_POINTER = /^\/(?:[^~]|~0|~1)*$/;
  	var RELATIVE_JSON_POINTER = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
  	function getData($data, { dataLevel, dataNames, dataPathArr }) {
  		let jsonPointer;
  		let data;
  		if ($data === "") return names_1.default.rootData;
  		if ($data[0] === "/") {
  			if (!JSON_POINTER.test($data)) throw new Error(`Invalid JSON-pointer: ${$data}`);
  			jsonPointer = $data;
  			data = names_1.default.rootData;
  		} else {
  			const matches = RELATIVE_JSON_POINTER.exec($data);
  			if (!matches) throw new Error(`Invalid JSON-pointer: ${$data}`);
  			const up = +matches[1];
  			jsonPointer = matches[2];
  			if (jsonPointer === "#") {
  				if (up >= dataLevel) throw new Error(errorMsg("property/index", up));
  				return dataPathArr[dataLevel - up];
  			}
  			if (up > dataLevel) throw new Error(errorMsg("data", up));
  			data = dataNames[dataLevel - up];
  			if (!jsonPointer) return data;
  		}
  		let expr = data;
  		const segments = jsonPointer.split("/");
  		for (const segment of segments) if (segment) {
  			data = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)((0, util_1.unescapeJsonPointer)(segment))}`;
  			expr = (0, codegen_1._)`${expr} && ${data}`;
  		}
  		return expr;
  		function errorMsg(pointerType, up) {
  			return `Cannot access ${pointerType} ${up} levels up, current level is ${dataLevel}`;
  		}
  	}
  	exports.getData = getData;
  }));
  var require_validation_error = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var ValidationError = class extends Error {
  		constructor(errors) {
  			super("validation failed");
  			this.errors = errors;
  			this.ajv = this.validation = true;
  		}
  	};
  	exports.default = ValidationError;
  }));
  var require_ref_error = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var resolve_1 = require_resolve();
  	var MissingRefError = class extends Error {
  		constructor(resolver, baseId, ref, msg) {
  			super(msg || `can't resolve reference ${ref} from id ${baseId}`);
  			this.missingRef = (0, resolve_1.resolveUrl)(resolver, baseId, ref);
  			this.missingSchema = (0, resolve_1.normalizeId)((0, resolve_1.getFullPath)(resolver, this.missingRef));
  		}
  	};
  	exports.default = MissingRefError;
  }));
  var require_compile = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.resolveSchema = exports.getCompilingSchema = exports.resolveRef = exports.compileSchema = exports.SchemaEnv = void 0;
  	var codegen_1 = require_codegen();
  	var validation_error_1 = require_validation_error();
  	var names_1 = require_names();
  	var resolve_1 = require_resolve();
  	var util_1 = require_util();
  	var validate_1 = require_validate();
  	var SchemaEnv = class {
  		constructor(env) {
  			var _a;
  			this.refs = {};
  			this.dynamicAnchors = {};
  			let schema;
  			if (typeof env.schema == "object") schema = env.schema;
  			this.schema = env.schema;
  			this.schemaId = env.schemaId;
  			this.root = env.root || this;
  			this.baseId = (_a = env.baseId) !== null && _a !== void 0 ? _a : (0, resolve_1.normalizeId)(schema === null || schema === void 0 ? void 0 : schema[env.schemaId || "$id"]);
  			this.schemaPath = env.schemaPath;
  			this.localRefs = env.localRefs;
  			this.meta = env.meta;
  			this.$async = schema === null || schema === void 0 ? void 0 : schema.$async;
  			this.refs = {};
  		}
  	};
  	exports.SchemaEnv = SchemaEnv;
  	function compileSchema(sch) {
  		const _sch = getCompilingSchema.call(this, sch);
  		if (_sch) return _sch;
  		const rootId = (0, resolve_1.getFullPath)(this.opts.uriResolver, sch.root.baseId);
  		const { es5, lines } = this.opts.code;
  		const { ownProperties } = this.opts;
  		const gen = new codegen_1.CodeGen(this.scope, {
  			es5,
  			lines,
  			ownProperties
  		});
  		let _ValidationError;
  		if (sch.$async) _ValidationError = gen.scopeValue("Error", {
  			ref: validation_error_1.default,
  			code: (0, codegen_1._)`require("ajv/dist/runtime/validation_error").default`
  		});
  		const validateName = gen.scopeName("validate");
  		sch.validateName = validateName;
  		const schemaCxt = {
  			gen,
  			allErrors: this.opts.allErrors,
  			data: names_1.default.data,
  			parentData: names_1.default.parentData,
  			parentDataProperty: names_1.default.parentDataProperty,
  			dataNames: [names_1.default.data],
  			dataPathArr: [codegen_1.nil],
  			dataLevel: 0,
  			dataTypes: [],
  			definedProperties: /* @__PURE__ */ new Set(),
  			topSchemaRef: gen.scopeValue("schema", this.opts.code.source === true ? {
  				ref: sch.schema,
  				code: (0, codegen_1.stringify)(sch.schema)
  			} : { ref: sch.schema }),
  			validateName,
  			ValidationError: _ValidationError,
  			schema: sch.schema,
  			schemaEnv: sch,
  			rootId,
  			baseId: sch.baseId || rootId,
  			schemaPath: codegen_1.nil,
  			errSchemaPath: sch.schemaPath || (this.opts.jtd ? "" : "#"),
  			errorPath: (0, codegen_1._)`""`,
  			opts: this.opts,
  			self: this
  		};
  		let sourceCode;
  		try {
  			this._compilations.add(sch);
  			(0, validate_1.validateFunctionCode)(schemaCxt);
  			gen.optimize(this.opts.code.optimize);
  			const validateCode = gen.toString();
  			sourceCode = `${gen.scopeRefs(names_1.default.scope)}return ${validateCode}`;
  			if (this.opts.code.process) sourceCode = this.opts.code.process(sourceCode, sch);
  			const validate = new Function(`${names_1.default.self}`, `${names_1.default.scope}`, sourceCode)(this, this.scope.get());
  			this.scope.value(validateName, { ref: validate });
  			validate.errors = null;
  			validate.schema = sch.schema;
  			validate.schemaEnv = sch;
  			if (sch.$async) validate.$async = true;
  			if (this.opts.code.source === true) validate.source = {
  				validateName,
  				validateCode,
  				scopeValues: gen._values
  			};
  			if (this.opts.unevaluated) {
  				const { props, items } = schemaCxt;
  				validate.evaluated = {
  					props: props instanceof codegen_1.Name ? void 0 : props,
  					items: items instanceof codegen_1.Name ? void 0 : items,
  					dynamicProps: props instanceof codegen_1.Name,
  					dynamicItems: items instanceof codegen_1.Name
  				};
  				if (validate.source) validate.source.evaluated = (0, codegen_1.stringify)(validate.evaluated);
  			}
  			sch.validate = validate;
  			return sch;
  		} catch (e) {
  			delete sch.validate;
  			delete sch.validateName;
  			if (sourceCode) this.logger.error("Error compiling schema, function code:", sourceCode);
  			throw e;
  		} finally {
  			this._compilations.delete(sch);
  		}
  	}
  	exports.compileSchema = compileSchema;
  	function resolveRef(root, baseId, ref) {
  		var _a;
  		ref = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, ref);
  		const schOrFunc = root.refs[ref];
  		if (schOrFunc) return schOrFunc;
  		let _sch = resolve.call(this, root, ref);
  		if (_sch === void 0) {
  			const schema = (_a = root.localRefs) === null || _a === void 0 ? void 0 : _a[ref];
  			const { schemaId } = this.opts;
  			if (schema) _sch = new SchemaEnv({
  				schema,
  				schemaId,
  				root,
  				baseId
  			});
  		}
  		if (_sch === void 0) return;
  		return root.refs[ref] = inlineOrCompile.call(this, _sch);
  	}
  	exports.resolveRef = resolveRef;
  	function inlineOrCompile(sch) {
  		if ((0, resolve_1.inlineRef)(sch.schema, this.opts.inlineRefs)) return sch.schema;
  		return sch.validate ? sch : compileSchema.call(this, sch);
  	}
  	function getCompilingSchema(schEnv) {
  		for (const sch of this._compilations) if (sameSchemaEnv(sch, schEnv)) return sch;
  	}
  	exports.getCompilingSchema = getCompilingSchema;
  	function sameSchemaEnv(s1, s2) {
  		return s1.schema === s2.schema && s1.root === s2.root && s1.baseId === s2.baseId;
  	}
  	function resolve(root, ref) {
  		let sch;
  		while (typeof (sch = this.refs[ref]) == "string") ref = sch;
  		return sch || this.schemas[ref] || resolveSchema.call(this, root, ref);
  	}
  	function resolveSchema(root, ref) {
  		const p = this.opts.uriResolver.parse(ref);
  		const refPath = (0, resolve_1._getFullPath)(this.opts.uriResolver, p);
  		let baseId = (0, resolve_1.getFullPath)(this.opts.uriResolver, root.baseId, void 0);
  		if (Object.keys(root.schema).length > 0 && refPath === baseId) return getJsonPointer.call(this, p, root);
  		const id = (0, resolve_1.normalizeId)(refPath);
  		const schOrRef = this.refs[id] || this.schemas[id];
  		if (typeof schOrRef == "string") {
  			const sch = resolveSchema.call(this, root, schOrRef);
  			if (typeof (sch === null || sch === void 0 ? void 0 : sch.schema) !== "object") return;
  			return getJsonPointer.call(this, p, sch);
  		}
  		if (typeof (schOrRef === null || schOrRef === void 0 ? void 0 : schOrRef.schema) !== "object") return;
  		if (!schOrRef.validate) compileSchema.call(this, schOrRef);
  		if (id === (0, resolve_1.normalizeId)(ref)) {
  			const { schema } = schOrRef;
  			const { schemaId } = this.opts;
  			const schId = schema[schemaId];
  			if (schId) baseId = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schId);
  			return new SchemaEnv({
  				schema,
  				schemaId,
  				root,
  				baseId
  			});
  		}
  		return getJsonPointer.call(this, p, schOrRef);
  	}
  	exports.resolveSchema = resolveSchema;
  	var PREVENT_SCOPE_CHANGE = /* @__PURE__ */ new Set([
  		"properties",
  		"patternProperties",
  		"enum",
  		"dependencies",
  		"definitions"
  	]);
  	function getJsonPointer(parsedRef, { baseId, schema, root }) {
  		var _a;
  		if (((_a = parsedRef.fragment) === null || _a === void 0 ? void 0 : _a[0]) !== "/") return;
  		for (const part of parsedRef.fragment.slice(1).split("/")) {
  			if (typeof schema === "boolean") return;
  			const partSchema = schema[(0, util_1.unescapeFragment)(part)];
  			if (partSchema === void 0) return;
  			schema = partSchema;
  			const schId = typeof schema === "object" && schema[this.opts.schemaId];
  			if (!PREVENT_SCOPE_CHANGE.has(part) && schId) baseId = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schId);
  		}
  		let env;
  		if (typeof schema != "boolean" && schema.$ref && !(0, util_1.schemaHasRulesButRef)(schema, this.RULES)) {
  			const $ref = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schema.$ref);
  			env = resolveSchema.call(this, root, $ref);
  		}
  		const { schemaId } = this.opts;
  		env = env || new SchemaEnv({
  			schema,
  			schemaId,
  			root,
  			baseId
  		});
  		if (env.schema !== env.root.schema) return env;
  	}
  }));
  var data_exports = /* @__PURE__ */ __exportAll({
  	$id: () => $id$10,
  	additionalProperties: () => false,
  	default: () => data_default,
  	description: () => description,
  	properties: () => properties$9,
  	required: () => required,
  	type: () => type$9
  }), $id$10, description, type$9, required, properties$9, data_default;
  var init_data = __esmMin((() => {
  	$id$10 = "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#";
  	description = "Meta-schema for $data reference (JSON AnySchema extension proposal)";
  	type$9 = "object";
  	required = ["$data"];
  	properties$9 = { "$data": {
  		"type": "string",
  		"anyOf": [{ "format": "relative-json-pointer" }, { "format": "json-pointer" }]
  	} };
  	data_default = {
  		$id: $id$10,
  		description,
  		type: type$9,
  		required,
  		properties: properties$9,
  		additionalProperties: false
  	};
  }));
  var require_utils = /* @__PURE__ */ __commonJSMin(((exports, module) => {
  	/** @type {(value: string) => boolean} */
  	var isUUID = RegExp.prototype.test.bind(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/iu);
  	/** @type {(value: string) => boolean} */
  	var isIPv4 = RegExp.prototype.test.bind(/^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)$/u);
  	/** @type {(value: string) => boolean} */
  	var isPort = RegExp.prototype.test.bind(/^\d*$/u);
  	/** @type {(value: string) => boolean} */
  	var isHexPair = RegExp.prototype.test.bind(/^[\da-f]{2}$/iu);
  	/** @type {(value: string) => boolean} */
  	var isUnreserved = RegExp.prototype.test.bind(/^[\da-z\-._~]$/iu);
  	/** @type {(value: string) => boolean} */
  	var isPathCharacter = RegExp.prototype.test.bind(/^[A-Za-z0-9\-._~!$&'()*+,;=:@/]$/u);
  	/** @type {(value: string) => boolean} */
  	var isQueryFragmentCharacter = RegExp.prototype.test.bind(/^[A-Za-z0-9\-._~!$&'()*+,;=:@/?]$/u);
  	/** @type {(value: string) => boolean} */
  	var isUserinfoCharacter = RegExp.prototype.test.bind(/^[A-Za-z0-9\-._~!$&'()*+,;=:]$/u);
  	var BYTE_HEX = new Array(256);
  	{
  		const HEX_DIGITS = "0123456789ABCDEF";
  		for (let i = 0; i < 256; i++) BYTE_HEX[i] = "%" + HEX_DIGITS[i >> 4] + HEX_DIGITS[i & 15];
  	}
  	function percentEncodeNonAscii(cp) {
  		if (cp < 2048) return BYTE_HEX[192 | cp >> 6] + BYTE_HEX[128 | cp & 63];
  		if (cp < 65536) return BYTE_HEX[224 | cp >> 12] + BYTE_HEX[128 | cp >> 6 & 63] + BYTE_HEX[128 | cp & 63];
  		return BYTE_HEX[240 | cp >> 18] + BYTE_HEX[128 | cp >> 12 & 63] + BYTE_HEX[128 | cp >> 6 & 63] + BYTE_HEX[128 | cp & 63];
  	}
  	/**
  	* @param {Array<string>} input
  	* @returns {string}
  	*/
  	function stringArrayToHexStripped(input) {
  		let acc = "";
  		let code = 0;
  		let i = 0;
  		for (i = 0; i < input.length; i++) {
  			code = input[i].charCodeAt(0);
  			if (code === 48) continue;
  			if (!(code >= 48 && code <= 57 || code >= 65 && code <= 70 || code >= 97 && code <= 102)) return "";
  			acc += input[i];
  			break;
  		}
  		for (i += 1; i < input.length; i++) {
  			code = input[i].charCodeAt(0);
  			if (!(code >= 48 && code <= 57 || code >= 65 && code <= 70 || code >= 97 && code <= 102)) return "";
  			acc += input[i];
  		}
  		return acc;
  	}
  	/** @type {(value: string) => boolean} */
  	var isHextet = RegExp.prototype.test.bind(/^[\dA-Fa-f]{1,4}$/);
  	/** @type {(value: string) => boolean} */
  	var isIPvFuture = RegExp.prototype.test.bind(/^[vV][\dA-Fa-f]+\.[A-Za-z\d\-._~!$&'()*+,;=:]+$/);
  	/** @type {(value: string) => boolean} */
  	var isZoneCharacter = RegExp.prototype.test.bind(/^[A-Za-z\d\-._~]$/);
  	/**
  	* @param {string} value
  	* @returns {boolean}
  	*/
  	var nonSimpleDomain = RegExp.prototype.test.bind(/[^!"$&'()*+,\-.;=_`a-z{}~]/u);
  	/**
  	* @param {string} zone
  	* @returns {boolean}
  	*/
  	function isZoneIdentifier(zone) {
  		if (zone.length === 0) return false;
  		for (let i = 0; i < zone.length; i++) {
  			if (isZoneCharacter(zone[i])) continue;
  			if (zone[i] === "%" && i + 2 < zone.length && isHexPair(zone.slice(i + 1, i + 3))) {
  				i += 2;
  				continue;
  			}
  			return false;
  		}
  		return true;
  	}
  	/**
  	* Compresses the longest run of zero hextets to "::" per RFC 5952. A run of a
  	* single zero hextet is left uncompressed. On ties the leftmost run wins.
  	*
  	* @param {string[]} hextets
  	* @returns {string}
  	*/
  	function compressIPv6ZeroRun(hextets) {
  		let bestStart = -1;
  		let bestLength = 0;
  		let runStart = -1;
  		let runLength = 0;
  		for (let i = 0; i < hextets.length; i++) if (hextets[i] === "0") {
  			if (runStart === -1) runStart = i;
  			runLength++;
  			if (runLength > bestLength) {
  				bestLength = runLength;
  				bestStart = runStart;
  			}
  		} else {
  			runStart = -1;
  			runLength = 0;
  		}
  		if (bestLength < 2) return hextets.join(":");
  		const head = hextets.slice(0, bestStart).join(":");
  		const tail = hextets.slice(bestStart + bestLength).join(":");
  		return head + "::" + tail;
  	}
  	/**
  	* Validates an IPv6 address against the alternatives in RFC 3986 section
  	* 3.2.2 and returns the same address with leading hextet zeroes removed.
  	* An embedded IPv4 address counts as two hextets and is only valid at the end.
  	*
  	* @param {string} input
  	* @returns {string|undefined}
  	*/
  	function normalizeIPv6Address(input) {
  		const compression = input.indexOf("::");
  		if (compression !== -1 && input.indexOf("::", compression + 1) !== -1) return void 0;
  		const left = compression === -1 ? input.split(":") : input.slice(0, compression).split(":");
  		const right = compression === -1 ? [] : input.slice(compression + 2).split(":");
  		if (compression !== -1) {
  			if (left.length === 1 && left[0] === "") left.length = 0;
  			if (right.length === 1 && right[0] === "") right.length = 0;
  		}
  		const parts = left.concat(right);
  		let hextetCount = 0;
  		for (let i = 0; i < parts.length; i++) {
  			const part = parts[i];
  			if (part === "") return void 0;
  			if (part.indexOf(".") !== -1) {
  				if (i !== parts.length - 1 || compression !== -1 && right.length === 0 || !isIPv4(part)) return void 0;
  				hextetCount += 2;
  				continue;
  			}
  			if (!isHextet(part)) return void 0;
  			parts[i] = parseInt(part, 16).toString(16);
  			hextetCount++;
  		}
  		if (compression === -1) {
  			if (hextetCount !== 8) return void 0;
  			return compressIPv6ZeroRun(parts);
  		}
  		if (hextetCount >= 8) return void 0;
  		const expanded = parts.slice(0, left.length);
  		for (let i = hextetCount; i < 8; i++) expanded.push("0");
  		for (let i = left.length; i < parts.length; i++) expanded.push(parts[i]);
  		return compressIPv6ZeroRun(expanded);
  	}
  	/**
  	* @typedef {Object} NormalizeIPv6Result
  	* @property {string} host - The normalized host.
  	* @property {string} [escapedHost] - The escaped host.
  	* @property {boolean} isIPV6 - Indicates if the host is an IPv6 address.
  	* @property {boolean} [isIPVFuture] - Indicates if the host is an IPvFuture literal.
  	* @property {boolean} [error] - Indicates if a bracketed IP literal is malformed.
  	*/
  	/**
  	* Validates and normalizes a bracketed IP literal. Raw zone separators remain
  	* accepted for backwards compatibility, while encoded separators and zone
  	* contents follow RFC 6874.
  	*
  	* @param {string} host
  	* @returns {NormalizeIPv6Result}
  	*/
  	function normalizeIPv6(host) {
  		const bracketed = host[0] === "[" && host[host.length - 1] === "]";
  		if ((host[0] === "[" || host[host.length - 1] === "]") && !bracketed) return {
  			host,
  			isIPV6: false,
  			error: true
  		};
  		let input = bracketed ? host.slice(1, -1) : host;
  		if (bracketed && isIPvFuture(input)) {
  			input = input.toLowerCase();
  			return {
  				host: `[${input}]`,
  				escapedHost: input,
  				isIPV6: false,
  				isIPVFuture: true
  			};
  		}
  		if (findToken(input, ":") < 2) return {
  			host,
  			isIPV6: false,
  			error: bracketed
  		};
  		let zoneIdentifier = "";
  		const zoneSeparator = input.indexOf("%");
  		if (zoneSeparator !== -1) {
  			const separatorLength = input.slice(zoneSeparator, zoneSeparator + 3).toLowerCase() === "%25" ? 3 : 1;
  			zoneIdentifier = input.slice(zoneSeparator + separatorLength);
  			if (!isZoneIdentifier(zoneIdentifier)) return {
  				host,
  				isIPV6: false,
  				error: true
  			};
  			input = input.slice(0, zoneSeparator);
  		}
  		const address = normalizeIPv6Address(input);
  		if (address === void 0) return {
  			host,
  			isIPV6: false,
  			error: true
  		};
  		return {
  			host: address + (zoneIdentifier ? "%" + zoneIdentifier : ""),
  			escapedHost: address + (zoneIdentifier ? "%25" + zoneIdentifier : ""),
  			isIPV6: true
  		};
  	}
  	/**
  	* @param {string} str
  	* @param {string} token
  	* @returns {number}
  	*/
  	function findToken(str, token) {
  		let ind = 0;
  		for (let i = 0; i < str.length; i++) if (str[i] === token) ind++;
  		return ind;
  	}
  	/**
  	* @param {string} path
  	* @returns {string}
  	*
  	* @see https://datatracker.ietf.org/doc/html/rfc3986#section-5.2.4
  	*/
  	function removeDotSegments(path) {
  		let input = path;
  		const output = [];
  		let nextSlash = -1;
  		let len = 0;
  		while (len = input.length) {
  			if (len === 1) {
  				if (input === ".") break;
  				else if (input === "/") {
  					output.push("/");
  					break;
  				} else {
  					output.push(input);
  					break;
  				}
  			} else if (len === 2) {
  				if (input[0] === ".") {
  					if (input[1] === ".") break;
  					else if (input[1] === "/") {
  						input = input.slice(2);
  						continue;
  					}
  				} else if (input[0] === "/") {
  					if (input[1] === "." || input[1] === "/") {
  						output.push("/");
  						break;
  					}
  				}
  			} else if (len === 3) {
  				if (input === "/..") {
  					if (output.length !== 0) output.pop();
  					output.push("/");
  					break;
  				}
  			}
  			if (input[0] === ".") {
  				if (input[1] === ".") {
  					if (input[2] === "/") {
  						input = input.slice(3);
  						continue;
  					}
  				} else if (input[1] === "/") {
  					input = input.slice(2);
  					continue;
  				}
  			} else if (input[0] === "/") {
  				if (input[1] === ".") {
  					if (input[2] === "/") {
  						input = input.slice(2);
  						continue;
  					} else if (input[2] === ".") {
  						if (input[3] === "/") {
  							input = input.slice(3);
  							if (output.length !== 0) output.pop();
  							continue;
  						}
  					}
  				}
  			}
  			if ((nextSlash = input.indexOf("/", 1)) === -1) {
  				output.push(input);
  				break;
  			} else {
  				output.push(input.slice(0, nextSlash));
  				input = input.slice(nextSlash);
  			}
  		}
  		return output.join("");
  	}
  	/**
  	* Re-escape RFC 3986 gen-delims that must not appear literally in the host.
  	* After the URI regex parses, these characters cannot be literal in the host
  	* field, so any that appear after decoding came from percent-encoding and
  	* must be restored to prevent authority structure changes.
  	*
  	* @param {string} host
  	* @param {boolean} isIP - true for IPv4/IPv6 hosts (skip colon re-escaping)
  	* @returns {string}
  	*/
  	var HOST_DELIMS = {
  		"@": "%40",
  		"/": "%2F",
  		"?": "%3F",
  		"#": "%23",
  		":": "%3A"
  	};
  	var HOST_DELIM_RE = /[@/?#:]/g;
  	var HOST_DELIM_NO_COLON_RE = /[@/?#]/g;
  	function reescapeHostDelimiters(host, isIP) {
  		const re = isIP ? HOST_DELIM_NO_COLON_RE : HOST_DELIM_RE;
  		re.lastIndex = 0;
  		return host.replace(re, (ch) => HOST_DELIMS[ch]);
  	}
  	/**
  	* Normalizes percent escapes and optionally decodes only unreserved ASCII bytes.
  	* Reserved delimiters such as `%2F` stay escaped; `%2E` is unreserved.
  	*
  	* @param {string} input
  	* @param {boolean} [decodeUnreserved=false]
  	* @returns {string}
  	*/
  	function normalizePercentEncoding(input, decodeUnreserved = false) {
  		if (input.indexOf("%") === -1) return input;
  		let output = "";
  		for (let i = 0; i < input.length; i++) {
  			if (input[i] === "%" && i + 2 < input.length) {
  				const hex = input.slice(i + 1, i + 3);
  				if (isHexPair(hex)) {
  					const normalizedHex = hex.toUpperCase();
  					const decoded = String.fromCharCode(parseInt(normalizedHex, 16));
  					if (decodeUnreserved && isUnreserved(decoded)) output += decoded;
  					else output += "%" + normalizedHex;
  					i += 2;
  					continue;
  				}
  			}
  			output += input[i];
  		}
  		return output;
  	}
  	/**
  	* Normalizes path data without turning reserved escapes into live path syntax.
  	* Valid escapes are uppercased, raw unsafe characters are escaped, and only
  	* unreserved bytes that are not `.` are decoded.
  	*
  	* @param {string} input
  	* @returns {string}
  	*/
  	function normalizePathEncoding(input) {
  		let output = "";
  		for (let i = 0; i < input.length; i++) {
  			const ch = input[i];
  			if (ch === "%" && i + 2 < input.length) {
  				const hex = input.slice(i + 1, i + 3);
  				if (isHexPair(hex)) {
  					const normalizedHex = hex.toUpperCase();
  					const decoded = String.fromCharCode(parseInt(normalizedHex, 16));
  					if (decoded !== "." && isUnreserved(decoded)) output += decoded;
  					else output += "%" + normalizedHex;
  					i += 2;
  					continue;
  				}
  			}
  			if (isPathCharacter(ch)) output += ch;
  			else {
  				const code = input.charCodeAt(i);
  				if (code < 128) output += isEscapeSafe(code) ? ch : BYTE_HEX[code];
  				else if (code < 55296 || code > 57343) output += percentEncodeNonAscii(code);
  				else if (code <= 56319 && i + 1 < input.length) {
  					const low = input.charCodeAt(i + 1);
  					if (low >= 56320 && low <= 57343) {
  						output += percentEncodeNonAscii(65536 + (code - 55296 << 10) + (low - 56320));
  						i++;
  					} else output += percentEncodeNonAscii(65533);
  				} else output += percentEncodeNonAscii(65533);
  			}
  		}
  		return output;
  	}
  	/**
  	* Serializes a path without rewriting reserved data. Raw RFC 3986 path
  	* characters remain literal, valid escapes are preserved and uppercased, and
  	* everything else is UTF-8 percent-encoded. In a path-noscheme, a colon in the
  	* first segment must be escaped so the result cannot be parsed as a scheme.
  	*
  	* @param {string} input
  	* @param {boolean} [pathNoScheme=false]
  	* @returns {string}
  	*/
  	function serializePathEncoding(input, pathNoScheme = false) {
  		let output = "";
  		let firstSegment = pathNoScheme && input[0] !== "/";
  		for (let i = 0; i < input.length; i++) {
  			const ch = input[i];
  			if (ch === "%" && i + 2 < input.length) {
  				const hex = input.slice(i + 1, i + 3);
  				if (isHexPair(hex)) {
  					output += "%" + hex.toUpperCase();
  					i += 2;
  					continue;
  				}
  			}
  			if (ch === "/") firstSegment = false;
  			if (isPathCharacter(ch) && (ch !== ":" || !firstSegment)) output += ch;
  			else {
  				const code = input.charCodeAt(i);
  				if (code < 128) output += BYTE_HEX[code];
  				else if (code < 55296 || code > 57343) output += percentEncodeNonAscii(code);
  				else if (code <= 56319 && i + 1 < input.length) {
  					const low = input.charCodeAt(i + 1);
  					if (low >= 56320 && low <= 57343) {
  						output += percentEncodeNonAscii(65536 + (code - 55296 << 10) + (low - 56320));
  						i++;
  					} else output += percentEncodeNonAscii(65533);
  				} else output += percentEncodeNonAscii(65533);
  			}
  		}
  		return output;
  	}
  	/**
  	* Percent-encodes a URI component using its RFC 3986 literal character set.
  	* Existing valid escapes are preserved and normalized to uppercase hex.
  	*
  	* @param {string} input
  	* @param {(value: string) => boolean} isAllowed
  	* @returns {string}
  	*/
  	function encodeComponent(input, isAllowed) {
  		let output = "";
  		for (let i = 0; i < input.length; i++) {
  			const ch = input[i];
  			if (ch === "%" && i + 2 < input.length) {
  				const hex = input.slice(i + 1, i + 3);
  				if (isHexPair(hex)) {
  					output += "%" + hex.toUpperCase();
  					i += 2;
  					continue;
  				}
  			}
  			if (isAllowed(ch)) output += ch;
  			else {
  				const code = input.charCodeAt(i);
  				if (code < 128) output += BYTE_HEX[code];
  				else if (code < 55296 || code > 57343) output += percentEncodeNonAscii(code);
  				else if (code <= 56319 && i + 1 < input.length) {
  					const low = input.charCodeAt(i + 1);
  					if (low >= 56320 && low <= 57343) {
  						output += percentEncodeNonAscii(65536 + (code - 55296 << 10) + (low - 56320));
  						i++;
  					} else output += percentEncodeNonAscii(65533);
  				} else output += percentEncodeNonAscii(65533);
  			}
  		}
  		return output;
  	}
  	/**
  	* Encodes userinfo while preserving its RFC 3986 §3.2.1 literal characters.
  	* In particular, authority delimiters such as `@`, `/`, `?`, and `#` are data.
  	*
  	* @param {string} input
  	* @returns {string}
  	*/
  	function encodeUserinfo(input) {
  		return encodeComponent(input, isUserinfoCharacter);
  	}
  	/**
  	* Encodes query data using the RFC 3986 §3.4 grammar. A literal `#` must be
  	* escaped because it would otherwise begin the fragment component.
  	*
  	* @param {string} input
  	* @returns {string}
  	*/
  	function encodeQuery(input) {
  		return encodeComponent(input, isQueryFragmentCharacter);
  	}
  	/**
  	* Encodes fragment data using the RFC 3986 §3.5 grammar.
  	*
  	* @param {string} input
  	* @returns {string}
  	*/
  	function encodeFragment(input) {
  		return encodeComponent(input, isQueryFragmentCharacter);
  	}
  	function isEscapeSafe(cp) {
  		return cp >= 48 && cp <= 57 || cp >= 65 && cp <= 90 || cp >= 97 && cp <= 122 || cp === 42 || cp === 43 || cp === 45 || cp === 46 || cp === 47 || cp === 64 || cp === 95;
  	}
  	/**
  	* Normalizes the percent-encoding of a query or fragment component.
  	*
  	* Like `normalizePathEncoding`, but uses the query/fragment character set
  	* (which additionally allows `?`) and decodes `.` since it has no dot-segment
  	* meaning outside of a path.
  	*
  	* @param {string} input
  	* @returns {string}
  	*/
  	function normalizeQueryFragmentEncoding(input) {
  		let output = "";
  		for (let i = 0; i < input.length; i++) {
  			const ch = input[i];
  			if (ch === "%" && i + 2 < input.length) {
  				const hex = input.slice(i + 1, i + 3);
  				if (isHexPair(hex)) {
  					const normalizedHex = hex.toUpperCase();
  					const decoded = String.fromCharCode(parseInt(normalizedHex, 16));
  					if (isUnreserved(decoded)) output += decoded;
  					else output += "%" + normalizedHex;
  					i += 2;
  					continue;
  				}
  			}
  			if (isQueryFragmentCharacter(ch)) output += ch;
  			else {
  				const code = input.charCodeAt(i);
  				if (code < 128) output += isEscapeSafe(code) ? ch : BYTE_HEX[code];
  				else if (code < 55296 || code > 57343) output += percentEncodeNonAscii(code);
  				else if (code <= 56319 && i + 1 < input.length) {
  					const low = input.charCodeAt(i + 1);
  					if (low >= 56320 && low <= 57343) {
  						output += percentEncodeNonAscii(65536 + (code - 55296 << 10) + (low - 56320));
  						i++;
  					} else output += percentEncodeNonAscii(65533);
  				} else output += percentEncodeNonAscii(65533);
  			}
  		}
  		return output;
  	}
  	/**
  	* Escapes a component while preserving existing valid percent escapes.
  	*
  	* @param {string} input
  	* @returns {string}
  	*/
  	function escapePreservingEscapes(input) {
  		let output = "";
  		for (let i = 0; i < input.length; i++) {
  			if (input[i] === "%" && i + 2 < input.length) {
  				const hex = input.slice(i + 1, i + 3);
  				if (isHexPair(hex)) {
  					output += "%" + hex.toUpperCase();
  					i += 2;
  					continue;
  				}
  			}
  			output += escape(input[i]);
  		}
  		return output;
  	}
  	/**
  	* @param {import('../types/index').URIComponent} component
  	* @returns {string|undefined}
  	*/
  	function recomposeAuthority(component) {
  		const uriTokens = [];
  		if (component.userinfo !== void 0) {
  			uriTokens.push(encodeUserinfo(component.userinfo));
  			uriTokens.push("@");
  		}
  		if (component.host !== void 0) {
  			let host = component.host;
  			if (!isIPv4(host)) {
  				let ipV6res = normalizeIPv6(host);
  				if (ipV6res.isIPV6 !== true && ipV6res.isIPVFuture !== true) {
  					host = normalizePercentEncoding(host, true);
  					ipV6res = normalizeIPv6(host);
  				}
  				if (ipV6res.isIPV6 === true || ipV6res.isIPVFuture === true) host = `[${ipV6res.escapedHost}]`;
  				else host = reescapeHostDelimiters(host, false);
  			}
  			uriTokens.push(host);
  		}
  		if (typeof component.port === "number" || typeof component.port === "string") {
  			const port = String(component.port);
  			if (!isPort(port)) throw new TypeError("URI port is malformed.");
  			uriTokens.push(":");
  			uriTokens.push(port);
  		}
  		return uriTokens.length ? uriTokens.join("") : void 0;
  	}
  	module.exports = {
  		nonSimpleDomain,
  		recomposeAuthority,
  		reescapeHostDelimiters,
  		normalizePercentEncoding,
  		normalizePathEncoding,
  		serializePathEncoding,
  		normalizeQueryFragmentEncoding,
  		encodeUserinfo,
  		encodeQuery,
  		encodeFragment,
  		escapePreservingEscapes,
  		removeDotSegments,
  		isIPv4,
  		isUUID,
  		normalizeIPv6,
  		stringArrayToHexStripped
  	};
  }));
  var require_schemes = /* @__PURE__ */ __commonJSMin(((exports, module) => {
  	var { isUUID } = require_utils();
  	var URN_REG = /^([\da-z][\d\-a-z]{0,31}):((?:[\w!$'()*+,\-./:;=@]|%[\da-f]{2})+)$/iu;
  	var supportedSchemeNames = [
  		"http",
  		"https",
  		"ws",
  		"wss",
  		"urn",
  		"urn:uuid"
  	];
  	/** @typedef {supportedSchemeNames[number]} SchemeName */
  	/**
  	* @param {string} name
  	* @returns {name is SchemeName}
  	*/
  	function isValidSchemeName(name) {
  		return supportedSchemeNames.indexOf(name) !== -1;
  	}
  	/**
  	* @callback SchemeFn
  	* @param {import('../types/index').URIComponent} component
  	* @param {import('../types/index').Options} options
  	* @returns {import('../types/index').URIComponent}
  	*/
  	/**
  	* @typedef {Object} SchemeHandler
  	* @property {SchemeName} scheme - The scheme name.
  	* @property {boolean} [domainHost] - Indicates if the scheme supports domain hosts.
  	* @property {SchemeFn} parse - Function to parse the URI component for this scheme.
  	* @property {SchemeFn} serialize - Function to serialize the URI component for this scheme.
  	* @property {boolean} [skipNormalize] - Indicates if normalization should be skipped for this scheme.
  	* @property {boolean} [absolutePath] - Indicates if the scheme uses absolute paths.
  	* @property {boolean} [unicodeSupport] - Indicates if the scheme supports Unicode.
  	*/
  	/**
  	* @param {import('../types/index').URIComponent} wsComponent
  	* @returns {boolean}
  	*/
  	function wsIsSecure(wsComponent) {
  		if (wsComponent.secure === true) return true;
  		else if (wsComponent.secure === false) return false;
  		else if (wsComponent.scheme) return wsComponent.scheme.length === 3 && (wsComponent.scheme[0] === "w" || wsComponent.scheme[0] === "W") && (wsComponent.scheme[1] === "s" || wsComponent.scheme[1] === "S") && (wsComponent.scheme[2] === "s" || wsComponent.scheme[2] === "S");
  		else return false;
  	}
  	/** @type {SchemeFn} */
  	function httpParse(component) {
  		if (!component.host) component.error = component.error || "HTTP URIs must have a host.";
  		return component;
  	}
  	/** @type {SchemeFn} */
  	function httpSerialize(component) {
  		const secure = String(component.scheme).toLowerCase() === "https";
  		if (component.port === (secure ? 443 : 80) || component.port === "") component.port = void 0;
  		if (!component.path) component.path = "/";
  		return component;
  	}
  	/** @type {SchemeFn} */
  	function wsParse(wsComponent) {
  		wsComponent.secure = wsIsSecure(wsComponent);
  		wsComponent.resourceName = (wsComponent.path || "/") + (wsComponent.query ? "?" + wsComponent.query : "");
  		wsComponent.path = void 0;
  		wsComponent.query = void 0;
  		return wsComponent;
  	}
  	/** @type {SchemeFn} */
  	function wsSerialize(wsComponent) {
  		if (wsComponent.port === (wsIsSecure(wsComponent) ? 443 : 80) || wsComponent.port === "") wsComponent.port = void 0;
  		if (typeof wsComponent.secure === "boolean") {
  			wsComponent.scheme = wsComponent.secure ? "wss" : "ws";
  			wsComponent.secure = void 0;
  		}
  		if (wsComponent.resourceName) {
  			const queryIndex = wsComponent.resourceName.indexOf("?");
  			const path = queryIndex === -1 ? wsComponent.resourceName : wsComponent.resourceName.slice(0, queryIndex);
  			wsComponent.path = path && path !== "/" ? path : void 0;
  			wsComponent.query = queryIndex === -1 ? void 0 : wsComponent.resourceName.slice(queryIndex + 1);
  			wsComponent.resourceName = void 0;
  		}
  		wsComponent.fragment = void 0;
  		return wsComponent;
  	}
  	/** @type {SchemeFn} */
  	function urnParse(urnComponent, options) {
  		if (!urnComponent.path) {
  			urnComponent.error = "URN can not be parsed";
  			return urnComponent;
  		}
  		const matches = urnComponent.path.match(URN_REG);
  		if (matches && matches[0] === urnComponent.path) {
  			const scheme = options.scheme || urnComponent.scheme || "urn";
  			urnComponent.nid = matches[1].toLowerCase();
  			urnComponent.nss = matches[2];
  			const schemeHandler = getSchemeHandler(`${scheme}:${options.nid || urnComponent.nid}`);
  			urnComponent.path = void 0;
  			if (schemeHandler) urnComponent = schemeHandler.parse(urnComponent, options);
  		} else urnComponent.error = urnComponent.error || "URN can not be parsed.";
  		return urnComponent;
  	}
  	/** @type {SchemeFn} */
  	function urnSerialize(urnComponent, options) {
  		if (urnComponent.nid === void 0) throw new Error("URN without nid cannot be serialized");
  		const scheme = options.scheme || urnComponent.scheme || "urn";
  		const nid = urnComponent.nid.toLowerCase();
  		const schemeHandler = getSchemeHandler(`${scheme}:${options.nid || nid}`);
  		if (schemeHandler) urnComponent = schemeHandler.serialize(urnComponent, options);
  		const uriComponent = urnComponent;
  		const nss = urnComponent.nss;
  		uriComponent.path = `${nid || options.nid}:${nss}`;
  		options.skipEscape = true;
  		return uriComponent;
  	}
  	/** @type {SchemeFn} */
  	function urnuuidParse(urnComponent, options) {
  		const uuidComponent = urnComponent;
  		uuidComponent.uuid = uuidComponent.nss;
  		uuidComponent.nss = void 0;
  		if (!options.tolerant && (!uuidComponent.uuid || !isUUID(uuidComponent.uuid))) uuidComponent.error = uuidComponent.error || "UUID is not valid.";
  		return uuidComponent;
  	}
  	/** @type {SchemeFn} */
  	function urnuuidSerialize(uuidComponent) {
  		const urnComponent = uuidComponent;
  		urnComponent.nss = (uuidComponent.uuid || "").toLowerCase();
  		return urnComponent;
  	}
  	var http = {
  		scheme: "http",
  		domainHost: true,
  		parse: httpParse,
  		serialize: httpSerialize
  	};
  	var https = {
  		scheme: "https",
  		domainHost: http.domainHost,
  		parse: httpParse,
  		serialize: httpSerialize
  	};
  	var ws = {
  		scheme: "ws",
  		domainHost: true,
  		parse: wsParse,
  		serialize: wsSerialize
  	};
  	var SCHEMES = {
  		http,
  		https,
  		ws,
  		wss: {
  			scheme: "wss",
  			domainHost: ws.domainHost,
  			parse: ws.parse,
  			serialize: ws.serialize
  		},
  		urn: {
  			scheme: "urn",
  			parse: urnParse,
  			serialize: urnSerialize,
  			skipNormalize: true
  		},
  		"urn:uuid": {
  			scheme: "urn:uuid",
  			parse: urnuuidParse,
  			serialize: urnuuidSerialize,
  			skipNormalize: true
  		}
  	};
  	Object.setPrototypeOf(SCHEMES, null);
  	/**
  	* @param {string|undefined} scheme
  	* @returns {SchemeHandler|undefined}
  	*/
  	function getSchemeHandler(scheme) {
  		return scheme && (SCHEMES[scheme] || SCHEMES[scheme.toLowerCase()]) || void 0;
  	}
  	module.exports = {
  		wsIsSecure,
  		SCHEMES,
  		isValidSchemeName,
  		getSchemeHandler
  	};
  }));
  var require_fast_uri = /* @__PURE__ */ __commonJSMin(((exports, module) => {
  	var { normalizeIPv6, removeDotSegments, recomposeAuthority, normalizePercentEncoding, normalizePathEncoding, serializePathEncoding, normalizeQueryFragmentEncoding, encodeQuery, encodeFragment, reescapeHostDelimiters, isIPv4, nonSimpleDomain } = require_utils();
  	var { SCHEMES, getSchemeHandler } = require_schemes();
  	var VALID_SCHEME = /^[A-Za-z][A-Za-z0-9+.-]*$/u;
  	var MALFORMED_SCHEME_ERROR = "URI scheme is malformed.";
  	/**
  	* @param {string} scheme
  	* @returns {string}
  	*/
  	function decodeValidScheme(scheme) {
  		const decodedScheme = unescape(String(scheme));
  		if (!VALID_SCHEME.test(decodedScheme)) throw new TypeError(MALFORMED_SCHEME_ERROR);
  		return decodedScheme;
  	}
  	/**
  	* @template {import('./types/index').URIComponent|string} T
  	* @param {T} uri
  	* @param {import('./types/index').Options} [options]
  	* @returns {T}
  	*/
  	function normalize(uri, options) {
  		if (typeof uri === "string") uri = normalizeString(uri, options);
  		else if (typeof uri === "object") uri = parse(serialize(uri, options), options);
  		return uri;
  	}
  	/**
  	* @param {string} baseURI
  	* @param {string} relativeURI
  	* @param {import('./types/index').Options} [options]
  	* @returns {string}
  	*/
  	function resolve(baseURI, relativeURI, options) {
  		const schemelessOptions = options ? Object.assign({ scheme: "null" }, options) : { scheme: "null" };
  		const { parsed: baseParsed, malformedAuthorityOrPort: baseMalformed, malformedPercentEncoding: baseMalformedPercentEncoding, malformedSchemeSpecific: baseMalformedSchemeSpecific, malformedHost: baseMalformedHost, malformedScheme: baseMalformedScheme } = parseWithStatus(baseURI, schemelessOptions);
  		const { parsed: relativeParsed, malformedAuthorityOrPort: relativeMalformed, malformedPercentEncoding: relativeMalformedPercentEncoding, malformedSchemeSpecific: relativeMalformedSchemeSpecific, malformedHost: relativeMalformedHost, malformedScheme: relativeMalformedScheme } = parseWithStatus(relativeURI, schemelessOptions);
  		if (baseMalformed || relativeMalformed || baseMalformedPercentEncoding || relativeMalformedPercentEncoding || baseMalformedSchemeSpecific || relativeMalformedSchemeSpecific || baseMalformedHost || relativeMalformedHost || baseMalformedScheme || relativeMalformedScheme) throw new Error(baseParsed.error || relativeParsed.error || "URI is malformed.");
  		const resolved = resolveComponent(baseParsed, relativeParsed, schemelessOptions, true);
  		const resolvedSchemeHandler = getSchemeHandler(options && options.scheme || resolved.scheme);
  		const resolvedHost = resolved.host;
  		const resolvedHostIsIP = resolvedHost !== void 0 && resolvedHost !== "" && (isIPv4(resolvedHost) || normalizeIPv6(resolvedHost).isIPV6);
  		canonicalizeHost(resolved, options || {}, resolvedSchemeHandler, resolvedHostIsIP);
  		const encodedASCIIHost = resolvedHost && resolvedHost.indexOf("%") !== -1 && !/\P{ASCII}/u.test(resolvedHost);
  		if (resolved.error && !encodedASCIIHost) throw new Error(resolved.error);
  		schemelessOptions.skipEscape = true;
  		return serialize(resolved, schemelessOptions);
  	}
  	/**
  	* @param {import ('./types/index').URIComponent} base
  	* @param {import ('./types/index').URIComponent} relative
  	* @param {import('./types/index').Options} [options]
  	* @param {boolean} [skipNormalization=false]
  	* @returns {import ('./types/index').URIComponent}
  	*/
  	function resolveComponent(base, relative, options, skipNormalization) {
  		/** @type {import('./types/index').URIComponent} */
  		const target = {};
  		if (!skipNormalization) {
  			base = parse(serialize(base, options), options);
  			relative = parse(serialize(relative, options), options);
  		}
  		options = options || {};
  		if (!options.tolerant && relative.scheme) {
  			target.scheme = relative.scheme;
  			target.userinfo = relative.userinfo;
  			target.host = relative.host;
  			target.port = relative.port;
  			target.path = removeDotSegments(relative.path || "");
  			target.query = relative.query;
  		} else {
  			if (relative.userinfo !== void 0 || relative.host !== void 0 || relative.port !== void 0) {
  				target.userinfo = relative.userinfo;
  				target.host = relative.host;
  				target.port = relative.port;
  				target.path = removeDotSegments(relative.path || "");
  				target.query = relative.query;
  			} else {
  				if (!relative.path) {
  					target.path = base.path;
  					if (relative.query !== void 0) target.query = relative.query;
  					else target.query = base.query;
  				} else {
  					if (relative.path[0] === "/") target.path = removeDotSegments(relative.path);
  					else {
  						if ((base.userinfo !== void 0 || base.host !== void 0 || base.port !== void 0) && !base.path) target.path = "/" + relative.path;
  						else if (!base.path) target.path = relative.path;
  						else target.path = base.path.slice(0, base.path.lastIndexOf("/") + 1) + relative.path;
  						target.path = removeDotSegments(target.path);
  					}
  					target.query = relative.query;
  				}
  				target.userinfo = base.userinfo;
  				target.host = base.host;
  				target.port = base.port;
  			}
  			target.scheme = base.scheme;
  		}
  		target.fragment = relative.fragment;
  		return target;
  	}
  	/**
  	* @param {import ('./types/index').URIComponent|string} uriA
  	* @param {import ('./types/index').URIComponent|string} uriB
  	* @param {import ('./types/index').Options} options
  	* @returns {boolean}
  	*/
  	function equal(uriA, uriB, options) {
  		const normalizedA = normalizeComparableURI(uriA, options);
  		const normalizedB = normalizeComparableURI(uriB, options);
  		return normalizedA !== void 0 && normalizedB !== void 0 && normalizedA === normalizedB;
  	}
  	/**
  	* @param {Readonly<import('./types/index').URIComponent>} cmpts
  	* @param {import('./types/index').Options} [opts]
  	* @returns {string}
  	*/
  	function serialize(cmpts, opts) {
  		const component = {
  			host: cmpts.host,
  			scheme: cmpts.scheme,
  			userinfo: cmpts.userinfo,
  			port: cmpts.port,
  			path: cmpts.path,
  			query: cmpts.query,
  			nid: cmpts.nid,
  			nss: cmpts.nss,
  			uuid: cmpts.uuid,
  			fragment: cmpts.fragment,
  			reference: cmpts.reference,
  			resourceName: cmpts.resourceName,
  			secure: cmpts.secure,
  			error: ""
  		};
  		const options = Object.assign({}, opts);
  		const uriTokens = [];
  		if (component.scheme) component.scheme = decodeValidScheme(component.scheme);
  		const schemeHandler = getSchemeHandler(options.scheme || component.scheme);
  		if (schemeHandler && schemeHandler.serialize) schemeHandler.serialize(component, options);
  		const hasAuthority = component.userinfo !== void 0 || component.host !== void 0 || component.port !== void 0;
  		const pathNoScheme = !options.skipEscape && component.scheme === void 0 && !hasAuthority;
  		if (component.path !== void 0) {
  			if (!options.skipEscape) component.path = serializePathEncoding(component.path, pathNoScheme);
  			else component.path = normalizePercentEncoding(component.path);
  		}
  		if (options.reference !== "suffix" && component.scheme) {
  			component.scheme = decodeValidScheme(component.scheme);
  			uriTokens.push(component.scheme, ":");
  		}
  		const authority = recomposeAuthority(component);
  		if (authority !== void 0) {
  			if (options.reference !== "suffix") uriTokens.push("//");
  			uriTokens.push(authority);
  			if (component.path && component.path[0] !== "/") uriTokens.push("/");
  		}
  		if (component.path !== void 0) {
  			let s = component.path;
  			if (!options.absolutePath && (!schemeHandler || !schemeHandler.absolutePath)) s = removeDotSegments(s);
  			if (pathNoScheme) s = serializePathEncoding(s, true);
  			if (authority === void 0 && s[0] === "/" && s[1] === "/") s = "/%2F" + s.slice(2);
  			uriTokens.push(s);
  		}
  		if (component.query !== void 0) uriTokens.push("?", encodeQuery(component.query));
  		if (component.fragment !== void 0) uriTokens.push("#", encodeFragment(component.fragment));
  		return uriTokens.join("");
  	}
  	var URI_PARSE = /^(?:([^#/:?]+):)?(?:\/\/((?:([^#/?@]*)@)?(\[[^#/?\]]+\]|[^#/:?]*)(?::(\d*))?))?([^#?]*)(?:\?([^#]*))?(?:#((?:.|[\n\r])*))?/u;
  	var AUTHORITY_PREFIX = /^(?:[^#/:?]+:)?\/\/([^/?#]*)/;
  	var AUTHORITY_INTRODUCER_REGION = /^(?:[^#/:?]+:)?([/\\\t\n\r]*)/;
  	/**
  	* @param {import('./types/index').URIComponent} parsed
  	* @param {RegExpMatchArray} matches
  	* @returns {string|undefined}
  	*/
  	function getParseError(parsed, matches) {
  		if (matches[2] !== void 0 && parsed.path && parsed.path[0] !== "/") return "URI path must start with \"/\" when authority is present.";
  		if (typeof parsed.port === "number" && (parsed.port < 0 || parsed.port > 65535)) return "URI port is malformed.";
  	}
  	/**
  	* Checks percent syntax without decoding the represented octets. RFC 3986
  	* percent-encoding is byte-oriented, so sequences such as `%FF` are valid even
  	* though they are not independently valid UTF-8.
  	*
  	* @param {string|undefined} component
  	* @returns {boolean}
  	*/
  	function hasMalformedPercentEncoding(component) {
  		if (component === void 0) return false;
  		let percent = component.indexOf("%");
  		while (percent !== -1) {
  			if (percent + 2 >= component.length || !/^[\da-f]{2}$/iu.test(component.slice(percent + 1, percent + 3))) return true;
  			percent = component.indexOf("%", percent + 3);
  		}
  		return false;
  	}
  	/**
  	* Whether the host is a bracketed IP literal (RFC 3986 `IP-literal`).
  	* An unterminated `[` is not a literal, so it must still be validated as a
  	* reg-name instead of being waved through as an IP.
  	*
  	* @param {string} host
  	* @returns {boolean}
  	*/
  	function isIPLiteral(host) {
  		return host[0] === "[" && host[host.length - 1] === "]";
  	}
  	/**
  	* @param {RegExpMatchArray} matches
  	* @returns {boolean}
  	*/
  	function hasMalformedComponentPercentEncoding(matches) {
  		const host = matches[4];
  		return hasMalformedPercentEncoding(matches[3]) || host !== void 0 && !isIPLiteral(host) && hasMalformedPercentEncoding(host) || hasMalformedPercentEncoding(matches[6]) || hasMalformedPercentEncoding(matches[7]) || hasMalformedPercentEncoding(matches[8]);
  	}
  	/**
  	* @param {import('./types/index').URIComponent} parsed
  	* @param {import('./types/index').Options} options
  	* @param {{ domainHost?: boolean, unicodeSupport?: boolean }|undefined} schemeHandler
  	* @param {boolean} isIP
  	* @returns {boolean} whether host conversion failed
  	*/
  	function canonicalizeHost(parsed, options, schemeHandler, isIP) {
  		if (!options.unicodeSupport && (!schemeHandler || !schemeHandler.unicodeSupport) && parsed.host && !isIPLiteral(parsed.host) && (options.domainHost || schemeHandler && schemeHandler.domainHost) && isIP === false && nonSimpleDomain(parsed.host)) try {
  			parsed.host = new URL("http://" + parsed.host).hostname;
  		} catch (e) {
  			parsed.error = parsed.error || "Host's domain name can not be converted to ASCII: " + e;
  			return true;
  		}
  		return false;
  	}
  	/**
  	* @param {string} uri
  	* @param {import('./types/index').Options} [opts]
  	* @returns {{ parsed: import('./types/index').URIComponent, malformedAuthorityOrPort: boolean, malformedPercentEncoding: boolean, malformedSchemeSpecific: boolean, malformedHost: boolean, malformedScheme: boolean }}
  	*/
  	function parseWithStatus(uri, opts) {
  		const options = Object.assign({}, opts);
  		/** @type {import('./types/index').URIComponent} */
  		const parsed = {
  			scheme: void 0,
  			userinfo: void 0,
  			host: "",
  			port: void 0,
  			path: "",
  			query: void 0,
  			fragment: void 0
  		};
  		let malformedAuthorityOrPort = false;
  		let malformedPercentEncoding = false;
  		let malformedSchemeSpecific = false;
  		let malformedHost = false;
  		let malformedIPLiteral = false;
  		let malformedScheme = false;
  		let isIP = false;
  		if (options.reference === "suffix") {
  			if (options.scheme) uri = options.scheme + ":" + uri;
  			else uri = "//" + uri;
  		}
  		const authorityMatch = uri.match(AUTHORITY_PREFIX);
  		if (authorityMatch !== null && authorityMatch[1].indexOf("\\") !== -1) {
  			parsed.error = "URI authority must not contain a literal backslash.";
  			malformedAuthorityOrPort = true;
  		}
  		const introducerMatch = uri.match(AUTHORITY_INTRODUCER_REGION);
  		if (introducerMatch !== null) {
  			const region = introducerMatch[1];
  			const normalizedRegion = region.replace(/[\t\n\r]/g, "");
  			if (normalizedRegion.length >= 2) {
  				if (normalizedRegion.slice(0, 2) !== "//") {
  					parsed.error = parsed.error || "URI authority must not contain a literal backslash.";
  					malformedAuthorityOrPort = true;
  				} else if (region.length !== normalizedRegion.length) {
  					parsed.error = parsed.error || "URI authority introducer must not contain whitespace.";
  					malformedAuthorityOrPort = true;
  				}
  			}
  		}
  		const matches = uri.match(URI_PARSE);
  		if (matches) {
  			parsed.scheme = matches[1];
  			parsed.userinfo = matches[3];
  			parsed.host = matches[4];
  			parsed.port = parseInt(matches[5], 10);
  			parsed.path = matches[6] || "";
  			parsed.query = matches[7];
  			parsed.fragment = matches[8];
  			if (parsed.scheme !== void 0) {
  				const decodedScheme = unescape(parsed.scheme);
  				if (VALID_SCHEME.test(decodedScheme)) parsed.scheme = decodedScheme.toLowerCase();
  				else {
  					parsed.error = parsed.error || MALFORMED_SCHEME_ERROR;
  					malformedScheme = true;
  				}
  			}
  			malformedPercentEncoding = hasMalformedComponentPercentEncoding(matches);
  			if (malformedPercentEncoding) parsed.error = parsed.error || "URI contains malformed percent-encoding.";
  			if (isNaN(parsed.port)) parsed.port = matches[5];
  			const parseError = getParseError(parsed, matches);
  			if (parseError !== void 0) {
  				parsed.error = parsed.error || parseError;
  				malformedAuthorityOrPort = true;
  			}
  			if (parsed.host) {
  				if (isIPv4(parsed.host) === false) {
  					const bracketedIPLiteral = isIPLiteral(parsed.host);
  					const hasIPLiteralBracket = parsed.host.indexOf("[") !== -1 || parsed.host.indexOf("]") !== -1;
  					const ipv6result = normalizeIPv6(parsed.host);
  					isIP = ipv6result.isIPV6 || ipv6result.isIPVFuture === true;
  					malformedIPLiteral = hasIPLiteralBracket && (!bracketedIPLiteral || ipv6result.error === true);
  					parsed.host = isIP ? ipv6result.host : ipv6result.host.toLowerCase();
  					if (malformedIPLiteral) {
  						parsed.error = parsed.error || "URI host is malformed.";
  						malformedAuthorityOrPort = true;
  					}
  				} else isIP = true;
  			}
  			if (parsed.scheme === void 0 && parsed.userinfo === void 0 && parsed.host === void 0 && parsed.port === void 0 && parsed.query === void 0 && !parsed.path) parsed.reference = "same-document";
  			else if (parsed.scheme === void 0) parsed.reference = "relative";
  			else if (parsed.fragment === void 0) parsed.reference = "absolute";
  			else parsed.reference = "uri";
  			if (options.reference && options.reference !== "suffix" && options.reference !== parsed.reference) parsed.error = parsed.error || "URI is not a " + options.reference + " reference.";
  			const schemeHandler = getSchemeHandler(options.scheme || parsed.scheme);
  			if (!malformedIPLiteral) malformedHost = canonicalizeHost(parsed, options, schemeHandler, isIP);
  			if (uri.indexOf("%") !== -1 && parsed.host !== void 0 && !malformedIPLiteral) {
  				let host = isIP ? parsed.host : normalizePercentEncoding(parsed.host, true);
  				if (!isIP) host = normalizePercentEncoding(host.toLowerCase());
  				parsed.host = reescapeHostDelimiters(host, isIP);
  			}
  			if (!schemeHandler || schemeHandler && !schemeHandler.skipNormalize) {
  				if (parsed.path) parsed.path = normalizePathEncoding(parsed.path);
  				if (parsed.query) parsed.query = normalizeQueryFragmentEncoding(parsed.query);
  				if (parsed.fragment) parsed.fragment = normalizeQueryFragmentEncoding(parsed.fragment);
  			}
  			if (schemeHandler && schemeHandler.parse) {
  				schemeHandler.parse(parsed, options);
  				if (schemeHandler === SCHEMES.urn && parsed.nid === void 0) malformedSchemeSpecific = true;
  			}
  		} else parsed.error = parsed.error || "URI can not be parsed.";
  		return {
  			parsed,
  			malformedAuthorityOrPort,
  			malformedPercentEncoding,
  			malformedSchemeSpecific,
  			malformedHost,
  			malformedScheme
  		};
  	}
  	/**
  	* @param {string} uri
  	* @param {import('./types/index').Options} [opts]
  	* @returns
  	*/
  	function parse(uri, opts) {
  		return parseWithStatus(uri, opts).parsed;
  	}
  	/**
  	* @param {string} uri
  	* @param {import('./types/index').Options} [opts]
  	* @returns {string}
  	*/
  	function normalizeString(uri, opts) {
  		return normalizeStringWithStatus(uri, opts).normalized;
  	}
  	/**
  	* @param {string} uri
  	* @param {import('./types/index').Options} [opts]
  	* @returns {{ normalized: string, malformedAuthorityOrPort: boolean, malformedPercentEncoding: boolean, malformedSchemeSpecific: boolean, malformedHost: boolean, malformedScheme: boolean }}
  	*/
  	function normalizeStringWithStatus(uri, opts) {
  		const { parsed, malformedAuthorityOrPort, malformedPercentEncoding, malformedSchemeSpecific, malformedHost, malformedScheme } = parseWithStatus(uri, opts);
  		return {
  			normalized: malformedAuthorityOrPort || malformedPercentEncoding || malformedSchemeSpecific || malformedHost || malformedScheme ? uri : serialize(parsed, opts),
  			malformedAuthorityOrPort,
  			malformedPercentEncoding,
  			malformedSchemeSpecific,
  			malformedHost,
  			malformedScheme
  		};
  	}
  	/**
  	* @param {import ('./types/index').URIComponent|string} uri
  	* @param {import('./types/index').Options} [opts]
  	* @returns {string|undefined}
  	*/
  	function normalizeComparableURI(uri, opts) {
  		if (typeof uri !== "string" && typeof uri !== "object") return;
  		let value;
  		try {
  			value = typeof uri === "string" ? uri : serialize(uri, opts);
  		} catch {
  			return;
  		}
  		const { normalized, malformedAuthorityOrPort, malformedPercentEncoding, malformedSchemeSpecific, malformedHost, malformedScheme } = normalizeStringWithStatus(value, opts);
  		return malformedAuthorityOrPort || malformedPercentEncoding || malformedSchemeSpecific || malformedHost || malformedScheme ? void 0 : normalized;
  	}
  	var fastUri = {
  		SCHEMES,
  		normalize,
  		resolve,
  		resolveComponent,
  		equal,
  		serialize,
  		parse
  	};
  	module.exports = fastUri;
  	module.exports.default = fastUri;
  	module.exports.fastUri = fastUri;
  }));
  var require_uri = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var uri = require_fast_uri();
  	uri.code = "require(\"ajv/dist/runtime/uri\").default";
  	exports.default = uri;
  }));
  var require_core$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.CodeGen = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.KeywordCxt = void 0;
  	var validate_1 = require_validate();
  	Object.defineProperty(exports, "KeywordCxt", {
  		enumerable: true,
  		get: function() {
  			return validate_1.KeywordCxt;
  		}
  	});
  	var codegen_1 = require_codegen();
  	Object.defineProperty(exports, "_", {
  		enumerable: true,
  		get: function() {
  			return codegen_1._;
  		}
  	});
  	Object.defineProperty(exports, "str", {
  		enumerable: true,
  		get: function() {
  			return codegen_1.str;
  		}
  	});
  	Object.defineProperty(exports, "stringify", {
  		enumerable: true,
  		get: function() {
  			return codegen_1.stringify;
  		}
  	});
  	Object.defineProperty(exports, "nil", {
  		enumerable: true,
  		get: function() {
  			return codegen_1.nil;
  		}
  	});
  	Object.defineProperty(exports, "Name", {
  		enumerable: true,
  		get: function() {
  			return codegen_1.Name;
  		}
  	});
  	Object.defineProperty(exports, "CodeGen", {
  		enumerable: true,
  		get: function() {
  			return codegen_1.CodeGen;
  		}
  	});
  	var validation_error_1 = require_validation_error();
  	var ref_error_1 = require_ref_error();
  	var rules_1 = require_rules();
  	var compile_1 = require_compile();
  	var codegen_2 = require_codegen();
  	var resolve_1 = require_resolve();
  	var dataType_1 = require_dataType();
  	var util_1 = require_util();
  	var $dataRefSchema = (init_data(), __toCommonJS(data_exports).default);
  	var uri_1 = require_uri();
  	var defaultRegExp = (str, flags) => new RegExp(str, flags);
  	defaultRegExp.code = "new RegExp";
  	var META_IGNORE_OPTIONS = [
  		"removeAdditional",
  		"useDefaults",
  		"coerceTypes"
  	];
  	var EXT_SCOPE_NAMES = /* @__PURE__ */ new Set([
  		"validate",
  		"serialize",
  		"parse",
  		"wrapper",
  		"root",
  		"schema",
  		"keyword",
  		"pattern",
  		"formats",
  		"validate$data",
  		"func",
  		"obj",
  		"Error"
  	]);
  	var removedOptions = {
  		errorDataPath: "",
  		format: "`validateFormats: false` can be used instead.",
  		nullable: "\"nullable\" keyword is supported by default.",
  		jsonPointers: "Deprecated jsPropertySyntax can be used instead.",
  		extendRefs: "Deprecated ignoreKeywordsWithRef can be used instead.",
  		missingRefs: "Pass empty schema with $id that should be ignored to ajv.addSchema.",
  		processCode: "Use option `code: {process: (code, schemaEnv: object) => string}`",
  		sourceCode: "Use option `code: {source: true}`",
  		strictDefaults: "It is default now, see option `strict`.",
  		strictKeywords: "It is default now, see option `strict`.",
  		uniqueItems: "\"uniqueItems\" keyword is always validated.",
  		unknownFormats: "Disable strict mode or pass `true` to `ajv.addFormat` (or `formats` option).",
  		cache: "Map is used as cache, schema object as key.",
  		serialize: "Map is used as cache, schema object as key.",
  		ajvErrors: "It is default now."
  	};
  	var deprecatedOptions = {
  		ignoreKeywordsWithRef: "",
  		jsPropertySyntax: "",
  		unicode: "\"minLength\"/\"maxLength\" account for unicode characters by default."
  	};
  	var MAX_EXPRESSION = 200;
  	function requiredOptions(o) {
  		var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0;
  		const s = o.strict;
  		const _optz = (_a = o.code) === null || _a === void 0 ? void 0 : _a.optimize;
  		const optimize = _optz === true || _optz === void 0 ? 1 : _optz || 0;
  		const regExp = (_c = (_b = o.code) === null || _b === void 0 ? void 0 : _b.regExp) !== null && _c !== void 0 ? _c : defaultRegExp;
  		const uriResolver = (_d = o.uriResolver) !== null && _d !== void 0 ? _d : uri_1.default;
  		return {
  			strictSchema: (_f = (_e = o.strictSchema) !== null && _e !== void 0 ? _e : s) !== null && _f !== void 0 ? _f : true,
  			strictNumbers: (_h = (_g = o.strictNumbers) !== null && _g !== void 0 ? _g : s) !== null && _h !== void 0 ? _h : true,
  			strictTypes: (_k = (_j = o.strictTypes) !== null && _j !== void 0 ? _j : s) !== null && _k !== void 0 ? _k : "log",
  			strictTuples: (_m = (_l = o.strictTuples) !== null && _l !== void 0 ? _l : s) !== null && _m !== void 0 ? _m : "log",
  			strictRequired: (_p = (_o = o.strictRequired) !== null && _o !== void 0 ? _o : s) !== null && _p !== void 0 ? _p : false,
  			code: o.code ? {
  				...o.code,
  				optimize,
  				regExp
  			} : {
  				optimize,
  				regExp
  			},
  			loopRequired: (_q = o.loopRequired) !== null && _q !== void 0 ? _q : MAX_EXPRESSION,
  			loopEnum: (_r = o.loopEnum) !== null && _r !== void 0 ? _r : MAX_EXPRESSION,
  			meta: (_s = o.meta) !== null && _s !== void 0 ? _s : true,
  			messages: (_t = o.messages) !== null && _t !== void 0 ? _t : true,
  			inlineRefs: (_u = o.inlineRefs) !== null && _u !== void 0 ? _u : true,
  			schemaId: (_v = o.schemaId) !== null && _v !== void 0 ? _v : "$id",
  			addUsedSchema: (_w = o.addUsedSchema) !== null && _w !== void 0 ? _w : true,
  			validateSchema: (_x = o.validateSchema) !== null && _x !== void 0 ? _x : true,
  			validateFormats: (_y = o.validateFormats) !== null && _y !== void 0 ? _y : true,
  			unicodeRegExp: (_z = o.unicodeRegExp) !== null && _z !== void 0 ? _z : true,
  			int32range: (_0 = o.int32range) !== null && _0 !== void 0 ? _0 : true,
  			uriResolver
  		};
  	}
  	var Ajv = class {
  		constructor(opts = {}) {
  			this.schemas = {};
  			this.refs = {};
  			this.formats = Object.create(null);
  			this._compilations = /* @__PURE__ */ new Set();
  			this._loading = {};
  			this._cache = /* @__PURE__ */ new Map();
  			opts = this.opts = {
  				...opts,
  				...requiredOptions(opts)
  			};
  			const { es5, lines } = this.opts.code;
  			this.scope = new codegen_2.ValueScope({
  				scope: {},
  				prefixes: EXT_SCOPE_NAMES,
  				es5,
  				lines
  			});
  			this.logger = getLogger(opts.logger);
  			const formatOpt = opts.validateFormats;
  			opts.validateFormats = false;
  			this.RULES = (0, rules_1.getRules)();
  			checkOptions.call(this, removedOptions, opts, "NOT SUPPORTED");
  			checkOptions.call(this, deprecatedOptions, opts, "DEPRECATED", "warn");
  			this._metaOpts = getMetaSchemaOptions.call(this);
  			if (opts.formats) addInitialFormats.call(this);
  			this._addVocabularies();
  			this._addDefaultMetaSchema();
  			if (opts.keywords) addInitialKeywords.call(this, opts.keywords);
  			if (typeof opts.meta == "object") this.addMetaSchema(opts.meta);
  			addInitialSchemas.call(this);
  			opts.validateFormats = formatOpt;
  		}
  		_addVocabularies() {
  			this.addKeyword("$async");
  		}
  		_addDefaultMetaSchema() {
  			const { $data, meta, schemaId } = this.opts;
  			let _dataRefSchema = $dataRefSchema;
  			if (schemaId === "id") {
  				_dataRefSchema = { ...$dataRefSchema };
  				_dataRefSchema.id = _dataRefSchema.$id;
  				delete _dataRefSchema.$id;
  			}
  			if (meta && $data) this.addMetaSchema(_dataRefSchema, _dataRefSchema[schemaId], false);
  		}
  		defaultMeta() {
  			const { meta, schemaId } = this.opts;
  			return this.opts.defaultMeta = typeof meta == "object" ? meta[schemaId] || meta : void 0;
  		}
  		validate(schemaKeyRef, data) {
  			let v;
  			if (typeof schemaKeyRef == "string") {
  				v = this.getSchema(schemaKeyRef);
  				if (!v) throw new Error(`no schema with key or ref "${schemaKeyRef}"`);
  			} else v = this.compile(schemaKeyRef);
  			const valid = v(data);
  			if (!("$async" in v)) this.errors = v.errors;
  			return valid;
  		}
  		compile(schema, _meta) {
  			const sch = this._addSchema(schema, _meta);
  			return sch.validate || this._compileSchemaEnv(sch);
  		}
  		compileAsync(schema, meta) {
  			if (typeof this.opts.loadSchema != "function") throw new Error("options.loadSchema should be a function");
  			const { loadSchema } = this.opts;
  			return runCompileAsync.call(this, schema, meta);
  			async function runCompileAsync(_schema, _meta) {
  				await loadMetaSchema.call(this, _schema.$schema);
  				const sch = this._addSchema(_schema, _meta);
  				return sch.validate || _compileAsync.call(this, sch);
  			}
  			async function loadMetaSchema($ref) {
  				if ($ref && !this.getSchema($ref)) await runCompileAsync.call(this, { $ref }, true);
  			}
  			async function _compileAsync(sch) {
  				try {
  					return this._compileSchemaEnv(sch);
  				} catch (e) {
  					if (!(e instanceof ref_error_1.default)) throw e;
  					checkLoaded.call(this, e);
  					await loadMissingSchema.call(this, e.missingSchema);
  					return _compileAsync.call(this, sch);
  				}
  			}
  			function checkLoaded({ missingSchema: ref, missingRef }) {
  				if (this.refs[ref]) throw new Error(`AnySchema ${ref} is loaded but ${missingRef} cannot be resolved`);
  			}
  			async function loadMissingSchema(ref) {
  				const _schema = await _loadSchema.call(this, ref);
  				if (!this.refs[ref]) await loadMetaSchema.call(this, _schema.$schema);
  				if (!this.refs[ref]) this.addSchema(_schema, ref, meta);
  			}
  			async function _loadSchema(ref) {
  				const p = this._loading[ref];
  				if (p) return p;
  				try {
  					return await (this._loading[ref] = loadSchema(ref));
  				} finally {
  					delete this._loading[ref];
  				}
  			}
  		}
  		addSchema(schema, key, _meta, _validateSchema = this.opts.validateSchema) {
  			if (Array.isArray(schema)) {
  				for (const sch of schema) this.addSchema(sch, void 0, _meta, _validateSchema);
  				return this;
  			}
  			let id;
  			if (typeof schema === "object") {
  				const { schemaId } = this.opts;
  				id = schema[schemaId];
  				if (id !== void 0 && typeof id != "string") throw new Error(`schema ${schemaId} must be string`);
  			}
  			key = (0, resolve_1.normalizeId)(key || id);
  			this._checkUnique(key);
  			this.schemas[key] = this._addSchema(schema, _meta, key, _validateSchema, true);
  			return this;
  		}
  		addMetaSchema(schema, key, _validateSchema = this.opts.validateSchema) {
  			this.addSchema(schema, key, true, _validateSchema);
  			return this;
  		}
  		validateSchema(schema, throwOrLogError) {
  			if (typeof schema == "boolean") return true;
  			let $schema;
  			$schema = schema.$schema;
  			if ($schema !== void 0 && typeof $schema != "string") throw new Error("$schema must be a string");
  			$schema = $schema || this.opts.defaultMeta || this.defaultMeta();
  			if (!$schema) {
  				this.logger.warn("meta-schema not available");
  				this.errors = null;
  				return true;
  			}
  			const valid = this.validate($schema, schema);
  			if (!valid && throwOrLogError) {
  				const message = "schema is invalid: " + this.errorsText();
  				if (this.opts.validateSchema === "log") this.logger.error(message);
  				else throw new Error(message);
  			}
  			return valid;
  		}
  		getSchema(keyRef) {
  			let sch;
  			while (typeof (sch = getSchEnv.call(this, keyRef)) == "string") keyRef = sch;
  			if (sch === void 0) {
  				const { schemaId } = this.opts;
  				const root = new compile_1.SchemaEnv({
  					schema: {},
  					schemaId
  				});
  				sch = compile_1.resolveSchema.call(this, root, keyRef);
  				if (!sch) return;
  				this.refs[keyRef] = sch;
  			}
  			return sch.validate || this._compileSchemaEnv(sch);
  		}
  		removeSchema(schemaKeyRef) {
  			if (schemaKeyRef instanceof RegExp) {
  				this._removeAllSchemas(this.schemas, schemaKeyRef);
  				this._removeAllSchemas(this.refs, schemaKeyRef);
  				return this;
  			}
  			switch (typeof schemaKeyRef) {
  				case "undefined":
  					this._removeAllSchemas(this.schemas);
  					this._removeAllSchemas(this.refs);
  					this._cache.clear();
  					return this;
  				case "string": {
  					const sch = getSchEnv.call(this, schemaKeyRef);
  					if (typeof sch == "object") this._cache.delete(sch.schema);
  					delete this.schemas[schemaKeyRef];
  					delete this.refs[schemaKeyRef];
  					return this;
  				}
  				case "object": {
  					const cacheKey = schemaKeyRef;
  					this._cache.delete(cacheKey);
  					let id = schemaKeyRef[this.opts.schemaId];
  					if (id) {
  						id = (0, resolve_1.normalizeId)(id);
  						delete this.schemas[id];
  						delete this.refs[id];
  					}
  					return this;
  				}
  				default: throw new Error("ajv.removeSchema: invalid parameter");
  			}
  		}
  		addVocabulary(definitions) {
  			for (const def of definitions) this.addKeyword(def);
  			return this;
  		}
  		addKeyword(kwdOrDef, def) {
  			let keyword;
  			if (typeof kwdOrDef == "string") {
  				keyword = kwdOrDef;
  				if (typeof def == "object") {
  					this.logger.warn("these parameters are deprecated, see docs for addKeyword");
  					def.keyword = keyword;
  				}
  			} else if (typeof kwdOrDef == "object" && def === void 0) {
  				def = kwdOrDef;
  				keyword = def.keyword;
  				if (Array.isArray(keyword) && !keyword.length) throw new Error("addKeywords: keyword must be string or non-empty array");
  			} else throw new Error("invalid addKeywords parameters");
  			checkKeyword.call(this, keyword, def);
  			if (!def) {
  				(0, util_1.eachItem)(keyword, (kwd) => addRule.call(this, kwd));
  				return this;
  			}
  			keywordMetaschema.call(this, def);
  			const definition = {
  				...def,
  				type: (0, dataType_1.getJSONTypes)(def.type),
  				schemaType: (0, dataType_1.getJSONTypes)(def.schemaType)
  			};
  			(0, util_1.eachItem)(keyword, definition.type.length === 0 ? (k) => addRule.call(this, k, definition) : (k) => definition.type.forEach((t) => addRule.call(this, k, definition, t)));
  			return this;
  		}
  		getKeyword(keyword) {
  			const rule = this.RULES.all[keyword];
  			return typeof rule == "object" ? rule.definition : !!rule;
  		}
  		removeKeyword(keyword) {
  			const { RULES } = this;
  			delete RULES.keywords[keyword];
  			delete RULES.all[keyword];
  			for (const group of RULES.rules) {
  				const i = group.rules.findIndex((rule) => rule.keyword === keyword);
  				if (i >= 0) group.rules.splice(i, 1);
  			}
  			return this;
  		}
  		addFormat(name, format) {
  			if (typeof format == "string") format = new RegExp(format);
  			this.formats[name] = format;
  			return this;
  		}
  		errorsText(errors = this.errors, { separator = ", ", dataVar = "data" } = {}) {
  			if (!errors || errors.length === 0) return "No errors";
  			return errors.map((e) => `${dataVar}${e.instancePath} ${e.message}`).reduce((text, msg) => text + separator + msg);
  		}
  		$dataMetaSchema(metaSchema, keywordsJsonPointers) {
  			const rules = this.RULES.all;
  			metaSchema = JSON.parse(JSON.stringify(metaSchema));
  			for (const jsonPointer of keywordsJsonPointers) {
  				const segments = jsonPointer.split("/").slice(1);
  				let keywords = metaSchema;
  				for (const seg of segments) keywords = keywords[seg];
  				for (const key in rules) {
  					const rule = rules[key];
  					if (typeof rule != "object") continue;
  					const { $data } = rule.definition;
  					const schema = keywords[key];
  					if ($data && schema) keywords[key] = schemaOrData(schema);
  				}
  			}
  			return metaSchema;
  		}
  		_removeAllSchemas(schemas, regex) {
  			for (const keyRef in schemas) {
  				const sch = schemas[keyRef];
  				if (!regex || regex.test(keyRef)) {
  					if (typeof sch == "string") delete schemas[keyRef];
  					else if (sch && !sch.meta) {
  						this._cache.delete(sch.schema);
  						delete schemas[keyRef];
  					}
  				}
  			}
  		}
  		_addSchema(schema, meta, baseId, validateSchema = this.opts.validateSchema, addSchema = this.opts.addUsedSchema) {
  			let id;
  			const { schemaId } = this.opts;
  			if (typeof schema == "object") id = schema[schemaId];
  			else if (this.opts.jtd) throw new Error("schema must be object");
  			else if (typeof schema != "boolean") throw new Error("schema must be object or boolean");
  			let sch = this._cache.get(schema);
  			if (sch !== void 0) return sch;
  			baseId = (0, resolve_1.normalizeId)(id || baseId);
  			const localRefs = resolve_1.getSchemaRefs.call(this, schema, baseId);
  			sch = new compile_1.SchemaEnv({
  				schema,
  				schemaId,
  				meta,
  				baseId,
  				localRefs
  			});
  			this._cache.set(sch.schema, sch);
  			if (addSchema && !baseId.startsWith("#")) {
  				if (baseId) this._checkUnique(baseId);
  				this.refs[baseId] = sch;
  			}
  			if (validateSchema) this.validateSchema(schema, true);
  			return sch;
  		}
  		_checkUnique(id) {
  			if (this.schemas[id] || this.refs[id]) throw new Error(`schema with key or id "${id}" already exists`);
  		}
  		_compileSchemaEnv(sch) {
  			if (sch.meta) this._compileMetaSchema(sch);
  			else compile_1.compileSchema.call(this, sch);
  			/* istanbul ignore if */
  			if (!sch.validate) throw new Error("ajv implementation error");
  			return sch.validate;
  		}
  		_compileMetaSchema(sch) {
  			const currentOpts = this.opts;
  			this.opts = this._metaOpts;
  			try {
  				compile_1.compileSchema.call(this, sch);
  			} finally {
  				this.opts = currentOpts;
  			}
  		}
  	};
  	Ajv.ValidationError = validation_error_1.default;
  	Ajv.MissingRefError = ref_error_1.default;
  	exports.default = Ajv;
  	function checkOptions(checkOpts, options, msg, log = "error") {
  		for (const key in checkOpts) {
  			const opt = key;
  			if (opt in options) this.logger[log](`${msg}: option ${key}. ${checkOpts[opt]}`);
  		}
  	}
  	function getSchEnv(keyRef) {
  		keyRef = (0, resolve_1.normalizeId)(keyRef);
  		return this.schemas[keyRef] || this.refs[keyRef];
  	}
  	function addInitialSchemas() {
  		const optsSchemas = this.opts.schemas;
  		if (!optsSchemas) return;
  		if (Array.isArray(optsSchemas)) this.addSchema(optsSchemas);
  		else for (const key in optsSchemas) this.addSchema(optsSchemas[key], key);
  	}
  	function addInitialFormats() {
  		for (const name in this.opts.formats) {
  			const format = this.opts.formats[name];
  			if (format) this.addFormat(name, format);
  		}
  	}
  	function addInitialKeywords(defs) {
  		if (Array.isArray(defs)) {
  			this.addVocabulary(defs);
  			return;
  		}
  		this.logger.warn("keywords option as map is deprecated, pass array");
  		for (const keyword in defs) {
  			const def = defs[keyword];
  			if (!def.keyword) def.keyword = keyword;
  			this.addKeyword(def);
  		}
  	}
  	function getMetaSchemaOptions() {
  		const metaOpts = { ...this.opts };
  		for (const opt of META_IGNORE_OPTIONS) delete metaOpts[opt];
  		return metaOpts;
  	}
  	var noLogs = {
  		log() {},
  		warn() {},
  		error() {}
  	};
  	function getLogger(logger) {
  		if (logger === false) return noLogs;
  		if (logger === void 0) return console;
  		if (logger.log && logger.warn && logger.error) return logger;
  		throw new Error("logger must implement log, warn and error methods");
  	}
  	var KEYWORD_NAME = /^[a-z_$][a-z0-9_$:-]*$/i;
  	function checkKeyword(keyword, def) {
  		const { RULES } = this;
  		(0, util_1.eachItem)(keyword, (kwd) => {
  			if (RULES.keywords[kwd]) throw new Error(`Keyword ${kwd} is already defined`);
  			if (!KEYWORD_NAME.test(kwd)) throw new Error(`Keyword ${kwd} has invalid name`);
  		});
  		if (!def) return;
  		if (def.$data && !("code" in def || "validate" in def)) throw new Error("$data keyword must have \"code\" or \"validate\" function");
  	}
  	function addRule(keyword, definition, dataType) {
  		var _a;
  		const post = definition === null || definition === void 0 ? void 0 : definition.post;
  		if (dataType && post) throw new Error("keyword with \"post\" flag cannot have \"type\"");
  		const { RULES } = this;
  		let ruleGroup = post ? RULES.post : RULES.rules.find(({ type: t }) => t === dataType);
  		if (!ruleGroup) {
  			ruleGroup = {
  				type: dataType,
  				rules: []
  			};
  			RULES.rules.push(ruleGroup);
  		}
  		RULES.keywords[keyword] = true;
  		if (!definition) return;
  		const rule = {
  			keyword,
  			definition: {
  				...definition,
  				type: (0, dataType_1.getJSONTypes)(definition.type),
  				schemaType: (0, dataType_1.getJSONTypes)(definition.schemaType)
  			}
  		};
  		if (definition.before) addBeforeRule.call(this, ruleGroup, rule, definition.before);
  		else ruleGroup.rules.push(rule);
  		RULES.all[keyword] = rule;
  		(_a = definition.implements) === null || _a === void 0 || _a.forEach((kwd) => this.addKeyword(kwd));
  	}
  	function addBeforeRule(ruleGroup, rule, before) {
  		const i = ruleGroup.rules.findIndex((_rule) => _rule.keyword === before);
  		if (i >= 0) ruleGroup.rules.splice(i, 0, rule);
  		else {
  			ruleGroup.rules.push(rule);
  			this.logger.warn(`rule ${before} is not defined`);
  		}
  	}
  	function keywordMetaschema(def) {
  		let { metaSchema } = def;
  		if (metaSchema === void 0) return;
  		if (def.$data && this.opts.$data) metaSchema = schemaOrData(metaSchema);
  		def.validateSchema = this.compile(metaSchema, true);
  	}
  	var $dataRef = { $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#" };
  	function schemaOrData(schema) {
  		return { anyOf: [schema, $dataRef] };
  	}
  }));
  var require_id = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.default = {
  		keyword: "id",
  		code() {
  			throw new Error("NOT SUPPORTED: keyword \"id\", use \"$id\" for schema ID");
  		}
  	};
  }));
  var require_ref = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.callRef = exports.getValidate = void 0;
  	var ref_error_1 = require_ref_error();
  	var code_1 = require_code();
  	var codegen_1 = require_codegen();
  	var names_1 = require_names();
  	var compile_1 = require_compile();
  	var util_1 = require_util();
  	var def = {
  		keyword: "$ref",
  		schemaType: "string",
  		code(cxt) {
  			const { gen, schema: $ref, it } = cxt;
  			const { baseId, schemaEnv: env, validateName, opts, self } = it;
  			const { root } = env;
  			if (($ref === "#" || $ref === "#/") && baseId === root.baseId) return callRootRef();
  			const schOrEnv = compile_1.resolveRef.call(self, root, baseId, $ref);
  			if (schOrEnv === void 0) throw new ref_error_1.default(it.opts.uriResolver, baseId, $ref);
  			if (schOrEnv instanceof compile_1.SchemaEnv) return callValidate(schOrEnv);
  			return inlineRefSchema(schOrEnv);
  			function callRootRef() {
  				if (env === root) return callRef(cxt, validateName, env, env.$async);
  				const rootName = gen.scopeValue("root", { ref: root });
  				return callRef(cxt, (0, codegen_1._)`${rootName}.validate`, root, root.$async);
  			}
  			function callValidate(sch) {
  				callRef(cxt, getValidate(cxt, sch), sch, sch.$async);
  			}
  			function inlineRefSchema(sch) {
  				const schName = gen.scopeValue("schema", opts.code.source === true ? {
  					ref: sch,
  					code: (0, codegen_1.stringify)(sch)
  				} : { ref: sch });
  				const valid = gen.name("valid");
  				const schCxt = cxt.subschema({
  					schema: sch,
  					dataTypes: [],
  					schemaPath: codegen_1.nil,
  					topSchemaRef: schName,
  					errSchemaPath: $ref
  				}, valid);
  				cxt.mergeEvaluated(schCxt);
  				cxt.ok(valid);
  			}
  		}
  	};
  	function getValidate(cxt, sch) {
  		const { gen } = cxt;
  		return sch.validate ? gen.scopeValue("validate", { ref: sch.validate }) : (0, codegen_1._)`${gen.scopeValue("wrapper", { ref: sch })}.validate`;
  	}
  	exports.getValidate = getValidate;
  	function callRef(cxt, v, sch, $async) {
  		const { gen, it } = cxt;
  		const { allErrors, schemaEnv: env, opts } = it;
  		const passCxt = opts.passContext ? names_1.default.this : codegen_1.nil;
  		if ($async) callAsyncRef();
  		else callSyncRef();
  		function callAsyncRef() {
  			if (!env.$async) throw new Error("async schema referenced by sync schema");
  			const valid = gen.let("valid");
  			gen.try(() => {
  				gen.code((0, codegen_1._)`await ${(0, code_1.callValidateCode)(cxt, v, passCxt)}`);
  				addEvaluatedFrom(v);
  				if (!allErrors) gen.assign(valid, true);
  			}, (e) => {
  				gen.if((0, codegen_1._)`!(${e} instanceof ${it.ValidationError})`, () => gen.throw(e));
  				addErrorsFrom(e);
  				if (!allErrors) gen.assign(valid, false);
  			});
  			cxt.ok(valid);
  		}
  		function callSyncRef() {
  			cxt.result((0, code_1.callValidateCode)(cxt, v, passCxt), () => addEvaluatedFrom(v), () => addErrorsFrom(v));
  		}
  		function addErrorsFrom(source) {
  			const errs = (0, codegen_1._)`${source}.errors`;
  			gen.assign(names_1.default.vErrors, (0, codegen_1._)`${names_1.default.vErrors} === null ? ${errs} : ${names_1.default.vErrors}.concat(${errs})`);
  			gen.assign(names_1.default.errors, (0, codegen_1._)`${names_1.default.vErrors}.length`);
  		}
  		function addEvaluatedFrom(source) {
  			var _a;
  			if (!it.opts.unevaluated) return;
  			const schEvaluated = (_a = sch === null || sch === void 0 ? void 0 : sch.validate) === null || _a === void 0 ? void 0 : _a.evaluated;
  			if (it.props !== true) {
  				if (schEvaluated && !schEvaluated.dynamicProps) {
  					if (schEvaluated.props !== void 0) it.props = util_1.mergeEvaluated.props(gen, schEvaluated.props, it.props);
  				} else {
  					const props = gen.var("props", (0, codegen_1._)`${source}.evaluated.props`);
  					it.props = util_1.mergeEvaluated.props(gen, props, it.props, codegen_1.Name);
  				}
  			}
  			if (it.items !== true) {
  				if (schEvaluated && !schEvaluated.dynamicItems) {
  					if (schEvaluated.items !== void 0) it.items = util_1.mergeEvaluated.items(gen, schEvaluated.items, it.items);
  				} else {
  					const items = gen.var("items", (0, codegen_1._)`${source}.evaluated.items`);
  					it.items = util_1.mergeEvaluated.items(gen, items, it.items, codegen_1.Name);
  				}
  			}
  		}
  	}
  	exports.callRef = callRef;
  	exports.default = def;
  }));
  var require_core = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var id_1 = require_id();
  	var ref_1 = require_ref();
  	exports.default = [
  		"$schema",
  		"$id",
  		"$defs",
  		"$vocabulary",
  		{ keyword: "$comment" },
  		"definitions",
  		id_1.default,
  		ref_1.default
  	];
  }));
  var require_limitNumber = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var codegen_1 = require_codegen();
  	var ops = codegen_1.operators;
  	var KWDs = {
  		maximum: {
  			okStr: "<=",
  			ok: ops.LTE,
  			fail: ops.GT
  		},
  		minimum: {
  			okStr: ">=",
  			ok: ops.GTE,
  			fail: ops.LT
  		},
  		exclusiveMaximum: {
  			okStr: "<",
  			ok: ops.LT,
  			fail: ops.GTE
  		},
  		exclusiveMinimum: {
  			okStr: ">",
  			ok: ops.GT,
  			fail: ops.LTE
  		}
  	};
  	exports.default = {
  		keyword: Object.keys(KWDs),
  		type: "number",
  		schemaType: "number",
  		$data: true,
  		error: {
  			message: ({ keyword, schemaCode }) => (0, codegen_1.str)`must be ${KWDs[keyword].okStr} ${schemaCode}`,
  			params: ({ keyword, schemaCode }) => (0, codegen_1._)`{comparison: ${KWDs[keyword].okStr}, limit: ${schemaCode}}`
  		},
  		code(cxt) {
  			const { keyword, data, schemaCode } = cxt;
  			cxt.fail$data((0, codegen_1._)`${data} ${KWDs[keyword].fail} ${schemaCode} || isNaN(${data})`);
  		}
  	};
  }));
  var require_multipleOf = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var codegen_1 = require_codegen();
  	exports.default = {
  		keyword: "multipleOf",
  		type: "number",
  		schemaType: "number",
  		$data: true,
  		error: {
  			message: ({ schemaCode }) => (0, codegen_1.str)`must be multiple of ${schemaCode}`,
  			params: ({ schemaCode }) => (0, codegen_1._)`{multipleOf: ${schemaCode}}`
  		},
  		code(cxt) {
  			const { gen, data, schemaCode, it } = cxt;
  			const prec = it.opts.multipleOfPrecision;
  			const res = gen.let("res");
  			const invalid = prec ? (0, codegen_1._)`Math.abs(Math.round(${res}) - ${res}) > 1e-${prec}` : (0, codegen_1._)`${res} !== parseInt(${res})`;
  			cxt.fail$data((0, codegen_1._)`(${schemaCode} === 0 || (${res} = ${data}/${schemaCode}, ${invalid}))`);
  		}
  	};
  }));
  var require_ucs2length = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	function ucs2length(str) {
  		const len = str.length;
  		let length = 0;
  		let pos = 0;
  		let value;
  		while (pos < len) {
  			length++;
  			value = str.charCodeAt(pos++);
  			if (value >= 55296 && value <= 56319 && pos < len) {
  				value = str.charCodeAt(pos);
  				if ((value & 64512) === 56320) pos++;
  			}
  		}
  		return length;
  	}
  	exports.default = ucs2length;
  	ucs2length.code = "require(\"ajv/dist/runtime/ucs2length\").default";
  }));
  var require_limitLength = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	var ucs2length_1 = require_ucs2length();
  	exports.default = {
  		keyword: ["maxLength", "minLength"],
  		type: "string",
  		schemaType: "number",
  		$data: true,
  		error: {
  			message({ keyword, schemaCode }) {
  				const comp = keyword === "maxLength" ? "more" : "fewer";
  				return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} characters`;
  			},
  			params: ({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`
  		},
  		code(cxt) {
  			const { keyword, data, schemaCode, it } = cxt;
  			const op = keyword === "maxLength" ? codegen_1.operators.GT : codegen_1.operators.LT;
  			const len = it.opts.unicode === false ? (0, codegen_1._)`${data}.length` : (0, codegen_1._)`${(0, util_1.useFunc)(cxt.gen, ucs2length_1.default)}(${data})`;
  			cxt.fail$data((0, codegen_1._)`${len} ${op} ${schemaCode}`);
  		}
  	};
  }));
  var require_pattern = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var code_1 = require_code();
  	var util_1 = require_util();
  	var codegen_1 = require_codegen();
  	exports.default = {
  		keyword: "pattern",
  		type: "string",
  		schemaType: "string",
  		$data: true,
  		error: {
  			message: ({ schemaCode }) => (0, codegen_1.str)`must match pattern "${schemaCode}"`,
  			params: ({ schemaCode }) => (0, codegen_1._)`{pattern: ${schemaCode}}`
  		},
  		code(cxt) {
  			const { gen, data, $data, schema, schemaCode, it } = cxt;
  			const u = it.opts.unicodeRegExp ? "u" : "";
  			if ($data) {
  				const { regExp } = it.opts.code;
  				const regExpCode = regExp.code === "new RegExp" ? (0, codegen_1._)`new RegExp` : (0, util_1.useFunc)(gen, regExp);
  				const valid = gen.let("valid");
  				gen.try(() => gen.assign(valid, (0, codegen_1._)`${regExpCode}(${schemaCode}, ${u}).test(${data})`), () => gen.assign(valid, false));
  				cxt.fail$data((0, codegen_1._)`!${valid}`);
  			} else {
  				const regExp = (0, code_1.usePattern)(cxt, schema);
  				cxt.fail$data((0, codegen_1._)`!${regExp}.test(${data})`);
  			}
  		}
  	};
  }));
  var require_limitProperties = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var codegen_1 = require_codegen();
  	exports.default = {
  		keyword: ["maxProperties", "minProperties"],
  		type: "object",
  		schemaType: "number",
  		$data: true,
  		error: {
  			message({ keyword, schemaCode }) {
  				const comp = keyword === "maxProperties" ? "more" : "fewer";
  				return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} properties`;
  			},
  			params: ({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`
  		},
  		code(cxt) {
  			const { keyword, data, schemaCode } = cxt;
  			const op = keyword === "maxProperties" ? codegen_1.operators.GT : codegen_1.operators.LT;
  			cxt.fail$data((0, codegen_1._)`Object.keys(${data}).length ${op} ${schemaCode}`);
  		}
  	};
  }));
  var require_required = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var code_1 = require_code();
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	exports.default = {
  		keyword: "required",
  		type: "object",
  		schemaType: "array",
  		$data: true,
  		error: {
  			message: ({ params: { missingProperty } }) => (0, codegen_1.str)`must have required property '${missingProperty}'`,
  			params: ({ params: { missingProperty } }) => (0, codegen_1._)`{missingProperty: ${missingProperty}}`
  		},
  		code(cxt) {
  			const { gen, schema, schemaCode, data, $data, it } = cxt;
  			const { opts } = it;
  			if (!$data && schema.length === 0) return;
  			const useLoop = schema.length >= opts.loopRequired;
  			if (it.allErrors) allErrorsMode();
  			else exitOnErrorMode();
  			if (opts.strictRequired) {
  				const props = cxt.parentSchema.properties;
  				const { definedProperties } = cxt.it;
  				for (const requiredKey of schema) if ((props === null || props === void 0 ? void 0 : props[requiredKey]) === void 0 && !definedProperties.has(requiredKey)) {
  					const msg = `required property "${requiredKey}" is not defined at "${it.schemaEnv.baseId + it.errSchemaPath}" (strictRequired)`;
  					(0, util_1.checkStrictMode)(it, msg, it.opts.strictRequired);
  				}
  			}
  			function allErrorsMode() {
  				if (useLoop || $data) cxt.block$data(codegen_1.nil, loopAllRequired);
  				else for (const prop of schema) (0, code_1.checkReportMissingProp)(cxt, prop);
  			}
  			function exitOnErrorMode() {
  				const missing = gen.let("missing");
  				if (useLoop || $data) {
  					const valid = gen.let("valid", true);
  					cxt.block$data(valid, () => loopUntilMissing(missing, valid));
  					cxt.ok(valid);
  				} else {
  					gen.if((0, code_1.checkMissingProp)(cxt, schema, missing));
  					(0, code_1.reportMissingProp)(cxt, missing);
  					gen.else();
  				}
  			}
  			function loopAllRequired() {
  				gen.forOf("prop", schemaCode, (prop) => {
  					cxt.setParams({ missingProperty: prop });
  					gen.if((0, code_1.noPropertyInData)(gen, data, prop, opts.ownProperties), () => cxt.error());
  				});
  			}
  			function loopUntilMissing(missing, valid) {
  				cxt.setParams({ missingProperty: missing });
  				gen.forOf(missing, schemaCode, () => {
  					gen.assign(valid, (0, code_1.propertyInData)(gen, data, missing, opts.ownProperties));
  					gen.if((0, codegen_1.not)(valid), () => {
  						cxt.error();
  						gen.break();
  					});
  				}, codegen_1.nil);
  			}
  		}
  	};
  }));
  var require_limitItems = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var codegen_1 = require_codegen();
  	exports.default = {
  		keyword: ["maxItems", "minItems"],
  		type: "array",
  		schemaType: "number",
  		$data: true,
  		error: {
  			message({ keyword, schemaCode }) {
  				const comp = keyword === "maxItems" ? "more" : "fewer";
  				return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} items`;
  			},
  			params: ({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`
  		},
  		code(cxt) {
  			const { keyword, data, schemaCode } = cxt;
  			const op = keyword === "maxItems" ? codegen_1.operators.GT : codegen_1.operators.LT;
  			cxt.fail$data((0, codegen_1._)`${data}.length ${op} ${schemaCode}`);
  		}
  	};
  }));
  var require_equal = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var equal = require_fast_deep_equal();
  	equal.code = "require(\"ajv/dist/runtime/equal\").default";
  	exports.default = equal;
  }));
  var require_uniqueItems = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var dataType_1 = require_dataType();
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	var equal_1 = require_equal();
  	exports.default = {
  		keyword: "uniqueItems",
  		type: "array",
  		schemaType: "boolean",
  		$data: true,
  		error: {
  			message: ({ params: { i, j } }) => (0, codegen_1.str)`must NOT have duplicate items (items ## ${j} and ${i} are identical)`,
  			params: ({ params: { i, j } }) => (0, codegen_1._)`{i: ${i}, j: ${j}}`
  		},
  		code(cxt) {
  			const { gen, data, $data, schema, parentSchema, schemaCode, it } = cxt;
  			if (!$data && !schema) return;
  			const valid = gen.let("valid");
  			const itemTypes = parentSchema.items ? (0, dataType_1.getSchemaTypes)(parentSchema.items) : [];
  			cxt.block$data(valid, validateUniqueItems, (0, codegen_1._)`${schemaCode} === false`);
  			cxt.ok(valid);
  			function validateUniqueItems() {
  				const i = gen.let("i", (0, codegen_1._)`${data}.length`);
  				const j = gen.let("j");
  				cxt.setParams({
  					i,
  					j
  				});
  				gen.assign(valid, true);
  				gen.if((0, codegen_1._)`${i} > 1`, () => (canOptimize() ? loopN : loopN2)(i, j));
  			}
  			function canOptimize() {
  				return itemTypes.length > 0 && !itemTypes.some((t) => t === "object" || t === "array");
  			}
  			function loopN(i, j) {
  				const item = gen.name("item");
  				const wrongType = (0, dataType_1.checkDataTypes)(itemTypes, item, it.opts.strictNumbers, dataType_1.DataType.Wrong);
  				const indices = gen.const("indices", (0, codegen_1._)`{}`);
  				gen.for((0, codegen_1._)`;${i}--;`, () => {
  					gen.let(item, (0, codegen_1._)`${data}[${i}]`);
  					gen.if(wrongType, (0, codegen_1._)`continue`);
  					if (itemTypes.length > 1) gen.if((0, codegen_1._)`typeof ${item} == "string"`, (0, codegen_1._)`${item} += "_"`);
  					gen.if((0, codegen_1._)`typeof ${indices}[${item}] == "number"`, () => {
  						gen.assign(j, (0, codegen_1._)`${indices}[${item}]`);
  						cxt.error();
  						gen.assign(valid, false).break();
  					}).code((0, codegen_1._)`${indices}[${item}] = ${i}`);
  				});
  			}
  			function loopN2(i, j) {
  				const eql = (0, util_1.useFunc)(gen, equal_1.default);
  				const outer = gen.name("outer");
  				gen.label(outer).for((0, codegen_1._)`;${i}--;`, () => gen.for((0, codegen_1._)`${j} = ${i}; ${j}--;`, () => gen.if((0, codegen_1._)`${eql}(${data}[${i}], ${data}[${j}])`, () => {
  					cxt.error();
  					gen.assign(valid, false).break(outer);
  				})));
  			}
  		}
  	};
  }));
  var require_const = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	var equal_1 = require_equal();
  	exports.default = {
  		keyword: "const",
  		$data: true,
  		error: {
  			message: "must be equal to constant",
  			params: ({ schemaCode }) => (0, codegen_1._)`{allowedValue: ${schemaCode}}`
  		},
  		code(cxt) {
  			const { gen, data, $data, schemaCode, schema } = cxt;
  			if ($data || schema && typeof schema == "object") cxt.fail$data((0, codegen_1._)`!${(0, util_1.useFunc)(gen, equal_1.default)}(${data}, ${schemaCode})`);
  			else cxt.fail((0, codegen_1._)`${schema} !== ${data}`);
  		}
  	};
  }));
  var require_enum = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	var equal_1 = require_equal();
  	exports.default = {
  		keyword: "enum",
  		schemaType: "array",
  		$data: true,
  		error: {
  			message: "must be equal to one of the allowed values",
  			params: ({ schemaCode }) => (0, codegen_1._)`{allowedValues: ${schemaCode}}`
  		},
  		code(cxt) {
  			const { gen, data, $data, schema, schemaCode, it } = cxt;
  			if (!$data && schema.length === 0) throw new Error("enum must have non-empty array");
  			const useLoop = schema.length >= it.opts.loopEnum;
  			let eql;
  			const getEql = () => eql !== null && eql !== void 0 ? eql : eql = (0, util_1.useFunc)(gen, equal_1.default);
  			let valid;
  			if (useLoop || $data) {
  				valid = gen.let("valid");
  				cxt.block$data(valid, loopEnum);
  			} else {
  				/* istanbul ignore if */
  				if (!Array.isArray(schema)) throw new Error("ajv implementation error");
  				const vSchema = gen.const("vSchema", schemaCode);
  				valid = (0, codegen_1.or)(...schema.map((_x, i) => equalCode(vSchema, i)));
  			}
  			cxt.pass(valid);
  			function loopEnum() {
  				gen.assign(valid, false);
  				gen.forOf("v", schemaCode, (v) => gen.if((0, codegen_1._)`${getEql()}(${data}, ${v})`, () => gen.assign(valid, true).break()));
  			}
  			function equalCode(vSchema, i) {
  				const sch = schema[i];
  				return typeof sch === "object" && sch !== null ? (0, codegen_1._)`${getEql()}(${data}, ${vSchema}[${i}])` : (0, codegen_1._)`${data} === ${sch}`;
  			}
  		}
  	};
  }));
  var require_validation = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var limitNumber_1 = require_limitNumber();
  	var multipleOf_1 = require_multipleOf();
  	var limitLength_1 = require_limitLength();
  	var pattern_1 = require_pattern();
  	var limitProperties_1 = require_limitProperties();
  	var required_1 = require_required();
  	var limitItems_1 = require_limitItems();
  	var uniqueItems_1 = require_uniqueItems();
  	var const_1 = require_const();
  	var enum_1 = require_enum();
  	exports.default = [
  		limitNumber_1.default,
  		multipleOf_1.default,
  		limitLength_1.default,
  		pattern_1.default,
  		limitProperties_1.default,
  		required_1.default,
  		limitItems_1.default,
  		uniqueItems_1.default,
  		{
  			keyword: "type",
  			schemaType: ["string", "array"]
  		},
  		{
  			keyword: "nullable",
  			schemaType: "boolean"
  		},
  		const_1.default,
  		enum_1.default
  	];
  }));
  var require_additionalItems = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.validateAdditionalItems = void 0;
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	var def = {
  		keyword: "additionalItems",
  		type: "array",
  		schemaType: ["boolean", "object"],
  		before: "uniqueItems",
  		error: {
  			message: ({ params: { len } }) => (0, codegen_1.str)`must NOT have more than ${len} items`,
  			params: ({ params: { len } }) => (0, codegen_1._)`{limit: ${len}}`
  		},
  		code(cxt) {
  			const { parentSchema, it } = cxt;
  			const { items } = parentSchema;
  			if (!Array.isArray(items)) {
  				(0, util_1.checkStrictMode)(it, "\"additionalItems\" is ignored when \"items\" is not an array of schemas");
  				return;
  			}
  			validateAdditionalItems(cxt, items);
  		}
  	};
  	function validateAdditionalItems(cxt, items) {
  		const { gen, schema, data, keyword, it } = cxt;
  		it.items = true;
  		const len = gen.const("len", (0, codegen_1._)`${data}.length`);
  		if (schema === false) {
  			cxt.setParams({ len: items.length });
  			cxt.pass((0, codegen_1._)`${len} <= ${items.length}`);
  		} else if (typeof schema == "object" && !(0, util_1.alwaysValidSchema)(it, schema)) {
  			const valid = gen.var("valid", (0, codegen_1._)`${len} <= ${items.length}`);
  			gen.if((0, codegen_1.not)(valid), () => validateItems(valid));
  			cxt.ok(valid);
  		}
  		function validateItems(valid) {
  			gen.forRange("i", items.length, len, (i) => {
  				cxt.subschema({
  					keyword,
  					dataProp: i,
  					dataPropType: util_1.Type.Num
  				}, valid);
  				if (!it.allErrors) gen.if((0, codegen_1.not)(valid), () => gen.break());
  			});
  		}
  	}
  	exports.validateAdditionalItems = validateAdditionalItems;
  	exports.default = def;
  }));
  var require_items = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.validateTuple = void 0;
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	var code_1 = require_code();
  	var def = {
  		keyword: "items",
  		type: "array",
  		schemaType: [
  			"object",
  			"array",
  			"boolean"
  		],
  		before: "uniqueItems",
  		code(cxt) {
  			const { schema, it } = cxt;
  			if (Array.isArray(schema)) return validateTuple(cxt, "additionalItems", schema);
  			it.items = true;
  			if ((0, util_1.alwaysValidSchema)(it, schema)) return;
  			cxt.ok((0, code_1.validateArray)(cxt));
  		}
  	};
  	function validateTuple(cxt, extraItems, schArr = cxt.schema) {
  		const { gen, parentSchema, data, keyword, it } = cxt;
  		checkStrictTuple(parentSchema);
  		if (it.opts.unevaluated && schArr.length && it.items !== true) it.items = util_1.mergeEvaluated.items(gen, schArr.length, it.items);
  		const valid = gen.name("valid");
  		const len = gen.const("len", (0, codegen_1._)`${data}.length`);
  		schArr.forEach((sch, i) => {
  			if ((0, util_1.alwaysValidSchema)(it, sch)) return;
  			gen.if((0, codegen_1._)`${len} > ${i}`, () => cxt.subschema({
  				keyword,
  				schemaProp: i,
  				dataProp: i
  			}, valid));
  			cxt.ok(valid);
  		});
  		function checkStrictTuple(sch) {
  			const { opts, errSchemaPath } = it;
  			const l = schArr.length;
  			const fullTuple = l === sch.minItems && (l === sch.maxItems || sch[extraItems] === false);
  			if (opts.strictTuples && !fullTuple) {
  				const msg = `"${keyword}" is ${l}-tuple, but minItems or maxItems/${extraItems} are not specified or different at path "${errSchemaPath}"`;
  				(0, util_1.checkStrictMode)(it, msg, opts.strictTuples);
  			}
  		}
  	}
  	exports.validateTuple = validateTuple;
  	exports.default = def;
  }));
  var require_prefixItems = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var items_1 = require_items();
  	exports.default = {
  		keyword: "prefixItems",
  		type: "array",
  		schemaType: ["array"],
  		before: "uniqueItems",
  		code: (cxt) => (0, items_1.validateTuple)(cxt, "items")
  	};
  }));
  var require_items2020 = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	var code_1 = require_code();
  	var additionalItems_1 = require_additionalItems();
  	exports.default = {
  		keyword: "items",
  		type: "array",
  		schemaType: ["object", "boolean"],
  		before: "uniqueItems",
  		error: {
  			message: ({ params: { len } }) => (0, codegen_1.str)`must NOT have more than ${len} items`,
  			params: ({ params: { len } }) => (0, codegen_1._)`{limit: ${len}}`
  		},
  		code(cxt) {
  			const { schema, parentSchema, it } = cxt;
  			const { prefixItems } = parentSchema;
  			it.items = true;
  			if ((0, util_1.alwaysValidSchema)(it, schema)) return;
  			if (prefixItems) (0, additionalItems_1.validateAdditionalItems)(cxt, prefixItems);
  			else cxt.ok((0, code_1.validateArray)(cxt));
  		}
  	};
  }));
  var require_contains = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	exports.default = {
  		keyword: "contains",
  		type: "array",
  		schemaType: ["object", "boolean"],
  		before: "uniqueItems",
  		trackErrors: true,
  		error: {
  			message: ({ params: { min, max } }) => max === void 0 ? (0, codegen_1.str)`must contain at least ${min} valid item(s)` : (0, codegen_1.str)`must contain at least ${min} and no more than ${max} valid item(s)`,
  			params: ({ params: { min, max } }) => max === void 0 ? (0, codegen_1._)`{minContains: ${min}}` : (0, codegen_1._)`{minContains: ${min}, maxContains: ${max}}`
  		},
  		code(cxt) {
  			const { gen, schema, parentSchema, data, it } = cxt;
  			let min;
  			let max;
  			const { minContains, maxContains } = parentSchema;
  			if (it.opts.next) {
  				min = minContains === void 0 ? 1 : minContains;
  				max = maxContains;
  			} else min = 1;
  			const len = gen.const("len", (0, codegen_1._)`${data}.length`);
  			cxt.setParams({
  				min,
  				max
  			});
  			if (max === void 0 && min === 0) {
  				(0, util_1.checkStrictMode)(it, `"minContains" == 0 without "maxContains": "contains" keyword ignored`);
  				return;
  			}
  			if (max !== void 0 && min > max) {
  				(0, util_1.checkStrictMode)(it, `"minContains" > "maxContains" is always invalid`);
  				cxt.fail();
  				return;
  			}
  			if ((0, util_1.alwaysValidSchema)(it, schema)) {
  				let cond = (0, codegen_1._)`${len} >= ${min}`;
  				if (max !== void 0) cond = (0, codegen_1._)`${cond} && ${len} <= ${max}`;
  				cxt.pass(cond);
  				return;
  			}
  			it.items = true;
  			const valid = gen.name("valid");
  			if (max === void 0 && min === 1) validateItems(valid, () => gen.if(valid, () => gen.break()));
  			else if (min === 0) {
  				gen.let(valid, true);
  				if (max !== void 0) gen.if((0, codegen_1._)`${data}.length > 0`, validateItemsWithCount);
  			} else {
  				gen.let(valid, false);
  				validateItemsWithCount();
  			}
  			cxt.result(valid, () => cxt.reset());
  			function validateItemsWithCount() {
  				const schValid = gen.name("_valid");
  				const count = gen.let("count", 0);
  				validateItems(schValid, () => gen.if(schValid, () => checkLimits(count)));
  			}
  			function validateItems(_valid, block) {
  				gen.forRange("i", 0, len, (i) => {
  					cxt.subschema({
  						keyword: "contains",
  						dataProp: i,
  						dataPropType: util_1.Type.Num,
  						compositeRule: true
  					}, _valid);
  					block();
  				});
  			}
  			function checkLimits(count) {
  				gen.code((0, codegen_1._)`${count}++`);
  				if (max === void 0) gen.if((0, codegen_1._)`${count} >= ${min}`, () => gen.assign(valid, true).break());
  				else {
  					gen.if((0, codegen_1._)`${count} > ${max}`, () => gen.assign(valid, false).break());
  					if (min === 1) gen.assign(valid, true);
  					else gen.if((0, codegen_1._)`${count} >= ${min}`, () => gen.assign(valid, true));
  				}
  			}
  		}
  	};
  }));
  var require_dependencies = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.validateSchemaDeps = exports.validatePropertyDeps = exports.error = void 0;
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	var code_1 = require_code();
  	exports.error = {
  		message: ({ params: { property, depsCount, deps } }) => {
  			const property_ies = depsCount === 1 ? "property" : "properties";
  			return (0, codegen_1.str)`must have ${property_ies} ${deps} when property ${property} is present`;
  		},
  		params: ({ params: { property, depsCount, deps, missingProperty } }) => (0, codegen_1._)`{property: ${property},
      missingProperty: ${missingProperty},
      depsCount: ${depsCount},
      deps: ${deps}}`
  	};
  	var def = {
  		keyword: "dependencies",
  		type: "object",
  		schemaType: "object",
  		error: exports.error,
  		code(cxt) {
  			const [propDeps, schDeps] = splitDependencies(cxt);
  			validatePropertyDeps(cxt, propDeps);
  			validateSchemaDeps(cxt, schDeps);
  		}
  	};
  	function splitDependencies({ schema }) {
  		const propertyDeps = {};
  		const schemaDeps = {};
  		for (const key in schema) {
  			if (key === "__proto__") continue;
  			const deps = Array.isArray(schema[key]) ? propertyDeps : schemaDeps;
  			deps[key] = schema[key];
  		}
  		return [propertyDeps, schemaDeps];
  	}
  	function validatePropertyDeps(cxt, propertyDeps = cxt.schema) {
  		const { gen, data, it } = cxt;
  		if (Object.keys(propertyDeps).length === 0) return;
  		const missing = gen.let("missing");
  		for (const prop in propertyDeps) {
  			const deps = propertyDeps[prop];
  			if (deps.length === 0) continue;
  			const hasProperty = (0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties);
  			cxt.setParams({
  				property: prop,
  				depsCount: deps.length,
  				deps: deps.join(", ")
  			});
  			if (it.allErrors) gen.if(hasProperty, () => {
  				for (const depProp of deps) (0, code_1.checkReportMissingProp)(cxt, depProp);
  			});
  			else {
  				gen.if((0, codegen_1._)`${hasProperty} && (${(0, code_1.checkMissingProp)(cxt, deps, missing)})`);
  				(0, code_1.reportMissingProp)(cxt, missing);
  				gen.else();
  			}
  		}
  	}
  	exports.validatePropertyDeps = validatePropertyDeps;
  	function validateSchemaDeps(cxt, schemaDeps = cxt.schema) {
  		const { gen, data, keyword, it } = cxt;
  		const valid = gen.name("valid");
  		for (const prop in schemaDeps) {
  			if ((0, util_1.alwaysValidSchema)(it, schemaDeps[prop])) continue;
  			gen.if((0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties), () => {
  				const schCxt = cxt.subschema({
  					keyword,
  					schemaProp: prop
  				}, valid);
  				cxt.mergeValidEvaluated(schCxt, valid);
  			}, () => gen.var(valid, true));
  			cxt.ok(valid);
  		}
  	}
  	exports.validateSchemaDeps = validateSchemaDeps;
  	exports.default = def;
  }));
  var require_propertyNames = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	exports.default = {
  		keyword: "propertyNames",
  		type: "object",
  		schemaType: ["object", "boolean"],
  		error: {
  			message: "property name must be valid",
  			params: ({ params }) => (0, codegen_1._)`{propertyName: ${params.propertyName}}`
  		},
  		code(cxt) {
  			const { gen, schema, data, it } = cxt;
  			if ((0, util_1.alwaysValidSchema)(it, schema)) return;
  			const valid = gen.name("valid");
  			gen.forIn("key", data, (key) => {
  				cxt.setParams({ propertyName: key });
  				cxt.subschema({
  					keyword: "propertyNames",
  					data: key,
  					dataTypes: ["string"],
  					propertyName: key,
  					compositeRule: true
  				}, valid);
  				gen.if((0, codegen_1.not)(valid), () => {
  					cxt.error(true);
  					if (!it.allErrors) gen.break();
  				});
  			});
  			cxt.ok(valid);
  		}
  	};
  }));
  var require_additionalProperties = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var code_1 = require_code();
  	var codegen_1 = require_codegen();
  	var names_1 = require_names();
  	var util_1 = require_util();
  	exports.default = {
  		keyword: "additionalProperties",
  		type: ["object"],
  		schemaType: ["boolean", "object"],
  		allowUndefined: true,
  		trackErrors: true,
  		error: {
  			message: "must NOT have additional properties",
  			params: ({ params }) => (0, codegen_1._)`{additionalProperty: ${params.additionalProperty}}`
  		},
  		code(cxt) {
  			const { gen, schema, parentSchema, data, errsCount, it } = cxt;
  			/* istanbul ignore if */
  			if (!errsCount) throw new Error("ajv implementation error");
  			const { allErrors, opts } = it;
  			it.props = true;
  			if (opts.removeAdditional !== "all" && (0, util_1.alwaysValidSchema)(it, schema)) return;
  			const props = (0, code_1.allSchemaProperties)(parentSchema.properties);
  			const patProps = (0, code_1.allSchemaProperties)(parentSchema.patternProperties);
  			checkAdditionalProperties();
  			cxt.ok((0, codegen_1._)`${errsCount} === ${names_1.default.errors}`);
  			function checkAdditionalProperties() {
  				gen.forIn("key", data, (key) => {
  					if (!props.length && !patProps.length) additionalPropertyCode(key);
  					else gen.if(isAdditional(key), () => additionalPropertyCode(key));
  				});
  			}
  			function isAdditional(key) {
  				let definedProp;
  				if (props.length > 8) {
  					const propsSchema = (0, util_1.schemaRefOrVal)(it, parentSchema.properties, "properties");
  					definedProp = (0, code_1.isOwnProperty)(gen, propsSchema, key);
  				} else if (props.length) definedProp = (0, codegen_1.or)(...props.map((p) => (0, codegen_1._)`${key} === ${p}`));
  				else definedProp = codegen_1.nil;
  				if (patProps.length) definedProp = (0, codegen_1.or)(definedProp, ...patProps.map((p) => (0, codegen_1._)`${(0, code_1.usePattern)(cxt, p)}.test(${key})`));
  				return (0, codegen_1.not)(definedProp);
  			}
  			function deleteAdditional(key) {
  				gen.code((0, codegen_1._)`delete ${data}[${key}]`);
  			}
  			function additionalPropertyCode(key) {
  				if (opts.removeAdditional === "all" || opts.removeAdditional && schema === false) {
  					deleteAdditional(key);
  					return;
  				}
  				if (schema === false) {
  					cxt.setParams({ additionalProperty: key });
  					cxt.error();
  					if (!allErrors) gen.break();
  					return;
  				}
  				if (typeof schema == "object" && !(0, util_1.alwaysValidSchema)(it, schema)) {
  					const valid = gen.name("valid");
  					if (opts.removeAdditional === "failing") {
  						applyAdditionalSchema(key, valid, false);
  						gen.if((0, codegen_1.not)(valid), () => {
  							cxt.reset();
  							deleteAdditional(key);
  						});
  					} else {
  						applyAdditionalSchema(key, valid);
  						if (!allErrors) gen.if((0, codegen_1.not)(valid), () => gen.break());
  					}
  				}
  			}
  			function applyAdditionalSchema(key, valid, errors) {
  				const subschema = {
  					keyword: "additionalProperties",
  					dataProp: key,
  					dataPropType: util_1.Type.Str
  				};
  				if (errors === false) Object.assign(subschema, {
  					compositeRule: true,
  					createErrors: false,
  					allErrors: false
  				});
  				cxt.subschema(subschema, valid);
  			}
  		}
  	};
  }));
  var require_properties = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var validate_1 = require_validate();
  	var code_1 = require_code();
  	var util_1 = require_util();
  	var additionalProperties_1 = require_additionalProperties();
  	exports.default = {
  		keyword: "properties",
  		type: "object",
  		schemaType: "object",
  		code(cxt) {
  			const { gen, schema, parentSchema, data, it } = cxt;
  			if (it.opts.removeAdditional === "all" && parentSchema.additionalProperties === void 0) additionalProperties_1.default.code(new validate_1.KeywordCxt(it, additionalProperties_1.default, "additionalProperties"));
  			const allProps = (0, code_1.allSchemaProperties)(schema);
  			for (const prop of allProps) it.definedProperties.add(prop);
  			if (it.opts.unevaluated && allProps.length && it.props !== true) it.props = util_1.mergeEvaluated.props(gen, (0, util_1.toHash)(allProps), it.props);
  			const properties = allProps.filter((p) => !(0, util_1.alwaysValidSchema)(it, schema[p]));
  			if (properties.length === 0) return;
  			const valid = gen.name("valid");
  			for (const prop of properties) {
  				if (hasDefault(prop)) applyPropertySchema(prop);
  				else {
  					gen.if((0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties));
  					applyPropertySchema(prop);
  					if (!it.allErrors) gen.else().var(valid, true);
  					gen.endIf();
  				}
  				cxt.it.definedProperties.add(prop);
  				cxt.ok(valid);
  			}
  			function hasDefault(prop) {
  				return it.opts.useDefaults && !it.compositeRule && schema[prop].default !== void 0;
  			}
  			function applyPropertySchema(prop) {
  				cxt.subschema({
  					keyword: "properties",
  					schemaProp: prop,
  					dataProp: prop
  				}, valid);
  			}
  		}
  	};
  }));
  var require_patternProperties = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var code_1 = require_code();
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	var util_2 = require_util();
  	exports.default = {
  		keyword: "patternProperties",
  		type: "object",
  		schemaType: "object",
  		code(cxt) {
  			const { gen, schema, data, parentSchema, it } = cxt;
  			const { opts } = it;
  			const patterns = (0, code_1.allSchemaProperties)(schema);
  			const alwaysValidPatterns = patterns.filter((p) => (0, util_1.alwaysValidSchema)(it, schema[p]));
  			if (patterns.length === 0 || alwaysValidPatterns.length === patterns.length && (!it.opts.unevaluated || it.props === true)) return;
  			const checkProperties = opts.strictSchema && !opts.allowMatchingProperties && parentSchema.properties;
  			const valid = gen.name("valid");
  			if (it.props !== true && !(it.props instanceof codegen_1.Name)) it.props = (0, util_2.evaluatedPropsToName)(gen, it.props);
  			const { props } = it;
  			validatePatternProperties();
  			function validatePatternProperties() {
  				for (const pat of patterns) {
  					if (checkProperties) checkMatchingProperties(pat);
  					if (it.allErrors) validateProperties(pat);
  					else {
  						gen.var(valid, true);
  						validateProperties(pat);
  						gen.if(valid);
  					}
  				}
  			}
  			function checkMatchingProperties(pat) {
  				for (const prop in checkProperties) if (new RegExp(pat).test(prop)) (0, util_1.checkStrictMode)(it, `property ${prop} matches pattern ${pat} (use allowMatchingProperties)`);
  			}
  			function validateProperties(pat) {
  				gen.forIn("key", data, (key) => {
  					gen.if((0, codegen_1._)`${(0, code_1.usePattern)(cxt, pat)}.test(${key})`, () => {
  						const alwaysValid = alwaysValidPatterns.includes(pat);
  						if (!alwaysValid) cxt.subschema({
  							keyword: "patternProperties",
  							schemaProp: pat,
  							dataProp: key,
  							dataPropType: util_2.Type.Str
  						}, valid);
  						if (it.opts.unevaluated && props !== true) gen.assign((0, codegen_1._)`${props}[${key}]`, true);
  						else if (!alwaysValid && !it.allErrors) gen.if((0, codegen_1.not)(valid), () => gen.break());
  					});
  				});
  			}
  		}
  	};
  }));
  var require_not = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var util_1 = require_util();
  	exports.default = {
  		keyword: "not",
  		schemaType: ["object", "boolean"],
  		trackErrors: true,
  		code(cxt) {
  			const { gen, schema, it } = cxt;
  			if ((0, util_1.alwaysValidSchema)(it, schema)) {
  				cxt.fail();
  				return;
  			}
  			const valid = gen.name("valid");
  			cxt.subschema({
  				keyword: "not",
  				compositeRule: true,
  				createErrors: false,
  				allErrors: false
  			}, valid);
  			cxt.failResult(valid, () => cxt.reset(), () => cxt.error());
  		},
  		error: { message: "must NOT be valid" }
  	};
  }));
  var require_anyOf = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.default = {
  		keyword: "anyOf",
  		schemaType: "array",
  		trackErrors: true,
  		code: require_code().validateUnion,
  		error: { message: "must match a schema in anyOf" }
  	};
  }));
  var require_oneOf = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	exports.default = {
  		keyword: "oneOf",
  		schemaType: "array",
  		trackErrors: true,
  		error: {
  			message: "must match exactly one schema in oneOf",
  			params: ({ params }) => (0, codegen_1._)`{passingSchemas: ${params.passing}}`
  		},
  		code(cxt) {
  			const { gen, schema, parentSchema, it } = cxt;
  			/* istanbul ignore if */
  			if (!Array.isArray(schema)) throw new Error("ajv implementation error");
  			if (it.opts.discriminator && parentSchema.discriminator) return;
  			const schArr = schema;
  			const valid = gen.let("valid", false);
  			const passing = gen.let("passing", null);
  			const schValid = gen.name("_valid");
  			cxt.setParams({ passing });
  			gen.block(validateOneOf);
  			cxt.result(valid, () => cxt.reset(), () => cxt.error(true));
  			function validateOneOf() {
  				schArr.forEach((sch, i) => {
  					let schCxt;
  					if ((0, util_1.alwaysValidSchema)(it, sch)) gen.var(schValid, true);
  					else schCxt = cxt.subschema({
  						keyword: "oneOf",
  						schemaProp: i,
  						compositeRule: true
  					}, schValid);
  					if (i > 0) gen.if((0, codegen_1._)`${schValid} && ${valid}`).assign(valid, false).assign(passing, (0, codegen_1._)`[${passing}, ${i}]`).else();
  					gen.if(schValid, () => {
  						gen.assign(valid, true);
  						gen.assign(passing, i);
  						if (schCxt) cxt.mergeEvaluated(schCxt, codegen_1.Name);
  					});
  				});
  			}
  		}
  	};
  }));
  var require_allOf = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var util_1 = require_util();
  	exports.default = {
  		keyword: "allOf",
  		schemaType: "array",
  		code(cxt) {
  			const { gen, schema, it } = cxt;
  			/* istanbul ignore if */
  			if (!Array.isArray(schema)) throw new Error("ajv implementation error");
  			const valid = gen.name("valid");
  			schema.forEach((sch, i) => {
  				if ((0, util_1.alwaysValidSchema)(it, sch)) return;
  				const schCxt = cxt.subschema({
  					keyword: "allOf",
  					schemaProp: i
  				}, valid);
  				cxt.ok(valid);
  				cxt.mergeEvaluated(schCxt);
  			});
  		}
  	};
  }));
  var require_if = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	var def = {
  		keyword: "if",
  		schemaType: ["object", "boolean"],
  		trackErrors: true,
  		error: {
  			message: ({ params }) => (0, codegen_1.str)`must match "${params.ifClause}" schema`,
  			params: ({ params }) => (0, codegen_1._)`{failingKeyword: ${params.ifClause}}`
  		},
  		code(cxt) {
  			const { gen, parentSchema, it } = cxt;
  			if (parentSchema.then === void 0 && parentSchema.else === void 0) (0, util_1.checkStrictMode)(it, "\"if\" without \"then\" and \"else\" is ignored");
  			const hasThen = hasSchema(it, "then");
  			const hasElse = hasSchema(it, "else");
  			if (!hasThen && !hasElse) return;
  			const valid = gen.let("valid", true);
  			const schValid = gen.name("_valid");
  			validateIf();
  			cxt.reset();
  			if (hasThen && hasElse) {
  				const ifClause = gen.let("ifClause");
  				cxt.setParams({ ifClause });
  				gen.if(schValid, validateClause("then", ifClause), validateClause("else", ifClause));
  			} else if (hasThen) gen.if(schValid, validateClause("then"));
  			else gen.if((0, codegen_1.not)(schValid), validateClause("else"));
  			cxt.pass(valid, () => cxt.error(true));
  			function validateIf() {
  				const schCxt = cxt.subschema({
  					keyword: "if",
  					compositeRule: true,
  					createErrors: false,
  					allErrors: false
  				}, schValid);
  				cxt.mergeEvaluated(schCxt);
  			}
  			function validateClause(keyword, ifClause) {
  				return () => {
  					const schCxt = cxt.subschema({ keyword }, schValid);
  					gen.assign(valid, schValid);
  					cxt.mergeValidEvaluated(schCxt, valid);
  					if (ifClause) gen.assign(ifClause, (0, codegen_1._)`${keyword}`);
  					else cxt.setParams({ ifClause: keyword });
  				};
  			}
  		}
  	};
  	function hasSchema(it, keyword) {
  		const schema = it.schema[keyword];
  		return schema !== void 0 && !(0, util_1.alwaysValidSchema)(it, schema);
  	}
  	exports.default = def;
  }));
  var require_thenElse = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var util_1 = require_util();
  	exports.default = {
  		keyword: ["then", "else"],
  		schemaType: ["object", "boolean"],
  		code({ keyword, parentSchema, it }) {
  			if (parentSchema.if === void 0) (0, util_1.checkStrictMode)(it, `"${keyword}" without "if" is ignored`);
  		}
  	};
  }));
  var require_applicator = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var additionalItems_1 = require_additionalItems();
  	var prefixItems_1 = require_prefixItems();
  	var items_1 = require_items();
  	var items2020_1 = require_items2020();
  	var contains_1 = require_contains();
  	var dependencies_1 = require_dependencies();
  	var propertyNames_1 = require_propertyNames();
  	var additionalProperties_1 = require_additionalProperties();
  	var properties_1 = require_properties();
  	var patternProperties_1 = require_patternProperties();
  	var not_1 = require_not();
  	var anyOf_1 = require_anyOf();
  	var oneOf_1 = require_oneOf();
  	var allOf_1 = require_allOf();
  	var if_1 = require_if();
  	var thenElse_1 = require_thenElse();
  	function getApplicator(draft2020 = false) {
  		const applicator = [
  			not_1.default,
  			anyOf_1.default,
  			oneOf_1.default,
  			allOf_1.default,
  			if_1.default,
  			thenElse_1.default,
  			propertyNames_1.default,
  			additionalProperties_1.default,
  			dependencies_1.default,
  			properties_1.default,
  			patternProperties_1.default
  		];
  		if (draft2020) applicator.push(prefixItems_1.default, items2020_1.default);
  		else applicator.push(additionalItems_1.default, items_1.default);
  		applicator.push(contains_1.default);
  		return applicator;
  	}
  	exports.default = getApplicator;
  }));
  var require_format$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var codegen_1 = require_codegen();
  	exports.default = {
  		keyword: "format",
  		type: ["number", "string"],
  		schemaType: "string",
  		$data: true,
  		error: {
  			message: ({ schemaCode }) => (0, codegen_1.str)`must match format "${schemaCode}"`,
  			params: ({ schemaCode }) => (0, codegen_1._)`{format: ${schemaCode}}`
  		},
  		code(cxt, ruleType) {
  			const { gen, data, $data, schema, schemaCode, it } = cxt;
  			const { opts, errSchemaPath, schemaEnv, self } = it;
  			if (!opts.validateFormats) return;
  			if ($data) validate$DataFormat();
  			else validateFormat();
  			function validate$DataFormat() {
  				const fmts = gen.scopeValue("formats", {
  					ref: self.formats,
  					code: opts.code.formats
  				});
  				const fDef = gen.const("fDef", (0, codegen_1._)`${fmts}[${schemaCode}]`);
  				const fType = gen.let("fType");
  				const format = gen.let("format");
  				gen.if((0, codegen_1._)`typeof ${fDef} == "object" && !(${fDef} instanceof RegExp)`, () => gen.assign(fType, (0, codegen_1._)`${fDef}.type || "string"`).assign(format, (0, codegen_1._)`${fDef}.validate`), () => gen.assign(fType, (0, codegen_1._)`"string"`).assign(format, fDef));
  				cxt.fail$data((0, codegen_1.or)(unknownFmt(), invalidFmt()));
  				function unknownFmt() {
  					if (opts.strictSchema === false) return codegen_1.nil;
  					return (0, codegen_1._)`${schemaCode} && !${format}`;
  				}
  				function invalidFmt() {
  					const callFormat = schemaEnv.$async ? (0, codegen_1._)`(${fDef}.async ? await ${format}(${data}) : ${format}(${data}))` : (0, codegen_1._)`${format}(${data})`;
  					const validData = (0, codegen_1._)`(typeof ${format} == "function" ? ${callFormat} : ${format}.test(${data}))`;
  					return (0, codegen_1._)`${format} && ${format} !== true && ${fType} === ${ruleType} && !${validData}`;
  				}
  			}
  			function validateFormat() {
  				const formatDef = self.formats[schema];
  				if (!formatDef) {
  					unknownFormat();
  					return;
  				}
  				if (formatDef === true) return;
  				const [fmtType, format, fmtRef] = getFormat(formatDef);
  				if (fmtType === ruleType) cxt.pass(validCondition());
  				function unknownFormat() {
  					if (opts.strictSchema === false) {
  						self.logger.warn(unknownMsg());
  						return;
  					}
  					throw new Error(unknownMsg());
  					function unknownMsg() {
  						return `unknown format "${schema}" ignored in schema at path "${errSchemaPath}"`;
  					}
  				}
  				function getFormat(fmtDef) {
  					const code = fmtDef instanceof RegExp ? (0, codegen_1.regexpCode)(fmtDef) : opts.code.formats ? (0, codegen_1._)`${opts.code.formats}${(0, codegen_1.getProperty)(schema)}` : void 0;
  					const fmt = gen.scopeValue("formats", {
  						key: schema,
  						ref: fmtDef,
  						code
  					});
  					if (typeof fmtDef == "object" && !(fmtDef instanceof RegExp)) return [
  						fmtDef.type || "string",
  						fmtDef.validate,
  						(0, codegen_1._)`${fmt}.validate`
  					];
  					return [
  						"string",
  						fmtDef,
  						fmt
  					];
  				}
  				function validCondition() {
  					if (typeof formatDef == "object" && !(formatDef instanceof RegExp) && formatDef.async) {
  						if (!schemaEnv.$async) throw new Error("async format in sync schema");
  						return (0, codegen_1._)`await ${fmtRef}(${data})`;
  					}
  					return typeof format == "function" ? (0, codegen_1._)`${fmtRef}(${data})` : (0, codegen_1._)`${fmtRef}.test(${data})`;
  				}
  			}
  		}
  	};
  }));
  var require_format = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.default = [require_format$1().default];
  }));
  var require_metadata = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.contentVocabulary = exports.metadataVocabulary = void 0;
  	exports.metadataVocabulary = [
  		"title",
  		"description",
  		"default",
  		"deprecated",
  		"readOnly",
  		"writeOnly",
  		"examples"
  	];
  	exports.contentVocabulary = [
  		"contentMediaType",
  		"contentEncoding",
  		"contentSchema"
  	];
  }));
  var require_draft7 = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var core_1 = require_core();
  	var validation_1 = require_validation();
  	var applicator_1 = require_applicator();
  	var format_1 = require_format();
  	var metadata_1 = require_metadata();
  	exports.default = [
  		core_1.default,
  		validation_1.default,
  		(0, applicator_1.default)(),
  		format_1.default,
  		metadata_1.metadataVocabulary,
  		metadata_1.contentVocabulary
  	];
  }));
  var require_types = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.DiscrError = void 0;
  	var DiscrError;
  	(function(DiscrError) {
  		DiscrError["Tag"] = "tag";
  		DiscrError["Mapping"] = "mapping";
  	})(DiscrError || (exports.DiscrError = DiscrError = {}));
  }));
  var require_discriminator = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var codegen_1 = require_codegen();
  	var types_1 = require_types();
  	var compile_1 = require_compile();
  	var ref_error_1 = require_ref_error();
  	var util_1 = require_util();
  	exports.default = {
  		keyword: "discriminator",
  		type: "object",
  		schemaType: "object",
  		error: {
  			message: ({ params: { discrError, tagName } }) => discrError === types_1.DiscrError.Tag ? `tag "${tagName}" must be string` : `value of tag "${tagName}" must be in oneOf`,
  			params: ({ params: { discrError, tag, tagName } }) => (0, codegen_1._)`{error: ${discrError}, tag: ${tagName}, tagValue: ${tag}}`
  		},
  		code(cxt) {
  			const { gen, data, schema, parentSchema, it } = cxt;
  			const { oneOf } = parentSchema;
  			if (!it.opts.discriminator) throw new Error("discriminator: requires discriminator option");
  			const tagName = schema.propertyName;
  			if (typeof tagName != "string") throw new Error("discriminator: requires propertyName");
  			if (schema.mapping) throw new Error("discriminator: mapping is not supported");
  			if (!oneOf) throw new Error("discriminator: requires oneOf keyword");
  			const valid = gen.let("valid", false);
  			const tag = gen.const("tag", (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(tagName)}`);
  			gen.if((0, codegen_1._)`typeof ${tag} == "string"`, () => validateMapping(), () => cxt.error(false, {
  				discrError: types_1.DiscrError.Tag,
  				tag,
  				tagName
  			}));
  			cxt.ok(valid);
  			function validateMapping() {
  				const mapping = getMapping();
  				gen.if(false);
  				for (const tagValue in mapping) {
  					gen.elseIf((0, codegen_1._)`${tag} === ${tagValue}`);
  					gen.assign(valid, applyTagSchema(mapping[tagValue]));
  				}
  				gen.else();
  				cxt.error(false, {
  					discrError: types_1.DiscrError.Mapping,
  					tag,
  					tagName
  				});
  				gen.endIf();
  			}
  			function applyTagSchema(schemaProp) {
  				const _valid = gen.name("valid");
  				const schCxt = cxt.subschema({
  					keyword: "oneOf",
  					schemaProp
  				}, _valid);
  				cxt.mergeEvaluated(schCxt, codegen_1.Name);
  				return _valid;
  			}
  			function getMapping() {
  				var _a;
  				const oneOfMapping = {};
  				const topRequired = hasRequired(parentSchema);
  				let tagRequired = true;
  				for (let i = 0; i < oneOf.length; i++) {
  					let sch = oneOf[i];
  					if ((sch === null || sch === void 0 ? void 0 : sch.$ref) && !(0, util_1.schemaHasRulesButRef)(sch, it.self.RULES)) {
  						const ref = sch.$ref;
  						sch = compile_1.resolveRef.call(it.self, it.schemaEnv.root, it.baseId, ref);
  						if (sch instanceof compile_1.SchemaEnv) sch = sch.schema;
  						if (sch === void 0) throw new ref_error_1.default(it.opts.uriResolver, it.baseId, ref);
  					}
  					const propSch = (_a = sch === null || sch === void 0 ? void 0 : sch.properties) === null || _a === void 0 ? void 0 : _a[tagName];
  					if (typeof propSch != "object") throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${tagName}"`);
  					tagRequired = tagRequired && (topRequired || hasRequired(sch));
  					addMappings(propSch, i);
  				}
  				if (!tagRequired) throw new Error(`discriminator: "${tagName}" must be required`);
  				return oneOfMapping;
  				function hasRequired({ required }) {
  					return Array.isArray(required) && required.includes(tagName);
  				}
  				function addMappings(sch, i) {
  					if (sch.const) addMapping(sch.const, i);
  					else if (sch.enum) for (const tagValue of sch.enum) addMapping(tagValue, i);
  					else throw new Error(`discriminator: "properties/${tagName}" must have "const" or "enum"`);
  				}
  				function addMapping(tagValue, i) {
  					if (typeof tagValue != "string" || tagValue in oneOfMapping) throw new Error(`discriminator: "${tagName}" values must be unique strings`);
  					oneOfMapping[tagValue] = i;
  				}
  			}
  		}
  	};
  }));
  var json_schema_draft_07_exports = /* @__PURE__ */ __exportAll({
  	$id: () => $id$9,
  	$schema: () => $schema$9,
  	default: () => json_schema_draft_07_default,
  	definitions: () => definitions$1,
  	properties: () => properties$8,
  	title: () => title$8,
  	type: () => type$8
  });
  var $schema$9, $id$9, title$8, definitions$1, type$8, properties$8, json_schema_draft_07_default;
  var init_json_schema_draft_07 = __esmMin((() => {
  	$schema$9 = "http://json-schema.org/draft-07/schema#";
  	$id$9 = "http://json-schema.org/draft-07/schema#";
  	title$8 = "Core schema meta-schema";
  	definitions$1 = {
  		"schemaArray": {
  			"type": "array",
  			"minItems": 1,
  			"items": { "$ref": "#" }
  		},
  		"nonNegativeInteger": {
  			"type": "integer",
  			"minimum": 0
  		},
  		"nonNegativeIntegerDefault0": { "allOf": [{ "$ref": "#/definitions/nonNegativeInteger" }, { "default": 0 }] },
  		"simpleTypes": { "enum": [
  			"array",
  			"boolean",
  			"integer",
  			"null",
  			"number",
  			"object",
  			"string"
  		] },
  		"stringArray": {
  			"type": "array",
  			"items": { "type": "string" },
  			"uniqueItems": true,
  			"default": []
  		}
  	};
  	type$8 = ["object", "boolean"];
  	properties$8 = {
  		"$id": {
  			"type": "string",
  			"format": "uri-reference"
  		},
  		"$schema": {
  			"type": "string",
  			"format": "uri"
  		},
  		"$ref": {
  			"type": "string",
  			"format": "uri-reference"
  		},
  		"$comment": { "type": "string" },
  		"title": { "type": "string" },
  		"description": { "type": "string" },
  		"default": true,
  		"readOnly": {
  			"type": "boolean",
  			"default": false
  		},
  		"examples": {
  			"type": "array",
  			"items": true
  		},
  		"multipleOf": {
  			"type": "number",
  			"exclusiveMinimum": 0
  		},
  		"maximum": { "type": "number" },
  		"exclusiveMaximum": { "type": "number" },
  		"minimum": { "type": "number" },
  		"exclusiveMinimum": { "type": "number" },
  		"maxLength": { "$ref": "#/definitions/nonNegativeInteger" },
  		"minLength": { "$ref": "#/definitions/nonNegativeIntegerDefault0" },
  		"pattern": {
  			"type": "string",
  			"format": "regex"
  		},
  		"additionalItems": { "$ref": "#" },
  		"items": {
  			"anyOf": [{ "$ref": "#" }, { "$ref": "#/definitions/schemaArray" }],
  			"default": true
  		},
  		"maxItems": { "$ref": "#/definitions/nonNegativeInteger" },
  		"minItems": { "$ref": "#/definitions/nonNegativeIntegerDefault0" },
  		"uniqueItems": {
  			"type": "boolean",
  			"default": false
  		},
  		"contains": { "$ref": "#" },
  		"maxProperties": { "$ref": "#/definitions/nonNegativeInteger" },
  		"minProperties": { "$ref": "#/definitions/nonNegativeIntegerDefault0" },
  		"required": { "$ref": "#/definitions/stringArray" },
  		"additionalProperties": { "$ref": "#" },
  		"definitions": {
  			"type": "object",
  			"additionalProperties": { "$ref": "#" },
  			"default": {}
  		},
  		"properties": {
  			"type": "object",
  			"additionalProperties": { "$ref": "#" },
  			"default": {}
  		},
  		"patternProperties": {
  			"type": "object",
  			"additionalProperties": { "$ref": "#" },
  			"propertyNames": { "format": "regex" },
  			"default": {}
  		},
  		"dependencies": {
  			"type": "object",
  			"additionalProperties": { "anyOf": [{ "$ref": "#" }, { "$ref": "#/definitions/stringArray" }] }
  		},
  		"propertyNames": { "$ref": "#" },
  		"const": true,
  		"enum": {
  			"type": "array",
  			"items": true,
  			"minItems": 1,
  			"uniqueItems": true
  		},
  		"type": { "anyOf": [{ "$ref": "#/definitions/simpleTypes" }, {
  			"type": "array",
  			"items": { "$ref": "#/definitions/simpleTypes" },
  			"minItems": 1,
  			"uniqueItems": true
  		}] },
  		"format": { "type": "string" },
  		"contentMediaType": { "type": "string" },
  		"contentEncoding": { "type": "string" },
  		"if": { "$ref": "#" },
  		"then": { "$ref": "#" },
  		"else": { "$ref": "#" },
  		"allOf": { "$ref": "#/definitions/schemaArray" },
  		"anyOf": { "$ref": "#/definitions/schemaArray" },
  		"oneOf": { "$ref": "#/definitions/schemaArray" },
  		"not": { "$ref": "#" }
  	};
  	json_schema_draft_07_default = {
  		$schema: $schema$9,
  		$id: $id$9,
  		title: title$8,
  		definitions: definitions$1,
  		type: type$8,
  		properties: properties$8,
  		"default": true
  	};
  }));
  var require_ajv = /* @__PURE__ */ __commonJSMin(((exports, module) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.MissingRefError = exports.ValidationError = exports.CodeGen = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.KeywordCxt = exports.Ajv = void 0;
  	var core_1 = require_core$1();
  	var draft7_1 = require_draft7();
  	var discriminator_1 = require_discriminator();
  	var draft7MetaSchema = (init_json_schema_draft_07(), __toCommonJS(json_schema_draft_07_exports).default);
  	var META_SUPPORT_DATA = ["/properties"];
  	var META_SCHEMA_ID = "http://json-schema.org/draft-07/schema";
  	var Ajv = class extends core_1.default {
  		_addVocabularies() {
  			super._addVocabularies();
  			draft7_1.default.forEach((v) => this.addVocabulary(v));
  			if (this.opts.discriminator) this.addKeyword(discriminator_1.default);
  		}
  		_addDefaultMetaSchema() {
  			super._addDefaultMetaSchema();
  			if (!this.opts.meta) return;
  			const metaSchema = this.opts.$data ? this.$dataMetaSchema(draft7MetaSchema, META_SUPPORT_DATA) : draft7MetaSchema;
  			this.addMetaSchema(metaSchema, META_SCHEMA_ID, false);
  			this.refs["http://json-schema.org/schema"] = META_SCHEMA_ID;
  		}
  		defaultMeta() {
  			return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(META_SCHEMA_ID) ? META_SCHEMA_ID : void 0);
  		}
  	};
  	exports.Ajv = Ajv;
  	module.exports = exports = Ajv;
  	module.exports.Ajv = Ajv;
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.default = Ajv;
  	var validate_1 = require_validate();
  	Object.defineProperty(exports, "KeywordCxt", {
  		enumerable: true,
  		get: function() {
  			return validate_1.KeywordCxt;
  		}
  	});
  	var codegen_1 = require_codegen();
  	Object.defineProperty(exports, "_", {
  		enumerable: true,
  		get: function() {
  			return codegen_1._;
  		}
  	});
  	Object.defineProperty(exports, "str", {
  		enumerable: true,
  		get: function() {
  			return codegen_1.str;
  		}
  	});
  	Object.defineProperty(exports, "stringify", {
  		enumerable: true,
  		get: function() {
  			return codegen_1.stringify;
  		}
  	});
  	Object.defineProperty(exports, "nil", {
  		enumerable: true,
  		get: function() {
  			return codegen_1.nil;
  		}
  	});
  	Object.defineProperty(exports, "Name", {
  		enumerable: true,
  		get: function() {
  			return codegen_1.Name;
  		}
  	});
  	Object.defineProperty(exports, "CodeGen", {
  		enumerable: true,
  		get: function() {
  			return codegen_1.CodeGen;
  		}
  	});
  	var validation_error_1 = require_validation_error();
  	Object.defineProperty(exports, "ValidationError", {
  		enumerable: true,
  		get: function() {
  			return validation_error_1.default;
  		}
  	});
  	var ref_error_1 = require_ref_error();
  	Object.defineProperty(exports, "MissingRefError", {
  		enumerable: true,
  		get: function() {
  			return ref_error_1.default;
  		}
  	});
  }));
  var require_dynamicAnchor = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.dynamicAnchor = void 0;
  	var codegen_1 = require_codegen();
  	var names_1 = require_names();
  	var compile_1 = require_compile();
  	var ref_1 = require_ref();
  	var def = {
  		keyword: "$dynamicAnchor",
  		schemaType: "string",
  		code: (cxt) => dynamicAnchor(cxt, cxt.schema)
  	};
  	function dynamicAnchor(cxt, anchor) {
  		const { gen, it } = cxt;
  		it.schemaEnv.root.dynamicAnchors[anchor] = true;
  		const v = (0, codegen_1._)`${names_1.default.dynamicAnchors}${(0, codegen_1.getProperty)(anchor)}`;
  		const validate = it.errSchemaPath === "#" ? it.validateName : _getValidate(cxt);
  		gen.if((0, codegen_1._)`!${v}`, () => gen.assign(v, validate));
  	}
  	exports.dynamicAnchor = dynamicAnchor;
  	function _getValidate(cxt) {
  		const { schemaEnv, schema, self } = cxt.it;
  		const { root, baseId, localRefs, meta } = schemaEnv.root;
  		const { schemaId } = self.opts;
  		const sch = new compile_1.SchemaEnv({
  			schema,
  			schemaId,
  			root,
  			baseId,
  			localRefs,
  			meta
  		});
  		compile_1.compileSchema.call(self, sch);
  		return (0, ref_1.getValidate)(cxt, sch);
  	}
  	exports.default = def;
  }));
  var require_dynamicRef = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.dynamicRef = void 0;
  	var codegen_1 = require_codegen();
  	var names_1 = require_names();
  	var ref_1 = require_ref();
  	var def = {
  		keyword: "$dynamicRef",
  		schemaType: "string",
  		code: (cxt) => dynamicRef(cxt, cxt.schema)
  	};
  	function dynamicRef(cxt, ref) {
  		const { gen, keyword, it } = cxt;
  		if (ref[0] !== "#") throw new Error(`"${keyword}" only supports hash fragment reference`);
  		const anchor = ref.slice(1);
  		if (it.allErrors) _dynamicRef();
  		else {
  			const valid = gen.let("valid", false);
  			_dynamicRef(valid);
  			cxt.ok(valid);
  		}
  		function _dynamicRef(valid) {
  			if (it.schemaEnv.root.dynamicAnchors[anchor]) {
  				const v = gen.let("_v", (0, codegen_1._)`${names_1.default.dynamicAnchors}${(0, codegen_1.getProperty)(anchor)}`);
  				gen.if(v, _callRef(v, valid), _callRef(it.validateName, valid));
  			} else _callRef(it.validateName, valid)();
  		}
  		function _callRef(validate, valid) {
  			return valid ? () => gen.block(() => {
  				(0, ref_1.callRef)(cxt, validate);
  				gen.let(valid, true);
  			}) : () => (0, ref_1.callRef)(cxt, validate);
  		}
  	}
  	exports.dynamicRef = dynamicRef;
  	exports.default = def;
  }));
  var require_recursiveAnchor = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var dynamicAnchor_1 = require_dynamicAnchor();
  	var util_1 = require_util();
  	exports.default = {
  		keyword: "$recursiveAnchor",
  		schemaType: "boolean",
  		code(cxt) {
  			if (cxt.schema) (0, dynamicAnchor_1.dynamicAnchor)(cxt, "");
  			else (0, util_1.checkStrictMode)(cxt.it, "$recursiveAnchor: false is ignored");
  		}
  	};
  }));
  var require_recursiveRef = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var dynamicRef_1 = require_dynamicRef();
  	exports.default = {
  		keyword: "$recursiveRef",
  		schemaType: "string",
  		code: (cxt) => (0, dynamicRef_1.dynamicRef)(cxt, cxt.schema)
  	};
  }));
  var require_dynamic = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var dynamicAnchor_1 = require_dynamicAnchor();
  	var dynamicRef_1 = require_dynamicRef();
  	var recursiveAnchor_1 = require_recursiveAnchor();
  	var recursiveRef_1 = require_recursiveRef();
  	exports.default = [
  		dynamicAnchor_1.default,
  		dynamicRef_1.default,
  		recursiveAnchor_1.default,
  		recursiveRef_1.default
  	];
  }));
  var require_dependentRequired = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var dependencies_1 = require_dependencies();
  	exports.default = {
  		keyword: "dependentRequired",
  		type: "object",
  		schemaType: "object",
  		error: dependencies_1.error,
  		code: (cxt) => (0, dependencies_1.validatePropertyDeps)(cxt)
  	};
  }));
  var require_dependentSchemas = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var dependencies_1 = require_dependencies();
  	exports.default = {
  		keyword: "dependentSchemas",
  		type: "object",
  		schemaType: "object",
  		code: (cxt) => (0, dependencies_1.validateSchemaDeps)(cxt)
  	};
  }));
  var require_limitContains = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var util_1 = require_util();
  	exports.default = {
  		keyword: ["maxContains", "minContains"],
  		type: "array",
  		schemaType: "number",
  		code({ keyword, parentSchema, it }) {
  			if (parentSchema.contains === void 0) (0, util_1.checkStrictMode)(it, `"${keyword}" without "contains" is ignored`);
  		}
  	};
  }));
  var require_next = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var dependentRequired_1 = require_dependentRequired();
  	var dependentSchemas_1 = require_dependentSchemas();
  	var limitContains_1 = require_limitContains();
  	exports.default = [
  		dependentRequired_1.default,
  		dependentSchemas_1.default,
  		limitContains_1.default
  	];
  }));
  var require_unevaluatedProperties = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	var names_1 = require_names();
  	exports.default = {
  		keyword: "unevaluatedProperties",
  		type: "object",
  		schemaType: ["boolean", "object"],
  		trackErrors: true,
  		error: {
  			message: "must NOT have unevaluated properties",
  			params: ({ params }) => (0, codegen_1._)`{unevaluatedProperty: ${params.unevaluatedProperty}}`
  		},
  		code(cxt) {
  			const { gen, schema, data, errsCount, it } = cxt;
  			/* istanbul ignore if */
  			if (!errsCount) throw new Error("ajv implementation error");
  			const { allErrors, props } = it;
  			if (props instanceof codegen_1.Name) gen.if((0, codegen_1._)`${props} !== true`, () => gen.forIn("key", data, (key) => gen.if(unevaluatedDynamic(props, key), () => unevaluatedPropCode(key))));
  			else if (props !== true) gen.forIn("key", data, (key) => props === void 0 ? unevaluatedPropCode(key) : gen.if(unevaluatedStatic(props, key), () => unevaluatedPropCode(key)));
  			it.props = true;
  			cxt.ok((0, codegen_1._)`${errsCount} === ${names_1.default.errors}`);
  			function unevaluatedPropCode(key) {
  				if (schema === false) {
  					cxt.setParams({ unevaluatedProperty: key });
  					cxt.error();
  					if (!allErrors) gen.break();
  					return;
  				}
  				if (!(0, util_1.alwaysValidSchema)(it, schema)) {
  					const valid = gen.name("valid");
  					cxt.subschema({
  						keyword: "unevaluatedProperties",
  						dataProp: key,
  						dataPropType: util_1.Type.Str
  					}, valid);
  					if (!allErrors) gen.if((0, codegen_1.not)(valid), () => gen.break());
  				}
  			}
  			function unevaluatedDynamic(evaluatedProps, key) {
  				return (0, codegen_1._)`!${evaluatedProps} || !${evaluatedProps}[${key}]`;
  			}
  			function unevaluatedStatic(evaluatedProps, key) {
  				const ps = [];
  				for (const p in evaluatedProps) if (evaluatedProps[p] === true) ps.push((0, codegen_1._)`${key} !== ${p}`);
  				return (0, codegen_1.and)(...ps);
  			}
  		}
  	};
  }));
  var require_unevaluatedItems = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	exports.default = {
  		keyword: "unevaluatedItems",
  		type: "array",
  		schemaType: ["boolean", "object"],
  		error: {
  			message: ({ params: { len } }) => (0, codegen_1.str)`must NOT have more than ${len} items`,
  			params: ({ params: { len } }) => (0, codegen_1._)`{limit: ${len}}`
  		},
  		code(cxt) {
  			const { gen, schema, data, it } = cxt;
  			const items = it.items || 0;
  			if (items === true) return;
  			const len = gen.const("len", (0, codegen_1._)`${data}.length`);
  			if (schema === false) {
  				cxt.setParams({ len: items });
  				cxt.fail((0, codegen_1._)`${len} > ${items}`);
  			} else if (typeof schema == "object" && !(0, util_1.alwaysValidSchema)(it, schema)) {
  				const valid = gen.var("valid", (0, codegen_1._)`${len} <= ${items}`);
  				gen.if((0, codegen_1.not)(valid), () => validateItems(valid, items));
  				cxt.ok(valid);
  			}
  			it.items = true;
  			function validateItems(valid, from) {
  				gen.forRange("i", from, len, (i) => {
  					cxt.subschema({
  						keyword: "unevaluatedItems",
  						dataProp: i,
  						dataPropType: util_1.Type.Num
  					}, valid);
  					if (!it.allErrors) gen.if((0, codegen_1.not)(valid), () => gen.break());
  				});
  			}
  		}
  	};
  }));
  var require_unevaluated = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var unevaluatedProperties_1 = require_unevaluatedProperties();
  	var unevaluatedItems_1 = require_unevaluatedItems();
  	exports.default = [unevaluatedProperties_1.default, unevaluatedItems_1.default];
  }));
  var require_draft2020 = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var core_1 = require_core();
  	var validation_1 = require_validation();
  	var applicator_1 = require_applicator();
  	var dynamic_1 = require_dynamic();
  	var next_1 = require_next();
  	var unevaluated_1 = require_unevaluated();
  	var format_1 = require_format();
  	var metadata_1 = require_metadata();
  	exports.default = [
  		dynamic_1.default,
  		core_1.default,
  		validation_1.default,
  		(0, applicator_1.default)(true),
  		format_1.default,
  		metadata_1.metadataVocabulary,
  		metadata_1.contentVocabulary,
  		next_1.default,
  		unevaluated_1.default
  	];
  }));
  var schema_exports = /* @__PURE__ */ __exportAll({
  	$comment: () => $comment,
  	$dynamicAnchor: () => $dynamicAnchor$7,
  	$id: () => $id$8,
  	$schema: () => $schema$8,
  	$vocabulary: () => $vocabulary$7,
  	allOf: () => allOf,
  	default: () => schema_default,
  	properties: () => properties$7,
  	title: () => title$7,
  	type: () => type$7
  });
  var $schema$8, $id$8, $vocabulary$7, $dynamicAnchor$7, title$7, allOf, type$7, $comment, properties$7, schema_default;
  var init_schema = __esmMin((() => {
  	$schema$8 = "https://json-schema.org/draft/2020-12/schema";
  	$id$8 = "https://json-schema.org/draft/2020-12/schema";
  	$vocabulary$7 = {
  		"https://json-schema.org/draft/2020-12/vocab/core": true,
  		"https://json-schema.org/draft/2020-12/vocab/applicator": true,
  		"https://json-schema.org/draft/2020-12/vocab/unevaluated": true,
  		"https://json-schema.org/draft/2020-12/vocab/validation": true,
  		"https://json-schema.org/draft/2020-12/vocab/meta-data": true,
  		"https://json-schema.org/draft/2020-12/vocab/format-annotation": true,
  		"https://json-schema.org/draft/2020-12/vocab/content": true
  	};
  	$dynamicAnchor$7 = "meta";
  	title$7 = "Core and Validation specifications meta-schema";
  	allOf = [
  		{ "$ref": "meta/core" },
  		{ "$ref": "meta/applicator" },
  		{ "$ref": "meta/unevaluated" },
  		{ "$ref": "meta/validation" },
  		{ "$ref": "meta/meta-data" },
  		{ "$ref": "meta/format-annotation" },
  		{ "$ref": "meta/content" }
  	];
  	type$7 = ["object", "boolean"];
  	$comment = "This meta-schema also defines keywords that have appeared in previous drafts in order to prevent incompatible extensions as they remain in common use.";
  	properties$7 = {
  		"definitions": {
  			"$comment": "\"definitions\" has been replaced by \"$defs\".",
  			"type": "object",
  			"additionalProperties": { "$dynamicRef": "#meta" },
  			"deprecated": true,
  			"default": {}
  		},
  		"dependencies": {
  			"$comment": "\"dependencies\" has been split and replaced by \"dependentSchemas\" and \"dependentRequired\" in order to serve their differing semantics.",
  			"type": "object",
  			"additionalProperties": { "anyOf": [{ "$dynamicRef": "#meta" }, { "$ref": "meta/validation#/$defs/stringArray" }] },
  			"deprecated": true,
  			"default": {}
  		},
  		"$recursiveAnchor": {
  			"$comment": "\"$recursiveAnchor\" has been replaced by \"$dynamicAnchor\".",
  			"$ref": "meta/core#/$defs/anchorString",
  			"deprecated": true
  		},
  		"$recursiveRef": {
  			"$comment": "\"$recursiveRef\" has been replaced by \"$dynamicRef\".",
  			"$ref": "meta/core#/$defs/uriReferenceString",
  			"deprecated": true
  		}
  	};
  	schema_default = {
  		$schema: $schema$8,
  		$id: $id$8,
  		$vocabulary: $vocabulary$7,
  		$dynamicAnchor: $dynamicAnchor$7,
  		title: title$7,
  		allOf,
  		type: type$7,
  		$comment,
  		properties: properties$7
  	};
  }));
  var applicator_exports = /* @__PURE__ */ __exportAll({
  	$defs: () => $defs$3,
  	$dynamicAnchor: () => $dynamicAnchor$6,
  	$id: () => $id$7,
  	$schema: () => $schema$7,
  	$vocabulary: () => $vocabulary$6,
  	default: () => applicator_default,
  	properties: () => properties$6,
  	title: () => title$6,
  	type: () => type$6
  });
  var $schema$7, $id$7, $vocabulary$6, $dynamicAnchor$6, title$6, type$6, properties$6, $defs$3, applicator_default;
  var init_applicator = __esmMin((() => {
  	$schema$7 = "https://json-schema.org/draft/2020-12/schema";
  	$id$7 = "https://json-schema.org/draft/2020-12/meta/applicator";
  	$vocabulary$6 = { "https://json-schema.org/draft/2020-12/vocab/applicator": true };
  	$dynamicAnchor$6 = "meta";
  	title$6 = "Applicator vocabulary meta-schema";
  	type$6 = ["object", "boolean"];
  	properties$6 = {
  		"prefixItems": { "$ref": "#/$defs/schemaArray" },
  		"items": { "$dynamicRef": "#meta" },
  		"contains": { "$dynamicRef": "#meta" },
  		"additionalProperties": { "$dynamicRef": "#meta" },
  		"properties": {
  			"type": "object",
  			"additionalProperties": { "$dynamicRef": "#meta" },
  			"default": {}
  		},
  		"patternProperties": {
  			"type": "object",
  			"additionalProperties": { "$dynamicRef": "#meta" },
  			"propertyNames": { "format": "regex" },
  			"default": {}
  		},
  		"dependentSchemas": {
  			"type": "object",
  			"additionalProperties": { "$dynamicRef": "#meta" },
  			"default": {}
  		},
  		"propertyNames": { "$dynamicRef": "#meta" },
  		"if": { "$dynamicRef": "#meta" },
  		"then": { "$dynamicRef": "#meta" },
  		"else": { "$dynamicRef": "#meta" },
  		"allOf": { "$ref": "#/$defs/schemaArray" },
  		"anyOf": { "$ref": "#/$defs/schemaArray" },
  		"oneOf": { "$ref": "#/$defs/schemaArray" },
  		"not": { "$dynamicRef": "#meta" }
  	};
  	$defs$3 = { "schemaArray": {
  		"type": "array",
  		"minItems": 1,
  		"items": { "$dynamicRef": "#meta" }
  	} };
  	applicator_default = {
  		$schema: $schema$7,
  		$id: $id$7,
  		$vocabulary: $vocabulary$6,
  		$dynamicAnchor: $dynamicAnchor$6,
  		title: title$6,
  		type: type$6,
  		properties: properties$6,
  		$defs: $defs$3
  	};
  }));
  var unevaluated_exports = /* @__PURE__ */ __exportAll({
  	$dynamicAnchor: () => $dynamicAnchor$5,
  	$id: () => $id$6,
  	$schema: () => $schema$6,
  	$vocabulary: () => $vocabulary$5,
  	default: () => unevaluated_default,
  	properties: () => properties$5,
  	title: () => title$5,
  	type: () => type$5
  });
  var $schema$6, $id$6, $vocabulary$5, $dynamicAnchor$5, title$5, type$5, properties$5, unevaluated_default;
  var init_unevaluated = __esmMin((() => {
  	$schema$6 = "https://json-schema.org/draft/2020-12/schema";
  	$id$6 = "https://json-schema.org/draft/2020-12/meta/unevaluated";
  	$vocabulary$5 = { "https://json-schema.org/draft/2020-12/vocab/unevaluated": true };
  	$dynamicAnchor$5 = "meta";
  	title$5 = "Unevaluated applicator vocabulary meta-schema";
  	type$5 = ["object", "boolean"];
  	properties$5 = {
  		"unevaluatedItems": { "$dynamicRef": "#meta" },
  		"unevaluatedProperties": { "$dynamicRef": "#meta" }
  	};
  	unevaluated_default = {
  		$schema: $schema$6,
  		$id: $id$6,
  		$vocabulary: $vocabulary$5,
  		$dynamicAnchor: $dynamicAnchor$5,
  		title: title$5,
  		type: type$5,
  		properties: properties$5
  	};
  }));
  var content_exports = /* @__PURE__ */ __exportAll({
  	$dynamicAnchor: () => $dynamicAnchor$4,
  	$id: () => $id$5,
  	$schema: () => $schema$5,
  	$vocabulary: () => $vocabulary$4,
  	default: () => content_default,
  	properties: () => properties$4,
  	title: () => title$4,
  	type: () => type$4
  });
  var $schema$5, $id$5, $vocabulary$4, $dynamicAnchor$4, title$4, type$4, properties$4, content_default;
  var init_content = __esmMin((() => {
  	$schema$5 = "https://json-schema.org/draft/2020-12/schema";
  	$id$5 = "https://json-schema.org/draft/2020-12/meta/content";
  	$vocabulary$4 = { "https://json-schema.org/draft/2020-12/vocab/content": true };
  	$dynamicAnchor$4 = "meta";
  	title$4 = "Content vocabulary meta-schema";
  	type$4 = ["object", "boolean"];
  	properties$4 = {
  		"contentEncoding": { "type": "string" },
  		"contentMediaType": { "type": "string" },
  		"contentSchema": { "$dynamicRef": "#meta" }
  	};
  	content_default = {
  		$schema: $schema$5,
  		$id: $id$5,
  		$vocabulary: $vocabulary$4,
  		$dynamicAnchor: $dynamicAnchor$4,
  		title: title$4,
  		type: type$4,
  		properties: properties$4
  	};
  }));
  var core_exports = /* @__PURE__ */ __exportAll({
  	$defs: () => $defs$2,
  	$dynamicAnchor: () => $dynamicAnchor$3,
  	$id: () => $id$4,
  	$schema: () => $schema$4,
  	$vocabulary: () => $vocabulary$3,
  	default: () => core_default,
  	properties: () => properties$3,
  	title: () => title$3,
  	type: () => type$3
  });
  var $schema$4, $id$4, $vocabulary$3, $dynamicAnchor$3, title$3, type$3, properties$3, $defs$2, core_default;
  var init_core = __esmMin((() => {
  	$schema$4 = "https://json-schema.org/draft/2020-12/schema";
  	$id$4 = "https://json-schema.org/draft/2020-12/meta/core";
  	$vocabulary$3 = { "https://json-schema.org/draft/2020-12/vocab/core": true };
  	$dynamicAnchor$3 = "meta";
  	title$3 = "Core vocabulary meta-schema";
  	type$3 = ["object", "boolean"];
  	properties$3 = {
  		"$id": {
  			"$ref": "#/$defs/uriReferenceString",
  			"$comment": "Non-empty fragments not allowed.",
  			"pattern": "^[^#]*#?$"
  		},
  		"$schema": { "$ref": "#/$defs/uriString" },
  		"$ref": { "$ref": "#/$defs/uriReferenceString" },
  		"$anchor": { "$ref": "#/$defs/anchorString" },
  		"$dynamicRef": { "$ref": "#/$defs/uriReferenceString" },
  		"$dynamicAnchor": { "$ref": "#/$defs/anchorString" },
  		"$vocabulary": {
  			"type": "object",
  			"propertyNames": { "$ref": "#/$defs/uriString" },
  			"additionalProperties": { "type": "boolean" }
  		},
  		"$comment": { "type": "string" },
  		"$defs": {
  			"type": "object",
  			"additionalProperties": { "$dynamicRef": "#meta" }
  		}
  	};
  	$defs$2 = {
  		"anchorString": {
  			"type": "string",
  			"pattern": "^[A-Za-z_][-A-Za-z0-9._]*$"
  		},
  		"uriString": {
  			"type": "string",
  			"format": "uri"
  		},
  		"uriReferenceString": {
  			"type": "string",
  			"format": "uri-reference"
  		}
  	};
  	core_default = {
  		$schema: $schema$4,
  		$id: $id$4,
  		$vocabulary: $vocabulary$3,
  		$dynamicAnchor: $dynamicAnchor$3,
  		title: title$3,
  		type: type$3,
  		properties: properties$3,
  		$defs: $defs$2
  	};
  }));
  var format_annotation_exports = /* @__PURE__ */ __exportAll({
  	$dynamicAnchor: () => $dynamicAnchor$2,
  	$id: () => $id$3,
  	$schema: () => $schema$3,
  	$vocabulary: () => $vocabulary$2,
  	default: () => format_annotation_default,
  	properties: () => properties$2,
  	title: () => title$2,
  	type: () => type$2
  });
  var $schema$3, $id$3, $vocabulary$2, $dynamicAnchor$2, title$2, type$2, properties$2, format_annotation_default;
  var init_format_annotation = __esmMin((() => {
  	$schema$3 = "https://json-schema.org/draft/2020-12/schema";
  	$id$3 = "https://json-schema.org/draft/2020-12/meta/format-annotation";
  	$vocabulary$2 = { "https://json-schema.org/draft/2020-12/vocab/format-annotation": true };
  	$dynamicAnchor$2 = "meta";
  	title$2 = "Format vocabulary meta-schema for annotation results";
  	type$2 = ["object", "boolean"];
  	properties$2 = { "format": { "type": "string" } };
  	format_annotation_default = {
  		$schema: $schema$3,
  		$id: $id$3,
  		$vocabulary: $vocabulary$2,
  		$dynamicAnchor: $dynamicAnchor$2,
  		title: title$2,
  		type: type$2,
  		properties: properties$2
  	};
  }));
  var meta_data_exports = /* @__PURE__ */ __exportAll({
  	$dynamicAnchor: () => $dynamicAnchor$1,
  	$id: () => $id$2,
  	$schema: () => $schema$2,
  	$vocabulary: () => $vocabulary$1,
  	default: () => meta_data_default,
  	properties: () => properties$1,
  	title: () => title$1,
  	type: () => type$1
  });
  var $schema$2, $id$2, $vocabulary$1, $dynamicAnchor$1, title$1, type$1, properties$1, meta_data_default;
  var init_meta_data = __esmMin((() => {
  	$schema$2 = "https://json-schema.org/draft/2020-12/schema";
  	$id$2 = "https://json-schema.org/draft/2020-12/meta/meta-data";
  	$vocabulary$1 = { "https://json-schema.org/draft/2020-12/vocab/meta-data": true };
  	$dynamicAnchor$1 = "meta";
  	title$1 = "Meta-data vocabulary meta-schema";
  	type$1 = ["object", "boolean"];
  	properties$1 = {
  		"title": { "type": "string" },
  		"description": { "type": "string" },
  		"default": true,
  		"deprecated": {
  			"type": "boolean",
  			"default": false
  		},
  		"readOnly": {
  			"type": "boolean",
  			"default": false
  		},
  		"writeOnly": {
  			"type": "boolean",
  			"default": false
  		},
  		"examples": {
  			"type": "array",
  			"items": true
  		}
  	};
  	meta_data_default = {
  		$schema: $schema$2,
  		$id: $id$2,
  		$vocabulary: $vocabulary$1,
  		$dynamicAnchor: $dynamicAnchor$1,
  		title: title$1,
  		type: type$1,
  		properties: properties$1
  	};
  }));
  var validation_exports = /* @__PURE__ */ __exportAll({
  	$defs: () => $defs$1,
  	$dynamicAnchor: () => $dynamicAnchor,
  	$id: () => $id$1,
  	$schema: () => $schema$1,
  	$vocabulary: () => $vocabulary,
  	default: () => validation_default,
  	properties: () => properties,
  	title: () => title,
  	type: () => type
  });
  var $schema$1, $id$1, $vocabulary, $dynamicAnchor, title, type, properties, $defs$1, validation_default;
  var init_validation = __esmMin((() => {
  	$schema$1 = "https://json-schema.org/draft/2020-12/schema";
  	$id$1 = "https://json-schema.org/draft/2020-12/meta/validation";
  	$vocabulary = { "https://json-schema.org/draft/2020-12/vocab/validation": true };
  	$dynamicAnchor = "meta";
  	title = "Validation vocabulary meta-schema";
  	type = ["object", "boolean"];
  	properties = {
  		"type": { "anyOf": [{ "$ref": "#/$defs/simpleTypes" }, {
  			"type": "array",
  			"items": { "$ref": "#/$defs/simpleTypes" },
  			"minItems": 1,
  			"uniqueItems": true
  		}] },
  		"const": true,
  		"enum": {
  			"type": "array",
  			"items": true
  		},
  		"multipleOf": {
  			"type": "number",
  			"exclusiveMinimum": 0
  		},
  		"maximum": { "type": "number" },
  		"exclusiveMaximum": { "type": "number" },
  		"minimum": { "type": "number" },
  		"exclusiveMinimum": { "type": "number" },
  		"maxLength": { "$ref": "#/$defs/nonNegativeInteger" },
  		"minLength": { "$ref": "#/$defs/nonNegativeIntegerDefault0" },
  		"pattern": {
  			"type": "string",
  			"format": "regex"
  		},
  		"maxItems": { "$ref": "#/$defs/nonNegativeInteger" },
  		"minItems": { "$ref": "#/$defs/nonNegativeIntegerDefault0" },
  		"uniqueItems": {
  			"type": "boolean",
  			"default": false
  		},
  		"maxContains": { "$ref": "#/$defs/nonNegativeInteger" },
  		"minContains": {
  			"$ref": "#/$defs/nonNegativeInteger",
  			"default": 1
  		},
  		"maxProperties": { "$ref": "#/$defs/nonNegativeInteger" },
  		"minProperties": { "$ref": "#/$defs/nonNegativeIntegerDefault0" },
  		"required": { "$ref": "#/$defs/stringArray" },
  		"dependentRequired": {
  			"type": "object",
  			"additionalProperties": { "$ref": "#/$defs/stringArray" }
  		}
  	};
  	$defs$1 = {
  		"nonNegativeInteger": {
  			"type": "integer",
  			"minimum": 0
  		},
  		"nonNegativeIntegerDefault0": {
  			"$ref": "#/$defs/nonNegativeInteger",
  			"default": 0
  		},
  		"simpleTypes": { "enum": [
  			"array",
  			"boolean",
  			"integer",
  			"null",
  			"number",
  			"object",
  			"string"
  		] },
  		"stringArray": {
  			"type": "array",
  			"items": { "type": "string" },
  			"uniqueItems": true,
  			"default": []
  		}
  	};
  	validation_default = {
  		$schema: $schema$1,
  		$id: $id$1,
  		$vocabulary,
  		$dynamicAnchor,
  		title,
  		type,
  		properties,
  		$defs: $defs$1
  	};
  }));
  var require_json_schema_2020_12 = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var metaSchema = (init_schema(), __toCommonJS(schema_exports).default);
  	var applicator = (init_applicator(), __toCommonJS(applicator_exports).default);
  	var unevaluated = (init_unevaluated(), __toCommonJS(unevaluated_exports).default);
  	var content = (init_content(), __toCommonJS(content_exports).default);
  	var core = (init_core(), __toCommonJS(core_exports).default);
  	var format = (init_format_annotation(), __toCommonJS(format_annotation_exports).default);
  	var metadata = (init_meta_data(), __toCommonJS(meta_data_exports).default);
  	var validation = (init_validation(), __toCommonJS(validation_exports).default);
  	var META_SUPPORT_DATA = ["/properties"];
  	function addMetaSchema2020($data) {
  		[
  			metaSchema,
  			applicator,
  			unevaluated,
  			content,
  			core,
  			with$data(this, format),
  			metadata,
  			with$data(this, validation)
  		].forEach((sch) => this.addMetaSchema(sch, void 0, false));
  		return this;
  		function with$data(ajv, sch) {
  			return $data ? ajv.$dataMetaSchema(sch, META_SUPPORT_DATA) : sch;
  		}
  	}
  	exports.default = addMetaSchema2020;
  }));
  var require__2020 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.MissingRefError = exports.ValidationError = exports.CodeGen = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.KeywordCxt = exports.Ajv2020 = void 0;
  	var core_1 = require_core$1();
  	var draft2020_1 = require_draft2020();
  	var discriminator_1 = require_discriminator();
  	var json_schema_2020_12_1 = require_json_schema_2020_12();
  	var META_SCHEMA_ID = "https://json-schema.org/draft/2020-12/schema";
  	var Ajv2020 = class extends core_1.default {
  		constructor(opts = {}) {
  			super({
  				...opts,
  				dynamicRef: true,
  				next: true,
  				unevaluated: true
  			});
  		}
  		_addVocabularies() {
  			super._addVocabularies();
  			draft2020_1.default.forEach((v) => this.addVocabulary(v));
  			if (this.opts.discriminator) this.addKeyword(discriminator_1.default);
  		}
  		_addDefaultMetaSchema() {
  			super._addDefaultMetaSchema();
  			const { $data, meta } = this.opts;
  			if (!meta) return;
  			json_schema_2020_12_1.default.call(this, $data);
  			this.refs["http://json-schema.org/schema"] = META_SCHEMA_ID;
  		}
  		defaultMeta() {
  			return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(META_SCHEMA_ID) ? META_SCHEMA_ID : void 0);
  		}
  	};
  	exports.Ajv2020 = Ajv2020;
  	module.exports = exports = Ajv2020;
  	module.exports.Ajv2020 = Ajv2020;
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.default = Ajv2020;
  	var validate_1 = require_validate();
  	Object.defineProperty(exports, "KeywordCxt", {
  		enumerable: true,
  		get: function() {
  			return validate_1.KeywordCxt;
  		}
  	});
  	var codegen_1 = require_codegen();
  	Object.defineProperty(exports, "_", {
  		enumerable: true,
  		get: function() {
  			return codegen_1._;
  		}
  	});
  	Object.defineProperty(exports, "str", {
  		enumerable: true,
  		get: function() {
  			return codegen_1.str;
  		}
  	});
  	Object.defineProperty(exports, "stringify", {
  		enumerable: true,
  		get: function() {
  			return codegen_1.stringify;
  		}
  	});
  	Object.defineProperty(exports, "nil", {
  		enumerable: true,
  		get: function() {
  			return codegen_1.nil;
  		}
  	});
  	Object.defineProperty(exports, "Name", {
  		enumerable: true,
  		get: function() {
  			return codegen_1.Name;
  		}
  	});
  	Object.defineProperty(exports, "CodeGen", {
  		enumerable: true,
  		get: function() {
  			return codegen_1.CodeGen;
  		}
  	});
  	var validation_error_1 = require_validation_error();
  	Object.defineProperty(exports, "ValidationError", {
  		enumerable: true,
  		get: function() {
  			return validation_error_1.default;
  		}
  	});
  	var ref_error_1 = require_ref_error();
  	Object.defineProperty(exports, "MissingRefError", {
  		enumerable: true,
  		get: function() {
  			return ref_error_1.default;
  		}
  	});
  }));
  var require_formats = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.formatNames = exports.fastFormats = exports.fullFormats = void 0;
  	function fmtDef(validate, compare) {
  		return {
  			validate,
  			compare
  		};
  	}
  	exports.fullFormats = {
  		date: fmtDef(date, compareDate),
  		time: fmtDef(time, compareTime),
  		"date-time": fmtDef(date_time, compareDateTime),
  		duration: /^P(?!$)((\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?|(\d+W)?)$/,
  		uri,
  		"uri-reference": /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i,
  		"uri-template": /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i,
  		url: /^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu,
  		email: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,
  		hostname: /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i,
  		ipv4: /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/,
  		ipv6: /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i,
  		regex,
  		uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
  		"json-pointer": /^(?:\/(?:[^~/]|~0|~1)*)*$/,
  		"json-pointer-uri-fragment": /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i,
  		"relative-json-pointer": /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/,
  		byte,
  		int32: {
  			type: "number",
  			validate: validateInt32
  		},
  		int64: {
  			type: "number",
  			validate: validateInt64
  		},
  		float: {
  			type: "number",
  			validate: validateNumber
  		},
  		double: {
  			type: "number",
  			validate: validateNumber
  		},
  		password: true,
  		binary: true
  	};
  	exports.fastFormats = {
  		...exports.fullFormats,
  		date: fmtDef(/^\d\d\d\d-[0-1]\d-[0-3]\d$/, compareDate),
  		time: fmtDef(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, compareTime),
  		"date-time": fmtDef(/^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, compareDateTime),
  		uri: /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i,
  		"uri-reference": /^(?:(?:[a-z][a-z0-9+\-.]*:)?\/?\/)?(?:[^\\\s#][^\s#]*)?(?:#[^\\\s]*)?$/i,
  		email: /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i
  	};
  	exports.formatNames = Object.keys(exports.fullFormats);
  	function isLeapYear(year) {
  		return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  	}
  	var DATE = /^(\d\d\d\d)-(\d\d)-(\d\d)$/;
  	var DAYS = [
  		0,
  		31,
  		28,
  		31,
  		30,
  		31,
  		30,
  		31,
  		31,
  		30,
  		31,
  		30,
  		31
  	];
  	function date(str) {
  		const matches = DATE.exec(str);
  		if (!matches) return false;
  		const year = +matches[1];
  		const month = +matches[2];
  		const day = +matches[3];
  		return month >= 1 && month <= 12 && day >= 1 && day <= (month === 2 && isLeapYear(year) ? 29 : DAYS[month]);
  	}
  	function compareDate(d1, d2) {
  		if (!(d1 && d2)) return void 0;
  		if (d1 > d2) return 1;
  		if (d1 < d2) return -1;
  		return 0;
  	}
  	var TIME = /^(\d\d):(\d\d):(\d\d)(\.\d+)?(z|[+-]\d\d(?::?\d\d)?)?$/i;
  	function time(str, withTimeZone) {
  		const matches = TIME.exec(str);
  		if (!matches) return false;
  		const hour = +matches[1];
  		const minute = +matches[2];
  		const second = +matches[3];
  		const timeZone = matches[5];
  		return (hour <= 23 && minute <= 59 && second <= 59 || hour === 23 && minute === 59 && second === 60) && (!withTimeZone || timeZone !== "");
  	}
  	function compareTime(t1, t2) {
  		if (!(t1 && t2)) return void 0;
  		const a1 = TIME.exec(t1);
  		const a2 = TIME.exec(t2);
  		if (!(a1 && a2)) return void 0;
  		t1 = a1[1] + a1[2] + a1[3] + (a1[4] || "");
  		t2 = a2[1] + a2[2] + a2[3] + (a2[4] || "");
  		if (t1 > t2) return 1;
  		if (t1 < t2) return -1;
  		return 0;
  	}
  	var DATE_TIME_SEPARATOR = /t|\s/i;
  	function date_time(str) {
  		const dateTime = str.split(DATE_TIME_SEPARATOR);
  		return dateTime.length === 2 && date(dateTime[0]) && time(dateTime[1], true);
  	}
  	function compareDateTime(dt1, dt2) {
  		if (!(dt1 && dt2)) return void 0;
  		const [d1, t1] = dt1.split(DATE_TIME_SEPARATOR);
  		const [d2, t2] = dt2.split(DATE_TIME_SEPARATOR);
  		const res = compareDate(d1, d2);
  		if (res === void 0) return void 0;
  		return res || compareTime(t1, t2);
  	}
  	var NOT_URI_FRAGMENT = /\/|:/;
  	var URI = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
  	function uri(str) {
  		return NOT_URI_FRAGMENT.test(str) && URI.test(str);
  	}
  	var BYTE = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/gm;
  	function byte(str) {
  		BYTE.lastIndex = 0;
  		return BYTE.test(str);
  	}
  	var MIN_INT32 = -(2 ** 31);
  	var MAX_INT32 = 2 ** 31 - 1;
  	function validateInt32(value) {
  		return Number.isInteger(value) && value <= MAX_INT32 && value >= MIN_INT32;
  	}
  	function validateInt64(value) {
  		return Number.isInteger(value);
  	}
  	function validateNumber() {
  		return true;
  	}
  	var Z_ANCHOR = /[^\\]\\Z/;
  	function regex(str) {
  		if (Z_ANCHOR.test(str)) return false;
  		try {
  			new RegExp(str);
  			return true;
  		} catch (e) {
  			return false;
  		}
  	}
  }));
  var require_limit = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.formatLimitDefinition = void 0;
  	var ajv_1 = require_ajv();
  	var codegen_1 = require_codegen();
  	var ops = codegen_1.operators;
  	var KWDs = {
  		formatMaximum: {
  			okStr: "<=",
  			ok: ops.LTE,
  			fail: ops.GT
  		},
  		formatMinimum: {
  			okStr: ">=",
  			ok: ops.GTE,
  			fail: ops.LT
  		},
  		formatExclusiveMaximum: {
  			okStr: "<",
  			ok: ops.LT,
  			fail: ops.GTE
  		},
  		formatExclusiveMinimum: {
  			okStr: ">",
  			ok: ops.GT,
  			fail: ops.LTE
  		}
  	};
  	exports.formatLimitDefinition = {
  		keyword: Object.keys(KWDs),
  		type: "string",
  		schemaType: "string",
  		$data: true,
  		error: {
  			message: ({ keyword, schemaCode }) => codegen_1.str`should be ${KWDs[keyword].okStr} ${schemaCode}`,
  			params: ({ keyword, schemaCode }) => codegen_1._`{comparison: ${KWDs[keyword].okStr}, limit: ${schemaCode}}`
  		},
  		code(cxt) {
  			const { gen, data, schemaCode, keyword, it } = cxt;
  			const { opts, self } = it;
  			if (!opts.validateFormats) return;
  			const fCxt = new ajv_1.KeywordCxt(it, self.RULES.all.format.definition, "format");
  			if (fCxt.$data) validate$DataFormat();
  			else validateFormat();
  			function validate$DataFormat() {
  				const fmts = gen.scopeValue("formats", {
  					ref: self.formats,
  					code: opts.code.formats
  				});
  				const fmt = gen.const("fmt", codegen_1._`${fmts}[${fCxt.schemaCode}]`);
  				cxt.fail$data(codegen_1.or(codegen_1._`typeof ${fmt} != "object"`, codegen_1._`${fmt} instanceof RegExp`, codegen_1._`typeof ${fmt}.compare != "function"`, compareCode(fmt)));
  			}
  			function validateFormat() {
  				const format = fCxt.schema;
  				const fmtDef = self.formats[format];
  				if (!fmtDef || fmtDef === true) return;
  				if (typeof fmtDef != "object" || fmtDef instanceof RegExp || typeof fmtDef.compare != "function") throw new Error(`"${keyword}": format "${format}" does not define "compare" function`);
  				const fmt = gen.scopeValue("formats", {
  					key: format,
  					ref: fmtDef,
  					code: opts.code.formats ? codegen_1._`${opts.code.formats}${codegen_1.getProperty(format)}` : void 0
  				});
  				cxt.fail$data(compareCode(fmt));
  			}
  			function compareCode(fmt) {
  				return codegen_1._`${fmt}.compare(${data}, ${schemaCode}) ${KWDs[keyword].fail} 0`;
  			}
  		},
  		dependencies: ["format"]
  	};
  	var formatLimitPlugin = (ajv) => {
  		ajv.addKeyword(exports.formatLimitDefinition);
  		return ajv;
  	};
  	exports.default = formatLimitPlugin;
  }));
  var require_dist = /* @__PURE__ */ __commonJSMin(((exports, module) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var formats_1 = require_formats();
  	var limit_1 = require_limit();
  	var codegen_1 = require_codegen();
  	var fullName = new codegen_1.Name("fullFormats");
  	var fastName = new codegen_1.Name("fastFormats");
  	var formatsPlugin = (ajv, opts = { keywords: true }) => {
  		if (Array.isArray(opts)) {
  			addFormats(ajv, opts, formats_1.fullFormats, fullName);
  			return ajv;
  		}
  		const [formats, exportName] = opts.mode === "fast" ? [formats_1.fastFormats, fastName] : [formats_1.fullFormats, fullName];
  		addFormats(ajv, opts.formats || formats_1.formatNames, formats, exportName);
  		if (opts.keywords) limit_1.default(ajv);
  		return ajv;
  	};
  	formatsPlugin.get = (name, mode = "full") => {
  		const f = (mode === "fast" ? formats_1.fastFormats : formats_1.fullFormats)[name];
  		if (!f) throw new Error(`Unknown format "${name}"`);
  		return f;
  	};
  	function addFormats(ajv, list, fs, exportName) {
  		var _a;
  		var _b;
  		(_a = (_b = ajv.opts.code).formats) !== null && _a !== void 0 || (_b.formats = codegen_1._`require("ajv-formats/dist/formats").${exportName}`);
  		for (const f of list) ajv.addFormat(f, fs[f]);
  	}
  	module.exports = exports = formatsPlugin;
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.default = formatsPlugin;
  }));
  var import_ajv = require_ajv();
  var import__2020 = require__2020();
  var import_dist = /* @__PURE__ */ __toESM(require_dist(), 1);
  var import_fast_uri = /* @__PURE__ */ __toESM(require_fast_uri(), 1);
  var DIALECT_07 = "http://json-schema.org/draft-07/schema#";
  var DIALECT_2020 = "https://json-schema.org/draft/2020-12/schema";
  var { parse, resolve, normalize } = import_fast_uri.default;
  var maps = [
  	"$defs",
  	"definitions",
  	"properties",
  	"patternProperties",
  	"dependentSchemas",
  	"dependencies"
  ];
  var singles = [
  	"additionalProperties",
  	"additionalItems",
  	"contains",
  	"propertyNames",
  	"not",
  	"if",
  	"then",
  	"else",
  	"unevaluatedProperties",
  	"unevaluatedItems",
  	"contentSchema"
  ];
  var arrays = [
  	"allOf",
  	"anyOf",
  	"oneOf",
  	"prefixItems"
  ];
  var BundleError = class extends Error {
  	constructor(code) {
  		super("Invalid schema bundle.");
  		this.code = code;
  	}
  };
  function fail(code) {
  	throw new BundleError(code);
  }
  var ownString = (value, name) => {
  	const descriptor = Object.getOwnPropertyDescriptor(value, name);
  	return descriptor && "value" in descriptor && typeof descriptor.value === "string" ? descriptor.value : void 0;
  };
  var freezeIdentity = (identity) => Object.freeze({ ...identity });
  function scopeFor(value) {
  	const fallback = freezeIdentity({
  		ownerId: "unknown",
  		contractId: "unknown",
  		revision: "unknown",
  		variantId: "default"
  	});
  	try {
  		if (!isJsonRecord(value)) return Object.freeze({ identity: fallback });
  		const descriptor = Object.getOwnPropertyDescriptor(value, "identity");
  		const id = descriptor && "value" in descriptor ? descriptor.value : null;
  		if (!isJsonRecord(id)) return Object.freeze({ identity: fallback });
  		const ownerId = ownString(id, "ownerId"), contractId = ownString(id, "contractId");
  		const revision = ownString(id, "revision"), variantId = ownString(id, "variantId");
  		if (ownerId === void 0 || contractId === void 0 || revision === void 0 || variantId === void 0) return Object.freeze({ identity: fallback });
  		return Object.freeze({ identity: freezeIdentity({
  			ownerId,
  			contractId,
  			revision,
  			variantId
  		}) });
  	} catch (_a) {
  		return Object.freeze({ identity: fallback });
  	}
  }
  function dialectFor(uri) {
  	if (typeof uri !== "string") return void 0;
  	const canonical = uri.replace(/#$/, "").replace(/^https:/, "http:");
  	if (canonical === "http://json-schema.org/draft-07/schema") return "draft-07";
  	if (canonical === "http://json-schema.org/draft/2020-12/schema") return "2020-12";
  }
  var normalizeUri = (uri) => normalize(uri).replace(/#$/, "");
  function absoluteUri(uri, fragments) {
  	if (typeof uri !== "string" || !uri) return fail("resource-invalid");
  	const parsed = parse(uri);
  	if (parsed.error || !parsed.scheme || !fragments && parsed.fragment !== void 0) return fail("resource-invalid");
  	return normalizeUri(uri);
  }
  function referenceKey(value) {
  	var _a;
  	if (!isJsonRecord(value) || typeof value.repository !== "string" || typeof value.path !== "string") return fail("artifact-role-invalid");
  	for (const key of [
  		"symbol",
  		"version",
  		"sha256"
  	]) if (key in value && typeof value[key] !== "string") return fail("artifact-role-invalid");
  	return JSON.stringify([
  		value.repository,
  		value.path,
  		(_a = value.symbol) !== null && _a !== void 0 ? _a : null
  	]);
  }
  /** Check declared provenance only; paths and retrieval URIs are never fetched. */
  function validateArtifacts(bundle) {
  	const provenance = bundle.provenance;
  	if (!isJsonRecord(provenance)) fail("artifact-role-invalid");
  	const roles = /* @__PURE__ */ new Map();
  	for (const role of [
  		"canonicalSources",
  		"generatedFiles",
  		"referenceSchemas",
  		"generationSources"
  	]) {
  		const refs = provenance[role];
  		if (!Array.isArray(refs) || role === "canonicalSources" && refs.length === 0) fail("artifact-role-invalid");
  		for (const ref of refs) {
  			const key = referenceKey(ref);
  			if (roles.has(key)) fail("artifact-role-invalid");
  			roles.set(key, role);
  		}
  	}
  	for (const resource of [bundle.root, ...bundle.resources]) {
  		if (!isJsonRecord(resource) || !isJsonRecord(resource.artifact)) fail("artifact-role-invalid");
  		const artifact = resource.artifact;
  		const key = referenceKey(artifact.source);
  		if (artifact.role === "canonical-schema") {
  			if (roles.get(key) !== "canonicalSources") fail("artifact-role-invalid");
  		} else if (artifact.role === "generated-schema") {
  			if (roles.get(key) !== "generatedFiles" || !Array.isArray(artifact.generatedFrom) || !artifact.generatedFrom.length) fail("artifact-role-invalid");
  			for (const ref of artifact.generatedFrom) if (roles.get(referenceKey(ref)) !== "canonicalSources") fail("artifact-role-invalid");
  		} else fail("artifact-role-invalid");
  	}
  }
  function prepare(bundle, ajv) {
  	const registry = /* @__PURE__ */ new Map();
  	const nodes = [];
  	const register = (id, location) => {
  		const key = normalizeUri(id), previous = registry.get(key);
  		if (previous !== void 0 && previous !== location) fail("resource-id-conflict");
  		registry.set(key, location);
  	};
  	const resources = [];
  	const walk = (node, base, location) => {
  		if (typeof node === "boolean") return;
  		if (!isJsonRecord(node)) return;
  		if ("$schema" in node) {
  			const dialect = dialectFor(node.$schema);
  			if (!dialect) fail("dialect-unsupported");
  			if (dialect !== bundle.dialect) fail("dialect-conflict");
  			node.$schema = dialect === "draft-07" ? DIALECT_07 : DIALECT_2020;
  		}
  		if ("$id" in node) {
  			if (typeof node.$id !== "string") fail("schema-invalid");
  			base = absoluteUri(resolve(base, node.$id), true);
  			register(base, location);
  			node.$id = base;
  		}
  		for (const key of ["$anchor", "$dynamicAnchor"]) if (typeof node[key] === "string") register(`${base.replace(/#.*$/, "")}#${node[key]}`, location);
  		nodes.push({
  			node,
  			base
  		});
  		if (node.$async === true) fail("schema-invalid");
  		if (typeof node.format === "string" && !ajv.formats[node.format]) fail("schema-invalid");
  		for (const key of maps) if (isJsonRecord(node[key])) {
  			for (const [name, child] of Object.entries(node[key])) if (typeof child === "boolean" || isJsonRecord(child)) walk(child, base, appendPointer(appendPointer(location, key), name));
  		}
  		for (const key of singles) if (typeof node[key] === "boolean" || isJsonRecord(node[key])) walk(node[key], base, `${location}/${key}`);
  		for (const key of [...arrays, "items"]) {
  			const children = node[key];
  			if (Array.isArray(children)) children.forEach((child, index) => walk(child, base, `${location}/${key}/${index}`));
  			else if (key === "items" && (typeof children === "boolean" || isJsonRecord(children))) walk(children, base, `${location}/${key}`);
  		}
  	};
  	const supplied = [bundle.root, ...bundle.resources];
  	for (let index = 0; index < supplied.length; index++) {
  		const resource = supplied[index];
  		if (!isJsonRecord(resource) || typeof resource.document !== "boolean" && !isJsonRecord(resource.document)) fail("resource-invalid");
  		const uri = absoluteUri(resource.retrievalUri, false);
  		register(uri, `${index}`);
  		walk(resource.document, uri, `${index}`);
  		resources.push({
  			uri,
  			document: resource.document
  		});
  	}
  	for (const { node, base } of nodes) if (typeof node.$ref === "string") {
  		const absolute = normalizeUri(resolve(base, node.$ref));
  		let location = registry.get(absolute);
  		if (location === void 0) {
  			const hash = absolute.indexOf("#");
  			const resource = registry.get(hash < 0 ? absolute : absolute.slice(0, hash));
  			const fragment = hash < 0 ? "" : decodeURIComponent(absolute.slice(hash + 1));
  			if (resource !== void 0 && (fragment === "" || fragment.startsWith("/"))) location = resource + fragment;
  		}
  		if (location !== void 0) {
  			const slash = location.indexOf("/");
  			node.$ref = resources[Number(slash < 0 ? location : location.slice(0, slash))].uri + "#" + encodeURIComponent(slash < 0 ? "" : location.slice(slash)).replace(/%2F/g, "/");
  		} else node.$ref = absolute.includes("#") ? absolute : absolute + "#";
  	}
  	return {
  		root: resources[0].uri,
  		resources,
  		registry,
  		nodes
  	};
  }
  function structuralDiagnostics(errors, scope, rootUri) {
  	return Object.freeze(errors.map((error) => {
  		let dataPath = error.instancePath;
  		if (error.keyword === "required" && typeof error.params.missingProperty === "string") dataPath = appendPointer(dataPath, error.params.missingProperty);
  		if (error.keyword === "additionalProperties" && typeof error.params.additionalProperty === "string") dataPath = appendPointer(dataPath, error.params.additionalProperty);
  		const hash = error.schemaPath.indexOf("#");
  		const resourceUri = hash > 0 ? error.schemaPath.slice(0, hash) : rootUri;
  		const schemaPath = decodeURIComponent(hash >= 0 ? error.schemaPath.slice(hash + 1) : error.schemaPath);
  		return Object.freeze({
  			scope,
  			phase: "structure",
  			code: "schema-data-invalid",
  			dataPath,
  			schemaPath,
  			resourceUri,
  			keyword: error.keyword
  		});
  	}));
  }
  function makeValidator(validate, scope, dialect, rootUri) {
  	return Object.freeze({
  		identity: scope.identity,
  		dialect,
  		validate(data, context) {
  			var _a;
  			let currentScope = scope;
  			try {
  				if (context !== void 0) {
  					if (!isJsonRecord(context)) throw new Error();
  					const consumerId = ownString(context, "consumerId");
  					if (consumerId === void 0) throw new Error();
  					currentScope = Object.freeze({
  						...scope,
  						consumerId
  					});
  				}
  				if (validate(snapshotJson(data))) return Object.freeze({
  					kind: "valid",
  					diagnostics: Object.freeze([])
  				});
  				const diagnostics = structuralDiagnostics((_a = validate.errors) !== null && _a !== void 0 ? _a : [], currentScope, rootUri);
  				if (!diagnostics.length) throw new Error();
  				return Object.freeze({
  					kind: "invalid",
  					diagnostics
  				});
  			} catch (error) {
  				if (error instanceof JsonSnapshotError && error.kind === "invalid") return Object.freeze({
  					kind: "invalid",
  					diagnostics: Object.freeze([Object.freeze({
  						scope: currentScope,
  						phase: "structure",
  						code: "input-not-json",
  						dataPath: error.dataPath
  					})])
  				});
  				return Object.freeze({
  					kind: "execution-error",
  					diagnostics: Object.freeze([Object.freeze({
  						scope: currentScope,
  						phase: "execution",
  						operation: "structure",
  						code: error instanceof JsonSnapshotError && error.kind === "limit" || error instanceof RangeError ? "limit-exceeded" : "engine-failed"
  					})])
  				});
  			}
  		}
  	});
  }
  /** Compile an isolated synchronous validator from an immutable private snapshot. */
  function compileSchemaBundle(input) {
  	const scope = scopeFor(input);
  	try {
  		if (!isJsonRecord(input)) fail("resource-invalid");
  		const declaredDialect = Object.getOwnPropertyDescriptor(input, "dialect");
  		if (!declaredDialect || "value" in declaredDialect && declaredDialect.value === void 0) fail("dialect-required");
  		if (!("value" in declaredDialect)) fail("resource-invalid");
  		if (declaredDialect.value !== "draft-07" && declaredDialect.value !== "2020-12") fail("dialect-unsupported");
  		const candidate = snapshotJson(input);
  		if (!isJsonRecord(candidate) || !isJsonRecord(candidate.identity)) fail("resource-invalid");
  		for (const key of [
  			"ownerId",
  			"contractId",
  			"revision",
  			"variantId"
  		]) if (typeof candidate.identity[key] !== "string") fail("resource-invalid");
  		if (!candidate.dialect) fail("dialect-required");
  		if (candidate.dialect !== "draft-07" && candidate.dialect !== "2020-12") fail("dialect-unsupported");
  		if (!Array.isArray(candidate.resources) || !isJsonRecord(candidate.root)) fail("resource-invalid");
  		const bundle = candidate;
  		validateArtifacts(bundle);
  		const options = {
  			allErrors: true,
  			coerceTypes: false,
  			useDefaults: false,
  			removeAdditional: false,
  			strict: false,
  			logger: false,
  			ownProperties: true
  		};
  		const ajv = bundle.dialect === "draft-07" ? new import_ajv.Ajv(options) : new import__2020.Ajv2020(options);
  		import_dist.default.default(ajv);
  		const prepared = prepare(bundle, ajv);
  		for (const resource of prepared.resources) {
  			if (!ajv.validateSchema(resource.document)) fail("schema-invalid");
  			ajv.addSchema(resource.document, resource.uri);
  		}
  		const validate = ajv.getSchema(prepared.root);
  		if (!validate || "$async" in validate && validate.$async) fail("schema-invalid");
  		return Object.freeze({
  			kind: "compiled",
  			validator: makeValidator(validate, scope, bundle.dialect, prepared.root),
  			diagnostics: Object.freeze([])
  		});
  	} catch (error) {
  		let code;
  		if (error instanceof BundleError) code = error.code;
  		else if (error instanceof import_ajv.MissingRefError) code = "ref-unresolved";
  		else if (error instanceof JsonSnapshotError && error.kind === "invalid") code = "resource-invalid";
  		else if (error instanceof SyntaxError) code = "schema-invalid";
  		if (code) return Object.freeze({
  			kind: "schema-error",
  			diagnostics: Object.freeze([Object.freeze({
  				scope,
  				phase: "compile",
  				code
  			})])
  		});
  		return Object.freeze({
  			kind: "execution-error",
  			diagnostics: Object.freeze([Object.freeze({
  				scope,
  				phase: "execution",
  				operation: "compile",
  				code: error instanceof JsonSnapshotError && error.kind === "limit" || error instanceof RangeError ? "limit-exceeded" : "engine-failed"
  			})])
  		});
  	}
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
  function deepFreeze(value) {
  	if (value !== null && typeof value === "object") {
  		Object.values(value).forEach(deepFreeze);
  		Object.freeze(value);
  	}
  	return value;
  }
  function ownerFailure(scope, code) {
  	return Object.freeze({
  		kind: "execution-error",
  		diagnostics: Object.freeze([Object.freeze({
  			scope,
  			phase: "execution",
  			operation: "semantic",
  			code
  		})])
  	});
  }
  function asyncResult(value) {
  	try {
  		Promise.prototype.then.call(value, () => void 0, () => void 0);
  		return true;
  	} catch (_a) {}
  	return "then" in value;
  }
  /** Validate one protected candidate/context snapshot, then invoke a synchronous owner at most once. */
  function validateSchemaInput(compiled, data, options) {
  	let scope = scopeFor(compiled);
  	let context;
  	let owner;
  	try {
  		if (!isJsonRecord(options)) return ownerFailure(scope, "owner-context-invalid");
  		const descriptor = Object.getOwnPropertyDescriptor(options, "context");
  		if (!descriptor || !("value" in descriptor)) return ownerFailure(scope, "owner-context-invalid");
  		const candidate = snapshotJson(descriptor.value);
  		if (!isJsonRecord(candidate) || typeof candidate.consumerId !== "string" || typeof candidate.nowMs !== "number" || !Number.isFinite(candidate.nowMs) || !Object.hasOwn(candidate, "settings")) return ownerFailure(scope, "owner-context-invalid");
  		context = deepFreeze(candidate);
  		scope = Object.freeze({
  			...scope,
  			consumerId: context.consumerId
  		});
  		const ownerDescriptor = Object.getOwnPropertyDescriptor(options, "ownerValidate");
  		if (ownerDescriptor && !("value" in ownerDescriptor)) return ownerFailure(scope, "owner-result-invalid");
  		owner = ownerDescriptor === null || ownerDescriptor === void 0 ? void 0 : ownerDescriptor.value;
  		if (owner !== void 0 && typeof owner !== "function") return ownerFailure(scope, "owner-result-invalid");
  	} catch (_a) {
  		return ownerFailure(scope, "owner-context-invalid");
  	}
  	let input;
  	try {
  		input = deepFreeze(snapshotJson(data));
  		const structural = compiled.validate(input, { consumerId: context.consumerId });
  		if (!isJsonRecord(structural) || !Array.isArray(structural.diagnostics) || (structural.kind === "valid" ? structural.diagnostics.length !== 0 : structural.diagnostics.length === 0) || ![
  			"valid",
  			"invalid",
  			"execution-error"
  		].includes(structural.kind)) throw new Error();
  		if (structural.kind !== "valid") return structural;
  	} catch (error) {
  		if (error instanceof JsonSnapshotError && error.kind === "invalid") return Object.freeze({
  			kind: "invalid",
  			diagnostics: Object.freeze([Object.freeze({
  				scope,
  				phase: "structure",
  				code: "input-not-json",
  				dataPath: error.dataPath
  			})])
  		});
  		return Object.freeze({
  			kind: "execution-error",
  			diagnostics: Object.freeze([Object.freeze({
  				scope,
  				phase: "execution",
  				operation: "structure",
  				code: error instanceof JsonSnapshotError && error.kind === "limit" || error instanceof RangeError ? "limit-exceeded" : "engine-failed"
  			})])
  		});
  	}
  	if (!owner) return Object.freeze({
  		kind: "valid",
  		diagnostics: Object.freeze([])
  	});
  	let result;
  	try {
  		result = owner(input, context);
  	} catch (_b) {
  		return ownerFailure(scope, "owner-validation-failed");
  	}
  	try {
  		if (result !== null && (typeof result === "object" || typeof result === "function") && asyncResult(result)) return ownerFailure(scope, "async-owner-unsupported");
  		const snapshot = snapshotJson(result);
  		if (!isJsonRecord(snapshot) || !Array.isArray(snapshot.issues)) return ownerFailure(scope, "owner-result-invalid");
  		if (snapshot.kind === "valid" && snapshot.issues.length === 0) return Object.freeze({
  			kind: "valid",
  			diagnostics: Object.freeze([])
  		});
  		if (snapshot.kind !== "invalid" || snapshot.issues.length === 0) return ownerFailure(scope, "owner-result-invalid");
  		const diagnostics = [];
  		for (const issue of snapshot.issues) {
  			if (!isJsonRecord(issue) || typeof issue.dataPath !== "string" || issue.dataPath !== "" && !issue.dataPath.startsWith("/") || /~(?:[^01]|$)/u.test(issue.dataPath) || typeof issue.ruleId !== "string") return ownerFailure(scope, "owner-result-invalid");
  			diagnostics.push(Object.freeze({
  				scope,
  				phase: "semantic",
  				code: "owner-input-invalid",
  				dataPath: issue.dataPath,
  				ruleId: issue.ruleId
  			}));
  		}
  		return Object.freeze({
  			kind: "invalid",
  			diagnostics: Object.freeze(diagnostics)
  		});
  	} catch (_c) {
  		return ownerFailure(scope, "owner-result-invalid");
  	}
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
  function sourceBinding(argument, bundle, read, check = read, format = "json", uiSchema) {
  	const compiled = compileSchemaBundle(bundle);
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
  			if (compiled.kind !== "compiled") return {
  				source,
  				result: {
  					kind: "schema-error",
  					diagnostics: [{ code: "source-schema-invalid" }]
  				}
  			};
  			try {
  				const data = read(source);
  				return {
  					source,
  					result: validateSchemaInput(compiled.validator, data, {
  						context,
  						ownerValidate: () => {
  							try {
  								check(source);
  								return {
  									kind: "valid",
  									issues: []
  								};
  							} catch {
  								return {
  									kind: "invalid",
  									issues: [{
  										dataPath: "",
  										ruleId: "source-owner-invalid"
  									}]
  								};
  							}
  						}
  					})
  				};
  			} catch {
  				return {
  					source,
  					result: {
  						kind: "invalid",
  						diagnostics: [{ code: "source-decode-invalid" }]
  					}
  				};
  			}
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
  var ALIAS = Symbol.for("yaml.alias");
  var DOC = Symbol.for("yaml.document");
  var MAP = Symbol.for("yaml.map");
  var PAIR = Symbol.for("yaml.pair");
  var SCALAR$1 = Symbol.for("yaml.scalar");
  var SEQ = Symbol.for("yaml.seq");
  var NODE_TYPE = Symbol.for("yaml.node.type");
  var isAlias = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === ALIAS;
  var isDocument = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === DOC;
  var isMap = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === MAP;
  var isPair = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === PAIR;
  var isScalar = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SCALAR$1;
  var isSeq = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SEQ;
  function isCollection(node) {
  	if (node && typeof node === "object") switch (node[NODE_TYPE]) {
  		case MAP:
  		case SEQ: return true;
  	}
  	return false;
  }
  function isNode(node) {
  	if (node && typeof node === "object") switch (node[NODE_TYPE]) {
  		case ALIAS:
  		case MAP:
  		case SCALAR$1:
  		case SEQ: return true;
  	}
  	return false;
  }
  var hasAnchor = (node) => (isScalar(node) || isCollection(node)) && !!node.anchor;
  var BREAK$1 = Symbol("break visit");
  var SKIP$1 = Symbol("skip children");
  var REMOVE$1 = Symbol("remove node");
  /**
  * Apply a visitor to an AST node or document.
  *
  * Walks through the tree (depth-first) starting from `node`, calling a
  * `visitor` function with three arguments:
  *   - `key`: For sequence values and map `Pair`, the node's index in the
  *     collection. Within a `Pair`, `'key'` or `'value'`, correspondingly.
  *     `null` for the root node.
  *   - `node`: The current node.
  *   - `path`: The ancestry of the current node.
  *
  * The return value of the visitor may be used to control the traversal:
  *   - `undefined` (default): Do nothing and continue
  *   - `visit.SKIP`: Do not visit the children of this node, continue with next
  *     sibling
  *   - `visit.BREAK`: Terminate traversal completely
  *   - `visit.REMOVE`: Remove the current node, then continue with the next one
  *   - `Node`: Replace the current node, then continue by visiting it
  *   - `number`: While iterating the items of a sequence or map, set the index
  *     of the next step. This is useful especially if the index of the current
  *     node has changed.
  *
  * If `visitor` is a single function, it will be called with all values
  * encountered in the tree, including e.g. `null` values. Alternatively,
  * separate visitor functions may be defined for each `Map`, `Pair`, `Seq`,
  * `Alias` and `Scalar` node. To define the same visitor function for more than
  * one node type, use the `Collection` (map and seq), `Value` (map, seq & scalar)
  * and `Node` (alias, map, seq & scalar) targets. Of all these, only the most
  * specific defined one will be used for each node.
  */
  function visit$1(node, visitor) {
  	const visitor_ = initVisitor(visitor);
  	if (isDocument(node)) {
  		if (visit_(null, node.contents, visitor_, Object.freeze([node])) === REMOVE$1) node.contents = null;
  	} else visit_(null, node, visitor_, Object.freeze([]));
  }
  /** Terminate visit traversal completely */
  visit$1.BREAK = BREAK$1;
  /** Do not visit the children of the current node */
  visit$1.SKIP = SKIP$1;
  /** Remove the current node */
  visit$1.REMOVE = REMOVE$1;
  function visit_(key, node, visitor, path) {
  	const ctrl = callVisitor(key, node, visitor, path);
  	if (isNode(ctrl) || isPair(ctrl)) {
  		replaceNode(key, path, ctrl);
  		return visit_(key, ctrl, visitor, path);
  	}
  	if (typeof ctrl !== "symbol") {
  		if (isCollection(node)) {
  			path = Object.freeze(path.concat(node));
  			for (let i = 0; i < node.items.length; ++i) {
  				const ci = visit_(i, node.items[i], visitor, path);
  				if (typeof ci === "number") i = ci - 1;
  				else if (ci === BREAK$1) return BREAK$1;
  				else if (ci === REMOVE$1) {
  					node.items.splice(i, 1);
  					i -= 1;
  				}
  			}
  		} else if (isPair(node)) {
  			path = Object.freeze(path.concat(node));
  			const ck = visit_("key", node.key, visitor, path);
  			if (ck === BREAK$1) return BREAK$1;
  			else if (ck === REMOVE$1) node.key = null;
  			const cv = visit_("value", node.value, visitor, path);
  			if (cv === BREAK$1) return BREAK$1;
  			else if (cv === REMOVE$1) node.value = null;
  		}
  	}
  	return ctrl;
  }
  /**
  * Apply an async visitor to an AST node or document.
  *
  * Walks through the tree (depth-first) starting from `node`, calling a
  * `visitor` function with three arguments:
  *   - `key`: For sequence values and map `Pair`, the node's index in the
  *     collection. Within a `Pair`, `'key'` or `'value'`, correspondingly.
  *     `null` for the root node.
  *   - `node`: The current node.
  *   - `path`: The ancestry of the current node.
  *
  * The return value of the visitor may be used to control the traversal:
  *   - `Promise`: Must resolve to one of the following values
  *   - `undefined` (default): Do nothing and continue
  *   - `visit.SKIP`: Do not visit the children of this node, continue with next
  *     sibling
  *   - `visit.BREAK`: Terminate traversal completely
  *   - `visit.REMOVE`: Remove the current node, then continue with the next one
  *   - `Node`: Replace the current node, then continue by visiting it
  *   - `number`: While iterating the items of a sequence or map, set the index
  *     of the next step. This is useful especially if the index of the current
  *     node has changed.
  *
  * If `visitor` is a single function, it will be called with all values
  * encountered in the tree, including e.g. `null` values. Alternatively,
  * separate visitor functions may be defined for each `Map`, `Pair`, `Seq`,
  * `Alias` and `Scalar` node. To define the same visitor function for more than
  * one node type, use the `Collection` (map and seq), `Value` (map, seq & scalar)
  * and `Node` (alias, map, seq & scalar) targets. Of all these, only the most
  * specific defined one will be used for each node.
  */
  async function visitAsync(node, visitor) {
  	const visitor_ = initVisitor(visitor);
  	if (isDocument(node)) {
  		if (await visitAsync_(null, node.contents, visitor_, Object.freeze([node])) === REMOVE$1) node.contents = null;
  	} else await visitAsync_(null, node, visitor_, Object.freeze([]));
  }
  /** Terminate visit traversal completely */
  visitAsync.BREAK = BREAK$1;
  /** Do not visit the children of the current node */
  visitAsync.SKIP = SKIP$1;
  /** Remove the current node */
  visitAsync.REMOVE = REMOVE$1;
  async function visitAsync_(key, node, visitor, path) {
  	const ctrl = await callVisitor(key, node, visitor, path);
  	if (isNode(ctrl) || isPair(ctrl)) {
  		replaceNode(key, path, ctrl);
  		return visitAsync_(key, ctrl, visitor, path);
  	}
  	if (typeof ctrl !== "symbol") {
  		if (isCollection(node)) {
  			path = Object.freeze(path.concat(node));
  			for (let i = 0; i < node.items.length; ++i) {
  				const ci = await visitAsync_(i, node.items[i], visitor, path);
  				if (typeof ci === "number") i = ci - 1;
  				else if (ci === BREAK$1) return BREAK$1;
  				else if (ci === REMOVE$1) {
  					node.items.splice(i, 1);
  					i -= 1;
  				}
  			}
  		} else if (isPair(node)) {
  			path = Object.freeze(path.concat(node));
  			const ck = await visitAsync_("key", node.key, visitor, path);
  			if (ck === BREAK$1) return BREAK$1;
  			else if (ck === REMOVE$1) node.key = null;
  			const cv = await visitAsync_("value", node.value, visitor, path);
  			if (cv === BREAK$1) return BREAK$1;
  			else if (cv === REMOVE$1) node.value = null;
  		}
  	}
  	return ctrl;
  }
  function initVisitor(visitor) {
  	if (typeof visitor === "object" && (visitor.Collection || visitor.Node || visitor.Value)) return Object.assign({
  		Alias: visitor.Node,
  		Map: visitor.Node,
  		Scalar: visitor.Node,
  		Seq: visitor.Node
  	}, visitor.Value && {
  		Map: visitor.Value,
  		Scalar: visitor.Value,
  		Seq: visitor.Value
  	}, visitor.Collection && {
  		Map: visitor.Collection,
  		Seq: visitor.Collection
  	}, visitor);
  	return visitor;
  }
  function callVisitor(key, node, visitor, path) {
  	if (typeof visitor === "function") return visitor(key, node, path);
  	if (isMap(node)) return visitor.Map?.(key, node, path);
  	if (isSeq(node)) return visitor.Seq?.(key, node, path);
  	if (isPair(node)) return visitor.Pair?.(key, node, path);
  	if (isScalar(node)) return visitor.Scalar?.(key, node, path);
  	if (isAlias(node)) return visitor.Alias?.(key, node, path);
  }
  function replaceNode(key, path, node) {
  	const parent = path[path.length - 1];
  	if (isCollection(parent)) parent.items[key] = node;
  	else if (isPair(parent)) {
  		if (key === "key") parent.key = node;
  		else parent.value = node;
  	} else if (isDocument(parent)) parent.contents = node;
  	else {
  		const pt = isAlias(parent) ? "alias" : "scalar";
  		throw new Error(`Cannot replace node with ${pt} parent`);
  	}
  }
  var escapeChars = {
  	"!": "%21",
  	",": "%2C",
  	"[": "%5B",
  	"]": "%5D",
  	"{": "%7B",
  	"}": "%7D"
  };
  var escapeTagName = (tn) => tn.replace(/[!,[\]{}]/g, (ch) => escapeChars[ch]);
  var Directives = class Directives {
  	constructor(yaml, tags) {
  		/**
  		* The directives-end/doc-start marker `---`. If `null`, a marker may still be
  		* included in the document's stringified representation.
  		*/
  		this.docStart = null;
  		/** The doc-end marker `...`.  */
  		this.docEnd = false;
  		this.yaml = Object.assign({}, Directives.defaultYaml, yaml);
  		this.tags = Object.assign({}, Directives.defaultTags, tags);
  	}
  	clone() {
  		const copy = new Directives(this.yaml, this.tags);
  		copy.docStart = this.docStart;
  		return copy;
  	}
  	/**
  	* During parsing, get a Directives instance for the current document and
  	* update the stream state according to the current version's spec.
  	*/
  	atDocument() {
  		const res = new Directives(this.yaml, this.tags);
  		switch (this.yaml.version) {
  			case "1.1":
  				this.atNextDocument = true;
  				break;
  			case "1.2":
  				this.atNextDocument = false;
  				this.yaml = {
  					explicit: Directives.defaultYaml.explicit,
  					version: "1.2"
  				};
  				this.tags = Object.assign({}, Directives.defaultTags);
  		}
  		return res;
  	}
  	/**
  	* @param onError - May be called even if the action was successful
  	* @returns `true` on success
  	*/
  	add(line, onError) {
  		if (this.atNextDocument) {
  			this.yaml = {
  				explicit: Directives.defaultYaml.explicit,
  				version: "1.1"
  			};
  			this.tags = Object.assign({}, Directives.defaultTags);
  			this.atNextDocument = false;
  		}
  		const parts = line.trim().split(/[ \t]+/);
  		const name = parts.shift();
  		switch (name) {
  			case "%TAG": {
  				if (parts.length !== 2) {
  					onError(0, "%TAG directive should contain exactly two parts");
  					if (parts.length < 2) return false;
  				}
  				const [handle, prefix] = parts;
  				this.tags[handle] = prefix;
  				return true;
  			}
  			case "%YAML": {
  				this.yaml.explicit = true;
  				if (parts.length !== 1) {
  					onError(0, "%YAML directive should contain exactly one part");
  					return false;
  				}
  				const [version] = parts;
  				if (version === "1.1" || version === "1.2") {
  					this.yaml.version = version;
  					return true;
  				} else {
  					const isValid = /^\d+\.\d+$/.test(version);
  					onError(6, `Unsupported YAML version ${version}`, isValid);
  					return false;
  				}
  			}
  			default:
  				onError(0, `Unknown directive ${name}`, true);
  				return false;
  		}
  	}
  	/**
  	* Resolves a tag, matching handles to those defined in %TAG directives.
  	*
  	* @returns Resolved tag, which may also be the non-specific tag `'!'` or a
  	*   `'!local'` tag, or `null` if unresolvable.
  	*/
  	tagName(source, onError) {
  		if (source === "!") return "!";
  		if (source[0] !== "!") {
  			onError(`Not a valid tag: ${source}`);
  			return null;
  		}
  		if (source[1] === "<") {
  			const verbatim = source.slice(2, -1);
  			if (verbatim === "!" || verbatim === "!!") {
  				onError(`Verbatim tags aren't resolved, so ${source} is invalid.`);
  				return null;
  			}
  			if (source[source.length - 1] !== ">") onError("Verbatim tags must end with a >");
  			return verbatim;
  		}
  		const [, handle, suffix] = source.match(/^(.*!)([^!]*)$/s);
  		if (!suffix) onError(`The ${source} tag has no suffix`);
  		const prefix = this.tags[handle];
  		if (prefix) try {
  			return prefix + decodeURIComponent(suffix);
  		} catch (error) {
  			onError(String(error));
  			return null;
  		}
  		if (handle === "!") return source;
  		onError(`Could not resolve tag: ${source}`);
  		return null;
  	}
  	/**
  	* Given a fully resolved tag, returns its printable string form,
  	* taking into account current tag prefixes and defaults.
  	*/
  	tagString(tag) {
  		for (const [handle, prefix] of Object.entries(this.tags)) if (tag.startsWith(prefix)) return handle + escapeTagName(tag.substring(prefix.length));
  		return tag[0] === "!" ? tag : `!<${tag}>`;
  	}
  	toString(doc) {
  		const lines = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [];
  		const tagEntries = Object.entries(this.tags);
  		let tagNames;
  		if (doc && tagEntries.length > 0 && isNode(doc.contents)) {
  			const tags = {};
  			visit$1(doc.contents, (_key, node) => {
  				if (isNode(node) && node.tag) tags[node.tag] = true;
  			});
  			tagNames = Object.keys(tags);
  		} else tagNames = [];
  		for (const [handle, prefix] of tagEntries) {
  			if (handle === "!!" && prefix === "tag:yaml.org,2002:") continue;
  			if (!doc || tagNames.some((tn) => tn.startsWith(prefix))) lines.push(`%TAG ${handle} ${prefix}`);
  		}
  		return lines.join("\n");
  	}
  };
  Directives.defaultYaml = {
  	explicit: false,
  	version: "1.2"
  };
  Directives.defaultTags = { "!!": "tag:yaml.org,2002:" };
  /**
  * Verify that the input string is a valid anchor.
  *
  * Will throw on errors.
  */
  function anchorIsValid(anchor) {
  	if (/[\x00-\x19\s,[\]{}]/.test(anchor)) {
  		const msg = `Anchor must not contain whitespace or control characters: ${JSON.stringify(anchor)}`;
  		throw new Error(msg);
  	}
  	return true;
  }
  function anchorNames(root) {
  	const anchors = /* @__PURE__ */ new Set();
  	visit$1(root, { Value(_key, node) {
  		if (node.anchor) anchors.add(node.anchor);
  	} });
  	return anchors;
  }
  /** Find a new anchor name with the given `prefix` and a one-indexed suffix. */
  function findNewAnchor(prefix, exclude) {
  	for (let i = 1;; ++i) {
  		const name = `${prefix}${i}`;
  		if (!exclude.has(name)) return name;
  	}
  }
  function createNodeAnchors(doc, prefix) {
  	const aliasObjects = [];
  	const sourceObjects = /* @__PURE__ */ new Map();
  	let prevAnchors = null;
  	return {
  		onAnchor: (source) => {
  			aliasObjects.push(source);
  			prevAnchors ?? (prevAnchors = anchorNames(doc));
  			const anchor = findNewAnchor(prefix, prevAnchors);
  			prevAnchors.add(anchor);
  			return anchor;
  		},
  		/**
  		* With circular references, the source node is only resolved after all
  		* of its child nodes are. This is why anchors are set only after all of
  		* the nodes have been created.
  		*/
  		setAnchors: () => {
  			for (const source of aliasObjects) {
  				const ref = sourceObjects.get(source);
  				if (typeof ref === "object" && ref.anchor && (isScalar(ref.node) || isCollection(ref.node))) ref.node.anchor = ref.anchor;
  				else {
  					const error = /* @__PURE__ */ new Error("Failed to resolve repeated object (this should not happen)");
  					error.source = source;
  					throw error;
  				}
  			}
  		},
  		sourceObjects
  	};
  }
  /**
  * Applies the JSON.parse reviver algorithm as defined in the ECMA-262 spec,
  * in section 24.5.1.1 "Runtime Semantics: InternalizeJSONProperty" of the
  * 2021 edition: https://tc39.es/ecma262/#sec-json.parse
  *
  * Includes extensions for handling Map and Set objects.
  */
  function applyReviver(reviver, obj, key, val) {
  	if (val && typeof val === "object") {
  		if (Array.isArray(val)) for (let i = 0, len = val.length; i < len; ++i) {
  			const v0 = val[i];
  			const v1 = applyReviver(reviver, val, String(i), v0);
  			if (v1 === void 0) delete val[i];
  			else if (v1 !== v0) val[i] = v1;
  		}
  		else if (val instanceof Map) for (const k of Array.from(val.keys())) {
  			const v0 = val.get(k);
  			const v1 = applyReviver(reviver, val, k, v0);
  			if (v1 === void 0) val.delete(k);
  			else if (v1 !== v0) val.set(k, v1);
  		}
  		else if (val instanceof Set) for (const v0 of Array.from(val)) {
  			const v1 = applyReviver(reviver, val, v0, v0);
  			if (v1 === void 0) val.delete(v0);
  			else if (v1 !== v0) {
  				val.delete(v0);
  				val.add(v1);
  			}
  		}
  		else for (const [k, v0] of Object.entries(val)) {
  			const v1 = applyReviver(reviver, val, k, v0);
  			if (v1 === void 0) delete val[k];
  			else if (v1 !== v0) val[k] = v1;
  		}
  	}
  	return reviver.call(obj, key, val);
  }
  /**
  * Recursively convert any node or its contents to native JavaScript
  *
  * @param value - The input value
  * @param arg - If `value` defines a `toJSON()` method, use this
  *   as its first argument
  * @param ctx - Conversion context, originally set in Document#toJS(). If
  *   `{ keep: true }` is not set, output should be suitable for JSON
  *   stringification.
  */
  function toJS(value, arg, ctx) {
  	if (Array.isArray(value)) return value.map((v, i) => toJS(v, String(i), ctx));
  	if (value && typeof value.toJSON === "function") {
  		if (!ctx || !hasAnchor(value)) return value.toJSON(arg, ctx);
  		const data = {
  			aliasCount: 0,
  			count: 1,
  			res: void 0
  		};
  		ctx.anchors.set(value, data);
  		ctx.onCreate = (res) => {
  			data.res = res;
  			delete ctx.onCreate;
  		};
  		const res = value.toJSON(arg, ctx);
  		if (ctx.onCreate) ctx.onCreate(res);
  		return res;
  	}
  	if (typeof value === "bigint" && !ctx?.keep) return Number(value);
  	return value;
  }
  var NodeBase = class {
  	constructor(type) {
  		Object.defineProperty(this, NODE_TYPE, { value: type });
  	}
  	/** Create a copy of this node.  */
  	clone() {
  		const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
  		if (this.range) copy.range = this.range.slice();
  		return copy;
  	}
  	/** A plain JavaScript representation of this node. */
  	toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
  		if (!isDocument(doc)) throw new TypeError("A document argument is required");
  		const ctx = {
  			anchors: /* @__PURE__ */ new Map(),
  			doc,
  			keep: true,
  			mapAsMap: mapAsMap === true,
  			mapKeyWarned: false,
  			maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
  		};
  		const res = toJS(this, "", ctx);
  		if (typeof onAnchor === "function") for (const { count, res } of ctx.anchors.values()) onAnchor(res, count);
  		return typeof reviver === "function" ? applyReviver(reviver, { "": res }, "", res) : res;
  	}
  };
  var Alias = class extends NodeBase {
  	constructor(source) {
  		super(ALIAS);
  		this.source = source;
  		Object.defineProperty(this, "tag", { set() {
  			throw new Error("Alias nodes cannot have tags");
  		} });
  	}
  	/**
  	* Resolve the value of this alias within `doc`, finding the last
  	* instance of the `source` anchor before this node.
  	*/
  	resolve(doc, ctx) {
  		if (ctx?.maxAliasCount === 0) throw new ReferenceError("Alias resolution is disabled");
  		let nodes;
  		if (ctx?.aliasResolveCache) nodes = ctx.aliasResolveCache;
  		else {
  			nodes = [];
  			visit$1(doc, { Node: (_key, node) => {
  				if (isAlias(node) || hasAnchor(node)) nodes.push(node);
  			} });
  			if (ctx) ctx.aliasResolveCache = nodes;
  		}
  		let found = void 0;
  		for (const node of nodes) {
  			if (node === this) break;
  			if (node.anchor === this.source) found = node;
  		}
  		if (found && ctx) {
  			const { anchors, doc, maxAliasCount } = ctx;
  			let data = anchors.get(found);
  			if (!data) {
  				toJS(found, null, ctx);
  				data = anchors.get(found);
  			}
  			/* istanbul ignore if */
  			if (data?.res === void 0) throw new ReferenceError("This should not happen: Alias anchor was not resolved?");
  			if (maxAliasCount >= 0) {
  				data.count += 1;
  				if (data.aliasCount === 0) data.aliasCount = getAliasCount(doc, found, anchors);
  				if (data.count * data.aliasCount > maxAliasCount) throw new ReferenceError("Excessive alias count indicates a resource exhaustion attack");
  			}
  		}
  		return found;
  	}
  	toJSON(_arg, ctx) {
  		if (!ctx) return { source: this.source };
  		const source = this.resolve(ctx.doc, ctx);
  		if (!source) {
  			const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
  			throw new ReferenceError(msg);
  		}
  		return ctx.anchors.get(source).res;
  	}
  	toString(ctx, _onComment, _onChompKeep) {
  		const src = `*${this.source}`;
  		if (ctx) {
  			anchorIsValid(this.source);
  			if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
  				const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
  				throw new Error(msg);
  			}
  			if (ctx.implicitKey) return `${src} `;
  		}
  		return src;
  	}
  };
  function getAliasCount(doc, node, anchors) {
  	if (isAlias(node)) {
  		const source = node.resolve(doc);
  		const anchor = anchors && source && anchors.get(source);
  		return anchor ? anchor.count * anchor.aliasCount : 0;
  	} else if (isCollection(node)) {
  		let count = 0;
  		for (const item of node.items) {
  			const c = getAliasCount(doc, item, anchors);
  			if (c > count) count = c;
  		}
  		return count;
  	} else if (isPair(node)) {
  		const kc = getAliasCount(doc, node.key, anchors);
  		const vc = getAliasCount(doc, node.value, anchors);
  		return Math.max(kc, vc);
  	}
  	return 1;
  }
  var isScalarValue = (value) => !value || typeof value !== "function" && typeof value !== "object";
  var Scalar = class extends NodeBase {
  	constructor(value) {
  		super(SCALAR$1);
  		this.value = value;
  	}
  	toJSON(arg, ctx) {
  		return ctx?.keep ? this.value : toJS(this.value, arg, ctx);
  	}
  	toString() {
  		return String(this.value);
  	}
  };
  Scalar.BLOCK_FOLDED = "BLOCK_FOLDED";
  Scalar.BLOCK_LITERAL = "BLOCK_LITERAL";
  Scalar.PLAIN = "PLAIN";
  Scalar.QUOTE_DOUBLE = "QUOTE_DOUBLE";
  Scalar.QUOTE_SINGLE = "QUOTE_SINGLE";
  var defaultTagPrefix = "tag:yaml.org,2002:";
  function findTagObject(value, tagName, tags) {
  	if (tagName) {
  		const match = tags.filter((t) => t.tag === tagName);
  		const tagObj = match.find((t) => !t.format) ?? match[0];
  		if (!tagObj) throw new Error(`Tag ${tagName} not found`);
  		return tagObj;
  	}
  	return tags.find((t) => t.identify?.(value) && !t.format);
  }
  function createNode(value, tagName, ctx) {
  	if (isDocument(value)) value = value.contents;
  	if (isNode(value)) return value;
  	if (isPair(value)) {
  		const map = ctx.schema[MAP].createNode?.(ctx.schema, null, ctx);
  		map.items.push(value);
  		return map;
  	}
  	if (value instanceof String || value instanceof Number || value instanceof Boolean || typeof BigInt !== "undefined" && value instanceof BigInt) value = value.valueOf();
  	const { aliasDuplicateObjects, onAnchor, onTagObj, schema, sourceObjects } = ctx;
  	let ref = void 0;
  	if (aliasDuplicateObjects && value && typeof value === "object") {
  		ref = sourceObjects.get(value);
  		if (ref) {
  			ref.anchor ?? (ref.anchor = onAnchor(value));
  			return new Alias(ref.anchor);
  		} else {
  			ref = {
  				anchor: null,
  				node: null
  			};
  			sourceObjects.set(value, ref);
  		}
  	}
  	if (tagName?.startsWith("!!")) tagName = defaultTagPrefix + tagName.slice(2);
  	let tagObj = findTagObject(value, tagName, schema.tags);
  	if (!tagObj) {
  		if (value && typeof value.toJSON === "function") value = value.toJSON();
  		if (!value || typeof value !== "object") {
  			const node = new Scalar(value);
  			if (ref) ref.node = node;
  			return node;
  		}
  		tagObj = value instanceof Map ? schema[MAP] : Symbol.iterator in Object(value) ? schema[SEQ] : schema[MAP];
  	}
  	if (onTagObj) {
  		onTagObj(tagObj);
  		delete ctx.onTagObj;
  	}
  	const node = tagObj?.createNode ? tagObj.createNode(ctx.schema, value, ctx) : typeof tagObj?.nodeClass?.from === "function" ? tagObj.nodeClass.from(ctx.schema, value, ctx) : new Scalar(value);
  	if (tagName) node.tag = tagName;
  	else if (!tagObj.default) node.tag = tagObj.tag;
  	if (ref) ref.node = node;
  	return node;
  }
  function collectionFromPath(schema, path, value) {
  	let v = value;
  	for (let i = path.length - 1; i >= 0; --i) {
  		const k = path[i];
  		if (typeof k === "number" && Number.isInteger(k) && k >= 0) {
  			const a = [];
  			a[k] = v;
  			v = a;
  		} else v = /* @__PURE__ */ new Map([[k, v]]);
  	}
  	return createNode(v, void 0, {
  		aliasDuplicateObjects: false,
  		keepUndefined: false,
  		onAnchor: () => {
  			throw new Error("This should not happen, please report a bug.");
  		},
  		schema,
  		sourceObjects: /* @__PURE__ */ new Map()
  	});
  }
  var isEmptyPath = (path) => path == null || typeof path === "object" && !!path[Symbol.iterator]().next().done;
  var Collection = class extends NodeBase {
  	constructor(type, schema) {
  		super(type);
  		Object.defineProperty(this, "schema", {
  			value: schema,
  			configurable: true,
  			enumerable: false,
  			writable: true
  		});
  	}
  	/**
  	* Create a copy of this collection.
  	*
  	* @param schema - If defined, overwrites the original's schema
  	*/
  	clone(schema) {
  		const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
  		if (schema) copy.schema = schema;
  		copy.items = copy.items.map((it) => isNode(it) || isPair(it) ? it.clone(schema) : it);
  		if (this.range) copy.range = this.range.slice();
  		return copy;
  	}
  	/**
  	* Adds a value to the collection. For `!!map` and `!!omap` the value must
  	* be a Pair instance or a `{ key, value }` object, which may not have a key
  	* that already exists in the map.
  	*/
  	addIn(path, value) {
  		if (isEmptyPath(path)) this.add(value);
  		else {
  			const [key, ...rest] = path;
  			const node = this.get(key, true);
  			if (isCollection(node)) node.addIn(rest, value);
  			else if (node === void 0 && this.schema) this.set(key, collectionFromPath(this.schema, rest, value));
  			else throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
  		}
  	}
  	/**
  	* Removes a value from the collection.
  	* @returns `true` if the item was found and removed.
  	*/
  	deleteIn(path) {
  		const [key, ...rest] = path;
  		if (rest.length === 0) return this.delete(key);
  		const node = this.get(key, true);
  		if (isCollection(node)) return node.deleteIn(rest);
  		else throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
  	}
  	/**
  	* Returns item at `key`, or `undefined` if not found. By default unwraps
  	* scalar values from their surrounding node; to disable set `keepScalar` to
  	* `true` (collections are always returned intact).
  	*/
  	getIn(path, keepScalar) {
  		const [key, ...rest] = path;
  		const node = this.get(key, true);
  		if (rest.length === 0) return !keepScalar && isScalar(node) ? node.value : node;
  		else return isCollection(node) ? node.getIn(rest, keepScalar) : void 0;
  	}
  	hasAllNullValues(allowScalar) {
  		return this.items.every((node) => {
  			if (!isPair(node)) return false;
  			const n = node.value;
  			return n == null || allowScalar && isScalar(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
  		});
  	}
  	/**
  	* Checks if the collection includes a value with the key `key`.
  	*/
  	hasIn(path) {
  		const [key, ...rest] = path;
  		if (rest.length === 0) return this.has(key);
  		const node = this.get(key, true);
  		return isCollection(node) ? node.hasIn(rest) : false;
  	}
  	/**
  	* Sets a value in this collection. For `!!set`, `value` needs to be a
  	* boolean to add/remove the item from the set.
  	*/
  	setIn(path, value) {
  		const [key, ...rest] = path;
  		if (rest.length === 0) this.set(key, value);
  		else {
  			const node = this.get(key, true);
  			if (isCollection(node)) node.setIn(rest, value);
  			else if (node === void 0 && this.schema) this.set(key, collectionFromPath(this.schema, rest, value));
  			else throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
  		}
  	}
  };
  /**
  * Stringifies a comment.
  *
  * Empty comment lines are left empty,
  * lines consisting of a single space are replaced by `#`,
  * and all other lines are prefixed with a `#`.
  */
  var stringifyComment = (str) => str.replace(/^(?!$)(?: $)?/gm, "#");
  function indentComment(comment, indent) {
  	if (/^\n+$/.test(comment)) return comment.substring(1);
  	return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
  }
  var lineComment = (str, indent, comment) => str.endsWith("\n") ? indentComment(comment, indent) : comment.includes("\n") ? "\n" + indentComment(comment, indent) : (str.endsWith(" ") ? "" : " ") + comment;
  var FOLD_FLOW = "flow";
  var FOLD_BLOCK = "block";
  var FOLD_QUOTED = "quoted";
  /**
  * Tries to keep input at up to `lineWidth` characters, splitting only on spaces
  * not followed by newlines or spaces unless `mode` is `'quoted'`. Lines are
  * terminated with `\n` and started with `indent`.
  */
  function foldFlowLines(text, indent, mode = "flow", { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {}) {
  	if (!lineWidth || lineWidth < 0) return text;
  	if (lineWidth < minContentWidth) minContentWidth = 0;
  	const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
  	if (text.length <= endStep) return text;
  	const folds = [];
  	const escapedFolds = {};
  	let end = lineWidth - indent.length;
  	if (typeof indentAtStart === "number") {
  		if (indentAtStart > lineWidth - Math.max(2, minContentWidth)) folds.push(0);
  		else end = lineWidth - indentAtStart;
  	}
  	let split = void 0;
  	let prev = void 0;
  	let overflow = false;
  	let i = -1;
  	let escStart = -1;
  	let escEnd = -1;
  	if (mode === "block") {
  		i = consumeMoreIndentedLines(text, i, indent.length);
  		if (i !== -1) end = i + endStep;
  	}
  	for (let ch; ch = text[i += 1];) {
  		if (mode === "quoted" && ch === "\\") {
  			escStart = i;
  			switch (text[i + 1]) {
  				case "x":
  					i += 3;
  					break;
  				case "u":
  					i += 5;
  					break;
  				case "U":
  					i += 9;
  					break;
  				default: i += 1;
  			}
  			escEnd = i;
  		}
  		if (ch === "\n") {
  			if (mode === "block") i = consumeMoreIndentedLines(text, i, indent.length);
  			end = i + indent.length + endStep;
  			split = void 0;
  		} else {
  			if (ch === " " && prev && prev !== " " && prev !== "\n" && prev !== "	") {
  				const next = text[i + 1];
  				if (next && next !== " " && next !== "\n" && next !== "	") split = i;
  			}
  			if (i >= end) {
  				if (split) {
  					folds.push(split);
  					end = split + endStep;
  					split = void 0;
  				} else if (mode === "quoted") {
  					while (prev === " " || prev === "	") {
  						prev = ch;
  						ch = text[i += 1];
  						overflow = true;
  					}
  					const j = i > escEnd + 1 ? i - 2 : escStart - 1;
  					if (escapedFolds[j]) return text;
  					folds.push(j);
  					escapedFolds[j] = true;
  					end = j + endStep;
  					split = void 0;
  				} else overflow = true;
  			}
  		}
  		prev = ch;
  	}
  	if (overflow && onOverflow) onOverflow();
  	if (folds.length === 0) return text;
  	if (onFold) onFold();
  	let res = text.slice(0, folds[0]);
  	for (let i = 0; i < folds.length; ++i) {
  		const fold = folds[i];
  		const end = folds[i + 1] || text.length;
  		if (fold === 0) res = `\n${indent}${text.slice(0, end)}`;
  		else {
  			if (mode === "quoted" && escapedFolds[fold]) res += `${text[fold]}\\`;
  			res += `\n${indent}${text.slice(fold + 1, end)}`;
  		}
  	}
  	return res;
  }
  /**
  * Presumes `i + 1` is at the start of a line
  * @returns index of last newline in more-indented block
  */
  function consumeMoreIndentedLines(text, i, indent) {
  	let end = i;
  	let start = i + 1;
  	let ch = text[start];
  	while (ch === " " || ch === "	") if (i < start + indent) ch = text[++i];
  	else {
  		do
  			ch = text[++i];
  		while (ch && ch !== "\n");
  		end = i;
  		start = i + 1;
  		ch = text[start];
  	}
  	return end;
  }
  var getFoldOptions = (ctx, isBlock) => ({
  	indentAtStart: isBlock ? ctx.indent.length : ctx.indentAtStart,
  	lineWidth: ctx.options.lineWidth,
  	minContentWidth: ctx.options.minContentWidth
  });
  var containsDocumentMarker = (str) => /^(%|---|\.\.\.)/m.test(str);
  function lineLengthOverLimit(str, lineWidth, indentLength) {
  	if (!lineWidth || lineWidth < 0) return false;
  	const limit = lineWidth - indentLength;
  	const strLen = str.length;
  	if (strLen <= limit) return false;
  	for (let i = 0, start = 0; i < strLen; ++i) if (str[i] === "\n") {
  		if (i - start > limit) return true;
  		start = i + 1;
  		if (strLen - start <= limit) return false;
  	}
  	return true;
  }
  function doubleQuotedString(value, ctx) {
  	const json = JSON.stringify(value);
  	if (ctx.options.doubleQuotedAsJSON) return json;
  	const { implicitKey } = ctx;
  	const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
  	const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
  	let str = "";
  	let start = 0;
  	for (let i = 0, ch = json[i]; ch; ch = json[++i]) {
  		if (ch === " " && json[i + 1] === "\\" && json[i + 2] === "n") {
  			str += json.slice(start, i) + "\\ ";
  			i += 1;
  			start = i;
  			ch = "\\";
  		}
  		if (ch === "\\") switch (json[i + 1]) {
  			case "u":
  				{
  					str += json.slice(start, i);
  					const code = json.substr(i + 2, 4);
  					switch (code) {
  						case "0000":
  							str += "\\0";
  							break;
  						case "0007":
  							str += "\\a";
  							break;
  						case "000b":
  							str += "\\v";
  							break;
  						case "001b":
  							str += "\\e";
  							break;
  						case "0085":
  							str += "\\N";
  							break;
  						case "00a0":
  							str += "\\_";
  							break;
  						case "2028":
  							str += "\\L";
  							break;
  						case "2029":
  							str += "\\P";
  							break;
  						default: if (code.substr(0, 2) === "00") str += "\\x" + code.substr(2);
  						else str += json.substr(i, 6);
  					}
  					i += 5;
  					start = i + 1;
  				}
  				break;
  			case "n":
  				if (implicitKey || json[i + 2] === "\"" || json.length < minMultiLineLength) i += 1;
  				else {
  					str += json.slice(start, i) + "\n\n";
  					while (json[i + 2] === "\\" && json[i + 3] === "n" && json[i + 4] !== "\"") {
  						str += "\n";
  						i += 2;
  					}
  					str += indent;
  					if (json[i + 2] === " ") str += "\\";
  					i += 1;
  					start = i + 1;
  				}
  				break;
  			default: i += 1;
  		}
  	}
  	str = start ? str + json.slice(start) : json;
  	return implicitKey ? str : foldFlowLines(str, indent, FOLD_QUOTED, getFoldOptions(ctx, false));
  }
  function singleQuotedString(value, ctx) {
  	if (ctx.options.singleQuote === false || ctx.implicitKey && value.includes("\n") || /[ \t]\n|\n[ \t]/.test(value)) return doubleQuotedString(value, ctx);
  	const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
  	const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&\n${indent}`) + "'";
  	return ctx.implicitKey ? res : foldFlowLines(res, indent, FOLD_FLOW, getFoldOptions(ctx, false));
  }
  function quotedString(value, ctx) {
  	const { singleQuote } = ctx.options;
  	let qs;
  	if (singleQuote === false) qs = doubleQuotedString;
  	else {
  		const hasDouble = value.includes("\"");
  		const hasSingle = value.includes("'");
  		if (hasDouble && !hasSingle) qs = singleQuotedString;
  		else if (hasSingle && !hasDouble) qs = doubleQuotedString;
  		else qs = singleQuote ? singleQuotedString : doubleQuotedString;
  	}
  	return qs(value, ctx);
  }
  var blockEndNewlines;
  try {
  	blockEndNewlines = /* @__PURE__ */ new RegExp("(^|(?<!\n))\n+(?!\n|$)", "g");
  } catch {
  	blockEndNewlines = /\n+(?!\n|$)/g;
  }
  function blockString({ comment, type, value }, ctx, onComment, onChompKeep) {
  	const { blockQuote, commentString, lineWidth } = ctx.options;
  	if (!blockQuote || /\n[\t ]+$/.test(value)) return quotedString(value, ctx);
  	const indent = ctx.indent || (ctx.forceBlockIndent || containsDocumentMarker(value) ? "  " : "");
  	const literal = blockQuote === "literal" ? true : blockQuote === "folded" || type === Scalar.BLOCK_FOLDED ? false : type === Scalar.BLOCK_LITERAL ? true : !lineLengthOverLimit(value, lineWidth, indent.length);
  	if (!value) return literal ? "|\n" : ">\n";
  	let chomp;
  	let endStart;
  	for (endStart = value.length; endStart > 0; --endStart) {
  		const ch = value[endStart - 1];
  		if (ch !== "\n" && ch !== "	" && ch !== " ") break;
  	}
  	let end = value.substring(endStart);
  	const endNlPos = end.indexOf("\n");
  	if (endNlPos === -1) chomp = "-";
  	else if (value === end || endNlPos !== end.length - 1) {
  		chomp = "+";
  		if (onChompKeep) onChompKeep();
  	} else chomp = "";
  	if (end) {
  		value = value.slice(0, -end.length);
  		if (end[end.length - 1] === "\n") end = end.slice(0, -1);
  		end = end.replace(blockEndNewlines, `$&${indent}`);
  	}
  	let startWithSpace = false;
  	let startEnd;
  	let startNlPos = -1;
  	for (startEnd = 0; startEnd < value.length; ++startEnd) {
  		const ch = value[startEnd];
  		if (ch === " ") startWithSpace = true;
  		else if (ch === "\n") startNlPos = startEnd;
  		else break;
  	}
  	let start = value.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
  	if (start) {
  		value = value.substring(start.length);
  		start = start.replace(/\n+/g, `$&${indent}`);
  	}
  	let header = (startWithSpace ? indent ? "2" : "1" : "") + chomp;
  	if (comment) {
  		header += " " + commentString(comment.replace(/ ?[\r\n]+/g, " "));
  		if (onComment) onComment();
  	}
  	if (!literal) {
  		const foldedValue = value.replace(/\n+/g, "\n$&").replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${indent}`);
  		let literalFallback = false;
  		const foldOptions = getFoldOptions(ctx, true);
  		if (blockQuote !== "folded" && type !== Scalar.BLOCK_FOLDED) foldOptions.onOverflow = () => {
  			literalFallback = true;
  		};
  		const body = foldFlowLines(`${start}${foldedValue}${end}`, indent, FOLD_BLOCK, foldOptions);
  		if (!literalFallback) return `>${header}\n${indent}${body}`;
  	}
  	value = value.replace(/\n+/g, `$&${indent}`);
  	return `|${header}\n${indent}${start}${value}${end}`;
  }
  function plainString(item, ctx, onComment, onChompKeep) {
  	const { type, value } = item;
  	const { actualString, implicitKey, indent, indentStep, inFlow } = ctx;
  	if (implicitKey && value.includes("\n") || inFlow && /[[\]{},]/.test(value)) return quotedString(value, ctx);
  	if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) return implicitKey || inFlow || !value.includes("\n") ? quotedString(value, ctx) : blockString(item, ctx, onComment, onChompKeep);
  	if (!implicitKey && !inFlow && type !== Scalar.PLAIN && value.includes("\n")) return blockString(item, ctx, onComment, onChompKeep);
  	if (containsDocumentMarker(value)) {
  		if (indent === "") {
  			ctx.forceBlockIndent = true;
  			return blockString(item, ctx, onComment, onChompKeep);
  		} else if (implicitKey && indent === indentStep) return quotedString(value, ctx);
  	}
  	const str = value.replace(/\n+/g, `$&\n${indent}`);
  	if (actualString) {
  		const test = (tag) => tag.default && tag.tag !== "tag:yaml.org,2002:str" && tag.test?.test(str);
  		const { compat, tags } = ctx.doc.schema;
  		if (tags.some(test) || compat?.some(test)) return quotedString(value, ctx);
  	}
  	return implicitKey ? str : foldFlowLines(str, indent, FOLD_FLOW, getFoldOptions(ctx, false));
  }
  function stringifyString(item, ctx, onComment, onChompKeep) {
  	const { implicitKey, inFlow } = ctx;
  	const ss = typeof item.value === "string" ? item : Object.assign({}, item, { value: String(item.value) });
  	let { type } = item;
  	if (type !== Scalar.QUOTE_DOUBLE) {
  		if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss.value)) type = Scalar.QUOTE_DOUBLE;
  	}
  	const _stringify = (_type) => {
  		switch (_type) {
  			case Scalar.BLOCK_FOLDED:
  			case Scalar.BLOCK_LITERAL: return implicitKey || inFlow ? quotedString(ss.value, ctx) : blockString(ss, ctx, onComment, onChompKeep);
  			case Scalar.QUOTE_DOUBLE: return doubleQuotedString(ss.value, ctx);
  			case Scalar.QUOTE_SINGLE: return singleQuotedString(ss.value, ctx);
  			case Scalar.PLAIN: return plainString(ss, ctx, onComment, onChompKeep);
  			default: return null;
  		}
  	};
  	let res = _stringify(type);
  	if (res === null) {
  		const { defaultKeyType, defaultStringType } = ctx.options;
  		const t = implicitKey && defaultKeyType || defaultStringType;
  		res = _stringify(t);
  		if (res === null) throw new Error(`Unsupported default string type ${t}`);
  	}
  	return res;
  }
  function createStringifyContext(doc, options) {
  	const opt = Object.assign({
  		blockQuote: true,
  		commentString: stringifyComment,
  		defaultKeyType: null,
  		defaultStringType: "PLAIN",
  		directives: null,
  		doubleQuotedAsJSON: false,
  		doubleQuotedMinMultiLineLength: 40,
  		falseStr: "false",
  		flowCollectionPadding: true,
  		indentSeq: true,
  		lineWidth: 80,
  		minContentWidth: 20,
  		nullStr: "null",
  		simpleKeys: false,
  		singleQuote: null,
  		trailingComma: false,
  		trueStr: "true",
  		verifyAliasOrder: true
  	}, doc.schema.toStringOptions, options);
  	let inFlow;
  	switch (opt.collectionStyle) {
  		case "block":
  			inFlow = false;
  			break;
  		case "flow":
  			inFlow = true;
  			break;
  		default: inFlow = null;
  	}
  	return {
  		anchors: /* @__PURE__ */ new Set(),
  		doc,
  		flowCollectionPadding: opt.flowCollectionPadding ? " " : "",
  		indent: "",
  		indentStep: typeof opt.indent === "number" ? " ".repeat(opt.indent) : "  ",
  		inFlow,
  		options: opt
  	};
  }
  function getTagObject(tags, item) {
  	if (item.tag) {
  		const match = tags.filter((t) => t.tag === item.tag);
  		if (match.length > 0) return match.find((t) => t.format === item.format) ?? match[0];
  	}
  	let tagObj = void 0;
  	let obj;
  	if (isScalar(item)) {
  		obj = item.value;
  		let match = tags.filter((t) => t.identify?.(obj));
  		if (match.length > 1) {
  			const testMatch = match.filter((t) => t.test);
  			if (testMatch.length > 0) match = testMatch;
  		}
  		tagObj = match.find((t) => t.format === item.format) ?? match.find((t) => !t.format);
  	} else {
  		obj = item;
  		tagObj = tags.find((t) => t.nodeClass && obj instanceof t.nodeClass);
  	}
  	if (!tagObj) {
  		const name = obj?.constructor?.name ?? (obj === null ? "null" : typeof obj);
  		throw new Error(`Tag not resolved for ${name} value`);
  	}
  	return tagObj;
  }
  function stringifyProps(node, tagObj, { anchors, doc }) {
  	if (!doc.directives) return "";
  	const props = [];
  	const anchor = (isScalar(node) || isCollection(node)) && node.anchor;
  	if (anchor && anchorIsValid(anchor)) {
  		anchors.add(anchor);
  		props.push(`&${anchor}`);
  	}
  	const tag = node.tag ?? (tagObj.default ? null : tagObj.tag);
  	if (tag) props.push(doc.directives.tagString(tag));
  	return props.join(" ");
  }
  function stringify(item, ctx, onComment, onChompKeep) {
  	if (isPair(item)) return item.toString(ctx, onComment, onChompKeep);
  	if (isAlias(item)) {
  		if (ctx.doc.directives) return item.toString(ctx);
  		if (ctx.resolvedAliases?.has(item)) throw new TypeError(`Cannot stringify circular structure without alias nodes`);
  		else {
  			if (ctx.resolvedAliases) ctx.resolvedAliases.add(item);
  			else ctx.resolvedAliases = /* @__PURE__ */ new Set([item]);
  			item = item.resolve(ctx.doc);
  		}
  	}
  	let tagObj = void 0;
  	const node = isNode(item) ? item : ctx.doc.createNode(item, { onTagObj: (o) => tagObj = o });
  	tagObj ?? (tagObj = getTagObject(ctx.doc.schema.tags, node));
  	const props = stringifyProps(node, tagObj, ctx);
  	if (props.length > 0) ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1;
  	const str = typeof tagObj.stringify === "function" ? tagObj.stringify(node, ctx, onComment, onChompKeep) : isScalar(node) ? stringifyString(node, ctx, onComment, onChompKeep) : node.toString(ctx, onComment, onChompKeep);
  	if (!props) return str;
  	return isScalar(node) || str[0] === "{" || str[0] === "[" ? `${props} ${str}` : `${props}\n${ctx.indent}${str}`;
  }
  function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
  	const { allNullValues, doc, indent, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
  	let keyComment = isNode(key) && key.comment || null;
  	if (simpleKeys) {
  		if (keyComment) throw new Error("With simple keys, key nodes cannot have comments");
  		if (isCollection(key) || !isNode(key) && typeof key === "object") throw new Error("With simple keys, collection cannot be used as a key value");
  	}
  	let explicitKey = !simpleKeys && (!key || keyComment && value == null && !ctx.inFlow || isCollection(key) || (isScalar(key) ? key.type === Scalar.BLOCK_FOLDED || key.type === Scalar.BLOCK_LITERAL : typeof key === "object"));
  	ctx = Object.assign({}, ctx, {
  		allNullValues: false,
  		implicitKey: !explicitKey && (simpleKeys || !allNullValues),
  		indent: indent + indentStep
  	});
  	let keyCommentDone = false;
  	let chompKeep = false;
  	let str = stringify(key, ctx, () => keyCommentDone = true, () => chompKeep = true);
  	if (!explicitKey && !ctx.inFlow && str.length > 1024) {
  		if (simpleKeys) throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
  		explicitKey = true;
  	}
  	if (ctx.inFlow) {
  		if (allNullValues || value == null) {
  			if (keyCommentDone && onComment) onComment();
  			return str === "" ? "?" : explicitKey ? `? ${str}` : str;
  		}
  	} else if (allNullValues && !simpleKeys || value == null && explicitKey) {
  		str = `? ${str}`;
  		if (keyComment && !keyCommentDone) str += lineComment(str, ctx.indent, commentString(keyComment));
  		else if (chompKeep && onChompKeep) onChompKeep();
  		return str;
  	}
  	if (keyCommentDone) keyComment = null;
  	if (explicitKey) {
  		if (keyComment) str += lineComment(str, ctx.indent, commentString(keyComment));
  		str = `? ${str}\n${indent}:`;
  	} else {
  		str = `${str}:`;
  		if (keyComment) str += lineComment(str, ctx.indent, commentString(keyComment));
  	}
  	let vsb, vcb, valueComment;
  	if (isNode(value)) {
  		vsb = !!value.spaceBefore;
  		vcb = value.commentBefore;
  		valueComment = value.comment;
  	} else {
  		vsb = false;
  		vcb = null;
  		valueComment = null;
  		if (value && typeof value === "object") value = doc.createNode(value);
  	}
  	ctx.implicitKey = false;
  	if (!explicitKey && !keyComment && isScalar(value)) ctx.indentAtStart = str.length + 1;
  	chompKeep = false;
  	if (!indentSeq && indentStep.length >= 2 && !ctx.inFlow && !explicitKey && isSeq(value) && !value.flow && !value.tag && !value.anchor) ctx.indent = ctx.indent.substring(2);
  	let valueCommentDone = false;
  	const valueStr = stringify(value, ctx, () => valueCommentDone = true, () => chompKeep = true);
  	let ws = " ";
  	if (keyComment || vsb || vcb) {
  		ws = vsb ? "\n" : "";
  		if (vcb) {
  			const cs = commentString(vcb);
  			ws += `\n${indentComment(cs, ctx.indent)}`;
  		}
  		if (valueStr === "" && !ctx.inFlow) {
  			if (ws === "\n" && valueComment) ws = "\n\n";
  		} else ws += `\n${ctx.indent}`;
  	} else if (!explicitKey && isCollection(value)) {
  		const vs0 = valueStr[0];
  		const nl0 = valueStr.indexOf("\n");
  		const hasNewline = nl0 !== -1;
  		const flow = ctx.inFlow ?? value.flow ?? value.items.length === 0;
  		if (hasNewline || !flow) {
  			let hasPropsLine = false;
  			if (hasNewline && (vs0 === "&" || vs0 === "!")) {
  				let sp0 = valueStr.indexOf(" ");
  				if (vs0 === "&" && sp0 !== -1 && sp0 < nl0 && valueStr[sp0 + 1] === "!") sp0 = valueStr.indexOf(" ", sp0 + 1);
  				if (sp0 === -1 || nl0 < sp0) hasPropsLine = true;
  			}
  			if (!hasPropsLine) ws = `\n${ctx.indent}`;
  		}
  	} else if (valueStr === "" || valueStr[0] === "\n") ws = "";
  	str += ws + valueStr;
  	if (ctx.inFlow) {
  		if (valueCommentDone && onComment) onComment();
  	} else if (valueComment && !valueCommentDone) str += lineComment(str, ctx.indent, commentString(valueComment));
  	else if (chompKeep && onChompKeep) onChompKeep();
  	return str;
  }
  function warn(logLevel, warning) {
  	if (logLevel === "debug" || logLevel === "warn") console.warn(warning);
  }
  var MERGE_KEY = "<<";
  var merge = {
  	identify: (value) => value === MERGE_KEY || typeof value === "symbol" && value.description === MERGE_KEY,
  	default: "key",
  	tag: "tag:yaml.org,2002:merge",
  	test: /^<<$/,
  	resolve: () => Object.assign(new Scalar(Symbol(MERGE_KEY)), { addToJSMap: addMergeToJSMap }),
  	stringify: () => MERGE_KEY
  };
  var isMergeKey = (ctx, key) => (merge.identify(key) || isScalar(key) && (!key.type || key.type === Scalar.PLAIN) && merge.identify(key.value)) && ctx?.doc.schema.tags.some((tag) => tag.tag === merge.tag && tag.default);
  function addMergeToJSMap(ctx, map, value) {
  	const source = resolveAliasValue(ctx, value);
  	if (isSeq(source)) for (const it of source.items) mergeValue(ctx, map, it);
  	else if (Array.isArray(source)) for (const it of source) mergeValue(ctx, map, it);
  	else mergeValue(ctx, map, source);
  }
  function mergeValue(ctx, map, value) {
  	const source = resolveAliasValue(ctx, value);
  	if (!isMap(source)) throw new Error("Merge sources must be maps or map aliases");
  	const srcMap = source.toJSON(null, ctx, Map);
  	for (const [key, value] of srcMap) if (map instanceof Map) {
  		if (!map.has(key)) map.set(key, value);
  	} else if (map instanceof Set) map.add(key);
  	else if (!Object.prototype.hasOwnProperty.call(map, key)) Object.defineProperty(map, key, {
  		value,
  		writable: true,
  		enumerable: true,
  		configurable: true
  	});
  	return map;
  }
  function resolveAliasValue(ctx, value) {
  	return ctx && isAlias(value) ? value.resolve(ctx.doc, ctx) : value;
  }
  function addPairToJSMap(ctx, map, { key, value }) {
  	if (isNode(key) && key.addToJSMap) key.addToJSMap(ctx, map, value);
  	else if (isMergeKey(ctx, key)) addMergeToJSMap(ctx, map, value);
  	else {
  		const jsKey = toJS(key, "", ctx);
  		if (map instanceof Map) map.set(jsKey, toJS(value, jsKey, ctx));
  		else if (map instanceof Set) map.add(jsKey);
  		else {
  			const stringKey = stringifyKey(key, jsKey, ctx);
  			const jsValue = toJS(value, stringKey, ctx);
  			if (stringKey in map) Object.defineProperty(map, stringKey, {
  				value: jsValue,
  				writable: true,
  				enumerable: true,
  				configurable: true
  			});
  			else map[stringKey] = jsValue;
  		}
  	}
  	return map;
  }
  function stringifyKey(key, jsKey, ctx) {
  	if (jsKey === null) return "";
  	if (typeof jsKey !== "object") return String(jsKey);
  	if (isNode(key) && ctx?.doc) {
  		const strCtx = createStringifyContext(ctx.doc, {});
  		strCtx.anchors = /* @__PURE__ */ new Set();
  		for (const node of ctx.anchors.keys()) strCtx.anchors.add(node.anchor);
  		strCtx.inFlow = true;
  		strCtx.inStringifyKey = true;
  		const strKey = key.toString(strCtx);
  		if (!ctx.mapKeyWarned) {
  			let jsonStr = JSON.stringify(strKey);
  			if (jsonStr.length > 40) jsonStr = jsonStr.substring(0, 36) + "...\"";
  			warn(ctx.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`);
  			ctx.mapKeyWarned = true;
  		}
  		return strKey;
  	}
  	return JSON.stringify(jsKey);
  }
  function createPair(key, value, ctx) {
  	return new Pair(createNode(key, void 0, ctx), createNode(value, void 0, ctx));
  }
  var Pair = class Pair {
  	constructor(key, value = null) {
  		Object.defineProperty(this, NODE_TYPE, { value: PAIR });
  		this.key = key;
  		this.value = value;
  	}
  	clone(schema) {
  		let { key, value } = this;
  		if (isNode(key)) key = key.clone(schema);
  		if (isNode(value)) value = value.clone(schema);
  		return new Pair(key, value);
  	}
  	toJSON(_, ctx) {
  		return addPairToJSMap(ctx, ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {}, this);
  	}
  	toString(ctx, onComment, onChompKeep) {
  		return ctx?.doc ? stringifyPair(this, ctx, onComment, onChompKeep) : JSON.stringify(this);
  	}
  };
  function stringifyCollection(collection, ctx, options) {
  	return (ctx.inFlow ?? collection.flow ? stringifyFlowCollection : stringifyBlockCollection)(collection, ctx, options);
  }
  function stringifyBlockCollection({ comment, items }, ctx, { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment }) {
  	const { indent, options: { commentString } } = ctx;
  	const itemCtx = Object.assign({}, ctx, {
  		indent: itemIndent,
  		type: null
  	});
  	let chompKeep = false;
  	const lines = [];
  	for (let i = 0; i < items.length; ++i) {
  		const item = items[i];
  		let comment = null;
  		if (isNode(item)) {
  			if (!chompKeep && item.spaceBefore) lines.push("");
  			addCommentBefore(ctx, lines, item.commentBefore, chompKeep);
  			if (item.comment) comment = item.comment;
  		} else if (isPair(item)) {
  			const ik = isNode(item.key) ? item.key : null;
  			if (ik) {
  				if (!chompKeep && ik.spaceBefore) lines.push("");
  				addCommentBefore(ctx, lines, ik.commentBefore, chompKeep);
  			}
  		}
  		chompKeep = false;
  		let str = stringify(item, itemCtx, () => comment = null, () => chompKeep = true);
  		if (comment) str += lineComment(str, itemIndent, commentString(comment));
  		if (chompKeep && comment) chompKeep = false;
  		lines.push(blockItemPrefix + str);
  	}
  	let str;
  	if (lines.length === 0) str = flowChars.start + flowChars.end;
  	else {
  		str = lines[0];
  		for (let i = 1; i < lines.length; ++i) {
  			const line = lines[i];
  			str += line ? `\n${indent}${line}` : "\n";
  		}
  	}
  	if (comment) {
  		str += "\n" + indentComment(commentString(comment), indent);
  		if (onComment) onComment();
  	} else if (chompKeep && onChompKeep) onChompKeep();
  	return str;
  }
  function stringifyFlowCollection({ items }, ctx, { flowChars, itemIndent }) {
  	const { indent, indentStep, flowCollectionPadding: fcPadding, options: { commentString } } = ctx;
  	itemIndent += indentStep;
  	const itemCtx = Object.assign({}, ctx, {
  		indent: itemIndent,
  		inFlow: true,
  		type: null
  	});
  	let reqNewline = false;
  	let linesAtValue = 0;
  	const lines = [];
  	for (let i = 0; i < items.length; ++i) {
  		const item = items[i];
  		let comment = null;
  		if (isNode(item)) {
  			if (item.spaceBefore) lines.push("");
  			addCommentBefore(ctx, lines, item.commentBefore, false);
  			if (item.comment) comment = item.comment;
  		} else if (isPair(item)) {
  			const ik = isNode(item.key) ? item.key : null;
  			if (ik) {
  				if (ik.spaceBefore) lines.push("");
  				addCommentBefore(ctx, lines, ik.commentBefore, false);
  				if (ik.comment) reqNewline = true;
  			}
  			const iv = isNode(item.value) ? item.value : null;
  			if (iv) {
  				if (iv.comment) comment = iv.comment;
  				if (iv.commentBefore) reqNewline = true;
  			} else if (item.value == null && ik?.comment) comment = ik.comment;
  		}
  		if (comment) reqNewline = true;
  		let str = stringify(item, itemCtx, () => comment = null);
  		reqNewline || (reqNewline = lines.length > linesAtValue || str.includes("\n"));
  		if (i < items.length - 1) str += ",";
  		else if (ctx.options.trailingComma) {
  			if (ctx.options.lineWidth > 0) reqNewline || (reqNewline = lines.reduce((sum, line) => sum + line.length + 2, 2) + (str.length + 2) > ctx.options.lineWidth);
  			if (reqNewline) str += ",";
  		}
  		if (comment) str += lineComment(str, itemIndent, commentString(comment));
  		lines.push(str);
  		linesAtValue = lines.length;
  	}
  	const { start, end } = flowChars;
  	if (lines.length === 0) return start + end;
  	else {
  		if (!reqNewline) {
  			const len = lines.reduce((sum, line) => sum + line.length + 2, 2);
  			reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth;
  		}
  		if (reqNewline) {
  			let str = start;
  			for (const line of lines) str += line ? `\n${indentStep}${indent}${line}` : "\n";
  			return `${str}\n${indent}${end}`;
  		} else return `${start}${fcPadding}${lines.join(" ")}${fcPadding}${end}`;
  	}
  }
  function addCommentBefore({ indent, options: { commentString } }, lines, comment, chompKeep) {
  	if (comment && chompKeep) comment = comment.replace(/^\n+/, "");
  	if (comment) {
  		const ic = indentComment(commentString(comment), indent);
  		lines.push(ic.trimStart());
  	}
  }
  function findPair(items, key) {
  	const k = isScalar(key) ? key.value : key;
  	for (const it of items) if (isPair(it)) {
  		if (it.key === key || it.key === k) return it;
  		if (isScalar(it.key) && it.key.value === k) return it;
  	}
  }
  var YAMLMap = class extends Collection {
  	static get tagName() {
  		return "tag:yaml.org,2002:map";
  	}
  	constructor(schema) {
  		super(MAP, schema);
  		this.items = [];
  	}
  	/**
  	* A generic collection parsing method that can be extended
  	* to other node classes that inherit from YAMLMap
  	*/
  	static from(schema, obj, ctx) {
  		const { keepUndefined, replacer } = ctx;
  		const map = new this(schema);
  		const add = (key, value) => {
  			if (typeof replacer === "function") value = replacer.call(obj, key, value);
  			else if (Array.isArray(replacer) && !replacer.includes(key)) return;
  			if (value !== void 0 || keepUndefined) map.items.push(createPair(key, value, ctx));
  		};
  		if (obj instanceof Map) for (const [key, value] of obj) add(key, value);
  		else if (obj && typeof obj === "object") for (const key of Object.keys(obj)) add(key, obj[key]);
  		if (typeof schema.sortMapEntries === "function") map.items.sort(schema.sortMapEntries);
  		return map;
  	}
  	/**
  	* Adds a value to the collection.
  	*
  	* @param overwrite - If not set `true`, using a key that is already in the
  	*   collection will throw. Otherwise, overwrites the previous value.
  	*/
  	add(pair, overwrite) {
  		let _pair;
  		if (isPair(pair)) _pair = pair;
  		else if (!pair || typeof pair !== "object" || !("key" in pair)) _pair = new Pair(pair, pair?.value);
  		else _pair = new Pair(pair.key, pair.value);
  		const prev = findPair(this.items, _pair.key);
  		const sortEntries = this.schema?.sortMapEntries;
  		if (prev) {
  			if (!overwrite) throw new Error(`Key ${_pair.key} already set`);
  			if (isScalar(prev.value) && isScalarValue(_pair.value)) prev.value.value = _pair.value;
  			else prev.value = _pair.value;
  		} else if (sortEntries) {
  			const i = this.items.findIndex((item) => sortEntries(_pair, item) < 0);
  			if (i === -1) this.items.push(_pair);
  			else this.items.splice(i, 0, _pair);
  		} else this.items.push(_pair);
  	}
  	delete(key) {
  		const it = findPair(this.items, key);
  		if (!it) return false;
  		return this.items.splice(this.items.indexOf(it), 1).length > 0;
  	}
  	get(key, keepScalar) {
  		const node = findPair(this.items, key)?.value;
  		return (!keepScalar && isScalar(node) ? node.value : node) ?? void 0;
  	}
  	has(key) {
  		return !!findPair(this.items, key);
  	}
  	set(key, value) {
  		this.add(new Pair(key, value), true);
  	}
  	/**
  	* @param ctx - Conversion context, originally set in Document#toJS()
  	* @param {Class} Type - If set, forces the returned collection type
  	* @returns Instance of Type, Map, or Object
  	*/
  	toJSON(_, ctx, Type) {
  		const map = Type ? new Type() : ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
  		if (ctx?.onCreate) ctx.onCreate(map);
  		for (const item of this.items) addPairToJSMap(ctx, map, item);
  		return map;
  	}
  	toString(ctx, onComment, onChompKeep) {
  		if (!ctx) return JSON.stringify(this);
  		for (const item of this.items) if (!isPair(item)) throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
  		if (!ctx.allNullValues && this.hasAllNullValues(false)) ctx = Object.assign({}, ctx, { allNullValues: true });
  		return stringifyCollection(this, ctx, {
  			blockItemPrefix: "",
  			flowChars: {
  				start: "{",
  				end: "}"
  			},
  			itemIndent: ctx.indent || "",
  			onChompKeep,
  			onComment
  		});
  	}
  };
  var map = {
  	collection: "map",
  	default: true,
  	nodeClass: YAMLMap,
  	tag: "tag:yaml.org,2002:map",
  	resolve(map, onError) {
  		if (!isMap(map)) onError("Expected a mapping for this tag");
  		return map;
  	},
  	createNode: (schema, obj, ctx) => YAMLMap.from(schema, obj, ctx)
  };
  var YAMLSeq = class extends Collection {
  	static get tagName() {
  		return "tag:yaml.org,2002:seq";
  	}
  	constructor(schema) {
  		super(SEQ, schema);
  		this.items = [];
  	}
  	add(value) {
  		this.items.push(value);
  	}
  	/**
  	* Removes a value from the collection.
  	*
  	* `key` must contain a representation of an integer for this to succeed.
  	* It may be wrapped in a `Scalar`.
  	*
  	* @returns `true` if the item was found and removed.
  	*/
  	delete(key) {
  		const idx = asItemIndex(key);
  		if (typeof idx !== "number") return false;
  		return this.items.splice(idx, 1).length > 0;
  	}
  	get(key, keepScalar) {
  		const idx = asItemIndex(key);
  		if (typeof idx !== "number") return void 0;
  		const it = this.items[idx];
  		return !keepScalar && isScalar(it) ? it.value : it;
  	}
  	/**
  	* Checks if the collection includes a value with the key `key`.
  	*
  	* `key` must contain a representation of an integer for this to succeed.
  	* It may be wrapped in a `Scalar`.
  	*/
  	has(key) {
  		const idx = asItemIndex(key);
  		return typeof idx === "number" && idx < this.items.length;
  	}
  	/**
  	* Sets a value in this collection. For `!!set`, `value` needs to be a
  	* boolean to add/remove the item from the set.
  	*
  	* If `key` does not contain a representation of an integer, this will throw.
  	* It may be wrapped in a `Scalar`.
  	*/
  	set(key, value) {
  		const idx = asItemIndex(key);
  		if (typeof idx !== "number") throw new Error(`Expected a valid index, not ${key}.`);
  		const prev = this.items[idx];
  		if (isScalar(prev) && isScalarValue(value)) prev.value = value;
  		else this.items[idx] = value;
  	}
  	toJSON(_, ctx) {
  		const seq = [];
  		if (ctx?.onCreate) ctx.onCreate(seq);
  		let i = 0;
  		for (const item of this.items) seq.push(toJS(item, String(i++), ctx));
  		return seq;
  	}
  	toString(ctx, onComment, onChompKeep) {
  		if (!ctx) return JSON.stringify(this);
  		return stringifyCollection(this, ctx, {
  			blockItemPrefix: "- ",
  			flowChars: {
  				start: "[",
  				end: "]"
  			},
  			itemIndent: (ctx.indent || "") + "  ",
  			onChompKeep,
  			onComment
  		});
  	}
  	static from(schema, obj, ctx) {
  		const { replacer } = ctx;
  		const seq = new this(schema);
  		if (obj && Symbol.iterator in Object(obj)) {
  			let i = 0;
  			for (let it of obj) {
  				if (typeof replacer === "function") {
  					const key = obj instanceof Set ? it : String(i++);
  					it = replacer.call(obj, key, it);
  				}
  				seq.items.push(createNode(it, void 0, ctx));
  			}
  		}
  		return seq;
  	}
  };
  function asItemIndex(key) {
  	let idx = isScalar(key) ? key.value : key;
  	if (idx && typeof idx === "string") idx = Number(idx);
  	return typeof idx === "number" && Number.isInteger(idx) && idx >= 0 ? idx : null;
  }
  var seq = {
  	collection: "seq",
  	default: true,
  	nodeClass: YAMLSeq,
  	tag: "tag:yaml.org,2002:seq",
  	resolve(seq, onError) {
  		if (!isSeq(seq)) onError("Expected a sequence for this tag");
  		return seq;
  	},
  	createNode: (schema, obj, ctx) => YAMLSeq.from(schema, obj, ctx)
  };
  var string = {
  	identify: (value) => typeof value === "string",
  	default: true,
  	tag: "tag:yaml.org,2002:str",
  	resolve: (str) => str,
  	stringify(item, ctx, onComment, onChompKeep) {
  		ctx = Object.assign({ actualString: true }, ctx);
  		return stringifyString(item, ctx, onComment, onChompKeep);
  	}
  };
  var nullTag = {
  	identify: (value) => value == null,
  	createNode: () => new Scalar(null),
  	default: true,
  	tag: "tag:yaml.org,2002:null",
  	test: /^(?:~|[Nn]ull|NULL)?$/,
  	resolve: () => new Scalar(null),
  	stringify: ({ source }, ctx) => typeof source === "string" && nullTag.test.test(source) ? source : ctx.options.nullStr
  };
  var boolTag = {
  	identify: (value) => typeof value === "boolean",
  	default: true,
  	tag: "tag:yaml.org,2002:bool",
  	test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
  	resolve: (str) => new Scalar(str[0] === "t" || str[0] === "T"),
  	stringify({ source, value }, ctx) {
  		if (source && boolTag.test.test(source)) {
  			if (value === (source[0] === "t" || source[0] === "T")) return source;
  		}
  		return value ? ctx.options.trueStr : ctx.options.falseStr;
  	}
  };
  function stringifyNumber({ format, minFractionDigits, tag, value }) {
  	if (typeof value === "bigint") return String(value);
  	const num = typeof value === "number" ? value : Number(value);
  	if (!isFinite(num)) return isNaN(num) ? ".nan" : num < 0 ? "-.inf" : ".inf";
  	let n = Object.is(value, -0) ? "-0" : JSON.stringify(value);
  	if (!format && minFractionDigits && (!tag || tag === "tag:yaml.org,2002:float") && /^-?\d/.test(n) && !n.includes("e")) {
  		let i = n.indexOf(".");
  		if (i < 0) {
  			i = n.length;
  			n += ".";
  		}
  		let d = minFractionDigits - (n.length - i - 1);
  		while (d-- > 0) n += "0";
  	}
  	return n;
  }
  var floatNaN$1 = {
  	identify: (value) => typeof value === "number",
  	default: true,
  	tag: "tag:yaml.org,2002:float",
  	test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
  	resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
  	stringify: stringifyNumber
  };
  var floatExp$1 = {
  	identify: (value) => typeof value === "number",
  	default: true,
  	tag: "tag:yaml.org,2002:float",
  	format: "EXP",
  	test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
  	resolve: (str) => parseFloat(str),
  	stringify(node) {
  		const num = Number(node.value);
  		return isFinite(num) ? num.toExponential() : stringifyNumber(node);
  	}
  };
  var float$1 = {
  	identify: (value) => typeof value === "number",
  	default: true,
  	tag: "tag:yaml.org,2002:float",
  	test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
  	resolve(str) {
  		const node = new Scalar(parseFloat(str));
  		const dot = str.indexOf(".");
  		if (dot !== -1 && str[str.length - 1] === "0") node.minFractionDigits = str.length - dot - 1;
  		return node;
  	},
  	stringify: stringifyNumber
  };
  var intIdentify$2 = (value) => typeof value === "bigint" || Number.isInteger(value);
  var intResolve$1 = (str, offset, radix, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str.substring(offset), radix);
  function intStringify$1(node, radix, prefix) {
  	const { value } = node;
  	if (intIdentify$2(value) && value >= 0) return prefix + value.toString(radix);
  	return stringifyNumber(node);
  }
  var intOct$1 = {
  	identify: (value) => intIdentify$2(value) && value >= 0,
  	default: true,
  	tag: "tag:yaml.org,2002:int",
  	format: "OCT",
  	test: /^0o[0-7]+$/,
  	resolve: (str, _onError, opt) => intResolve$1(str, 2, 8, opt),
  	stringify: (node) => intStringify$1(node, 8, "0o")
  };
  var int$1 = {
  	identify: intIdentify$2,
  	default: true,
  	tag: "tag:yaml.org,2002:int",
  	test: /^[-+]?[0-9]+$/,
  	resolve: (str, _onError, opt) => intResolve$1(str, 0, 10, opt),
  	stringify: stringifyNumber
  };
  var intHex$1 = {
  	identify: (value) => intIdentify$2(value) && value >= 0,
  	default: true,
  	tag: "tag:yaml.org,2002:int",
  	format: "HEX",
  	test: /^0x[0-9a-fA-F]+$/,
  	resolve: (str, _onError, opt) => intResolve$1(str, 2, 16, opt),
  	stringify: (node) => intStringify$1(node, 16, "0x")
  };
  var schema$2 = [
  	map,
  	seq,
  	string,
  	nullTag,
  	boolTag,
  	intOct$1,
  	int$1,
  	intHex$1,
  	floatNaN$1,
  	floatExp$1,
  	float$1
  ];
  function intIdentify$1(value) {
  	return typeof value === "bigint" || Number.isInteger(value);
  }
  var stringifyJSON = ({ value }) => JSON.stringify(value);
  var jsonScalars = [
  	{
  		identify: (value) => typeof value === "string",
  		default: true,
  		tag: "tag:yaml.org,2002:str",
  		resolve: (str) => str,
  		stringify: stringifyJSON
  	},
  	{
  		identify: (value) => value == null,
  		createNode: () => new Scalar(null),
  		default: true,
  		tag: "tag:yaml.org,2002:null",
  		test: /^null$/,
  		resolve: () => null,
  		stringify: stringifyJSON
  	},
  	{
  		identify: (value) => typeof value === "boolean",
  		default: true,
  		tag: "tag:yaml.org,2002:bool",
  		test: /^true$|^false$/,
  		resolve: (str) => str === "true",
  		stringify: stringifyJSON
  	},
  	{
  		identify: intIdentify$1,
  		default: true,
  		tag: "tag:yaml.org,2002:int",
  		test: /^-?(?:0|[1-9][0-9]*)$/,
  		resolve: (str, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str, 10),
  		stringify: ({ value }) => intIdentify$1(value) ? value.toString() : JSON.stringify(value)
  	},
  	{
  		identify: (value) => typeof value === "number",
  		default: true,
  		tag: "tag:yaml.org,2002:float",
  		test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
  		resolve: (str) => parseFloat(str),
  		stringify: stringifyJSON
  	}
  ];
  var schema$1 = [map, seq].concat(jsonScalars, {
  	default: true,
  	tag: "",
  	test: /^/,
  	resolve(str, onError) {
  		onError(`Unresolved plain scalar ${JSON.stringify(str)}`);
  		return str;
  	}
  });
  var binary = {
  	identify: (value) => value instanceof Uint8Array,
  	default: false,
  	tag: "tag:yaml.org,2002:binary",
  	/**
  	* Returns a Buffer in node and an Uint8Array in browsers
  	*
  	* To use the resulting buffer as an image, you'll want to do something like:
  	*
  	*   const blob = new Blob([buffer], { type: 'image/jpeg' })
  	*   document.querySelector('#photo').src = URL.createObjectURL(blob)
  	*/
  	resolve(src, onError) {
  		if (typeof atob === "function") {
  			const str = atob(src.replace(/[\n\r]/g, ""));
  			const buffer = new Uint8Array(str.length);
  			for (let i = 0; i < str.length; ++i) buffer[i] = str.charCodeAt(i);
  			return buffer;
  		} else {
  			onError("This environment does not support reading binary tags; either Buffer or atob is required");
  			return src;
  		}
  	},
  	stringify({ comment, type, value }, ctx, onComment, onChompKeep) {
  		if (!value) return "";
  		const buf = value;
  		let str;
  		if (typeof btoa === "function") {
  			let s = "";
  			for (let i = 0; i < buf.length; ++i) s += String.fromCharCode(buf[i]);
  			str = btoa(s);
  		} else throw new Error("This environment does not support writing binary tags; either Buffer or btoa is required");
  		type ?? (type = Scalar.BLOCK_LITERAL);
  		if (type !== Scalar.QUOTE_DOUBLE) {
  			const lineWidth = Math.max(ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth);
  			const n = Math.ceil(str.length / lineWidth);
  			const lines = new Array(n);
  			for (let i = 0, o = 0; i < n; ++i, o += lineWidth) lines[i] = str.substr(o, lineWidth);
  			str = lines.join(type === Scalar.BLOCK_LITERAL ? "\n" : " ");
  		}
  		return stringifyString({
  			comment,
  			type,
  			value: str
  		}, ctx, onComment, onChompKeep);
  	}
  };
  function resolvePairs(seq, onError) {
  	if (isSeq(seq)) for (let i = 0; i < seq.items.length; ++i) {
  		let item = seq.items[i];
  		if (isPair(item)) continue;
  		else if (isMap(item)) {
  			if (item.items.length > 1) onError("Each pair must have its own sequence indicator");
  			const pair = item.items[0] || new Pair(new Scalar(null));
  			if (item.commentBefore) pair.key.commentBefore = pair.key.commentBefore ? `${item.commentBefore}\n${pair.key.commentBefore}` : item.commentBefore;
  			if (item.comment) {
  				const cn = pair.value ?? pair.key;
  				cn.comment = cn.comment ? `${item.comment}\n${cn.comment}` : item.comment;
  			}
  			item = pair;
  		}
  		seq.items[i] = isPair(item) ? item : new Pair(item);
  	}
  	else onError("Expected a sequence for this tag");
  	return seq;
  }
  function createPairs(schema, iterable, ctx) {
  	const { replacer } = ctx;
  	const pairs = new YAMLSeq(schema);
  	pairs.tag = "tag:yaml.org,2002:pairs";
  	let i = 0;
  	if (iterable && Symbol.iterator in Object(iterable)) for (let it of iterable) {
  		if (typeof replacer === "function") it = replacer.call(iterable, String(i++), it);
  		let key, value;
  		if (Array.isArray(it)) {
  			if (it.length === 2) {
  				key = it[0];
  				value = it[1];
  			} else throw new TypeError(`Expected [key, value] tuple: ${it}`);
  		} else if (it && it instanceof Object) {
  			const keys = Object.keys(it);
  			if (keys.length === 1) {
  				key = keys[0];
  				value = it[key];
  			} else throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
  		} else key = it;
  		pairs.items.push(createPair(key, value, ctx));
  	}
  	return pairs;
  }
  var pairs = {
  	collection: "seq",
  	default: false,
  	tag: "tag:yaml.org,2002:pairs",
  	resolve: resolvePairs,
  	createNode: createPairs
  };
  var YAMLOMap = class YAMLOMap extends YAMLSeq {
  	constructor() {
  		super();
  		this.add = YAMLMap.prototype.add.bind(this);
  		this.delete = YAMLMap.prototype.delete.bind(this);
  		this.get = YAMLMap.prototype.get.bind(this);
  		this.has = YAMLMap.prototype.has.bind(this);
  		this.set = YAMLMap.prototype.set.bind(this);
  		this.tag = YAMLOMap.tag;
  	}
  	/**
  	* If `ctx` is given, the return type is actually `Map<unknown, unknown>`,
  	* but TypeScript won't allow widening the signature of a child method.
  	*/
  	toJSON(_, ctx) {
  		if (!ctx) return super.toJSON(_);
  		const map = /* @__PURE__ */ new Map();
  		if (ctx?.onCreate) ctx.onCreate(map);
  		for (const pair of this.items) {
  			let key, value;
  			if (isPair(pair)) {
  				key = toJS(pair.key, "", ctx);
  				value = toJS(pair.value, key, ctx);
  			} else key = toJS(pair, "", ctx);
  			if (map.has(key)) throw new Error("Ordered maps must not include duplicate keys");
  			map.set(key, value);
  		}
  		return map;
  	}
  	static from(schema, iterable, ctx) {
  		const pairs = createPairs(schema, iterable, ctx);
  		const omap = new this();
  		omap.items = pairs.items;
  		return omap;
  	}
  };
  YAMLOMap.tag = "tag:yaml.org,2002:omap";
  var omap = {
  	collection: "seq",
  	identify: (value) => value instanceof Map,
  	nodeClass: YAMLOMap,
  	default: false,
  	tag: "tag:yaml.org,2002:omap",
  	resolve(seq, onError) {
  		const pairs = resolvePairs(seq, onError);
  		const seenKeys = [];
  		for (const { key } of pairs.items) if (isScalar(key)) {
  			if (seenKeys.includes(key.value)) onError(`Ordered maps must not include duplicate keys: ${key.value}`);
  			else seenKeys.push(key.value);
  		}
  		return Object.assign(new YAMLOMap(), pairs);
  	},
  	createNode: (schema, iterable, ctx) => YAMLOMap.from(schema, iterable, ctx)
  };
  function boolStringify({ value, source }, ctx) {
  	if (source && (value ? trueTag : falseTag).test.test(source)) return source;
  	return value ? ctx.options.trueStr : ctx.options.falseStr;
  }
  var trueTag = {
  	identify: (value) => value === true,
  	default: true,
  	tag: "tag:yaml.org,2002:bool",
  	test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
  	resolve: () => new Scalar(true),
  	stringify: boolStringify
  };
  var falseTag = {
  	identify: (value) => value === false,
  	default: true,
  	tag: "tag:yaml.org,2002:bool",
  	test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
  	resolve: () => new Scalar(false),
  	stringify: boolStringify
  };
  var floatNaN = {
  	identify: (value) => typeof value === "number",
  	default: true,
  	tag: "tag:yaml.org,2002:float",
  	test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
  	resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
  	stringify: stringifyNumber
  };
  var floatExp = {
  	identify: (value) => typeof value === "number",
  	default: true,
  	tag: "tag:yaml.org,2002:float",
  	format: "EXP",
  	test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
  	resolve: (str) => parseFloat(str.replace(/_/g, "")),
  	stringify(node) {
  		const num = Number(node.value);
  		return isFinite(num) ? num.toExponential() : stringifyNumber(node);
  	}
  };
  var float = {
  	identify: (value) => typeof value === "number",
  	default: true,
  	tag: "tag:yaml.org,2002:float",
  	test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
  	resolve(str) {
  		const node = new Scalar(parseFloat(str.replace(/_/g, "")));
  		const dot = str.indexOf(".");
  		if (dot !== -1) {
  			const f = str.substring(dot + 1).replace(/_/g, "");
  			if (f[f.length - 1] === "0") node.minFractionDigits = f.length;
  		}
  		return node;
  	},
  	stringify: stringifyNumber
  };
  var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
  function intResolve(str, offset, radix, { intAsBigInt }) {
  	const sign = str[0];
  	if (sign === "-" || sign === "+") offset += 1;
  	str = str.substring(offset).replace(/_/g, "");
  	if (intAsBigInt) {
  		switch (radix) {
  			case 2:
  				str = `0b${str}`;
  				break;
  			case 8:
  				str = `0o${str}`;
  				break;
  			case 16: str = `0x${str}`;
  		}
  		const n = BigInt(str);
  		return sign === "-" ? BigInt(-1) * n : n;
  	}
  	const n = parseInt(str, radix);
  	return sign === "-" ? -1 * n : n;
  }
  function intStringify(node, radix, prefix) {
  	const { value } = node;
  	if (intIdentify(value)) {
  		const str = value.toString(radix);
  		return value < 0 ? "-" + prefix + str.substr(1) : prefix + str;
  	}
  	return stringifyNumber(node);
  }
  var intBin = {
  	identify: intIdentify,
  	default: true,
  	tag: "tag:yaml.org,2002:int",
  	format: "BIN",
  	test: /^[-+]?0b[0-1_]+$/,
  	resolve: (str, _onError, opt) => intResolve(str, 2, 2, opt),
  	stringify: (node) => intStringify(node, 2, "0b")
  };
  var intOct = {
  	identify: intIdentify,
  	default: true,
  	tag: "tag:yaml.org,2002:int",
  	format: "OCT",
  	test: /^[-+]?0[0-7_]+$/,
  	resolve: (str, _onError, opt) => intResolve(str, 1, 8, opt),
  	stringify: (node) => intStringify(node, 8, "0")
  };
  var int = {
  	identify: intIdentify,
  	default: true,
  	tag: "tag:yaml.org,2002:int",
  	test: /^[-+]?[0-9][0-9_]*$/,
  	resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
  	stringify: stringifyNumber
  };
  var intHex = {
  	identify: intIdentify,
  	default: true,
  	tag: "tag:yaml.org,2002:int",
  	format: "HEX",
  	test: /^[-+]?0x[0-9a-fA-F_]+$/,
  	resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
  	stringify: (node) => intStringify(node, 16, "0x")
  };
  var YAMLSet = class YAMLSet extends YAMLMap {
  	constructor(schema) {
  		super(schema);
  		this.tag = YAMLSet.tag;
  	}
  	add(key) {
  		let pair;
  		if (isPair(key)) pair = key;
  		else if (key && typeof key === "object" && "key" in key && "value" in key && key.value === null) pair = new Pair(key.key, null);
  		else pair = new Pair(key, null);
  		if (!findPair(this.items, pair.key)) this.items.push(pair);
  	}
  	/**
  	* If `keepPair` is `true`, returns the Pair matching `key`.
  	* Otherwise, returns the value of that Pair's key.
  	*/
  	get(key, keepPair) {
  		const pair = findPair(this.items, key);
  		return !keepPair && isPair(pair) ? isScalar(pair.key) ? pair.key.value : pair.key : pair;
  	}
  	set(key, value) {
  		if (typeof value !== "boolean") throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
  		const prev = findPair(this.items, key);
  		if (prev && !value) this.items.splice(this.items.indexOf(prev), 1);
  		else if (!prev && value) this.items.push(new Pair(key));
  	}
  	toJSON(_, ctx) {
  		return super.toJSON(_, ctx, Set);
  	}
  	toString(ctx, onComment, onChompKeep) {
  		if (!ctx) return JSON.stringify(this);
  		if (this.hasAllNullValues(true)) return super.toString(Object.assign({}, ctx, { allNullValues: true }), onComment, onChompKeep);
  		else throw new Error("Set items must all have null values");
  	}
  	static from(schema, iterable, ctx) {
  		const { replacer } = ctx;
  		const set = new this(schema);
  		if (iterable && Symbol.iterator in Object(iterable)) for (let value of iterable) {
  			if (typeof replacer === "function") value = replacer.call(iterable, value, value);
  			set.items.push(createPair(value, null, ctx));
  		}
  		return set;
  	}
  };
  YAMLSet.tag = "tag:yaml.org,2002:set";
  var set = {
  	collection: "map",
  	identify: (value) => value instanceof Set,
  	nodeClass: YAMLSet,
  	default: false,
  	tag: "tag:yaml.org,2002:set",
  	createNode: (schema, iterable, ctx) => YAMLSet.from(schema, iterable, ctx),
  	resolve(map, onError) {
  		if (isMap(map)) {
  			if (map.hasAllNullValues(true)) return Object.assign(new YAMLSet(), map);
  			else onError("Set items must all have null values");
  		} else onError("Expected a mapping for this tag");
  		return map;
  	}
  };
  /** Internal types handle bigint as number, because TS can't figure it out. */
  function parseSexagesimal(str, asBigInt) {
  	const sign = str[0];
  	const parts = sign === "-" || sign === "+" ? str.substring(1) : str;
  	const num = (n) => asBigInt ? BigInt(n) : Number(n);
  	const res = parts.replace(/_/g, "").split(":").reduce((res, p) => res * num(60) + num(p), num(0));
  	return sign === "-" ? num(-1) * res : res;
  }
  /**
  * hhhh:mm:ss.sss
  *
  * Internal types handle bigint as number, because TS can't figure it out.
  */
  function stringifySexagesimal(node) {
  	let { value } = node;
  	let num = (n) => n;
  	if (typeof value === "bigint") num = (n) => BigInt(n);
  	else if (isNaN(value) || !isFinite(value)) return stringifyNumber(node);
  	let sign = "";
  	if (value < 0) {
  		sign = "-";
  		value *= num(-1);
  	}
  	const _60 = num(60);
  	const parts = [value % _60];
  	if (value < 60) parts.unshift(0);
  	else {
  		value = (value - parts[0]) / _60;
  		parts.unshift(value % _60);
  		if (value >= 60) {
  			value = (value - parts[0]) / _60;
  			parts.unshift(value);
  		}
  	}
  	return sign + parts.map((n) => String(n).padStart(2, "0")).join(":").replace(/000000\d*$/, "");
  }
  var intTime = {
  	identify: (value) => typeof value === "bigint" || Number.isInteger(value),
  	default: true,
  	tag: "tag:yaml.org,2002:int",
  	format: "TIME",
  	test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
  	resolve: (str, _onError, { intAsBigInt }) => parseSexagesimal(str, intAsBigInt),
  	stringify: stringifySexagesimal
  };
  var floatTime = {
  	identify: (value) => typeof value === "number",
  	default: true,
  	tag: "tag:yaml.org,2002:float",
  	format: "TIME",
  	test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
  	resolve: (str) => parseSexagesimal(str, false),
  	stringify: stringifySexagesimal
  };
  var timestamp = {
  	identify: (value) => value instanceof Date,
  	default: true,
  	tag: "tag:yaml.org,2002:timestamp",
  	test: RegExp("^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})(?:(?:t|T|[ \\t]+)([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?)?$"),
  	resolve(str) {
  		const match = str.match(timestamp.test);
  		if (!match) throw new Error("!!timestamp expects a date, starting with yyyy-mm-dd");
  		const [, year, month, day, hour, minute, second] = match.map(Number);
  		const millisec = match[7] ? Number((match[7] + "00").substr(1, 3)) : 0;
  		let date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
  		const tz = match[8];
  		if (tz && tz !== "Z") {
  			let d = parseSexagesimal(tz, false);
  			if (Math.abs(d) < 30) d *= 60;
  			date -= 6e4 * d;
  		}
  		return new Date(date);
  	},
  	stringify: ({ value }) => value?.toISOString().replace(/(T00:00:00)?\.000Z$/, "") ?? ""
  };
  var schema = [
  	map,
  	seq,
  	string,
  	nullTag,
  	trueTag,
  	falseTag,
  	intBin,
  	intOct,
  	int,
  	intHex,
  	floatNaN,
  	floatExp,
  	float,
  	binary,
  	merge,
  	omap,
  	pairs,
  	set,
  	intTime,
  	floatTime,
  	timestamp
  ];
  var schemas = /* @__PURE__ */ new Map([
  	["core", schema$2],
  	["failsafe", [
  		map,
  		seq,
  		string
  	]],
  	["json", schema$1],
  	["yaml11", schema],
  	["yaml-1.1", schema]
  ]);
  var tagsByName = {
  	binary,
  	bool: boolTag,
  	float: float$1,
  	floatExp: floatExp$1,
  	floatNaN: floatNaN$1,
  	floatTime,
  	int: int$1,
  	intHex: intHex$1,
  	intOct: intOct$1,
  	intTime,
  	map,
  	merge,
  	null: nullTag,
  	omap,
  	pairs,
  	seq,
  	set,
  	timestamp
  };
  var coreKnownTags = {
  	"tag:yaml.org,2002:binary": binary,
  	"tag:yaml.org,2002:merge": merge,
  	"tag:yaml.org,2002:omap": omap,
  	"tag:yaml.org,2002:pairs": pairs,
  	"tag:yaml.org,2002:set": set,
  	"tag:yaml.org,2002:timestamp": timestamp
  };
  function getTags(customTags, schemaName, addMergeTag) {
  	const schemaTags = schemas.get(schemaName);
  	if (schemaTags && !customTags) return addMergeTag && !schemaTags.includes(merge) ? schemaTags.concat(merge) : schemaTags.slice();
  	let tags = schemaTags;
  	if (!tags) {
  		if (Array.isArray(customTags)) tags = [];
  		else {
  			const keys = Array.from(schemas.keys()).filter((key) => key !== "yaml11").map((key) => JSON.stringify(key)).join(", ");
  			throw new Error(`Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`);
  		}
  	}
  	if (Array.isArray(customTags)) for (const tag of customTags) tags = tags.concat(tag);
  	else if (typeof customTags === "function") tags = customTags(tags.slice());
  	if (addMergeTag) tags = tags.concat(merge);
  	return tags.reduce((tags, tag) => {
  		const tagObj = typeof tag === "string" ? tagsByName[tag] : tag;
  		if (!tagObj) {
  			const tagName = JSON.stringify(tag);
  			const keys = Object.keys(tagsByName).map((key) => JSON.stringify(key)).join(", ");
  			throw new Error(`Unknown custom tag ${tagName}; use one of ${keys}`);
  		}
  		if (!tags.includes(tagObj)) tags.push(tagObj);
  		return tags;
  	}, []);
  }
  var sortMapEntriesByKey = (a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
  var Schema = class Schema {
  	constructor({ compat, customTags, merge, resolveKnownTags, schema, sortMapEntries, toStringDefaults }) {
  		this.compat = Array.isArray(compat) ? getTags(compat, "compat") : compat ? getTags(null, compat) : null;
  		this.name = typeof schema === "string" && schema || "core";
  		this.knownTags = resolveKnownTags ? coreKnownTags : {};
  		this.tags = getTags(customTags, this.name, merge);
  		this.toStringOptions = toStringDefaults ?? null;
  		Object.defineProperty(this, MAP, { value: map });
  		Object.defineProperty(this, SCALAR$1, { value: string });
  		Object.defineProperty(this, SEQ, { value: seq });
  		this.sortMapEntries = typeof sortMapEntries === "function" ? sortMapEntries : sortMapEntries === true ? sortMapEntriesByKey : null;
  	}
  	clone() {
  		const copy = Object.create(Schema.prototype, Object.getOwnPropertyDescriptors(this));
  		copy.tags = this.tags.slice();
  		return copy;
  	}
  };
  function stringifyDocument(doc, options) {
  	const lines = [];
  	let hasDirectives = options.directives === true;
  	if (options.directives !== false && doc.directives) {
  		const dir = doc.directives.toString(doc);
  		if (dir) {
  			lines.push(dir);
  			hasDirectives = true;
  		} else if (doc.directives.docStart) hasDirectives = true;
  	}
  	if (hasDirectives) lines.push("---");
  	const ctx = createStringifyContext(doc, options);
  	const { commentString } = ctx.options;
  	if (doc.commentBefore) {
  		if (lines.length !== 1) lines.unshift("");
  		const cs = commentString(doc.commentBefore);
  		lines.unshift(indentComment(cs, ""));
  	}
  	let chompKeep = false;
  	let contentComment = null;
  	if (doc.contents) {
  		if (isNode(doc.contents)) {
  			if (doc.contents.spaceBefore && hasDirectives) lines.push("");
  			if (doc.contents.commentBefore) {
  				const cs = commentString(doc.contents.commentBefore);
  				lines.push(indentComment(cs, ""));
  			}
  			ctx.forceBlockIndent = !!doc.comment;
  			contentComment = doc.contents.comment;
  		}
  		const onChompKeep = contentComment ? void 0 : () => chompKeep = true;
  		let body = stringify(doc.contents, ctx, () => contentComment = null, onChompKeep);
  		if (contentComment) body += lineComment(body, "", commentString(contentComment));
  		if ((body[0] === "|" || body[0] === ">") && lines[lines.length - 1] === "---") lines[lines.length - 1] = `--- ${body}`;
  		else lines.push(body);
  	} else lines.push(stringify(doc.contents, ctx));
  	if (doc.directives?.docEnd) {
  		if (doc.comment) {
  			const cs = commentString(doc.comment);
  			if (cs.includes("\n")) {
  				lines.push("...");
  				lines.push(indentComment(cs, ""));
  			} else lines.push(`... ${cs}`);
  		} else lines.push("...");
  	} else {
  		let dc = doc.comment;
  		if (dc && chompKeep) dc = dc.replace(/^\n+/, "");
  		if (dc) {
  			if ((!chompKeep || contentComment) && lines[lines.length - 1] !== "") lines.push("");
  			lines.push(indentComment(commentString(dc), ""));
  		}
  	}
  	return lines.join("\n") + "\n";
  }
  var Document = class Document {
  	constructor(value, replacer, options) {
  		/** A comment before this Document */
  		this.commentBefore = null;
  		/** A comment immediately after this Document */
  		this.comment = null;
  		/** Errors encountered during parsing. */
  		this.errors = [];
  		/** Warnings encountered during parsing. */
  		this.warnings = [];
  		Object.defineProperty(this, NODE_TYPE, { value: DOC });
  		let _replacer = null;
  		if (typeof replacer === "function" || Array.isArray(replacer)) _replacer = replacer;
  		else if (options === void 0 && replacer) {
  			options = replacer;
  			replacer = void 0;
  		}
  		const opt = Object.assign({
  			intAsBigInt: false,
  			keepSourceTokens: false,
  			logLevel: "warn",
  			prettyErrors: true,
  			strict: true,
  			stringKeys: false,
  			uniqueKeys: true,
  			version: "1.2"
  		}, options);
  		this.options = opt;
  		let { version } = opt;
  		if (options?._directives) {
  			this.directives = options._directives.atDocument();
  			if (this.directives.yaml.explicit) version = this.directives.yaml.version;
  		} else this.directives = new Directives({ version });
  		this.setSchema(version, options);
  		this.contents = value === void 0 ? null : this.createNode(value, _replacer, options);
  	}
  	/**
  	* Create a deep copy of this Document and its contents.
  	*
  	* Custom Node values that inherit from `Object` still refer to their original instances.
  	*/
  	clone() {
  		const copy = Object.create(Document.prototype, { [NODE_TYPE]: { value: DOC } });
  		copy.commentBefore = this.commentBefore;
  		copy.comment = this.comment;
  		copy.errors = this.errors.slice();
  		copy.warnings = this.warnings.slice();
  		copy.options = Object.assign({}, this.options);
  		if (this.directives) copy.directives = this.directives.clone();
  		copy.schema = this.schema.clone();
  		copy.contents = isNode(this.contents) ? this.contents.clone(copy.schema) : this.contents;
  		if (this.range) copy.range = this.range.slice();
  		return copy;
  	}
  	/** Adds a value to the document. */
  	add(value) {
  		if (assertCollection(this.contents)) this.contents.add(value);
  	}
  	/** Adds a value to the document. */
  	addIn(path, value) {
  		if (assertCollection(this.contents)) this.contents.addIn(path, value);
  	}
  	/**
  	* Create a new `Alias` node, ensuring that the target `node` has the required anchor.
  	*
  	* If `node` already has an anchor, `name` is ignored.
  	* Otherwise, the `node.anchor` value will be set to `name`,
  	* or if an anchor with that name is already present in the document,
  	* `name` will be used as a prefix for a new unique anchor.
  	* If `name` is undefined, the generated anchor will use 'a' as a prefix.
  	*/
  	createAlias(node, name) {
  		if (!node.anchor) {
  			const prev = anchorNames(this);
  			node.anchor = !name || prev.has(name) ? findNewAnchor(name || "a", prev) : name;
  		}
  		return new Alias(node.anchor);
  	}
  	createNode(value, replacer, options) {
  		let _replacer = void 0;
  		if (typeof replacer === "function") {
  			value = replacer.call({ "": value }, "", value);
  			_replacer = replacer;
  		} else if (Array.isArray(replacer)) {
  			const keyToStr = (v) => typeof v === "number" || v instanceof String || v instanceof Number;
  			const asStr = replacer.filter(keyToStr).map(String);
  			if (asStr.length > 0) replacer = replacer.concat(asStr);
  			_replacer = replacer;
  		} else if (options === void 0 && replacer) {
  			options = replacer;
  			replacer = void 0;
  		}
  		const { aliasDuplicateObjects, anchorPrefix, flow, keepUndefined, onTagObj, tag } = options ?? {};
  		const { onAnchor, setAnchors, sourceObjects } = createNodeAnchors(this, anchorPrefix || "a");
  		const ctx = {
  			aliasDuplicateObjects: aliasDuplicateObjects ?? true,
  			keepUndefined: keepUndefined ?? false,
  			onAnchor,
  			onTagObj,
  			replacer: _replacer,
  			schema: this.schema,
  			sourceObjects
  		};
  		const node = createNode(value, tag, ctx);
  		if (flow && isCollection(node)) node.flow = true;
  		setAnchors();
  		return node;
  	}
  	/**
  	* Convert a key and a value into a `Pair` using the current schema,
  	* recursively wrapping all values as `Scalar` or `Collection` nodes.
  	*/
  	createPair(key, value, options = {}) {
  		return new Pair(this.createNode(key, null, options), this.createNode(value, null, options));
  	}
  	/**
  	* Removes a value from the document.
  	* @returns `true` if the item was found and removed.
  	*/
  	delete(key) {
  		return assertCollection(this.contents) ? this.contents.delete(key) : false;
  	}
  	/**
  	* Removes a value from the document.
  	* @returns `true` if the item was found and removed.
  	*/
  	deleteIn(path) {
  		if (isEmptyPath(path)) {
  			if (this.contents == null) return false;
  			this.contents = null;
  			return true;
  		}
  		return assertCollection(this.contents) ? this.contents.deleteIn(path) : false;
  	}
  	/**
  	* Returns item at `key`, or `undefined` if not found. By default unwraps
  	* scalar values from their surrounding node; to disable set `keepScalar` to
  	* `true` (collections are always returned intact).
  	*/
  	get(key, keepScalar) {
  		return isCollection(this.contents) ? this.contents.get(key, keepScalar) : void 0;
  	}
  	/**
  	* Returns item at `path`, or `undefined` if not found. By default unwraps
  	* scalar values from their surrounding node; to disable set `keepScalar` to
  	* `true` (collections are always returned intact).
  	*/
  	getIn(path, keepScalar) {
  		if (isEmptyPath(path)) return !keepScalar && isScalar(this.contents) ? this.contents.value : this.contents;
  		return isCollection(this.contents) ? this.contents.getIn(path, keepScalar) : void 0;
  	}
  	/**
  	* Checks if the document includes a value with the key `key`.
  	*/
  	has(key) {
  		return isCollection(this.contents) ? this.contents.has(key) : false;
  	}
  	/**
  	* Checks if the document includes a value at `path`.
  	*/
  	hasIn(path) {
  		if (isEmptyPath(path)) return this.contents !== void 0;
  		return isCollection(this.contents) ? this.contents.hasIn(path) : false;
  	}
  	/**
  	* Sets a value in this document. For `!!set`, `value` needs to be a
  	* boolean to add/remove the item from the set.
  	*/
  	set(key, value) {
  		if (this.contents == null) this.contents = collectionFromPath(this.schema, [key], value);
  		else if (assertCollection(this.contents)) this.contents.set(key, value);
  	}
  	/**
  	* Sets a value in this document. For `!!set`, `value` needs to be a
  	* boolean to add/remove the item from the set.
  	*/
  	setIn(path, value) {
  		if (isEmptyPath(path)) this.contents = value;
  		else if (this.contents == null) this.contents = collectionFromPath(this.schema, Array.from(path), value);
  		else if (assertCollection(this.contents)) this.contents.setIn(path, value);
  	}
  	/**
  	* Change the YAML version and schema used by the document.
  	* A `null` version disables support for directives, explicit tags, anchors, and aliases.
  	* It also requires the `schema` option to be given as a `Schema` instance value.
  	*
  	* Overrides all previously set schema options.
  	*/
  	setSchema(version, options = {}) {
  		if (typeof version === "number") version = String(version);
  		let opt;
  		switch (version) {
  			case "1.1":
  				if (this.directives) this.directives.yaml.version = "1.1";
  				else this.directives = new Directives({ version: "1.1" });
  				opt = {
  					resolveKnownTags: false,
  					schema: "yaml-1.1"
  				};
  				break;
  			case "1.2":
  			case "next":
  				if (this.directives) this.directives.yaml.version = version;
  				else this.directives = new Directives({ version });
  				opt = {
  					resolveKnownTags: true,
  					schema: "core"
  				};
  				break;
  			case null:
  				if (this.directives) delete this.directives;
  				opt = null;
  				break;
  			default: {
  				const sv = JSON.stringify(version);
  				throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${sv}`);
  			}
  		}
  		if (options.schema instanceof Object) this.schema = options.schema;
  		else if (opt) this.schema = new Schema(Object.assign(opt, options));
  		else throw new Error(`With a null YAML version, the { schema: Schema } option is required`);
  	}
  	toJS({ json, jsonArg, mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
  		const ctx = {
  			anchors: /* @__PURE__ */ new Map(),
  			doc: this,
  			keep: !json,
  			mapAsMap: mapAsMap === true,
  			mapKeyWarned: false,
  			maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
  		};
  		const res = toJS(this.contents, jsonArg ?? "", ctx);
  		if (typeof onAnchor === "function") for (const { count, res } of ctx.anchors.values()) onAnchor(res, count);
  		return typeof reviver === "function" ? applyReviver(reviver, { "": res }, "", res) : res;
  	}
  	/**
  	* A JSON representation of the document `contents`.
  	*
  	* @param jsonArg Used by `JSON.stringify` to indicate the array index or
  	*   property name.
  	*/
  	toJSON(jsonArg, onAnchor) {
  		return this.toJS({
  			json: true,
  			jsonArg,
  			mapAsMap: false,
  			onAnchor
  		});
  	}
  	/** A YAML representation of the document. */
  	toString(options = {}) {
  		if (this.errors.length > 0) throw new Error("Document with errors cannot be stringified");
  		if ("indent" in options && (!Number.isInteger(options.indent) || Number(options.indent) <= 0)) {
  			const s = JSON.stringify(options.indent);
  			throw new Error(`"indent" option must be a positive integer, not ${s}`);
  		}
  		return stringifyDocument(this, options);
  	}
  };
  function assertCollection(contents) {
  	if (isCollection(contents)) return true;
  	throw new Error("Expected a YAML collection as document contents");
  }
  var YAMLError = class extends Error {
  	constructor(name, pos, code, message) {
  		super();
  		this.name = name;
  		this.code = code;
  		this.message = message;
  		this.pos = pos;
  	}
  };
  var YAMLParseError = class extends YAMLError {
  	constructor(pos, code, message) {
  		super("YAMLParseError", pos, code, message);
  	}
  };
  var YAMLWarning = class extends YAMLError {
  	constructor(pos, code, message) {
  		super("YAMLWarning", pos, code, message);
  	}
  };
  var prettifyError = (src, lc) => (error) => {
  	if (error.pos[0] === -1) return;
  	error.linePos = error.pos.map((pos) => lc.linePos(pos));
  	const { line, col } = error.linePos[0];
  	error.message += ` at line ${line}, column ${col}`;
  	let ci = col - 1;
  	let lineStr = src.substring(lc.lineStarts[line - 1], lc.lineStarts[line]).replace(/[\n\r]+$/, "");
  	if (ci >= 60 && lineStr.length > 80) {
  		const trimStart = Math.min(ci - 39, lineStr.length - 79);
  		lineStr = "…" + lineStr.substring(trimStart);
  		ci -= trimStart - 1;
  	}
  	if (lineStr.length > 80) lineStr = lineStr.substring(0, 79) + "…";
  	if (line > 1 && /^ *$/.test(lineStr.substring(0, ci))) {
  		let prev = src.substring(lc.lineStarts[line - 2], lc.lineStarts[line - 1]);
  		if (prev.length > 80) prev = prev.substring(0, 79) + "…\n";
  		lineStr = prev + lineStr;
  	}
  	if (/[^ ]/.test(lineStr)) {
  		let count = 1;
  		const end = error.linePos[1];
  		if (end?.line === line && end.col > col) count = Math.max(1, Math.min(end.col - col, 80 - ci));
  		const pointer = " ".repeat(ci) + "^".repeat(count);
  		error.message += `:\n\n${lineStr}\n${pointer}\n`;
  	}
  };
  function resolveProps(tokens, { flow, indicator, next, offset, onError, parentIndent, startOnNewline }) {
  	let spaceBefore = false;
  	let atNewline = startOnNewline;
  	let hasSpace = startOnNewline;
  	let comment = "";
  	let commentSep = "";
  	let hasNewline = false;
  	let reqSpace = false;
  	let tab = null;
  	let anchor = null;
  	let tag = null;
  	let newlineAfterProp = null;
  	let comma = null;
  	let found = null;
  	let start = null;
  	for (const token of tokens) {
  		if (reqSpace) {
  			if (token.type !== "space" && token.type !== "newline" && token.type !== "comma") onError(token.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
  			reqSpace = false;
  		}
  		if (tab) {
  			if (atNewline && token.type !== "comment" && token.type !== "newline") onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
  			tab = null;
  		}
  		switch (token.type) {
  			case "space":
  				if (!flow && (indicator !== "doc-start" || next?.type !== "flow-collection") && token.source.includes("	")) tab = token;
  				hasSpace = true;
  				break;
  			case "comment": {
  				if (!hasSpace) onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
  				const cb = token.source.substring(1) || " ";
  				if (!comment) comment = cb;
  				else comment += commentSep + cb;
  				commentSep = "";
  				atNewline = false;
  				break;
  			}
  			case "newline":
  				if (atNewline) {
  					if (comment) comment += token.source;
  					else if (!found || indicator !== "seq-item-ind") spaceBefore = true;
  				} else commentSep += token.source;
  				atNewline = true;
  				hasNewline = true;
  				if (anchor || tag) newlineAfterProp = token;
  				hasSpace = true;
  				break;
  			case "anchor":
  				if (anchor) onError(token, "MULTIPLE_ANCHORS", "A node can have at most one anchor");
  				if (token.source.endsWith(":")) onError(token.offset + token.source.length - 1, "BAD_ALIAS", "Anchor ending in : is ambiguous", true);
  				anchor = token;
  				start ?? (start = token.offset);
  				atNewline = false;
  				hasSpace = false;
  				reqSpace = true;
  				break;
  			case "tag":
  				if (tag) onError(token, "MULTIPLE_TAGS", "A node can have at most one tag");
  				tag = token;
  				start ?? (start = token.offset);
  				atNewline = false;
  				hasSpace = false;
  				reqSpace = true;
  				break;
  			case indicator:
  				if (anchor || tag) onError(token, "BAD_PROP_ORDER", `Anchors and tags must be after the ${token.source} indicator`);
  				if (found) onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.source} in ${flow ?? "collection"}`);
  				found = token;
  				atNewline = indicator === "seq-item-ind" || indicator === "explicit-key-ind";
  				hasSpace = false;
  				break;
  			case "comma": if (flow) {
  				if (comma) onError(token, "UNEXPECTED_TOKEN", `Unexpected , in ${flow}`);
  				comma = token;
  				atNewline = false;
  				hasSpace = false;
  				break;
  			}
  			default:
  				onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.type} token`);
  				atNewline = false;
  				hasSpace = false;
  		}
  	}
  	const last = tokens[tokens.length - 1];
  	const end = last ? last.offset + last.source.length : offset;
  	if (reqSpace && next && next.type !== "space" && next.type !== "newline" && next.type !== "comma" && (next.type !== "scalar" || next.source !== "")) onError(next.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
  	if (tab && (atNewline && tab.indent <= parentIndent || next?.type === "block-map" || next?.type === "block-seq")) onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
  	return {
  		comma,
  		found,
  		spaceBefore,
  		comment,
  		hasNewline,
  		anchor,
  		tag,
  		newlineAfterProp,
  		end,
  		start: start ?? end
  	};
  }
  function containsNewline(key) {
  	if (!key) return null;
  	switch (key.type) {
  		case "alias":
  		case "scalar":
  		case "double-quoted-scalar":
  		case "single-quoted-scalar":
  			if (key.source.includes("\n")) return true;
  			if (key.end) {
  				for (const st of key.end) if (st.type === "newline") return true;
  			}
  			return false;
  		case "flow-collection":
  			for (const it of key.items) {
  				for (const st of it.start) if (st.type === "newline") return true;
  				if (it.sep) {
  					for (const st of it.sep) if (st.type === "newline") return true;
  				}
  				if (containsNewline(it.key) || containsNewline(it.value)) return true;
  			}
  			return false;
  		default: return true;
  	}
  }
  function flowIndentCheck(indent, fc, onError) {
  	if (fc?.type === "flow-collection") {
  		const end = fc.end[0];
  		if (end.indent === indent && (end.source === "]" || end.source === "}") && containsNewline(fc)) onError(end, "BAD_INDENT", "Flow end indicator should be more indented than parent", true);
  	}
  }
  function mapIncludes(ctx, items, search) {
  	const { uniqueKeys } = ctx.options;
  	if (uniqueKeys === false) return false;
  	const isEqual = typeof uniqueKeys === "function" ? uniqueKeys : (a, b) => a === b || isScalar(a) && isScalar(b) && a.value === b.value;
  	return items.some((pair) => isEqual(pair.key, search));
  }
  var startColMsg = "All mapping items must start at the same column";
  function resolveBlockMap({ composeNode, composeEmptyNode }, ctx, bm, onError, tag) {
  	const map = new ((tag?.nodeClass) ?? YAMLMap)(ctx.schema);
  	if (ctx.atRoot) ctx.atRoot = false;
  	let offset = bm.offset;
  	let commentEnd = null;
  	for (const collItem of bm.items) {
  		const { start, key, sep, value } = collItem;
  		const keyProps = resolveProps(start, {
  			indicator: "explicit-key-ind",
  			next: key ?? sep?.[0],
  			offset,
  			onError,
  			parentIndent: bm.indent,
  			startOnNewline: true
  		});
  		const implicitKey = !keyProps.found;
  		if (implicitKey) {
  			if (key) {
  				if (key.type === "block-seq") onError(offset, "BLOCK_AS_IMPLICIT_KEY", "A block sequence may not be used as an implicit map key");
  				else if ("indent" in key && key.indent !== bm.indent) onError(offset, "BAD_INDENT", startColMsg);
  			}
  			if (!keyProps.anchor && !keyProps.tag && !sep) {
  				commentEnd = keyProps.end;
  				if (keyProps.comment) {
  					if (map.comment) map.comment += "\n" + keyProps.comment;
  					else map.comment = keyProps.comment;
  				}
  				continue;
  			}
  			if (keyProps.newlineAfterProp || containsNewline(key)) onError(key ?? start[start.length - 1], "MULTILINE_IMPLICIT_KEY", "Implicit keys need to be on a single line");
  		} else if (keyProps.found?.indent !== bm.indent) onError(offset, "BAD_INDENT", startColMsg);
  		ctx.atKey = true;
  		const keyStart = keyProps.end;
  		const keyNode = key ? composeNode(ctx, key, keyProps, onError) : composeEmptyNode(ctx, keyStart, start, null, keyProps, onError);
  		if (ctx.schema.compat) flowIndentCheck(bm.indent, key, onError);
  		ctx.atKey = false;
  		if (mapIncludes(ctx, map.items, keyNode)) onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
  		const valueProps = resolveProps(sep ?? [], {
  			indicator: "map-value-ind",
  			next: value,
  			offset: keyNode.range[2],
  			onError,
  			parentIndent: bm.indent,
  			startOnNewline: !key || key.type === "block-scalar"
  		});
  		offset = valueProps.end;
  		if (valueProps.found) {
  			if (implicitKey) {
  				if (value?.type === "block-map" && !valueProps.hasNewline) onError(offset, "BLOCK_AS_IMPLICIT_KEY", "Nested mappings are not allowed in compact mappings");
  				if (ctx.options.strict && keyProps.start < valueProps.found.offset - 1024) onError(keyNode.range, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit block mapping key");
  			}
  			const valueNode = value ? composeNode(ctx, value, valueProps, onError) : composeEmptyNode(ctx, offset, sep, null, valueProps, onError);
  			if (ctx.schema.compat) flowIndentCheck(bm.indent, value, onError);
  			offset = valueNode.range[2];
  			const pair = new Pair(keyNode, valueNode);
  			if (ctx.options.keepSourceTokens) pair.srcToken = collItem;
  			map.items.push(pair);
  		} else {
  			if (implicitKey) onError(keyNode.range, "MISSING_CHAR", "Implicit map keys need to be followed by map values");
  			if (valueProps.comment) {
  				if (keyNode.comment) keyNode.comment += "\n" + valueProps.comment;
  				else keyNode.comment = valueProps.comment;
  			}
  			const pair = new Pair(keyNode);
  			if (ctx.options.keepSourceTokens) pair.srcToken = collItem;
  			map.items.push(pair);
  		}
  	}
  	if (commentEnd && commentEnd < offset) onError(commentEnd, "IMPOSSIBLE", "Map comment with trailing content");
  	map.range = [
  		bm.offset,
  		offset,
  		commentEnd ?? offset
  	];
  	return map;
  }
  function resolveBlockSeq({ composeNode, composeEmptyNode }, ctx, bs, onError, tag) {
  	const seq = new ((tag?.nodeClass) ?? YAMLSeq)(ctx.schema);
  	if (ctx.atRoot) ctx.atRoot = false;
  	if (ctx.atKey) ctx.atKey = false;
  	let offset = bs.offset;
  	let commentEnd = null;
  	for (const { start, value } of bs.items) {
  		const props = resolveProps(start, {
  			indicator: "seq-item-ind",
  			next: value,
  			offset,
  			onError,
  			parentIndent: bs.indent,
  			startOnNewline: true
  		});
  		if (!props.found) {
  			if (props.anchor || props.tag || value) {
  				if (value?.type === "block-seq") onError(props.end, "BAD_INDENT", "All sequence items must start at the same column");
  				else onError(offset, "MISSING_CHAR", "Sequence item without - indicator");
  			} else {
  				commentEnd = props.end;
  				if (props.comment) seq.comment = props.comment;
  				continue;
  			}
  		}
  		const node = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, start, null, props, onError);
  		if (ctx.schema.compat) flowIndentCheck(bs.indent, value, onError);
  		offset = node.range[2];
  		seq.items.push(node);
  	}
  	seq.range = [
  		bs.offset,
  		offset,
  		commentEnd ?? offset
  	];
  	return seq;
  }
  function resolveEnd(end, offset, reqSpace, onError) {
  	let comment = "";
  	if (end) {
  		let hasSpace = false;
  		let sep = "";
  		for (const token of end) {
  			const { source, type } = token;
  			switch (type) {
  				case "space":
  					hasSpace = true;
  					break;
  				case "comment": {
  					if (reqSpace && !hasSpace) onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
  					const cb = source.substring(1) || " ";
  					if (!comment) comment = cb;
  					else comment += sep + cb;
  					sep = "";
  					break;
  				}
  				case "newline":
  					if (comment) sep += source;
  					hasSpace = true;
  					break;
  				default: onError(token, "UNEXPECTED_TOKEN", `Unexpected ${type} at node end`);
  			}
  			offset += source.length;
  		}
  	}
  	return {
  		comment,
  		offset
  	};
  }
  var blockMsg = "Block collections are not allowed within flow collections";
  var isBlock = (token) => token && (token.type === "block-map" || token.type === "block-seq");
  function resolveFlowCollection({ composeNode, composeEmptyNode }, ctx, fc, onError, tag) {
  	const isMap = fc.start.source === "{";
  	const fcName = isMap ? "flow map" : "flow sequence";
  	const coll = new ((tag?.nodeClass) ?? (isMap ? YAMLMap : YAMLSeq))(ctx.schema);
  	coll.flow = true;
  	const atRoot = ctx.atRoot;
  	if (atRoot) ctx.atRoot = false;
  	if (ctx.atKey) ctx.atKey = false;
  	let offset = fc.offset + fc.start.source.length;
  	for (let i = 0; i < fc.items.length; ++i) {
  		const collItem = fc.items[i];
  		const { start, key, sep, value } = collItem;
  		const props = resolveProps(start, {
  			flow: fcName,
  			indicator: "explicit-key-ind",
  			next: key ?? sep?.[0],
  			offset,
  			onError,
  			parentIndent: fc.indent,
  			startOnNewline: false
  		});
  		if (!props.found) {
  			if (!props.anchor && !props.tag && !sep && !value) {
  				if (i === 0 && props.comma) onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
  				else if (i < fc.items.length - 1) onError(props.start, "UNEXPECTED_TOKEN", `Unexpected empty item in ${fcName}`);
  				if (props.comment) {
  					if (coll.comment) coll.comment += "\n" + props.comment;
  					else coll.comment = props.comment;
  				}
  				offset = props.end;
  				continue;
  			}
  			if (!isMap && ctx.options.strict && containsNewline(key)) onError(key, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
  		}
  		if (i === 0) {
  			if (props.comma) onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
  		} else {
  			if (!props.comma) onError(props.start, "MISSING_CHAR", `Missing , between ${fcName} items`);
  			if (props.comment) {
  				let prevItemComment = "";
  				loop: for (const st of start) switch (st.type) {
  					case "comma":
  					case "space": break;
  					case "comment":
  						prevItemComment = st.source.substring(1);
  						break loop;
  					default: break loop;
  				}
  				if (prevItemComment) {
  					let prev = coll.items[coll.items.length - 1];
  					if (isPair(prev)) prev = prev.value ?? prev.key;
  					if (prev.comment) prev.comment += "\n" + prevItemComment;
  					else prev.comment = prevItemComment;
  					props.comment = props.comment.substring(prevItemComment.length + 1);
  				}
  			}
  		}
  		if (!isMap && !sep && !props.found) {
  			const valueNode = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, sep, null, props, onError);
  			coll.items.push(valueNode);
  			offset = valueNode.range[2];
  			if (isBlock(value)) onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
  		} else {
  			ctx.atKey = true;
  			const keyStart = props.end;
  			const keyNode = key ? composeNode(ctx, key, props, onError) : composeEmptyNode(ctx, keyStart, start, null, props, onError);
  			if (isBlock(key)) onError(keyNode.range, "BLOCK_IN_FLOW", blockMsg);
  			ctx.atKey = false;
  			const valueProps = resolveProps(sep ?? [], {
  				flow: fcName,
  				indicator: "map-value-ind",
  				next: value,
  				offset: keyNode.range[2],
  				onError,
  				parentIndent: fc.indent,
  				startOnNewline: false
  			});
  			if (valueProps.found) {
  				if (!isMap && !props.found && ctx.options.strict) {
  					if (sep) for (const st of sep) {
  						if (st === valueProps.found) break;
  						if (st.type === "newline") {
  							onError(st, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
  							break;
  						}
  					}
  					if (props.start < valueProps.found.offset - 1024) onError(valueProps.found, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit flow sequence key");
  				}
  			} else if (value) {
  				if ("source" in value && value.source?.[0] === ":") onError(value, "MISSING_CHAR", `Missing space after : in ${fcName}`);
  				else onError(valueProps.start, "MISSING_CHAR", `Missing , or : between ${fcName} items`);
  			}
  			const valueNode = value ? composeNode(ctx, value, valueProps, onError) : valueProps.found ? composeEmptyNode(ctx, valueProps.end, sep, null, valueProps, onError) : null;
  			if (valueNode) {
  				if (isBlock(value)) onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
  			} else if (valueProps.comment) {
  				if (keyNode.comment) keyNode.comment += "\n" + valueProps.comment;
  				else keyNode.comment = valueProps.comment;
  			}
  			const pair = new Pair(keyNode, valueNode);
  			if (ctx.options.keepSourceTokens) pair.srcToken = collItem;
  			if (isMap) {
  				const map = coll;
  				if (mapIncludes(ctx, map.items, keyNode)) onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
  				map.items.push(pair);
  			} else {
  				const map = new YAMLMap(ctx.schema);
  				map.flow = true;
  				map.items.push(pair);
  				const endRange = (valueNode ?? keyNode).range;
  				map.range = [
  					keyNode.range[0],
  					endRange[1],
  					endRange[2]
  				];
  				coll.items.push(map);
  			}
  			offset = valueNode ? valueNode.range[2] : valueProps.end;
  		}
  	}
  	const expectedEnd = isMap ? "}" : "]";
  	const [ce, ...ee] = fc.end;
  	let cePos = offset;
  	if (ce?.source === expectedEnd) cePos = ce.offset + ce.source.length;
  	else {
  		const name = fcName[0].toUpperCase() + fcName.substring(1);
  		const msg = atRoot ? `${name} must end with a ${expectedEnd}` : `${name} in block collection must be sufficiently indented and end with a ${expectedEnd}`;
  		onError(offset, atRoot ? "MISSING_CHAR" : "BAD_INDENT", msg);
  		if (ce && ce.source.length !== 1) ee.unshift(ce);
  	}
  	if (ee.length > 0) {
  		const end = resolveEnd(ee, cePos, ctx.options.strict, onError);
  		if (end.comment) {
  			if (coll.comment) coll.comment += "\n" + end.comment;
  			else coll.comment = end.comment;
  		}
  		coll.range = [
  			fc.offset,
  			cePos,
  			end.offset
  		];
  	} else coll.range = [
  		fc.offset,
  		cePos,
  		cePos
  	];
  	return coll;
  }
  function resolveCollection(CN, ctx, token, onError, tagName, tag) {
  	const coll = token.type === "block-map" ? resolveBlockMap(CN, ctx, token, onError, tag) : token.type === "block-seq" ? resolveBlockSeq(CN, ctx, token, onError, tag) : resolveFlowCollection(CN, ctx, token, onError, tag);
  	const Coll = coll.constructor;
  	if (tagName === "!" || tagName === Coll.tagName) {
  		coll.tag = Coll.tagName;
  		return coll;
  	}
  	if (tagName) coll.tag = tagName;
  	return coll;
  }
  function composeCollection(CN, ctx, token, props, onError) {
  	const tagToken = props.tag;
  	const tagName = !tagToken ? null : ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg));
  	if (token.type === "block-seq") {
  		const { anchor, newlineAfterProp: nl } = props;
  		const lastProp = anchor && tagToken ? anchor.offset > tagToken.offset ? anchor : tagToken : anchor ?? tagToken;
  		if (lastProp && (!nl || nl.offset < lastProp.offset)) onError(lastProp, "MISSING_CHAR", "Missing newline after block sequence props");
  	}
  	const expType = token.type === "block-map" ? "map" : token.type === "block-seq" ? "seq" : token.start.source === "{" ? "map" : "seq";
  	if (!tagToken || !tagName || tagName === "!" || tagName === YAMLMap.tagName && expType === "map" || tagName === YAMLSeq.tagName && expType === "seq") return resolveCollection(CN, ctx, token, onError, tagName);
  	let tag = ctx.schema.tags.find((t) => t.tag === tagName && t.collection === expType);
  	if (!tag) {
  		const kt = ctx.schema.knownTags[tagName];
  		if (kt?.collection === expType) {
  			ctx.schema.tags.push(Object.assign({}, kt, { default: false }));
  			tag = kt;
  		} else {
  			if (kt) onError(tagToken, "BAD_COLLECTION_TYPE", `${kt.tag} used for ${expType} collection, but expects ${kt.collection ?? "scalar"}`, true);
  			else onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, true);
  			return resolveCollection(CN, ctx, token, onError, tagName);
  		}
  	}
  	const coll = resolveCollection(CN, ctx, token, onError, tagName, tag);
  	const res = tag.resolve?.(coll, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg), ctx.options) ?? coll;
  	const node = isNode(res) ? res : new Scalar(res);
  	node.range = coll.range;
  	node.tag = tagName;
  	if (tag?.format) node.format = tag.format;
  	return node;
  }
  function resolveBlockScalar(ctx, scalar, onError) {
  	const start = scalar.offset;
  	const header = parseBlockScalarHeader(scalar, ctx.options.strict, onError);
  	if (!header) return {
  		value: "",
  		type: null,
  		comment: "",
  		range: [
  			start,
  			start,
  			start
  		]
  	};
  	const type = header.mode === ">" ? Scalar.BLOCK_FOLDED : Scalar.BLOCK_LITERAL;
  	const lines = scalar.source ? splitLines(scalar.source) : [];
  	let chompStart = lines.length;
  	for (let i = lines.length - 1; i >= 0; --i) {
  		const content = lines[i][1];
  		if (content === "" || content === "\r") chompStart = i;
  		else break;
  	}
  	if (chompStart === 0) {
  		const value = header.chomp === "+" && lines.length > 0 ? "\n".repeat(Math.max(1, lines.length - 1)) : "";
  		let end = start + header.length;
  		if (scalar.source) end += scalar.source.length;
  		return {
  			value,
  			type,
  			comment: header.comment,
  			range: [
  				start,
  				end,
  				end
  			]
  		};
  	}
  	let trimIndent = scalar.indent + header.indent;
  	let offset = scalar.offset + header.length;
  	let contentStart = 0;
  	for (let i = 0; i < chompStart; ++i) {
  		const [indent, content] = lines[i];
  		if (content === "" || content === "\r") {
  			if (header.indent === 0 && indent.length > trimIndent) trimIndent = indent.length;
  		} else {
  			if (indent.length < trimIndent) onError(offset + indent.length, "MISSING_CHAR", "Block scalars with more-indented leading empty lines must use an explicit indentation indicator");
  			if (header.indent === 0) trimIndent = indent.length;
  			contentStart = i;
  			if (trimIndent === 0 && !ctx.atRoot) onError(offset, "BAD_INDENT", "Block scalar values in collections must be indented");
  			break;
  		}
  		offset += indent.length + content.length + 1;
  	}
  	for (let i = lines.length - 1; i >= chompStart; --i) if (lines[i][0].length > trimIndent) chompStart = i + 1;
  	let value = "";
  	let sep = "";
  	let prevMoreIndented = false;
  	for (let i = 0; i < contentStart; ++i) value += lines[i][0].slice(trimIndent) + "\n";
  	for (let i = contentStart; i < chompStart; ++i) {
  		let [indent, content] = lines[i];
  		offset += indent.length + content.length + 1;
  		const crlf = content[content.length - 1] === "\r";
  		if (crlf) content = content.slice(0, -1);
  		/* istanbul ignore if already caught in lexer */
  		if (content && indent.length < trimIndent) {
  			const message = `Block scalar lines must not be less indented than their ${header.indent ? "explicit indentation indicator" : "first line"}`;
  			onError(offset - content.length - (crlf ? 2 : 1), "BAD_INDENT", message);
  			indent = "";
  		}
  		if (type === Scalar.BLOCK_LITERAL) {
  			value += sep + indent.slice(trimIndent) + content;
  			sep = "\n";
  		} else if (indent.length > trimIndent || content[0] === "	") {
  			if (sep === " ") sep = "\n";
  			else if (!prevMoreIndented && sep === "\n") sep = "\n\n";
  			value += sep + indent.slice(trimIndent) + content;
  			sep = "\n";
  			prevMoreIndented = true;
  		} else if (content === "") {
  			if (sep === "\n") value += "\n";
  			else sep = "\n";
  		} else {
  			value += sep + content;
  			sep = " ";
  			prevMoreIndented = false;
  		}
  	}
  	switch (header.chomp) {
  		case "-": break;
  		case "+":
  			for (let i = chompStart; i < lines.length; ++i) value += "\n" + lines[i][0].slice(trimIndent);
  			if (value[value.length - 1] !== "\n") value += "\n";
  			break;
  		default: value += "\n";
  	}
  	const end = start + header.length + scalar.source.length;
  	return {
  		value,
  		type,
  		comment: header.comment,
  		range: [
  			start,
  			end,
  			end
  		]
  	};
  }
  function parseBlockScalarHeader({ offset, props }, strict, onError) {
  	/* istanbul ignore if should not happen */
  	if (props[0].type !== "block-scalar-header") {
  		onError(props[0], "IMPOSSIBLE", "Block scalar header not found");
  		return null;
  	}
  	const { source } = props[0];
  	const mode = source[0];
  	let indent = 0;
  	let chomp = "";
  	let error = -1;
  	for (let i = 1; i < source.length; ++i) {
  		const ch = source[i];
  		if (!chomp && (ch === "-" || ch === "+")) chomp = ch;
  		else {
  			const n = Number(ch);
  			if (!indent && n) indent = n;
  			else if (error === -1) error = offset + i;
  		}
  	}
  	if (error !== -1) onError(error, "UNEXPECTED_TOKEN", `Block scalar header includes extra characters: ${source}`);
  	let hasSpace = false;
  	let comment = "";
  	let length = source.length;
  	for (let i = 1; i < props.length; ++i) {
  		const token = props[i];
  		switch (token.type) {
  			case "space": hasSpace = true;
  			case "newline":
  				length += token.source.length;
  				break;
  			case "comment":
  				if (strict && !hasSpace) onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
  				length += token.source.length;
  				comment = token.source.substring(1);
  				break;
  			case "error":
  				onError(token, "UNEXPECTED_TOKEN", token.message);
  				length += token.source.length;
  				break;
  			/* istanbul ignore next should not happen */
  			default: {
  				onError(token, "UNEXPECTED_TOKEN", `Unexpected token in block scalar header: ${token.type}`);
  				const ts = token.source;
  				if (ts && typeof ts === "string") length += ts.length;
  			}
  		}
  	}
  	return {
  		mode,
  		indent,
  		chomp,
  		comment,
  		length
  	};
  }
  /** @returns Array of lines split up as `[indent, content]` */
  function splitLines(source) {
  	const split = source.split(/\n( *)/);
  	const first = split[0];
  	const m = first.match(/^( *)/);
  	const lines = [m?.[1] ? [m[1], first.slice(m[1].length)] : ["", first]];
  	for (let i = 1; i < split.length; i += 2) lines.push([split[i], split[i + 1]]);
  	return lines;
  }
  function resolveFlowScalar(scalar, strict, onError) {
  	const { offset, type, source, end } = scalar;
  	let _type;
  	let value;
  	const _onError = (rel, code, msg) => onError(offset + rel, code, msg);
  	switch (type) {
  		case "scalar":
  			_type = Scalar.PLAIN;
  			value = plainValue(source, _onError);
  			break;
  		case "single-quoted-scalar":
  			_type = Scalar.QUOTE_SINGLE;
  			value = singleQuotedValue(source, _onError);
  			break;
  		case "double-quoted-scalar":
  			_type = Scalar.QUOTE_DOUBLE;
  			value = doubleQuotedValue(source, _onError);
  			break;
  		/* istanbul ignore next should not happen */
  		default:
  			onError(scalar, "UNEXPECTED_TOKEN", `Expected a flow scalar value, but found: ${type}`);
  			return {
  				value: "",
  				type: null,
  				comment: "",
  				range: [
  					offset,
  					offset + source.length,
  					offset + source.length
  				]
  			};
  	}
  	const valueEnd = offset + source.length;
  	const re = resolveEnd(end, valueEnd, strict, onError);
  	return {
  		value,
  		type: _type,
  		comment: re.comment,
  		range: [
  			offset,
  			valueEnd,
  			re.offset
  		]
  	};
  }
  function plainValue(source, onError) {
  	let badChar = "";
  	switch (source[0]) {
  		/* istanbul ignore next should not happen */
  		case "	":
  			badChar = "a tab character";
  			break;
  		case ",":
  			badChar = "flow indicator character ,";
  			break;
  		case "%":
  			badChar = "directive indicator character %";
  			break;
  		case "|":
  		case ">":
  			badChar = `block scalar indicator ${source[0]}`;
  			break;
  		case "@":
  		case "`": badChar = `reserved character ${source[0]}`;
  	}
  	if (badChar) onError(0, "BAD_SCALAR_START", `Plain value cannot start with ${badChar}`);
  	return unfoldLines(source);
  }
  function singleQuotedValue(source, onError) {
  	if (source[source.length - 1] !== "'" || source.length === 1) onError(source.length, "MISSING_CHAR", "Missing closing 'quote");
  	return unfoldLines(source.slice(1, -1)).replace(/''/g, "'");
  }
  function unfoldLines(source) {
  	const line = /(.*?)\r?\n/sy;
  	let match = line.exec(source);
  	if (!match) return source;
  	/**
  	* The negative lookbehinds in these RegExps are to
  	* prevent causing a polynomial search time in certain cases.
  	*
  	* The try-catch is for Safari < 16.4 and other old browsers:
  	* https://caniuse.com/js-regexp-lookbehind
  	*/
  	let trimEnd, trimBoth;
  	try {
  		trimEnd = /* @__PURE__ */ new RegExp("(?<![ 	])[ 	]+$");
  		trimBoth = /* @__PURE__ */ new RegExp("^[ 	]+|(?<![ 	])[ 	]+$", "g");
  	} catch {
  		trimEnd = /[ \t]+$/;
  		trimBoth = /^[ \t]+|[ \t]+$/g;
  	}
  	let res = match[1].replace(trimEnd, "");
  	let sep = " ";
  	let pos = line.lastIndex;
  	while (match = line.exec(source)) {
  		const lm = match[1].replace(trimBoth, "");
  		if (lm === "") {
  			if (sep === "\n") res += sep;
  			else sep = "\n";
  		} else {
  			res += sep + lm;
  			sep = " ";
  		}
  		pos = line.lastIndex;
  	}
  	const last = /[ \t]*(.*)/sy;
  	last.lastIndex = pos;
  	match = last.exec(source);
  	return res + sep + (match?.[1] ?? "");
  }
  function doubleQuotedValue(source, onError) {
  	let res = "";
  	for (let i = 1; i < source.length - 1; ++i) {
  		const ch = source[i];
  		if (ch === "\r" && source[i + 1] === "\n") continue;
  		if (ch === "\n") {
  			const { fold, offset } = foldNewline(source, i);
  			res += fold;
  			i = offset;
  		} else if (ch === "\\") {
  			let next = source[++i];
  			const cc = escapeCodes[next];
  			if (cc) res += cc;
  			else if (next === "\n") {
  				next = source[i + 1];
  				while (next === " " || next === "	") next = source[++i + 1];
  			} else if (next === "\r" && source[i + 1] === "\n") {
  				next = source[++i + 1];
  				while (next === " " || next === "	") next = source[++i + 1];
  			} else if (next === "x" || next === "u" || next === "U") {
  				const length = next === "x" ? 2 : next === "u" ? 4 : 8;
  				res += parseCharCode(source, i + 1, length, onError);
  				i += length;
  			} else {
  				const raw = source.substr(i - 1, 2);
  				onError(i - 1, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
  				res += raw;
  			}
  		} else if (ch === " " || ch === "	") {
  			const wsStart = i;
  			let next = source[i + 1];
  			while (next === " " || next === "	") next = source[++i + 1];
  			if (next !== "\n" && !(next === "\r" && source[i + 2] === "\n")) res += i > wsStart ? source.slice(wsStart, i + 1) : ch;
  		} else res += ch;
  	}
  	if (source[source.length - 1] !== "\"" || source.length === 1) onError(source.length, "MISSING_CHAR", "Missing closing \"quote");
  	return res;
  }
  /**
  * Fold a single newline into a space, multiple newlines to N - 1 newlines.
  * Presumes `source[offset] === '\n'`
  */
  function foldNewline(source, offset) {
  	let fold = "";
  	let ch = source[offset + 1];
  	while (ch === " " || ch === "	" || ch === "\n" || ch === "\r") {
  		if (ch === "\r" && source[offset + 2] !== "\n") break;
  		if (ch === "\n") fold += "\n";
  		offset += 1;
  		ch = source[offset + 1];
  	}
  	if (!fold) fold = " ";
  	return {
  		fold,
  		offset
  	};
  }
  var escapeCodes = {
  	"0": "\0",
  	a: "\x07",
  	b: "\b",
  	e: "\x1B",
  	f: "\f",
  	n: "\n",
  	r: "\r",
  	t: "	",
  	v: "\v",
  	N: "",
  	_: "\xA0",
  	L: "\u2028",
  	P: "\u2029",
  	" ": " ",
  	"\"": "\"",
  	"/": "/",
  	"\\": "\\",
  	"	": "	"
  };
  function parseCharCode(source, offset, length, onError) {
  	const cc = source.substr(offset, length);
  	const code = cc.length === length && /^[0-9a-fA-F]+$/.test(cc) ? parseInt(cc, 16) : NaN;
  	try {
  		return String.fromCodePoint(code);
  	} catch {
  		const raw = source.substr(offset - 2, length + 2);
  		onError(offset - 2, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
  		return raw;
  	}
  }
  function composeScalar(ctx, token, tagToken, onError) {
  	const { value, type, comment, range } = token.type === "block-scalar" ? resolveBlockScalar(ctx, token, onError) : resolveFlowScalar(token, ctx.options.strict, onError);
  	const tagName = tagToken ? ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg)) : null;
  	let tag;
  	if (ctx.options.stringKeys && ctx.atKey) tag = ctx.schema[SCALAR$1];
  	else if (tagName) tag = findScalarTagByName(ctx.schema, value, tagName, tagToken, onError);
  	else if (token.type === "scalar") tag = findScalarTagByTest(ctx, value, token, onError);
  	else tag = ctx.schema[SCALAR$1];
  	let scalar;
  	try {
  		const res = tag.resolve(value, (msg) => onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg), ctx.options);
  		scalar = isScalar(res) ? res : new Scalar(res);
  	} catch (error) {
  		const msg = error instanceof Error ? error.message : String(error);
  		onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg);
  		scalar = new Scalar(value);
  	}
  	scalar.range = range;
  	scalar.source = value;
  	if (type) scalar.type = type;
  	if (tagName) scalar.tag = tagName;
  	if (tag.format) scalar.format = tag.format;
  	if (comment) scalar.comment = comment;
  	return scalar;
  }
  function findScalarTagByName(schema, value, tagName, tagToken, onError) {
  	if (tagName === "!") return schema[SCALAR$1];
  	const matchWithTest = [];
  	for (const tag of schema.tags) if (!tag.collection && tag.tag === tagName) {
  		if (tag.default && tag.test) matchWithTest.push(tag);
  		else return tag;
  	}
  	for (const tag of matchWithTest) if (tag.test?.test(value)) return tag;
  	const kt = schema.knownTags[tagName];
  	if (kt && !kt.collection) {
  		schema.tags.push(Object.assign({}, kt, {
  			default: false,
  			test: void 0
  		}));
  		return kt;
  	}
  	onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, tagName !== "tag:yaml.org,2002:str");
  	return schema[SCALAR$1];
  }
  function findScalarTagByTest({ atKey, directives, schema }, value, token, onError) {
  	const tag = schema.tags.find((tag) => (tag.default === true || atKey && tag.default === "key") && tag.test?.test(value)) || schema[SCALAR$1];
  	if (schema.compat) {
  		const compat = schema.compat.find((tag) => tag.default && tag.test?.test(value)) ?? schema[SCALAR$1];
  		if (tag.tag !== compat.tag) onError(token, "TAG_RESOLVE_FAILED", `Value may be parsed as either ${directives.tagString(tag.tag)} or ${directives.tagString(compat.tag)}`, true);
  	}
  	return tag;
  }
  function emptyScalarPosition(offset, before, pos) {
  	if (before) {
  		pos ?? (pos = before.length);
  		for (let i = pos - 1; i >= 0; --i) {
  			let st = before[i];
  			switch (st.type) {
  				case "space":
  				case "comment":
  				case "newline":
  					offset -= st.source.length;
  					continue;
  			}
  			st = before[++i];
  			while (st?.type === "space") {
  				offset += st.source.length;
  				st = before[++i];
  			}
  			break;
  		}
  	}
  	return offset;
  }
  var CN = {
  	composeNode,
  	composeEmptyNode
  };
  function composeNode(ctx, token, props, onError) {
  	const atKey = ctx.atKey;
  	const { spaceBefore, comment, anchor, tag } = props;
  	let node;
  	let isSrcToken = true;
  	switch (token.type) {
  		case "alias":
  			node = composeAlias(ctx, token, onError);
  			if (anchor || tag) onError(token, "ALIAS_PROPS", "An alias node must not specify any properties");
  			break;
  		case "scalar":
  		case "single-quoted-scalar":
  		case "double-quoted-scalar":
  		case "block-scalar":
  			node = composeScalar(ctx, token, tag, onError);
  			if (anchor) node.anchor = anchor.source.substring(1);
  			break;
  		case "block-map":
  		case "block-seq":
  		case "flow-collection":
  			try {
  				node = composeCollection(CN, ctx, token, props, onError);
  				if (anchor) node.anchor = anchor.source.substring(1);
  			} catch (error) {
  				onError(token, "RESOURCE_EXHAUSTION", error instanceof Error ? error.message : String(error));
  			}
  			break;
  		default:
  			onError(token, "UNEXPECTED_TOKEN", token.type === "error" ? token.message : `Unsupported token (type: ${token.type})`);
  			isSrcToken = false;
  	}
  	node ?? (node = composeEmptyNode(ctx, token.offset, void 0, null, props, onError));
  	if (anchor && node.anchor === "") onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
  	if (atKey && ctx.options.stringKeys && (!isScalar(node) || typeof node.value !== "string" || node.tag && node.tag !== "tag:yaml.org,2002:str")) onError(tag ?? token, "NON_STRING_KEY", "With stringKeys, all keys must be strings");
  	if (spaceBefore) node.spaceBefore = true;
  	if (comment) {
  		if (token.type === "scalar" && token.source === "") node.comment = comment;
  		else node.commentBefore = comment;
  	}
  	if (ctx.options.keepSourceTokens && isSrcToken) node.srcToken = token;
  	return node;
  }
  function composeEmptyNode(ctx, offset, before, pos, { spaceBefore, comment, anchor, tag, end }, onError) {
  	const node = composeScalar(ctx, {
  		type: "scalar",
  		offset: emptyScalarPosition(offset, before, pos),
  		indent: -1,
  		source: ""
  	}, tag, onError);
  	if (anchor) {
  		node.anchor = anchor.source.substring(1);
  		if (node.anchor === "") onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
  	}
  	if (spaceBefore) node.spaceBefore = true;
  	if (comment) {
  		node.comment = comment;
  		node.range[2] = end;
  	}
  	return node;
  }
  function composeAlias({ options }, { offset, source, end }, onError) {
  	const alias = new Alias(source.substring(1));
  	if (alias.source === "") onError(offset, "BAD_ALIAS", "Alias cannot be an empty string");
  	if (alias.source.endsWith(":")) onError(offset + source.length - 1, "BAD_ALIAS", "Alias ending in : is ambiguous", true);
  	const valueEnd = offset + source.length;
  	const re = resolveEnd(end, valueEnd, options.strict, onError);
  	alias.range = [
  		offset,
  		valueEnd,
  		re.offset
  	];
  	if (re.comment) alias.comment = re.comment;
  	return alias;
  }
  function composeDoc(options, directives, { offset, start, value, end }, onError) {
  	const doc = new Document(void 0, Object.assign({ _directives: directives }, options));
  	const ctx = {
  		atKey: false,
  		atRoot: true,
  		directives: doc.directives,
  		options: doc.options,
  		schema: doc.schema
  	};
  	const props = resolveProps(start, {
  		indicator: "doc-start",
  		next: value ?? end?.[0],
  		offset,
  		onError,
  		parentIndent: 0,
  		startOnNewline: true
  	});
  	if (props.found) {
  		doc.directives.docStart = true;
  		if (value && (value.type === "block-map" || value.type === "block-seq") && !props.hasNewline) onError(props.end, "MISSING_CHAR", "Block collection cannot start on same line with directives-end marker");
  	}
  	doc.contents = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, start, null, props, onError);
  	const contentEnd = doc.contents.range[2];
  	const re = resolveEnd(end, contentEnd, false, onError);
  	if (re.comment) doc.comment = re.comment;
  	doc.range = [
  		offset,
  		contentEnd,
  		re.offset
  	];
  	return doc;
  }
  function getErrorPos(src) {
  	if (typeof src === "number") return [src, src + 1];
  	if (Array.isArray(src)) return src.length === 2 ? src : [src[0], src[1]];
  	const { offset, source } = src;
  	return [offset, offset + (typeof source === "string" ? source.length : 1)];
  }
  function parsePrelude(prelude) {
  	let comment = "";
  	let atComment = false;
  	let afterEmptyLine = false;
  	for (let i = 0; i < prelude.length; ++i) {
  		const source = prelude[i];
  		switch (source[0]) {
  			case "#":
  				comment += (comment === "" ? "" : afterEmptyLine ? "\n\n" : "\n") + (source.substring(1) || " ");
  				atComment = true;
  				afterEmptyLine = false;
  				break;
  			case "%":
  				if (prelude[i + 1]?.[0] !== "#") i += 1;
  				atComment = false;
  				break;
  			default:
  				if (!atComment) afterEmptyLine = true;
  				atComment = false;
  		}
  	}
  	return {
  		comment,
  		afterEmptyLine
  	};
  }
  /**
  * Compose a stream of CST nodes into a stream of YAML Documents.
  *
  * ```ts
  * import { Composer, Parser } from 'yaml'
  *
  * const src: string = ...
  * const tokens = new Parser().parse(src)
  * const docs = new Composer().compose(tokens)
  * ```
  */
  var Composer = class {
  	constructor(options = {}) {
  		this.doc = null;
  		this.atDirectives = false;
  		this.prelude = [];
  		this.errors = [];
  		this.warnings = [];
  		this.onError = (source, code, message, warning) => {
  			const pos = getErrorPos(source);
  			if (warning) this.warnings.push(new YAMLWarning(pos, code, message));
  			else this.errors.push(new YAMLParseError(pos, code, message));
  		};
  		this.directives = new Directives({ version: options.version || "1.2" });
  		this.options = options;
  	}
  	decorate(doc, afterDoc) {
  		const { comment, afterEmptyLine } = parsePrelude(this.prelude);
  		if (comment) {
  			const dc = doc.contents;
  			if (afterDoc) doc.comment = doc.comment ? `${doc.comment}\n${comment}` : comment;
  			else if (afterEmptyLine || doc.directives.docStart || !dc) doc.commentBefore = comment;
  			else if (isCollection(dc) && !dc.flow && dc.items.length > 0) {
  				let it = dc.items[0];
  				if (isPair(it)) it = it.key;
  				const cb = it.commentBefore;
  				it.commentBefore = cb ? `${comment}\n${cb}` : comment;
  			} else {
  				const cb = dc.commentBefore;
  				dc.commentBefore = cb ? `${comment}\n${cb}` : comment;
  			}
  		}
  		if (afterDoc) {
  			for (let i = 0; i < this.errors.length; ++i) doc.errors.push(this.errors[i]);
  			for (let i = 0; i < this.warnings.length; ++i) doc.warnings.push(this.warnings[i]);
  		} else {
  			doc.errors = this.errors;
  			doc.warnings = this.warnings;
  		}
  		this.prelude = [];
  		this.errors = [];
  		this.warnings = [];
  	}
  	/**
  	* Current stream status information.
  	*
  	* Mostly useful at the end of input for an empty stream.
  	*/
  	streamInfo() {
  		return {
  			comment: parsePrelude(this.prelude).comment,
  			directives: this.directives,
  			errors: this.errors,
  			warnings: this.warnings
  		};
  	}
  	/**
  	* Compose tokens into documents.
  	*
  	* @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
  	* @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
  	*/
  	*compose(tokens, forceDoc = false, endOffset = -1) {
  		for (const token of tokens) yield* this.next(token);
  		yield* this.end(forceDoc, endOffset);
  	}
  	/** Advance the composer by one CST token. */
  	*next(token) {
  		switch (token.type) {
  			case "directive":
  				this.directives.add(token.source, (offset, message, warning) => {
  					const pos = getErrorPos(token);
  					pos[0] += offset;
  					this.onError(pos, "BAD_DIRECTIVE", message, warning);
  				});
  				this.prelude.push(token.source);
  				this.atDirectives = true;
  				break;
  			case "document": {
  				const doc = composeDoc(this.options, this.directives, token, this.onError);
  				if (this.atDirectives && !doc.directives.docStart) this.onError(token, "MISSING_CHAR", "Missing directives-end/doc-start indicator line");
  				this.decorate(doc, false);
  				if (this.doc) yield this.doc;
  				this.doc = doc;
  				this.atDirectives = false;
  				break;
  			}
  			case "byte-order-mark":
  			case "space": break;
  			case "comment":
  			case "newline":
  				this.prelude.push(token.source);
  				break;
  			case "error": {
  				const msg = token.source ? `${token.message}: ${JSON.stringify(token.source)}` : token.message;
  				const error = new YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg);
  				if (this.atDirectives || !this.doc) this.errors.push(error);
  				else this.doc.errors.push(error);
  				break;
  			}
  			case "doc-end": {
  				if (!this.doc) {
  					this.errors.push(new YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", "Unexpected doc-end without preceding document"));
  					break;
  				}
  				this.doc.directives.docEnd = true;
  				const end = resolveEnd(token.end, token.offset + token.source.length, this.doc.options.strict, this.onError);
  				this.decorate(this.doc, true);
  				if (end.comment) {
  					const dc = this.doc.comment;
  					this.doc.comment = dc ? `${dc}\n${end.comment}` : end.comment;
  				}
  				this.doc.range[2] = end.offset;
  				break;
  			}
  			default: this.errors.push(new YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", `Unsupported token ${token.type}`));
  		}
  	}
  	/**
  	* Call at end of input to yield any remaining document.
  	*
  	* @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
  	* @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
  	*/
  	*end(forceDoc = false, endOffset = -1) {
  		if (this.doc) {
  			this.decorate(this.doc, true);
  			yield this.doc;
  			this.doc = null;
  		} else if (forceDoc) {
  			const doc = new Document(void 0, Object.assign({ _directives: this.directives }, this.options));
  			if (this.atDirectives) this.onError(endOffset, "MISSING_CHAR", "Missing directives-end indicator line");
  			doc.range = [
  				0,
  				endOffset,
  				endOffset
  			];
  			this.decorate(doc, false);
  			yield doc;
  		}
  	}
  };
  var BREAK = Symbol("break visit");
  var SKIP = Symbol("skip children");
  var REMOVE = Symbol("remove item");
  /**
  * Apply a visitor to a CST document or item.
  *
  * Walks through the tree (depth-first) starting from the root, calling a
  * `visitor` function with two arguments when entering each item:
  *   - `item`: The current item, which included the following members:
  *     - `start: SourceToken[]` – Source tokens before the key or value,
  *       possibly including its anchor or tag.
  *     - `key?: Token | null` – Set for pair values. May then be `null`, if
  *       the key before the `:` separator is empty.
  *     - `sep?: SourceToken[]` – Source tokens between the key and the value,
  *       which should include the `:` map value indicator if `value` is set.
  *     - `value?: Token` – The value of a sequence item, or of a map pair.
  *   - `path`: The steps from the root to the current node, as an array of
  *     `['key' | 'value', number]` tuples.
  *
  * The return value of the visitor may be used to control the traversal:
  *   - `undefined` (default): Do nothing and continue
  *   - `visit.SKIP`: Do not visit the children of this token, continue with
  *      next sibling
  *   - `visit.BREAK`: Terminate traversal completely
  *   - `visit.REMOVE`: Remove the current item, then continue with the next one
  *   - `number`: Set the index of the next step. This is useful especially if
  *     the index of the current token has changed.
  *   - `function`: Define the next visitor for this item. After the original
  *     visitor is called on item entry, next visitors are called after handling
  *     a non-empty `key` and when exiting the item.
  */
  function visit(cst, visitor) {
  	if ("type" in cst && cst.type === "document") cst = {
  		start: cst.start,
  		value: cst.value
  	};
  	_visit(Object.freeze([]), cst, visitor);
  }
  /** Terminate visit traversal completely */
  visit.BREAK = BREAK;
  /** Do not visit the children of the current item */
  visit.SKIP = SKIP;
  /** Remove the current item */
  visit.REMOVE = REMOVE;
  /** Find the item at `path` from `cst` as the root */
  visit.itemAtPath = (cst, path) => {
  	let item = cst;
  	for (const [field, index] of path) {
  		const tok = item?.[field];
  		if (tok && "items" in tok) item = tok.items[index];
  		else return void 0;
  	}
  	return item;
  };
  /**
  * Get the immediate parent collection of the item at `path` from `cst` as the root.
  *
  * Throws an error if the collection is not found, which should never happen if the item itself exists.
  */
  visit.parentCollection = (cst, path) => {
  	const parent = visit.itemAtPath(cst, path.slice(0, -1));
  	const field = path[path.length - 1][0];
  	const coll = parent?.[field];
  	if (coll && "items" in coll) return coll;
  	throw new Error("Parent collection not found");
  };
  function _visit(path, item, visitor) {
  	let ctrl = visitor(item, path);
  	if (typeof ctrl === "symbol") return ctrl;
  	for (const field of ["key", "value"]) {
  		const token = item[field];
  		if (token && "items" in token) {
  			for (let i = 0; i < token.items.length; ++i) {
  				const ci = _visit(Object.freeze(path.concat([[field, i]])), token.items[i], visitor);
  				if (typeof ci === "number") i = ci - 1;
  				else if (ci === BREAK) return BREAK;
  				else if (ci === REMOVE) {
  					token.items.splice(i, 1);
  					i -= 1;
  				}
  			}
  			if (typeof ctrl === "function" && field === "key") ctrl = ctrl(item, path);
  		}
  	}
  	return typeof ctrl === "function" ? ctrl(item, path) : ctrl;
  }
  /** Identify the type of a lexer token. May return `null` for unknown tokens. */
  function tokenType(source) {
  	switch (source) {
  		case "﻿": return "byte-order-mark";
  		case "": return "doc-mode";
  		case "": return "flow-error-end";
  		case "": return "scalar";
  		case "---": return "doc-start";
  		case "...": return "doc-end";
  		case "":
  		case "\n":
  		case "\r\n": return "newline";
  		case "-": return "seq-item-ind";
  		case "?": return "explicit-key-ind";
  		case ":": return "map-value-ind";
  		case "{": return "flow-map-start";
  		case "}": return "flow-map-end";
  		case "[": return "flow-seq-start";
  		case "]": return "flow-seq-end";
  		case ",": return "comma";
  	}
  	switch (source[0]) {
  		case " ":
  		case "	": return "space";
  		case "#": return "comment";
  		case "%": return "directive-line";
  		case "*": return "alias";
  		case "&": return "anchor";
  		case "!": return "tag";
  		case "'": return "single-quoted-scalar";
  		case "\"": return "double-quoted-scalar";
  		case "|":
  		case ">": return "block-scalar-header";
  	}
  	return null;
  }
  function isEmpty(ch) {
  	switch (ch) {
  		case void 0:
  		case " ":
  		case "\n":
  		case "\r":
  		case "	": return true;
  		default: return false;
  	}
  }
  var hexDigits = /* @__PURE__ */ new Set("0123456789ABCDEFabcdef");
  var tagChars = /* @__PURE__ */ new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
  var flowIndicatorChars = /* @__PURE__ */ new Set(",[]{}");
  var invalidAnchorChars = /* @__PURE__ */ new Set(" ,[]{}\n\r	");
  var isNotAnchorChar = (ch) => !ch || invalidAnchorChars.has(ch);
  /**
  * Splits an input string into lexical tokens, i.e. smaller strings that are
  * easily identifiable by `tokens.tokenType()`.
  *
  * Lexing starts always in a "stream" context. Incomplete input may be buffered
  * until a complete token can be emitted.
  *
  * In addition to slices of the original input, the following control characters
  * may also be emitted:
  *
  * - `\x02` (Start of Text): A document starts with the next token
  * - `\x18` (Cancel): Unexpected end of flow-mode (indicates an error)
  * - `\x1f` (Unit Separator): Next token is a scalar value
  * - `\u{FEFF}` (Byte order mark): Emitted separately outside documents
  */
  var Lexer = class {
  	constructor() {
  		/**
  		* Flag indicating whether the end of the current buffer marks the end of
  		* all input
  		*/
  		this.atEnd = false;
  		/**
  		* Explicit indent set in block scalar header, as an offset from the current
  		* minimum indent, so e.g. set to 1 from a header `|2+`. Set to -1 if not
  		* explicitly set.
  		*/
  		this.blockScalarIndent = -1;
  		/**
  		* Block scalars that include a + (keep) chomping indicator in their header
  		* include trailing empty lines, which are otherwise excluded from the
  		* scalar's contents.
  		*/
  		this.blockScalarKeep = false;
  		/** Current input */
  		this.buffer = "";
  		/**
  		* Flag noting whether the map value indicator : can immediately follow this
  		* node within a flow context.
  		*/
  		this.flowKey = false;
  		/** Count of surrounding flow collection levels. */
  		this.flowLevel = 0;
  		/**
  		* Minimum level of indentation required for next lines to be parsed as a
  		* part of the current scalar value.
  		*/
  		this.indentNext = 0;
  		/** Indentation level of the current line. */
  		this.indentValue = 0;
  		/** Position of the next \n character. */
  		this.lineEndPos = null;
  		/** Stores the state of the lexer if reaching the end of incpomplete input */
  		this.next = null;
  		/** A pointer to `buffer`; the current position of the lexer. */
  		this.pos = 0;
  	}
  	/**
  	* Generate YAML tokens from the `source` string. If `incomplete`,
  	* a part of the last line may be left as a buffer for the next call.
  	*
  	* @returns A generator of lexical tokens
  	*/
  	*lex(source, incomplete = false) {
  		if (source) {
  			if (typeof source !== "string") throw TypeError("source is not a string");
  			this.buffer = this.buffer ? this.buffer + source : source;
  			this.lineEndPos = null;
  		}
  		this.atEnd = !incomplete;
  		let next = this.next ?? "stream";
  		while (next && (incomplete || this.hasChars(1))) next = yield* this.parseNext(next);
  	}
  	atLineEnd() {
  		let i = this.pos;
  		let ch = this.buffer[i];
  		while (ch === " " || ch === "	") ch = this.buffer[++i];
  		if (!ch || ch === "#" || ch === "\n") return true;
  		if (ch === "\r") return this.buffer[i + 1] === "\n";
  		return false;
  	}
  	charAt(n) {
  		return this.buffer[this.pos + n];
  	}
  	continueScalar(offset) {
  		let ch = this.buffer[offset];
  		if (this.indentNext > 0) {
  			let indent = 0;
  			while (ch === " ") ch = this.buffer[++indent + offset];
  			if (ch === "\r") {
  				const next = this.buffer[indent + offset + 1];
  				if (next === "\n" || !next && !this.atEnd) return offset + indent + 1;
  			}
  			return ch === "\n" || indent >= this.indentNext || !ch && !this.atEnd ? offset + indent : -1;
  		}
  		if (ch === "-" || ch === ".") {
  			const dt = this.buffer.substr(offset, 3);
  			if ((dt === "---" || dt === "...") && isEmpty(this.buffer[offset + 3])) return -1;
  		}
  		return offset;
  	}
  	getLine() {
  		let end = this.lineEndPos;
  		if (typeof end !== "number" || end !== -1 && end < this.pos) {
  			end = this.buffer.indexOf("\n", this.pos);
  			this.lineEndPos = end;
  		}
  		if (end === -1) return this.atEnd ? this.buffer.substring(this.pos) : null;
  		if (this.buffer[end - 1] === "\r") end -= 1;
  		return this.buffer.substring(this.pos, end);
  	}
  	hasChars(n) {
  		return this.pos + n <= this.buffer.length;
  	}
  	setNext(state) {
  		this.buffer = this.buffer.substring(this.pos);
  		this.pos = 0;
  		this.lineEndPos = null;
  		this.next = state;
  		return null;
  	}
  	peek(n) {
  		return this.buffer.substr(this.pos, n);
  	}
  	*parseNext(next) {
  		switch (next) {
  			case "stream": return yield* this.parseStream();
  			case "line-start": return yield* this.parseLineStart();
  			case "block-start": return yield* this.parseBlockStart();
  			case "doc": return yield* this.parseDocument();
  			case "flow": return yield* this.parseFlowCollection();
  			case "quoted-scalar": return yield* this.parseQuotedScalar();
  			case "block-scalar": return yield* this.parseBlockScalar();
  			case "plain-scalar": return yield* this.parsePlainScalar();
  		}
  	}
  	*parseStream() {
  		let line = this.getLine();
  		if (line === null) return this.setNext("stream");
  		if (line[0] === "﻿") {
  			yield* this.pushCount(1);
  			line = line.substring(1);
  		}
  		if (line[0] === "%") {
  			let dirEnd = line.length;
  			let cs = line.indexOf("#");
  			while (cs !== -1) {
  				const ch = line[cs - 1];
  				if (ch === " " || ch === "	") {
  					dirEnd = cs - 1;
  					break;
  				} else cs = line.indexOf("#", cs + 1);
  			}
  			while (true) {
  				const ch = line[dirEnd - 1];
  				if (ch === " " || ch === "	") dirEnd -= 1;
  				else break;
  			}
  			const n = (yield* this.pushCount(dirEnd)) + (yield* this.pushSpaces(true));
  			yield* this.pushCount(line.length - n);
  			this.pushNewline();
  			return "stream";
  		}
  		if (this.atLineEnd()) {
  			const sp = yield* this.pushSpaces(true);
  			yield* this.pushCount(line.length - sp);
  			yield* this.pushNewline();
  			return "stream";
  		}
  		yield "";
  		return yield* this.parseLineStart();
  	}
  	*parseLineStart() {
  		const ch = this.charAt(0);
  		if (!ch && !this.atEnd) return this.setNext("line-start");
  		if (ch === "-" || ch === ".") {
  			if (!this.atEnd && !this.hasChars(4)) return this.setNext("line-start");
  			const s = this.peek(3);
  			if ((s === "---" || s === "...") && isEmpty(this.charAt(3))) {
  				yield* this.pushCount(3);
  				this.indentValue = 0;
  				this.indentNext = 0;
  				return s === "---" ? "doc" : "stream";
  			}
  		}
  		this.indentValue = yield* this.pushSpaces(false);
  		if (this.indentNext > this.indentValue && !isEmpty(this.charAt(1))) this.indentNext = this.indentValue;
  		return yield* this.parseBlockStart();
  	}
  	*parseBlockStart() {
  		const [ch0, ch1] = this.peek(2);
  		if (!ch1 && !this.atEnd) return this.setNext("block-start");
  		if ((ch0 === "-" || ch0 === "?" || ch0 === ":") && isEmpty(ch1)) {
  			const n = (yield* this.pushCount(1)) + (yield* this.pushSpaces(true));
  			this.indentNext = this.indentValue + 1;
  			this.indentValue += n;
  			return "block-start";
  		}
  		return "doc";
  	}
  	*parseDocument() {
  		yield* this.pushSpaces(true);
  		const line = this.getLine();
  		if (line === null) return this.setNext("doc");
  		let n = yield* this.pushIndicators();
  		switch (line[n]) {
  			case "#": yield* this.pushCount(line.length - n);
  			case void 0:
  				yield* this.pushNewline();
  				return yield* this.parseLineStart();
  			case "{":
  			case "[":
  				yield* this.pushCount(1);
  				this.flowKey = false;
  				this.flowLevel = 1;
  				return "flow";
  			case "}":
  			case "]":
  				yield* this.pushCount(1);
  				return "doc";
  			case "*":
  				yield* this.pushUntil(isNotAnchorChar);
  				return "doc";
  			case "\"":
  			case "'": return yield* this.parseQuotedScalar();
  			case "|":
  			case ">":
  				n += yield* this.parseBlockScalarHeader();
  				n += yield* this.pushSpaces(true);
  				yield* this.pushCount(line.length - n);
  				yield* this.pushNewline();
  				return yield* this.parseBlockScalar();
  			default: return yield* this.parsePlainScalar();
  		}
  	}
  	*parseFlowCollection() {
  		let nl, sp;
  		let indent = -1;
  		do {
  			nl = yield* this.pushNewline();
  			if (nl > 0) {
  				sp = yield* this.pushSpaces(false);
  				this.indentValue = indent = sp;
  			} else sp = 0;
  			sp += yield* this.pushSpaces(true);
  		} while (nl + sp > 0);
  		const line = this.getLine();
  		if (line === null) return this.setNext("flow");
  		if (indent !== -1 && indent < this.indentNext && line[0] !== "#" || indent === 0 && (line.startsWith("---") || line.startsWith("...")) && isEmpty(line[3])) {
  			if (!(indent === this.indentNext - 1 && this.flowLevel === 1 && (line[0] === "]" || line[0] === "}"))) {
  				this.flowLevel = 0;
  				yield "";
  				return yield* this.parseLineStart();
  			}
  		}
  		let n = 0;
  		while (line[n] === ",") {
  			n += yield* this.pushCount(1);
  			n += yield* this.pushSpaces(true);
  			this.flowKey = false;
  		}
  		n += yield* this.pushIndicators();
  		switch (line[n]) {
  			case void 0: return "flow";
  			case "#":
  				yield* this.pushCount(line.length - n);
  				return "flow";
  			case "{":
  			case "[":
  				yield* this.pushCount(1);
  				this.flowKey = false;
  				this.flowLevel += 1;
  				return "flow";
  			case "}":
  			case "]":
  				yield* this.pushCount(1);
  				this.flowKey = true;
  				this.flowLevel -= 1;
  				return this.flowLevel ? "flow" : "doc";
  			case "*":
  				yield* this.pushUntil(isNotAnchorChar);
  				return "flow";
  			case "\"":
  			case "'":
  				this.flowKey = true;
  				return yield* this.parseQuotedScalar();
  			case ":": {
  				const next = this.charAt(1);
  				if (this.flowKey || isEmpty(next) || next === ",") {
  					this.flowKey = false;
  					yield* this.pushCount(1);
  					yield* this.pushSpaces(true);
  					return "flow";
  				}
  			}
  			default:
  				this.flowKey = false;
  				return yield* this.parsePlainScalar();
  		}
  	}
  	*parseQuotedScalar() {
  		const quote = this.charAt(0);
  		let end = this.buffer.indexOf(quote, this.pos + 1);
  		if (quote === "'") while (end !== -1 && this.buffer[end + 1] === "'") end = this.buffer.indexOf("'", end + 2);
  		else while (end !== -1) {
  			let n = 0;
  			while (this.buffer[end - 1 - n] === "\\") n += 1;
  			if (n % 2 === 0) break;
  			end = this.buffer.indexOf("\"", end + 1);
  		}
  		const qb = this.buffer.substring(0, end);
  		let nl = qb.indexOf("\n", this.pos);
  		if (nl !== -1) {
  			while (nl !== -1) {
  				const cs = this.continueScalar(nl + 1);
  				if (cs === -1) break;
  				nl = qb.indexOf("\n", cs);
  			}
  			if (nl !== -1) end = nl - (qb[nl - 1] === "\r" ? 2 : 1);
  		}
  		if (end === -1) {
  			if (!this.atEnd) return this.setNext("quoted-scalar");
  			end = this.buffer.length;
  		}
  		yield* this.pushToIndex(end + 1, false);
  		return this.flowLevel ? "flow" : "doc";
  	}
  	*parseBlockScalarHeader() {
  		this.blockScalarIndent = -1;
  		this.blockScalarKeep = false;
  		let i = this.pos;
  		while (true) {
  			const ch = this.buffer[++i];
  			if (ch === "+") this.blockScalarKeep = true;
  			else if (ch > "0" && ch <= "9") this.blockScalarIndent = Number(ch) - 1;
  			else if (ch !== "-") break;
  		}
  		return yield* this.pushUntil((ch) => isEmpty(ch) || ch === "#");
  	}
  	*parseBlockScalar() {
  		let nl = this.pos - 1;
  		let indent = 0;
  		let ch;
  		loop: for (let i = this.pos; ch = this.buffer[i]; ++i) switch (ch) {
  			case " ":
  				indent += 1;
  				break;
  			case "\n":
  				nl = i;
  				indent = 0;
  				break;
  			case "\r": {
  				const next = this.buffer[i + 1];
  				if (!next && !this.atEnd) return this.setNext("block-scalar");
  				if (next === "\n") break;
  			}
  			default: break loop;
  		}
  		if (!ch && !this.atEnd) return this.setNext("block-scalar");
  		if (indent >= this.indentNext) {
  			if (this.blockScalarIndent === -1) this.indentNext = indent;
  			else this.indentNext = this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext);
  			do {
  				const cs = this.continueScalar(nl + 1);
  				if (cs === -1) break;
  				nl = this.buffer.indexOf("\n", cs);
  			} while (nl !== -1);
  			if (nl === -1) {
  				if (!this.atEnd) return this.setNext("block-scalar");
  				nl = this.buffer.length;
  			}
  		}
  		let i = nl + 1;
  		ch = this.buffer[i];
  		while (ch === " ") ch = this.buffer[++i];
  		if (ch === "	") {
  			while (ch === "	" || ch === " " || ch === "\r" || ch === "\n") ch = this.buffer[++i];
  			nl = i - 1;
  		} else if (!this.blockScalarKeep) do {
  			let i = nl - 1;
  			let ch = this.buffer[i];
  			if (ch === "\r") ch = this.buffer[--i];
  			const lastChar = i;
  			while (ch === " ") ch = this.buffer[--i];
  			if (ch === "\n" && i >= this.pos && i + 1 + indent > lastChar) nl = i;
  			else break;
  		} while (true);
  		yield "";
  		yield* this.pushToIndex(nl + 1, true);
  		return yield* this.parseLineStart();
  	}
  	*parsePlainScalar() {
  		const inFlow = this.flowLevel > 0;
  		let end = this.pos - 1;
  		let i = this.pos - 1;
  		let ch;
  		while (ch = this.buffer[++i]) if (ch === ":") {
  			const next = this.buffer[i + 1];
  			if (isEmpty(next) || inFlow && flowIndicatorChars.has(next)) break;
  			end = i;
  		} else if (isEmpty(ch)) {
  			let next = this.buffer[i + 1];
  			if (ch === "\r") {
  				if (next === "\n") {
  					i += 1;
  					ch = "\n";
  					next = this.buffer[i + 1];
  				} else end = i;
  			}
  			if (next === "#" || inFlow && flowIndicatorChars.has(next)) break;
  			if (ch === "\n") {
  				const cs = this.continueScalar(i + 1);
  				if (cs === -1) break;
  				i = Math.max(i, cs - 2);
  			}
  		} else {
  			if (inFlow && flowIndicatorChars.has(ch)) break;
  			end = i;
  		}
  		if (!ch && !this.atEnd) return this.setNext("plain-scalar");
  		yield "";
  		yield* this.pushToIndex(end + 1, true);
  		return inFlow ? "flow" : "doc";
  	}
  	*pushCount(n) {
  		if (n > 0) {
  			yield this.buffer.substr(this.pos, n);
  			this.pos += n;
  			return n;
  		}
  		return 0;
  	}
  	*pushToIndex(i, allowEmpty) {
  		const s = this.buffer.slice(this.pos, i);
  		if (s) {
  			yield s;
  			this.pos += s.length;
  			return s.length;
  		} else if (allowEmpty) yield "";
  		return 0;
  	}
  	*pushIndicators() {
  		let n = 0;
  		loop: while (true) {
  			switch (this.charAt(0)) {
  				case "!":
  					n += yield* this.pushTag();
  					n += yield* this.pushSpaces(true);
  					continue loop;
  				case "&":
  					n += yield* this.pushUntil(isNotAnchorChar);
  					n += yield* this.pushSpaces(true);
  					continue loop;
  				case "-":
  				case "?":
  				case ":": {
  					const inFlow = this.flowLevel > 0;
  					const ch1 = this.charAt(1);
  					if (isEmpty(ch1) || inFlow && flowIndicatorChars.has(ch1)) {
  						if (!inFlow) this.indentNext = this.indentValue + 1;
  						else if (this.flowKey) this.flowKey = false;
  						n += yield* this.pushCount(1);
  						n += yield* this.pushSpaces(true);
  						continue loop;
  					}
  				}
  			}
  			break loop;
  		}
  		return n;
  	}
  	*pushTag() {
  		if (this.charAt(1) === "<") {
  			let i = this.pos + 2;
  			let ch = this.buffer[i];
  			while (!isEmpty(ch) && ch !== ">") ch = this.buffer[++i];
  			return yield* this.pushToIndex(ch === ">" ? i + 1 : i, false);
  		} else {
  			let i = this.pos + 1;
  			let ch = this.buffer[i];
  			while (ch) if (tagChars.has(ch)) ch = this.buffer[++i];
  			else if (ch === "%" && hexDigits.has(this.buffer[i + 1]) && hexDigits.has(this.buffer[i + 2])) ch = this.buffer[i += 3];
  			else break;
  			return yield* this.pushToIndex(i, false);
  		}
  	}
  	*pushNewline() {
  		const ch = this.buffer[this.pos];
  		if (ch === "\n") return yield* this.pushCount(1);
  		else if (ch === "\r" && this.charAt(1) === "\n") return yield* this.pushCount(2);
  		else return 0;
  	}
  	*pushSpaces(allowTabs) {
  		let i = this.pos - 1;
  		let ch;
  		do
  			ch = this.buffer[++i];
  		while (ch === " " || allowTabs && ch === "	");
  		const n = i - this.pos;
  		if (n > 0) {
  			yield this.buffer.substr(this.pos, n);
  			this.pos = i;
  		}
  		return n;
  	}
  	*pushUntil(test) {
  		let i = this.pos;
  		let ch = this.buffer[i];
  		while (!test(ch)) ch = this.buffer[++i];
  		return yield* this.pushToIndex(i, false);
  	}
  };
  /**
  * Tracks newlines during parsing in order to provide an efficient API for
  * determining the one-indexed `{ line, col }` position for any offset
  * within the input.
  */
  var LineCounter = class {
  	constructor() {
  		this.lineStarts = [];
  		/**
  		* Should be called in ascending order. Otherwise, call
  		* `lineCounter.lineStarts.sort()` before calling `linePos()`.
  		*/
  		this.addNewLine = (offset) => this.lineStarts.push(offset);
  		/**
  		* Performs a binary search and returns the 1-indexed { line, col }
  		* position of `offset`. If `line === 0`, `addNewLine` has never been
  		* called or `offset` is before the first known newline.
  		*/
  		this.linePos = (offset) => {
  			let low = 0;
  			let high = this.lineStarts.length;
  			while (low < high) {
  				const mid = low + high >> 1;
  				if (this.lineStarts[mid] < offset) low = mid + 1;
  				else high = mid;
  			}
  			if (this.lineStarts[low] === offset) return {
  				line: low + 1,
  				col: 1
  			};
  			if (low === 0) return {
  				line: 0,
  				col: offset
  			};
  			const start = this.lineStarts[low - 1];
  			return {
  				line: low,
  				col: offset - start + 1
  			};
  		};
  	}
  };
  function includesToken(list, type) {
  	for (let i = 0; i < list.length; ++i) if (list[i].type === type) return true;
  	return false;
  }
  function findNonEmptyIndex(list) {
  	for (let i = 0; i < list.length; ++i) switch (list[i].type) {
  		case "space":
  		case "comment":
  		case "newline": break;
  		default: return i;
  	}
  	return -1;
  }
  function isFlowToken(token) {
  	switch (token?.type) {
  		case "alias":
  		case "scalar":
  		case "single-quoted-scalar":
  		case "double-quoted-scalar":
  		case "flow-collection": return true;
  		default: return false;
  	}
  }
  function getPrevProps(parent) {
  	switch (parent.type) {
  		case "document": return parent.start;
  		case "block-map": {
  			const it = parent.items[parent.items.length - 1];
  			return it.sep ?? it.start;
  		}
  		case "block-seq": return parent.items[parent.items.length - 1].start;
  		/* istanbul ignore next should not happen */
  		default: return [];
  	}
  }
  /** Note: May modify input array */
  function getFirstKeyStartProps(prev) {
  	if (prev.length === 0) return [];
  	let i = prev.length;
  	loop: while (--i >= 0) switch (prev[i].type) {
  		case "doc-start":
  		case "explicit-key-ind":
  		case "map-value-ind":
  		case "seq-item-ind":
  		case "newline": break loop;
  	}
  	while (prev[++i]?.type === "space");
  	return prev.splice(i, prev.length);
  }
  function arrayPushArray(target, source) {
  	if (source.length < 1e5) Array.prototype.push.apply(target, source);
  	else for (let i = 0; i < source.length; ++i) target.push(source[i]);
  }
  function fixFlowSeqItems(fc) {
  	if (fc.start.type === "flow-seq-start") {
  		for (const it of fc.items) if (it.sep && !it.value && !includesToken(it.start, "explicit-key-ind") && !includesToken(it.sep, "map-value-ind")) {
  			if (it.key) it.value = it.key;
  			delete it.key;
  			if (isFlowToken(it.value)) {
  				if (it.value.end) arrayPushArray(it.value.end, it.sep);
  				else it.value.end = it.sep;
  			} else arrayPushArray(it.start, it.sep);
  			delete it.sep;
  		}
  	}
  }
  /**
  * A YAML concrete syntax tree (CST) parser
  *
  * ```ts
  * const src: string = ...
  * for (const token of new Parser().parse(src)) {
  *   // token: Token
  * }
  * ```
  *
  * To use the parser with a user-provided lexer:
  *
  * ```ts
  * function* parse(source: string, lexer: Lexer) {
  *   const parser = new Parser()
  *   for (const lexeme of lexer.lex(source))
  *     yield* parser.next(lexeme)
  *   yield* parser.end()
  * }
  *
  * const src: string = ...
  * const lexer = new Lexer()
  * for (const token of parse(src, lexer)) {
  *   // token: Token
  * }
  * ```
  */
  var Parser = class {
  	/**
  	* @param onNewLine - If defined, called separately with the start position of
  	*   each new line (in `parse()`, including the start of input).
  	*/
  	constructor(onNewLine) {
  		/** If true, space and sequence indicators count as indentation */
  		this.atNewLine = true;
  		/** If true, next token is a scalar value */
  		this.atScalar = false;
  		/** Current indentation level */
  		this.indent = 0;
  		/** Current offset since the start of parsing */
  		this.offset = 0;
  		/** On the same line with a block map key */
  		this.onKeyLine = false;
  		/** Top indicates the node that's currently being built */
  		this.stack = [];
  		/** The source of the current token, set in parse() */
  		this.source = "";
  		/** The type of the current token, set in parse() */
  		this.type = "";
  		this.lexer = new Lexer();
  		this.onNewLine = onNewLine;
  	}
  	/**
  	* Parse `source` as a YAML stream.
  	* If `incomplete`, a part of the last line may be left as a buffer for the next call.
  	*
  	* Errors are not thrown, but yielded as `{ type: 'error', message }` tokens.
  	*
  	* @returns A generator of tokens representing each directive, document, and other structure.
  	*/
  	*parse(source, incomplete = false) {
  		if (this.onNewLine && this.offset === 0) this.onNewLine(0);
  		for (const lexeme of this.lexer.lex(source, incomplete)) yield* this.next(lexeme);
  		if (!incomplete) yield* this.end();
  	}
  	/**
  	* Advance the parser by the `source` of one lexical token.
  	*/
  	*next(source) {
  		this.source = source;
  		if (this.atScalar) {
  			this.atScalar = false;
  			yield* this.step();
  			this.offset += source.length;
  			return;
  		}
  		const type = tokenType(source);
  		if (!type) {
  			const message = `Not a YAML token: ${source}`;
  			yield* this.pop({
  				type: "error",
  				offset: this.offset,
  				message,
  				source
  			});
  			this.offset += source.length;
  		} else if (type === "scalar") {
  			this.atNewLine = false;
  			this.atScalar = true;
  			this.type = "scalar";
  		} else {
  			this.type = type;
  			yield* this.step();
  			switch (type) {
  				case "newline":
  					this.atNewLine = true;
  					this.indent = 0;
  					if (this.onNewLine) this.onNewLine(this.offset + source.length);
  					break;
  				case "space":
  					if (this.atNewLine && source[0] === " ") this.indent += source.length;
  					break;
  				case "explicit-key-ind":
  				case "map-value-ind":
  				case "seq-item-ind":
  					if (this.atNewLine) this.indent += source.length;
  					break;
  				case "doc-mode":
  				case "flow-error-end": return;
  				default: this.atNewLine = false;
  			}
  			this.offset += source.length;
  		}
  	}
  	/** Call at end of input to push out any remaining constructions */
  	*end() {
  		while (this.stack.length > 0) yield* this.pop();
  	}
  	get sourceToken() {
  		return {
  			type: this.type,
  			offset: this.offset,
  			indent: this.indent,
  			source: this.source
  		};
  	}
  	*step() {
  		const top = this.peek(1);
  		if (this.type === "doc-end" && top?.type !== "doc-end") {
  			while (this.stack.length > 0) yield* this.pop();
  			this.stack.push({
  				type: "doc-end",
  				offset: this.offset,
  				source: this.source
  			});
  			return;
  		}
  		if (!top) return yield* this.stream();
  		switch (top.type) {
  			case "document": return yield* this.document(top);
  			case "alias":
  			case "scalar":
  			case "single-quoted-scalar":
  			case "double-quoted-scalar": return yield* this.scalar(top);
  			case "block-scalar": return yield* this.blockScalar(top);
  			case "block-map": return yield* this.blockMap(top);
  			case "block-seq": return yield* this.blockSequence(top);
  			case "flow-collection": return yield* this.flowCollection(top);
  			case "doc-end": return yield* this.documentEnd(top);
  		}
  		/* istanbul ignore next should not happen */
  		yield* this.pop();
  	}
  	peek(n) {
  		return this.stack[this.stack.length - n];
  	}
  	*pop(error) {
  		const token = error ?? this.stack.pop();
  		/* istanbul ignore if should not happen */
  		if (!token) yield {
  			type: "error",
  			offset: this.offset,
  			source: "",
  			message: "Tried to pop an empty stack"
  		};
  		else if (this.stack.length === 0) yield token;
  		else {
  			const top = this.peek(1);
  			if (token.type === "block-scalar") token.indent = "indent" in top ? top.indent : 0;
  			else if (token.type === "flow-collection" && top.type === "document") token.indent = 0;
  			if (token.type === "flow-collection") fixFlowSeqItems(token);
  			switch (top.type) {
  				case "document":
  					top.value = token;
  					break;
  				case "block-scalar":
  					top.props.push(token);
  					break;
  				case "block-map": {
  					const it = top.items[top.items.length - 1];
  					if (it.value) {
  						top.items.push({
  							start: [],
  							key: token,
  							sep: []
  						});
  						this.onKeyLine = true;
  						return;
  					} else if (it.sep) it.value = token;
  					else {
  						Object.assign(it, {
  							key: token,
  							sep: []
  						});
  						this.onKeyLine = !it.explicitKey;
  						return;
  					}
  					break;
  				}
  				case "block-seq": {
  					const it = top.items[top.items.length - 1];
  					if (it.value) top.items.push({
  						start: [],
  						value: token
  					});
  					else it.value = token;
  					break;
  				}
  				case "flow-collection": {
  					const it = top.items[top.items.length - 1];
  					if (!it || it.value) top.items.push({
  						start: [],
  						key: token,
  						sep: []
  					});
  					else if (it.sep) it.value = token;
  					else Object.assign(it, {
  						key: token,
  						sep: []
  					});
  					return;
  				}
  				/* istanbul ignore next should not happen */
  				default:
  					yield* this.pop();
  					yield* this.pop(token);
  			}
  			if ((top.type === "document" || top.type === "block-map" || top.type === "block-seq") && (token.type === "block-map" || token.type === "block-seq")) {
  				const last = token.items[token.items.length - 1];
  				if (last && !last.sep && !last.value && last.start.length > 0 && findNonEmptyIndex(last.start) === -1 && (token.indent === 0 || last.start.every((st) => st.type !== "comment" || st.indent < token.indent))) {
  					if (top.type === "document") top.end = last.start;
  					else top.items.push({ start: last.start });
  					token.items.splice(-1, 1);
  				}
  			}
  		}
  	}
  	*stream() {
  		switch (this.type) {
  			case "directive-line":
  				yield {
  					type: "directive",
  					offset: this.offset,
  					source: this.source
  				};
  				return;
  			case "byte-order-mark":
  			case "space":
  			case "comment":
  			case "newline":
  				yield this.sourceToken;
  				return;
  			case "doc-mode":
  			case "doc-start": {
  				const doc = {
  					type: "document",
  					offset: this.offset,
  					start: []
  				};
  				if (this.type === "doc-start") doc.start.push(this.sourceToken);
  				this.stack.push(doc);
  				return;
  			}
  		}
  		yield {
  			type: "error",
  			offset: this.offset,
  			message: `Unexpected ${this.type} token in YAML stream`,
  			source: this.source
  		};
  	}
  	*document(doc) {
  		if (doc.value) return yield* this.lineEnd(doc);
  		switch (this.type) {
  			case "doc-start":
  				if (findNonEmptyIndex(doc.start) !== -1) {
  					yield* this.pop();
  					yield* this.step();
  				} else doc.start.push(this.sourceToken);
  				return;
  			case "anchor":
  			case "tag":
  			case "space":
  			case "comment":
  			case "newline":
  				doc.start.push(this.sourceToken);
  				return;
  		}
  		const bv = this.startBlockValue(doc);
  		if (bv) this.stack.push(bv);
  		else yield {
  			type: "error",
  			offset: this.offset,
  			message: `Unexpected ${this.type} token in YAML document`,
  			source: this.source
  		};
  	}
  	*scalar(scalar) {
  		if (this.type === "map-value-ind") {
  			const start = getFirstKeyStartProps(getPrevProps(this.peek(2)));
  			let sep;
  			if (scalar.end) {
  				sep = scalar.end;
  				sep.push(this.sourceToken);
  				delete scalar.end;
  			} else sep = [this.sourceToken];
  			const map = {
  				type: "block-map",
  				offset: scalar.offset,
  				indent: scalar.indent,
  				items: [{
  					start,
  					key: scalar,
  					sep
  				}]
  			};
  			this.onKeyLine = true;
  			this.stack[this.stack.length - 1] = map;
  		} else yield* this.lineEnd(scalar);
  	}
  	*blockScalar(scalar) {
  		switch (this.type) {
  			case "space":
  			case "comment":
  			case "newline":
  				scalar.props.push(this.sourceToken);
  				return;
  			case "scalar":
  				scalar.source = this.source;
  				this.atNewLine = true;
  				this.indent = 0;
  				if (this.onNewLine) {
  					let nl = this.source.indexOf("\n") + 1;
  					while (nl !== 0) {
  						this.onNewLine(this.offset + nl);
  						nl = this.source.indexOf("\n", nl) + 1;
  					}
  				}
  				yield* this.pop();
  				break;
  			/* istanbul ignore next should not happen */
  			default:
  				yield* this.pop();
  				yield* this.step();
  		}
  	}
  	*blockMap(map) {
  		const it = map.items[map.items.length - 1];
  		switch (this.type) {
  			case "newline":
  				this.onKeyLine = false;
  				if (it.value) {
  					const end = "end" in it.value ? it.value.end : void 0;
  					if ((Array.isArray(end) ? end[end.length - 1] : void 0)?.type === "comment") end?.push(this.sourceToken);
  					else map.items.push({ start: [this.sourceToken] });
  				} else if (it.sep) it.sep.push(this.sourceToken);
  				else it.start.push(this.sourceToken);
  				return;
  			case "space":
  			case "comment":
  				if (it.value) map.items.push({ start: [this.sourceToken] });
  				else if (it.sep) it.sep.push(this.sourceToken);
  				else {
  					if (this.atIndentedComment(it.start, map.indent)) {
  						const end = map.items[map.items.length - 2]?.value?.end;
  						if (Array.isArray(end)) {
  							arrayPushArray(end, it.start);
  							end.push(this.sourceToken);
  							map.items.pop();
  							return;
  						}
  					}
  					it.start.push(this.sourceToken);
  				}
  				return;
  		}
  		if (this.indent >= map.indent) {
  			const atMapIndent = !this.onKeyLine && this.indent === map.indent;
  			const atNextItem = atMapIndent && (it.sep || it.explicitKey) && this.type !== "seq-item-ind";
  			let start = [];
  			if (atNextItem && it.sep && !it.value) {
  				const nl = [];
  				for (let i = 0; i < it.sep.length; ++i) {
  					const st = it.sep[i];
  					switch (st.type) {
  						case "newline":
  							nl.push(i);
  							break;
  						case "space": break;
  						case "comment":
  							if (st.indent > map.indent) nl.length = 0;
  							break;
  						default: nl.length = 0;
  					}
  				}
  				if (nl.length >= 2) start = it.sep.splice(nl[1]);
  			}
  			switch (this.type) {
  				case "anchor":
  				case "tag":
  					if (atNextItem || it.value) {
  						start.push(this.sourceToken);
  						map.items.push({ start });
  						this.onKeyLine = true;
  					} else if (it.sep) it.sep.push(this.sourceToken);
  					else it.start.push(this.sourceToken);
  					return;
  				case "explicit-key-ind":
  					if (!it.sep && !it.explicitKey) {
  						it.start.push(this.sourceToken);
  						it.explicitKey = true;
  					} else if (atNextItem || it.value) {
  						start.push(this.sourceToken);
  						map.items.push({
  							start,
  							explicitKey: true
  						});
  					} else this.stack.push({
  						type: "block-map",
  						offset: this.offset,
  						indent: this.indent,
  						items: [{
  							start: [this.sourceToken],
  							explicitKey: true
  						}]
  					});
  					this.onKeyLine = true;
  					return;
  				case "map-value-ind":
  					if (it.explicitKey) {
  						if (!it.sep) {
  							if (includesToken(it.start, "newline")) Object.assign(it, {
  								key: null,
  								sep: [this.sourceToken]
  							});
  							else {
  								const start = getFirstKeyStartProps(it.start);
  								this.stack.push({
  									type: "block-map",
  									offset: this.offset,
  									indent: this.indent,
  									items: [{
  										start,
  										key: null,
  										sep: [this.sourceToken]
  									}]
  								});
  							}
  						} else if (it.value) map.items.push({
  							start: [],
  							key: null,
  							sep: [this.sourceToken]
  						});
  						else if (includesToken(it.sep, "map-value-ind")) this.stack.push({
  							type: "block-map",
  							offset: this.offset,
  							indent: this.indent,
  							items: [{
  								start,
  								key: null,
  								sep: [this.sourceToken]
  							}]
  						});
  						else if (isFlowToken(it.key) && !includesToken(it.sep, "newline")) {
  							const start = getFirstKeyStartProps(it.start);
  							const key = it.key;
  							const sep = it.sep;
  							sep.push(this.sourceToken);
  							delete it.key;
  							delete it.sep;
  							this.stack.push({
  								type: "block-map",
  								offset: this.offset,
  								indent: this.indent,
  								items: [{
  									start,
  									key,
  									sep
  								}]
  							});
  						} else if (start.length > 0) it.sep = it.sep.concat(start, this.sourceToken);
  						else it.sep.push(this.sourceToken);
  					} else if (!it.sep) Object.assign(it, {
  						key: null,
  						sep: [this.sourceToken]
  					});
  					else if (it.value || atNextItem) map.items.push({
  						start,
  						key: null,
  						sep: [this.sourceToken]
  					});
  					else if (includesToken(it.sep, "map-value-ind")) this.stack.push({
  						type: "block-map",
  						offset: this.offset,
  						indent: this.indent,
  						items: [{
  							start: [],
  							key: null,
  							sep: [this.sourceToken]
  						}]
  					});
  					else it.sep.push(this.sourceToken);
  					this.onKeyLine = true;
  					return;
  				case "alias":
  				case "scalar":
  				case "single-quoted-scalar":
  				case "double-quoted-scalar": {
  					const fs = this.flowScalar(this.type);
  					if (atNextItem || it.value) {
  						map.items.push({
  							start,
  							key: fs,
  							sep: []
  						});
  						this.onKeyLine = true;
  					} else if (it.sep) this.stack.push(fs);
  					else {
  						Object.assign(it, {
  							key: fs,
  							sep: []
  						});
  						this.onKeyLine = true;
  					}
  					return;
  				}
  				default: {
  					const bv = this.startBlockValue(map);
  					if (bv) {
  						if (bv.type === "block-seq") {
  							if (!it.explicitKey && it.sep && !includesToken(it.sep, "newline")) {
  								yield* this.pop({
  									type: "error",
  									offset: this.offset,
  									message: "Unexpected block-seq-ind on same line with key",
  									source: this.source
  								});
  								return;
  							}
  						} else if (atMapIndent) map.items.push({ start });
  						this.stack.push(bv);
  						return;
  					}
  				}
  			}
  		}
  		yield* this.pop();
  		yield* this.step();
  	}
  	*blockSequence(seq) {
  		const it = seq.items[seq.items.length - 1];
  		switch (this.type) {
  			case "newline":
  				if (it.value) {
  					const end = "end" in it.value ? it.value.end : void 0;
  					if ((Array.isArray(end) ? end[end.length - 1] : void 0)?.type === "comment") end?.push(this.sourceToken);
  					else seq.items.push({ start: [this.sourceToken] });
  				} else it.start.push(this.sourceToken);
  				return;
  			case "space":
  			case "comment":
  				if (it.value) seq.items.push({ start: [this.sourceToken] });
  				else {
  					if (this.atIndentedComment(it.start, seq.indent)) {
  						const end = seq.items[seq.items.length - 2]?.value?.end;
  						if (Array.isArray(end)) {
  							arrayPushArray(end, it.start);
  							end.push(this.sourceToken);
  							seq.items.pop();
  							return;
  						}
  					}
  					it.start.push(this.sourceToken);
  				}
  				return;
  			case "anchor":
  			case "tag":
  				if (it.value || this.indent <= seq.indent) break;
  				it.start.push(this.sourceToken);
  				return;
  			case "seq-item-ind":
  				if (this.indent !== seq.indent) break;
  				if (it.value || includesToken(it.start, "seq-item-ind")) seq.items.push({ start: [this.sourceToken] });
  				else it.start.push(this.sourceToken);
  				return;
  		}
  		if (this.indent > seq.indent) {
  			const bv = this.startBlockValue(seq);
  			if (bv) {
  				this.stack.push(bv);
  				return;
  			}
  		}
  		yield* this.pop();
  		yield* this.step();
  	}
  	*flowCollection(fc) {
  		const it = fc.items[fc.items.length - 1];
  		if (this.type === "flow-error-end") {
  			let top;
  			do {
  				yield* this.pop();
  				top = this.peek(1);
  			} while (top?.type === "flow-collection");
  		} else if (fc.end.length === 0) {
  			switch (this.type) {
  				case "comma":
  				case "explicit-key-ind":
  					if (!it || it.sep) fc.items.push({ start: [this.sourceToken] });
  					else it.start.push(this.sourceToken);
  					return;
  				case "map-value-ind":
  					if (!it || it.value) fc.items.push({
  						start: [],
  						key: null,
  						sep: [this.sourceToken]
  					});
  					else if (it.sep) it.sep.push(this.sourceToken);
  					else Object.assign(it, {
  						key: null,
  						sep: [this.sourceToken]
  					});
  					return;
  				case "space":
  				case "comment":
  				case "newline":
  				case "anchor":
  				case "tag":
  					if (!it || it.value) fc.items.push({ start: [this.sourceToken] });
  					else if (it.sep) it.sep.push(this.sourceToken);
  					else it.start.push(this.sourceToken);
  					return;
  				case "alias":
  				case "scalar":
  				case "single-quoted-scalar":
  				case "double-quoted-scalar": {
  					const fs = this.flowScalar(this.type);
  					if (!it || it.value) fc.items.push({
  						start: [],
  						key: fs,
  						sep: []
  					});
  					else if (it.sep) this.stack.push(fs);
  					else Object.assign(it, {
  						key: fs,
  						sep: []
  					});
  					return;
  				}
  				case "flow-map-end":
  				case "flow-seq-end":
  					fc.end.push(this.sourceToken);
  					return;
  			}
  			const bv = this.startBlockValue(fc);
  			/* istanbul ignore else should not happen */
  			if (bv) this.stack.push(bv);
  			else {
  				yield* this.pop();
  				yield* this.step();
  			}
  		} else {
  			const parent = this.peek(2);
  			if (parent.type === "block-map" && (this.type === "map-value-ind" && parent.indent === fc.indent || this.type === "newline" && !parent.items[parent.items.length - 1].sep)) {
  				yield* this.pop();
  				yield* this.step();
  			} else if (this.type === "map-value-ind" && parent.type !== "flow-collection") {
  				const start = getFirstKeyStartProps(getPrevProps(parent));
  				fixFlowSeqItems(fc);
  				const sep = fc.end.splice(1, fc.end.length);
  				sep.push(this.sourceToken);
  				const map = {
  					type: "block-map",
  					offset: fc.offset,
  					indent: fc.indent,
  					items: [{
  						start,
  						key: fc,
  						sep
  					}]
  				};
  				this.onKeyLine = true;
  				this.stack[this.stack.length - 1] = map;
  			} else yield* this.lineEnd(fc);
  		}
  	}
  	flowScalar(type) {
  		if (this.onNewLine) {
  			let nl = this.source.indexOf("\n") + 1;
  			while (nl !== 0) {
  				this.onNewLine(this.offset + nl);
  				nl = this.source.indexOf("\n", nl) + 1;
  			}
  		}
  		return {
  			type,
  			offset: this.offset,
  			indent: this.indent,
  			source: this.source
  		};
  	}
  	startBlockValue(parent) {
  		switch (this.type) {
  			case "alias":
  			case "scalar":
  			case "single-quoted-scalar":
  			case "double-quoted-scalar": return this.flowScalar(this.type);
  			case "block-scalar-header": return {
  				type: "block-scalar",
  				offset: this.offset,
  				indent: this.indent,
  				props: [this.sourceToken],
  				source: ""
  			};
  			case "flow-map-start":
  			case "flow-seq-start": return {
  				type: "flow-collection",
  				offset: this.offset,
  				indent: this.indent,
  				start: this.sourceToken,
  				items: [],
  				end: []
  			};
  			case "seq-item-ind": return {
  				type: "block-seq",
  				offset: this.offset,
  				indent: this.indent,
  				items: [{ start: [this.sourceToken] }]
  			};
  			case "explicit-key-ind": {
  				this.onKeyLine = true;
  				const start = getFirstKeyStartProps(getPrevProps(parent));
  				start.push(this.sourceToken);
  				return {
  					type: "block-map",
  					offset: this.offset,
  					indent: this.indent,
  					items: [{
  						start,
  						explicitKey: true
  					}]
  				};
  			}
  			case "map-value-ind": {
  				this.onKeyLine = true;
  				const start = getFirstKeyStartProps(getPrevProps(parent));
  				return {
  					type: "block-map",
  					offset: this.offset,
  					indent: this.indent,
  					items: [{
  						start,
  						key: null,
  						sep: [this.sourceToken]
  					}]
  				};
  			}
  		}
  		return null;
  	}
  	atIndentedComment(start, indent) {
  		if (this.type !== "comment") return false;
  		if (this.indent <= indent) return false;
  		return start.every((st) => st.type === "newline" || st.type === "space");
  	}
  	*documentEnd(docEnd) {
  		if (this.type !== "doc-mode") {
  			if (docEnd.end) docEnd.end.push(this.sourceToken);
  			else docEnd.end = [this.sourceToken];
  			if (this.type === "newline") yield* this.pop();
  		}
  	}
  	*lineEnd(token) {
  		switch (this.type) {
  			case "comma":
  			case "doc-start":
  			case "doc-end":
  			case "flow-seq-end":
  			case "flow-map-end":
  			case "map-value-ind":
  				yield* this.pop();
  				yield* this.step();
  				break;
  			case "newline": this.onKeyLine = false;
  			default:
  				if (token.end) token.end.push(this.sourceToken);
  				else token.end = [this.sourceToken];
  				if (this.type === "newline") yield* this.pop();
  		}
  	}
  };
  function parseOptions(options) {
  	const prettyErrors = options.prettyErrors !== false;
  	return {
  		lineCounter: options.lineCounter || prettyErrors && new LineCounter() || null,
  		prettyErrors
  	};
  }
  /** Parse an input string into a single YAML.Document */
  function parseDocument(source, options = {}) {
  	const { lineCounter, prettyErrors } = parseOptions(options);
  	const parser = new Parser(lineCounter?.addNewLine);
  	const composer = new Composer(options);
  	let doc = null;
  	for (const _doc of composer.compose(parser.parse(source), true, source.length)) if (!doc) doc = _doc;
  	else if (doc.options.logLevel !== "silent") {
  		doc.errors.push(new YAMLParseError(_doc.range.slice(0, 2), "MULTIPLE_DOCS", "Source contains multiple documents; please use YAML.parseAllDocuments()"));
  		break;
  	}
  	if (prettyErrors && lineCounter) {
  		doc.errors.forEach(prettifyError(source, lineCounter));
  		doc.warnings.forEach(prettifyError(source, lineCounter));
  	}
  	return doc;
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
  				"INDEX_OUT_OF_RANGE"
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
  				"INDEX_OUT_OF_RANGE"
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
  		}
  	]
  };
  var NAMED_DATA_REGISTRY_SYMBOL_KEY = "@kubohiroya/turbowarp-named-data/registry";
  var NAMED_DATA_REGISTRY_SYMBOL = Symbol.for(NAMED_DATA_REGISTRY_SYMBOL_KEY);
  var NAMED_DATA_NAMESPACE_PATTERN = /^[a-z][a-z0-9.-]{0,63}$/u;
  function isNamedDataNamespace(value) {
  	return typeof value === "string" && NAMED_DATA_NAMESPACE_PATTERN.test(value);
  }
  var NAMED_DATA_KINDS = [
  	"structured",
  	"document",
  	"binary",
  	"asset"
  ];
  var NAMED_DATA_SCOPES = ["target", "project"];
  var NAMED_DATA_REPRESENTATIONS = [
  	"json",
  	"yaml",
  	"html",
  	"markdown",
  	"raw"
  ];
  var NAMED_DATA_SCHEMA_ID_PATTERN = /^[a-z][a-z0-9.-]{0,127}$/u;
  var NAMED_DATA_SCHEMA_VERSION_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/u;
  var NAMED_DATA_ERROR_CODES = [
  	"NAMED_DATA_INVALID_REF",
  	"NAMED_DATA_INVALID_REGISTRY",
  	"NAMED_DATA_PROVIDER_CONFLICT",
  	"NAMED_DATA_PROVIDER_NOT_FOUND",
  	"NAMED_DATA_NOT_FOUND",
  	"NAMED_DATA_KIND_MISMATCH",
  	"NAMED_DATA_SCOPE_MISMATCH",
  	"NAMED_DATA_SCHEMA_NOT_FOUND",
  	"NAMED_DATA_SCHEMA_VERSION_MISMATCH",
  	"NAMED_DATA_SCHEMA_UNRESOLVED",
  	"NAMED_DATA_REPRESENTATION_UNSUPPORTED",
  	"NAMED_DATA_INVALID_METADATA",
  	"NAMED_DATA_BODY_TOO_LARGE",
  	"NAMED_DATA_ABORTED",
  	"NAMED_DATA_PROVIDER_RELEASED"
  ];
  var NamedDataError = class extends Error {
  	constructor(code, message, options) {
  		super(`${code}: ${message}`, options);
  		this.code = code;
  		this.name = "NamedDataError";
  	}
  };
  var LIFECYCLE_SYMBOL = Symbol.for("@kubohiroya/turbowarp-named-data/lifecycle");
  var errorCodes = new Set(NAMED_DATA_ERROR_CODES);
  var NamedDataRegistry = class {
  	constructor() {
  		this.providers = /* @__PURE__ */ new Map();
  		this.handles = /* @__PURE__ */ new Set();
  	}
  	registerProvider(provider, options = {}) {
  		requireNamespace(provider.namespace);
  		if (!NAMED_DATA_KINDS.includes(provider.kind)) throw new NamedDataError("NAMED_DATA_INVALID_REF", `Unknown provider kind: ${provider.kind}`);
  		const key = providerKey(provider.namespace, provider.kind);
  		if (this.providers.has(key)) throw new NamedDataError("NAMED_DATA_PROVIDER_CONFLICT", `Provider is already registered: ${provider.namespace}/${provider.kind}`);
  		const entry = {
  			provider,
  			lifetime: options.lifetime ?? "session"
  		};
  		this.providers.set(key, entry);
  		let active = true;
  		return {
  			namespace: provider.namespace,
  			kind: provider.kind,
  			unregister: async () => {
  				if (!active) return;
  				active = false;
  				if (this.providers.get(key) === entry) {
  					this.providers.delete(key);
  					await this.releaseHandlesForProvider(provider.namespace, provider.kind);
  					await provider.release("shutdown");
  				}
  			}
  		};
  	}
  	canResolve(reference, representation) {
  		try {
  			validateReferenceShape(reference, representation);
  			return (this.providers.get(providerKey(reference.namespace, reference.kind))?.provider)?.canResolve(reference, representation) ?? false;
  		} catch {
  			return false;
  		}
  	}
  	async stat(reference, representation, context = {}) {
  		const provider = this.resolveProvider(reference, representation, context);
  		throwIfAborted(context.signal);
  		try {
  			const metadata = await provider.stat(reference, representation, context);
  			throwIfAborted(context.signal);
  			validateMetadata(metadata, reference, representation);
  			return metadata;
  		} catch (error) {
  			throw normalizeProviderError(error);
  		}
  	}
  	async openBody(reference, representation, context = {}) {
  		const provider = this.resolveProvider(reference, representation, context);
  		throwIfAborted(context.signal);
  		let opened;
  		try {
  			opened = await provider.openBody(reference, representation, context);
  			validateMetadata(opened, reference, representation);
  			if (!(opened.body instanceof Uint8Array) && !(opened.body instanceof ReadableStream)) throw new NamedDataError("NAMED_DATA_INVALID_METADATA", "Provider returned an invalid body.");
  		} catch (error) {
  			throw normalizeProviderError(error);
  		}
  		if (context.signal?.aborted) {
  			await opened.release("abort");
  			throw abortedError();
  		}
  		let released = false;
  		let abortListener;
  		const tracked = {
  			namespace: reference.namespace,
  			kind: reference.kind,
  			release: async (reason = "complete") => {
  				if (released) return;
  				released = true;
  				if (abortListener && context.signal) context.signal.removeEventListener("abort", abortListener);
  				this.handles.delete(tracked);
  				await opened.release(reason);
  			}
  		};
  		this.handles.add(tracked);
  		if (context.signal) {
  			abortListener = () => {
  				Promise.resolve(tracked.release("abort")).catch(() => void 0);
  			};
  			context.signal.addEventListener("abort", abortListener, { once: true });
  			if (context.signal.aborted) {
  				await tracked.release("abort");
  				throw abortedError();
  			}
  		}
  		return Object.freeze({
  			reference: Object.freeze({ ...opened.reference }),
  			nativeRepresentation: opened.nativeRepresentation,
  			representation: opened.representation,
  			mediaType: opened.mediaType,
  			...opened.byteLength === void 0 ? {} : { byteLength: opened.byteLength },
  			...opened.digest === void 0 ? {} : { digest: opened.digest },
  			revision: opened.revision,
  			replayable: opened.replayable,
  			body: opened.body,
  			release: tracked.release
  		});
  	}
  	async clearSession() {
  		const handles = [...this.handles];
  		this.handles.clear();
  		await Promise.allSettled(handles.map((handle) => handle.release("shutdown")));
  		const sessionEntries = [...this.providers.entries()].filter(([, entry]) => entry.lifetime === "session");
  		for (const [namespace] of sessionEntries) this.providers.delete(namespace);
  		await Promise.allSettled(sessionEntries.map(([, entry]) => entry.provider.release("shutdown")));
  		await Promise.allSettled([...this.providers.values()].map((entry) => entry.provider.clearSession?.()));
  	}
  	resolveProvider(reference, representation, context) {
  		validateReference(reference, representation, context);
  		const provider = this.providers.get(providerKey(reference.namespace, reference.kind))?.provider;
  		if (!provider) {
  			const hasNamespace = [...this.providers.values()].some((entry) => entry.provider.namespace === reference.namespace);
  			throw new NamedDataError(hasNamespace ? "NAMED_DATA_KIND_MISMATCH" : "NAMED_DATA_PROVIDER_NOT_FOUND", hasNamespace ? `No provider for kind ${reference.kind} is registered in namespace ${reference.namespace}.` : `No provider can resolve namespace: ${reference.namespace}`);
  		}
  		if (!provider.canResolve(reference, representation)) throw new NamedDataError("NAMED_DATA_REPRESENTATION_UNSUPPORTED", `Provider ${reference.namespace} does not support representation: ${representation}`);
  		return provider;
  	}
  	async releaseHandlesForProvider(namespace, kind) {
  		const handles = [...this.handles].filter((handle) => handle.namespace === namespace && handle.kind === kind);
  		await Promise.allSettled(handles.map((handle) => handle.release("shutdown")));
  	}
  };
  function installNamedDataRegistry(runtime) {
  	const host = runtime;
  	const existing = host[NAMED_DATA_REGISTRY_SYMBOL];
  	if (existing !== void 0) return requireCompatibleRegistry(existing);
  	const registry = new NamedDataRegistry();
  	Object.defineProperty(host, NAMED_DATA_REGISTRY_SYMBOL, {
  		configurable: true,
  		enumerable: false,
  		writable: false,
  		value: registry
  	});
  	return registry;
  }
  function bindNamedDataRegistryLifecycle(runtime, registry) {
  	const host = runtime;
  	const existing = host[LIFECYCLE_SYMBOL];
  	if (existing !== void 0) {
  		if (!isLifecycleBinding(existing) || existing.registry !== registry) throw new NamedDataError("NAMED_DATA_INVALID_REGISTRY", "Runtime already has a lifecycle binding for a different registry.");
  		existing.references += 1;
  		return lifecycleUnbind(runtime, host, existing);
  	}
  	const listener = () => {
  		registry.clearSession();
  	};
  	runtime.on("PROJECT_STOP_ALL", listener);
  	const binding = {
  		registry,
  		listener,
  		references: 1
  	};
  	Object.defineProperty(host, LIFECYCLE_SYMBOL, {
  		configurable: true,
  		enumerable: false,
  		writable: false,
  		value: binding
  	});
  	return lifecycleUnbind(runtime, host, binding);
  }
  function isLifecycleBinding(value) {
  	if (typeof value !== "object" || value === null) return false;
  	const candidate = value;
  	return isCompatibleRegistry(candidate.registry) && typeof candidate.listener === "function" && Number.isSafeInteger(candidate.references) && (candidate.references ?? -1) >= 0;
  }
  function lifecycleUnbind(runtime, host, binding) {
  	let active = true;
  	return () => {
  		if (!active || host[LIFECYCLE_SYMBOL] !== binding) return;
  		active = false;
  		binding.references -= 1;
  		if (binding.references > 0) return;
  		if (runtime.off) {
  			runtime.off("PROJECT_STOP_ALL", binding.listener);
  			delete host[LIFECYCLE_SYMBOL];
  		}
  	};
  }
  function requireCompatibleRegistry(value) {
  	if (isCompatibleRegistry(value)) return value;
  	throw new NamedDataError("NAMED_DATA_INVALID_REGISTRY", `Runtime slot ${NAMED_DATA_REGISTRY_SYMBOL_KEY} contains an invalid registry.`);
  }
  function isCompatibleRegistry(value) {
  	if (typeof value !== "object" || value === null) return false;
  	try {
  		const candidate = value;
  		return typeof candidate.registerProvider === "function" && typeof candidate.canResolve === "function" && typeof candidate.stat === "function" && typeof candidate.openBody === "function" && typeof candidate.clearSession === "function";
  	} catch {
  		return false;
  	}
  }
  function validateReference(reference, representation, context) {
  	validateReferenceShape(reference, representation);
  	if (reference.scope === "target" && context.target === void 0) throw new NamedDataError("NAMED_DATA_SCOPE_MISMATCH", "Target scope requires target context.");
  	if (reference.scope === "project" && context.project === void 0) throw new NamedDataError("NAMED_DATA_SCOPE_MISMATCH", "Project scope requires project context.");
  	throwIfAborted(context.signal);
  }
  function validateReferenceShape(reference, representation) {
  	if (!reference || typeof reference !== "object") throw invalidReference();
  	requireNamespace(reference.namespace);
  	if (typeof reference.name !== "string" || reference.name.length === 0 || reference.name.length > 256 || containsControlCharacter(reference.name) || !NAMED_DATA_KINDS.includes(reference.kind) || !NAMED_DATA_SCOPES.includes(reference.scope) || !NAMED_DATA_REPRESENTATIONS.includes(representation)) throw invalidReference();
  	if (reference.schemaRef !== void 0) validateSchemaRef(reference.kind, reference.schemaRef);
  }
  function validateMetadata(metadata, reference, representation) {
  	if (metadata.representation !== representation || !isNativeRepresentation(metadata.reference.kind, metadata.nativeRepresentation) || metadata.reference.namespace !== reference.namespace || metadata.reference.name !== reference.name || metadata.reference.kind !== reference.kind || metadata.reference.scope !== reference.scope || typeof metadata.mediaType !== "string" || metadata.mediaType.length === 0 || typeof metadata.revision !== "string" || metadata.revision.length === 0 || typeof metadata.replayable !== "boolean" || metadata.byteLength !== void 0 && (!Number.isSafeInteger(metadata.byteLength) || metadata.byteLength < 0) || metadata.digest !== void 0 && !/^sha256-[A-Za-z0-9_-]+$/u.test(metadata.digest)) throw new NamedDataError("NAMED_DATA_INVALID_METADATA", "Provider returned invalid metadata.");
  	const expectedSchema = reference.schemaRef;
  	const actualSchema = metadata.schemaRef;
  	if (actualSchema !== void 0) validateSchemaRef(metadata.reference.kind, actualSchema, "NAMED_DATA_INVALID_METADATA");
  	if (metadata.reference.schemaRef !== void 0) validateSchemaRef(metadata.reference.kind, metadata.reference.schemaRef, "NAMED_DATA_INVALID_METADATA");
  	if (!sameSchemaRef(expectedSchema, actualSchema) || !sameSchemaRef(expectedSchema, metadata.reference.schemaRef)) throw new NamedDataError("NAMED_DATA_SCHEMA_VERSION_MISMATCH", "Provider schemaRef does not match the requested reference.");
  }
  function validateSchemaRef(kind, schemaRef, errorCode = "NAMED_DATA_INVALID_REF") {
  	if (kind !== "structured" || typeof schemaRef !== "object" || schemaRef === null || !NAMED_DATA_SCHEMA_ID_PATTERN.test(String(schemaRef.id ?? "")) || !NAMED_DATA_SCHEMA_VERSION_PATTERN.test(String(schemaRef.version ?? "")) || Object.keys(schemaRef).some((key) => key !== "id" && key !== "version")) throw new NamedDataError(errorCode, "Invalid schemaRef; schema references require a structured value, stable id, and full SemVer version.");
  }
  function sameSchemaRef(left, right) {
  	return left === void 0 ? right === void 0 : right !== void 0 && left.id === right.id && left.version === right.version;
  }
  function isNativeRepresentation(kind, representation) {
  	if (kind === "structured") return representation === "json" || representation === "yaml";
  	if (kind === "document") return representation === "html" || representation === "markdown";
  	return representation === "raw";
  }
  function requireNamespace(namespace) {
  	if (!isNamedDataNamespace(namespace)) throw invalidReference("Invalid namespace.");
  }
  function providerKey(namespace, kind) {
  	return `${namespace}\0${kind}`;
  }
  function containsControlCharacter(value) {
  	return [...value].some((character) => {
  		const code = character.codePointAt(0) ?? 0;
  		return code <= 31 || code === 127;
  	});
  }
  function invalidReference(message = "Invalid named-data reference.") {
  	return new NamedDataError("NAMED_DATA_INVALID_REF", message);
  }
  function throwIfAborted(signal) {
  	if (signal?.aborted) throw abortedError();
  }
  function abortedError() {
  	return new NamedDataError("NAMED_DATA_ABORTED", "Named-data operation was aborted.");
  }
  function normalizeProviderError(error) {
  	if (error instanceof NamedDataError) return error;
  	if (error instanceof Error && "code" in error && typeof error.code === "string" && errorCodes.has(error.code)) return new NamedDataError(error.code, error.message, { cause: error });
  	return new NamedDataError("NAMED_DATA_PROVIDER_RELEASED", "Provider operation failed.", { cause: error });
  }
  function configuredFlag(name) {
  	const value = globalThis.__TW_NAMED_DATA_FEATURE_FLAGS__?.[name];
  	return value === true || value === "true";
  }
  Object.freeze({
  	NAMED_DATA_REGISTRY_MVP: configuredFlag("NAMED_DATA_REGISTRY_MVP"),
  	NAMED_DATA_SCHEMA_REF: configuredFlag("NAMED_DATA_SCHEMA_REF")
  });
  var STRUCTURED_DATA_NAMESPACE = "structured";
  var STRUCTURED_BODY_MAX_BYTES = 262144;
  var StructuredDataNamedDataProvider = class {
  	constructor(store, maxBodyBytes = STRUCTURED_BODY_MAX_BYTES) {
  		this.store = store;
  		this.maxBodyBytes = maxBodyBytes;
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
  		return this.metadata(reference, resolved.nativeRepresentation, representation, resolved.bytes.byteLength, resolved.revision);
  	}
  	openBody(reference, representation, context) {
  		const resolved = this.resolve(reference, representation, context);
  		const handle = Symbol("structured-body");
  		this.openBodies.add(handle);
  		let released = false;
  		return {
  			...this.metadata(reference, resolved.nativeRepresentation, representation, resolved.bytes.byteLength, resolved.revision),
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
  		const text = this.render(binding.value, representation);
  		const bytes = new TextEncoder().encode(text);
  		if (bytes.byteLength > this.maxBodyBytes) throw new NamedDataError("NAMED_DATA_BODY_TOO_LARGE", `Encoded body is ${bytes.byteLength} bytes; maximum is ${this.maxBodyBytes}.`);
  		this.throwIfAborted(context.signal);
  		return {
  			bytes,
  			revision: binding.revision,
  			nativeRepresentation: binding.nativeRepresentation
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
  	metadata(reference, nativeRepresentation, representation, byteLength, revision) {
  		return {
  			reference: { ...reference },
  			nativeRepresentation,
  			representation,
  			mediaType: representation === "json" ? "application/json; charset=utf-8" : "application/yaml; charset=utf-8",
  			byteLength,
  			revision: String(revision),
  			replayable: true
  		};
  	}
  	throwIfAborted(signal) {
  		if (signal?.aborted) throw new NamedDataError("NAMED_DATA_ABORTED", "Body resolution was aborted.");
  	}
  };
  var LOOP_STATE = "structuredDataLoopState";
  var blockDefinitions = block_definitions_default.blocks;
  var StructuredDataExtension = class {
  	constructor(enabled = isStructuredDataMvpEnabled(), namedDataEnabled = isNamedDataRegistryMvpEnabled()) {
  		this.disposed = false;
  		this.registries = /* @__PURE__ */ new WeakMap();
  		this.iterationStacks = /* @__PURE__ */ new WeakMap();
  		this.nextRevision = 1;
  		this.enabled = enabled;
  		this.unregisterSourceEditors = registerSourceEditors(Scratch, enabled ? sourceEditorDefinitions : []);
  		const runtime = Scratch.vm?.runtime;
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
  			unregisterFixed = registerFixedInputEditors(Scratch, enabled ? fixedInputEditorDefinitions : []);
  			this.unregisterFixedInputEditors = unregisterFixed;
  			if (namedDataEnabled) {
  				this.namedDataProvider = new StructuredDataNamedDataProvider({ get: (target, name) => this.registries.get(target)?.get(name) });
  				const runtime = Scratch.vm?.runtime;
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
  			name: Scratch.translate(block_definitions_default.extensionName),
  			docsURI: extensionConfig.docsURI,
  			blockIconURI: extensionConfig.blockIconURI,
  			blocks: this.enabled ? blockDefinitions.map((block) => this.toScratchBlock(block)) : []
  		};
  	}
  	parseJson(args, util) {
  		this.store(util.target, args.NAME, parseJsonDocument(Scratch.Cast.toString(args.TEXT)), "json");
  	}
  	parseYaml(args, util) {
  		this.store(util.target, args.NAME, parseYamlDocument(Scratch.Cast.toString(args.TEXT)), "yaml");
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
  		const updated = setAtPath(this.requireDataByName(util.target, name), this.path(args.PATH), parseJson(Scratch.Cast.toString(args.VALUE)));
  		this.setBinding(util.target, name, updated);
  	}
  	deleteAtPath(args, util) {
  		const name = this.name(args.NAME);
  		const updated = deleteAtPath(this.requireDataByName(util.target, name), this.path(args.PATH));
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
  				entries: iterationEntries(this.requireData(util.target, args.NAME), this.path(args.PATH), Scratch.Cast.toNumber(args.MAX)),
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
  	setBinding(target, name, value, nativeRepresentation) {
  		const registry = this.registryFor(target);
  		const retainedRepresentation = nativeRepresentation ?? registry.get(name)?.nativeRepresentation ?? "json";
  		registry.set(name, {
  			value,
  			revision: this.nextRevision,
  			nativeRepresentation: retainedRepresentation
  		});
  		this.nextRevision += 1;
  	}
  	name(value) {
  		const name = Scratch.Cast.toString(value).trim();
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
  		return parsePath(Scratch.Cast.toString(value));
  	}
  	clearRuntimeState() {
  		this.namedDataProvider?.clearSession();
  		this.registries = /* @__PURE__ */ new WeakMap();
  		this.iterationStacks = /* @__PURE__ */ new WeakMap();
  		this.nextRevision = 1;
  	}
  	toScratchBlock(block) {
  		return {
  			opcode: block.opcode,
  			blockType: Scratch.BlockType[block.blockType],
  			text: Scratch.translate(block.text),
  			arguments: Object.fromEntries(Object.entries(block.arguments).map(([name, argument]) => [name, {
  				type: Scratch.ArgumentType[argument.type],
  				defaultValue: argument.defaultValue
  			}]))
  		};
  	}
  };
  if (extensionConfig.unsandboxed && !Scratch.extensions.unsandboxed) throw new Error(`${extensionConfig.name} must run unsandboxed.`);
  Scratch.extensions.register(new StructuredDataExtension());

})(Scratch);
