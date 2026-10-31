import {isStructuredDocumentSourceEnabled, isStructuredDocumentTreeEnabled} from './config.js';
import {createDocumentSourceProjection, createReadonlySchemaResolver} from './document-source.js';
import {copyDocumentTree, parseDocumentTreePositions} from './document-tree.js';
import type {SourceDocumentRegistry} from '@kubohiroya/turbowarp-document-data/composition';
import type {ScratchApi, TurboWarpExtension, ScratchBlockUtility} from './runtime-api.js';
import {fixedInputEditorDefinitions, registerFixedInputEditors} from './fixed-input-editors.js';
import {sourceEditorDefinitions} from './editor-schema.js';
import {registerSourceEditors} from './source-editor.js';
import definitions from './block-definitions.json' with {type: 'json'};
import {
  bindNamedDataRegistryLifecycle,
  installNamedDataRegistry,
  type NamedDataProviderRegistration,
  type NamedDataRegistryService
} from '@kubohiroya/turbowarp-named-data/composition';
import {
  extensionConfig,
  isNamedDataRegistryMvpEnabled,
  isStructuredDataMvpEnabled,
  isStructuredSchemaEnabled
} from './config.js';
import {
  addDraftProperty,
  assertValueMatchesSchema,
  beginSchemaDraft,
  draftToSchemaDocument,
  parseAdditionalProperties,
  parseRequiredFlag,
  parseSchemaDocument,
  parseSchemaReference,
  schemaEntry,
  schemaKey,
  type SchemaDraft,
  type SchemaEntry,
  type SchemaReference
} from './schema.js';
import {
  parseJsonDocument,
  parseYamlDocument,
  renderJsonDocument,
  renderYamlDocument
} from './codecs.js';
import {
  deleteAtPath,
  getAtPath,
  hasAtPath,
  iterationEntries,
  keysAtPath,
  lengthAtPath,
  parseJson as parseJsonValue,
  parsePath,
  scalarToText,
  setAtPath,
  stringifyJson,
  StructuredDataError,
  type IterationEntry,
  type JsonValue
} from './core.js';
import {
  StructuredDataNamedDataProvider,
  type StructuredDataBinding
} from './structured-provider.js';

type BlockTypeName = 'COMMAND' | 'REPORTER' | 'BOOLEAN' | 'LOOP';
type ArgumentTypeName = 'STRING' | 'NUMBER';

interface DefinitionArgument {
  type: ArgumentTypeName;
  defaultValue: string | number;
  menu?: string;
}

interface MenuDefinition {
  acceptReporters: boolean;
  items: readonly string[];
}

interface BlockDefinition {
  opcode: string;
  blockType: BlockTypeName;
  text: string;
  description: string;
  arguments: Record<string, DefinitionArgument>;
}

interface NamedPathArguments {
  NAME: unknown;
  PATH: unknown;
}

interface LoopState {
  entries: IterationEntry[];
  cursor: number;
  active: boolean;
}

interface ActiveIteration extends IterationEntry {
  index: number;
}

const LOOP_STATE = 'structuredDataLoopState';
const blockDefinitions = definitions.blocks as readonly BlockDefinition[];
const menuDefinitions = definitions.menus as Readonly<Record<string, MenuDefinition>>;

/** Blocks that only appear while the startup-fixed schema flag is on. */
const SCHEMA_OPCODES: ReadonlySet<string> = new Set([
  'defineSchema',
  'beginSchema',
  'addSchemaProperty',
  'commitSchema',
  'hasSchema',
  'deleteSchema',
  'parseJsonWithSchema',
  'parseYamlWithSchema',
  'schemaOf'
]);

/** Blocks that only appear while the startup-fixed document tree flag is on. */
const DOCUMENT_TREE_OPCODES: ReadonlySet<string> = new Set(['copyDocumentTree']);

export class StructuredDataExtension implements TurboWarpExtension {
  private readonly enabled: boolean;
  private disposed = false;
  private readonly releaseRuntimeListeners: () => void;
  private readonly unregisterSourceEditors: () => void;
  private readonly unregisterFixedInputEditors: () => void;
  private readonly sourceProjections = new Set<ReturnType<typeof createDocumentSourceProjection>>();
  private registries = new WeakMap<object, Map<string, StructuredDataBinding>>();
  private schemaRegistries = new WeakMap<object, Map<string, SchemaEntry>>();
  private schemaDrafts = new WeakMap<object, SchemaDraft>();
  private iterationStacks = new WeakMap<object, ActiveIteration[]>();
  private nextRevision = 1;
  private readonly namedDataProvider?: StructuredDataNamedDataProvider;
  private readonly namedDataRegistry?: NamedDataRegistryService;
  private readonly namedDataRegistration?: NamedDataProviderRegistration;
  private readonly unbindNamedDataRegistryLifecycle?: () => void;

  public constructor(
    private readonly scratch: ScratchApi,
    enabled = isStructuredDataMvpEnabled(),
    namedDataEnabled = isNamedDataRegistryMvpEnabled(),
    private readonly schemaEnabled = isStructuredSchemaEnabled(),
    private readonly documentSourceEnabled = isStructuredDocumentSourceEnabled(),
    private readonly documentTreeEnabled = isStructuredDocumentTreeEnabled()
  ) {
    this.enabled = enabled;
    this.unregisterSourceEditors = registerSourceEditors(this.scratch, enabled ? sourceEditorDefinitions : []);
    const runtime = this.scratch.vm?.runtime;
    const onDispose = () => this.clearRuntimeState();
    const onStop = () => this.clearRuntimeState();
    this.releaseRuntimeListeners = () => {
      runtime?.off?.('RUNTIME_DISPOSED', onDispose);
      runtime?.off?.('PROJECT_STOP_ALL', onStop);
      runtime?.off?.('PROJECT_LOADED', onStop);
    };
    let unregisterFixed = () => {};
    try {
      unregisterFixed = registerFixedInputEditors(this.scratch, enabled ? fixedInputEditorDefinitions : []);
      this.unregisterFixedInputEditors = unregisterFixed;
    if (namedDataEnabled) {
      this.namedDataProvider = new StructuredDataNamedDataProvider({
        get: (target, name) => this.registries.get(target)?.get(name)
      });
      const runtime = this.scratch.vm?.runtime;
      if (runtime) {
        this.namedDataRegistry = installNamedDataRegistry(runtime);
        this.namedDataRegistration = this.namedDataRegistry.registerProvider(
          this.namedDataProvider,
          {lifetime: 'persistent'}
        );
        this.unbindNamedDataRegistryLifecycle = bindNamedDataRegistryLifecycle(
          runtime,
          this.namedDataRegistry
        );
        runtime.on?.('RUNTIME_DISPOSED', onDispose);
      }
    }
    if (this.documentSourceEnabled && !namedDataEnabled) runtime?.on?.('RUNTIME_DISPOSED', onDispose);
    if (this.documentSourceEnabled || namedDataEnabled) runtime?.on?.('PROJECT_LOADED', onStop);
    runtime?.on?.('PROJECT_STOP_ALL', onStop);
    } catch (error) {
      this.releaseRuntimeListeners();
      unregisterFixed();
      this.unregisterSourceEditors();
      this.unbindNamedDataRegistryLifecycle?.();
      void this.namedDataRegistration?.unregister().catch(() => {});
      throw error;
    }
  }

  /** Explicitly project preserved source into this extension's transient target bindings. */
  public createSourceProjection(documents: SourceDocumentRegistry) {
    if (this.disposed || !this.enabled || !this.documentSourceEnabled) throw new StructuredDataError('DATA_NOT_FOUND', 'Structured data is unavailable.');
    const projection = createDocumentSourceProjection({documents,
      publish: (target, name, value, format) => this.store(target, name, value, format)});
    this.sourceProjections.add(projection);
    return projection;
  }

  public getSchemaResolver(target: object) {
    this.requireSchemaSupport();
    return createReadonlySchemaResolver(reference => this.disposed ? undefined : this.schemaRegistries.get(target)?.get(schemaKey(reference)));
  }

  public getNamedDataProvider(): StructuredDataNamedDataProvider | undefined {
    return this.namedDataProvider;
  }

  public getNamedDataRegistry(): NamedDataRegistryService | undefined {
    return this.namedDataRegistry;
  }

  public async dispose(): Promise<void> {
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

  public getInfo(): Record<string, unknown> {
    const visible = this.enabled
      ? blockDefinitions.filter(
          (block) =>
            (this.schemaEnabled || !SCHEMA_OPCODES.has(block.opcode)) &&
            (this.documentTreeEnabled || !DOCUMENT_TREE_OPCODES.has(block.opcode))
        )
      : [];
    const menuIds = new Set(
      visible.flatMap((block) => Object.values(block.arguments).flatMap((argument) => argument.menu ?? []))
    );
    return {
      id: extensionConfig.id,
      name: this.scratch.translate(definitions.extensionName),
      docsURI: extensionConfig.docsURI,
      blockIconURI: extensionConfig.blockIconURI,
      blocks: visible.map((block) => this.toScratchBlock(block)),
      menus: Object.fromEntries(
        [...menuIds].map((id) => {
          const menu = menuDefinitions[id];
          if (!menu) throw new Error(`Unknown menu: ${id}`);
          return [id, {acceptReporters: menu.acceptReporters, items: [...menu.items]}];
        })
      )
    };
  }

  public parseJson(args: {TEXT: unknown; NAME: unknown}, util: ScratchBlockUtility): void {
    this.store(
      util.target,
      args.NAME,
      parseJsonDocument(this.scratch.Cast.toString(args.TEXT)),
      'json'
    );
  }

  public parseYaml(args: {TEXT: unknown; NAME: unknown}, util: ScratchBlockUtility): void {
    this.store(
      util.target,
      args.NAME,
      parseYamlDocument(this.scratch.Cast.toString(args.TEXT)),
      'yaml'
    );
  }

  /**
   * Copies a Document Data subtree into a named value exactly as `parse JSON` binds one: the same
   * target-local name, replacement, stop-time clearing, and a schema the old value carried is dropped.
   * Every check and the copy finish before the binding changes, so a failure keeps the old value.
   */
  public copyDocumentTree(
    args: {DOCUMENT: unknown; LOCATION: unknown; POSITIONS: unknown; NAME: unknown},
    util: ScratchBlockUtility
  ): void {
    this.requireDocumentTreeSupport();
    const name = this.name(args.NAME);
    const documentName = this.scratch.Cast.toString(args.DOCUMENT).trim();
    if (documentName.length === 0) {
      throw new StructuredDataError('INVALID_NAME', 'Document name cannot be empty.');
    }
    const value = copyDocumentTree({
      scope: this.scratch.vm,
      target: util.target,
      documentName,
      location: this.scratch.Cast.toString(args.LOCATION),
      positions: parseDocumentTreePositions(this.scratch.Cast.toString(args.POSITIONS))
    });
    this.setBinding(util.target, name, value, 'json');
  }

  public toJson(args: {NAME: unknown}, util: ScratchBlockUtility): string {
    return renderJsonDocument(this.requireData(util.target, args.NAME));
  }

  public toYaml(args: {NAME: unknown}, util: ScratchBlockUtility): string {
    return renderYamlDocument(this.requireData(util.target, args.NAME));
  }

  public hasStructuredData(args: {NAME: unknown}, util: ScratchBlockUtility): boolean {
    return this.registryFor(util.target).has(this.name(args.NAME));
  }

  public deleteStructuredData(args: {NAME: unknown}, util: ScratchBlockUtility): void {
    const registry = this.registryFor(util.target);
    const name = this.name(args.NAME);
    if (!registry.delete(name)) this.dataNotFound(name);
  }

  public getJsonAtPath(args: NamedPathArguments, util: ScratchBlockUtility): string {
    return stringifyJson(
      getAtPath(this.requireData(util.target, args.NAME), this.path(args.PATH))
    );
  }

  public getTextAtPath(args: NamedPathArguments, util: ScratchBlockUtility): string {
    return scalarToText(
      getAtPath(this.requireData(util.target, args.NAME), this.path(args.PATH))
    );
  }

  public hasPath(args: NamedPathArguments, util: ScratchBlockUtility): boolean {
    return hasAtPath(this.requireData(util.target, args.NAME), this.path(args.PATH));
  }

  public setJsonAtPath(
    args: NamedPathArguments & {VALUE: unknown},
    util: ScratchBlockUtility
  ): void {
    const name = this.name(args.NAME);
    const updated = setAtPath(
      this.requireDataByName(util.target, name),
      this.path(args.PATH),
      parseJsonValue(this.scratch.Cast.toString(args.VALUE))
    );
    this.assertCandidate(util.target, name, updated);
    this.setBinding(util.target, name, updated);
  }

  public deleteAtPath(args: NamedPathArguments, util: ScratchBlockUtility): void {
    const name = this.name(args.NAME);
    const updated = deleteAtPath(
      this.requireDataByName(util.target, name),
      this.path(args.PATH)
    );
    this.assertCandidate(util.target, name, updated);
    this.setBinding(util.target, name, updated);
  }

  public keysAtPath(args: NamedPathArguments, util: ScratchBlockUtility): string {
    return JSON.stringify(
      keysAtPath(this.requireData(util.target, args.NAME), this.path(args.PATH))
    );
  }

  public lengthAtPath(args: NamedPathArguments, util: ScratchBlockUtility): number {
    return lengthAtPath(this.requireData(util.target, args.NAME), this.path(args.PATH));
  }

  public forEachAtPath(
    args: NamedPathArguments & {MAX: unknown},
    util: ScratchBlockUtility
  ): void {
    let state = util.stackFrame[LOOP_STATE] as LoopState | undefined;
    const stack = this.stackFor(util.thread);

    if (!state) {
      state = {
        entries: iterationEntries(
          this.requireData(util.target, args.NAME),
          this.path(args.PATH),
          this.scratch.Cast.toNumber(args.MAX)
        ),
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

    stack.push({...entry, index: state.cursor});
    state.active = true;
    util.startBranch(1, true);
  }

  public currentKey(_args: Record<string, never>, util: ScratchBlockUtility): string {
    return this.currentIteration(util.thread).key;
  }

  public currentIndex(_args: Record<string, never>, util: ScratchBlockUtility): number {
    return this.currentIteration(util.thread).index;
  }

  public currentValueJson(_args: Record<string, never>, util: ScratchBlockUtility): string {
    return stringifyJson(this.currentIteration(util.thread).value);
  }

  public currentJsonAtPath(args: {PATH: unknown}, util: ScratchBlockUtility): string {
    return stringifyJson(this.currentValueAt(util.thread, args.PATH));
  }

  public currentTextAtPath(args: {PATH: unknown}, util: ScratchBlockUtility): string {
    return scalarToText(this.currentValueAt(util.thread, args.PATH));
  }

  public defineSchema(
    args: {SCHEMA_ID: unknown; VERSION: unknown; TEXT: unknown},
    util: ScratchBlockUtility
  ): void {
    this.requireSchemaSupport();
    const reference = parseSchemaReference(args.SCHEMA_ID, args.VERSION);
    const document = parseSchemaDocument(this.scratch.Cast.toString(args.TEXT), reference);
    this.schemaRegistryFor(util.target).set(schemaKey(reference), schemaEntry(reference, document));
  }

  public beginSchema(
    args: {SCHEMA_ID: unknown; VERSION: unknown; EXTRA: unknown},
    util: ScratchBlockUtility
  ): void {
    this.requireSchemaSupport();
    const reference = parseSchemaReference(args.SCHEMA_ID, args.VERSION);
    const additionalProperties = parseAdditionalProperties(
      this.scratch.Cast.toString(args.EXTRA),
      reference
    );
    this.schemaDrafts.set(util.target, beginSchemaDraft(reference, additionalProperties));
  }

  public addSchemaProperty(
    args: {PROPERTY: unknown; TYPE: unknown; REQUIRED: unknown},
    util: ScratchBlockUtility
  ): void {
    this.requireSchemaSupport();
    const draft = this.requireDraft(util.target);
    addDraftProperty(
      draft,
      this.scratch.Cast.toString(args.PROPERTY),
      this.scratch.Cast.toString(args.TYPE),
      parseRequiredFlag(this.scratch.Cast.toString(args.REQUIRED), draft.reference)
    );
  }

  public commitSchema(_args: Record<string, never>, util: ScratchBlockUtility): void {
    this.requireSchemaSupport();
    const draft = this.requireDraft(util.target);
    const entry = schemaEntry(draft.reference, draftToSchemaDocument(draft));
    this.schemaRegistryFor(util.target).set(schemaKey(draft.reference), entry);
    this.schemaDrafts.delete(util.target);
  }

  public hasSchema(
    args: {SCHEMA_ID: unknown; VERSION: unknown},
    util: ScratchBlockUtility
  ): boolean {
    this.requireSchemaSupport();
    return this.schemaRegistryFor(util.target).has(
      schemaKey(parseSchemaReference(args.SCHEMA_ID, args.VERSION))
    );
  }

  public deleteSchema(
    args: {SCHEMA_ID: unknown; VERSION: unknown},
    util: ScratchBlockUtility
  ): void {
    this.requireSchemaSupport();
    const reference = parseSchemaReference(args.SCHEMA_ID, args.VERSION);
    if (!this.schemaRegistryFor(util.target).delete(schemaKey(reference))) {
      this.schemaNotFound(reference);
    }
  }

  public parseJsonWithSchema(
    args: {TEXT: unknown; NAME: unknown; SCHEMA_ID: unknown; VERSION: unknown},
    util: ScratchBlockUtility
  ): void {
    this.storeWithSchema(args, util, parseJsonDocument, 'json');
  }

  public parseYamlWithSchema(
    args: {TEXT: unknown; NAME: unknown; SCHEMA_ID: unknown; VERSION: unknown},
    util: ScratchBlockUtility
  ): void {
    this.storeWithSchema(args, util, parseYamlDocument, 'yaml');
  }

  public schemaOf(args: {NAME: unknown}, util: ScratchBlockUtility): string {
    this.requireSchemaSupport();
    const name = this.name(args.NAME);
    const binding = this.registryFor(util.target).get(name);
    if (binding === undefined) this.dataNotFound(name);
    const reference = binding.schemaRef;
    return stringifyJson(
      reference === undefined ? {} : {id: reference.id, version: reference.version}
    );
  }

  /** Parses a document and binds it only when the whole value matches the referenced Schema. */
  private storeWithSchema(
    args: {TEXT: unknown; NAME: unknown; SCHEMA_ID: unknown; VERSION: unknown},
    util: ScratchBlockUtility,
    decode: (source: string) => JsonValue,
    nativeRepresentation: 'json' | 'yaml'
  ): void {
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
  private assertCandidate(target: object, name: string, candidate: JsonValue): void {
    const reference = this.registryFor(target).get(name)?.schemaRef;
    if (reference === undefined) return;
    assertValueMatchesSchema(candidate, this.requireSchema(target, reference), name);
  }

  private requireSchema(target: object, reference: SchemaReference): SchemaEntry {
    const entry = this.schemaRegistryFor(target).get(schemaKey(reference));
    if (entry === undefined) this.schemaNotFound(reference);
    return entry;
  }

  private requireDraft(target: object): SchemaDraft {
    const draft = this.schemaDrafts.get(target);
    if (!draft) {
      throw new StructuredDataError(
        'INVALID_SCHEMA',
        'No schema definition is open; use the begin schema block first.'
      );
    }
    return draft;
  }

  private schemaRegistryFor(target: object): Map<string, SchemaEntry> {
    let registry = this.schemaRegistries.get(target);
    if (!registry) {
      registry = new Map();
      this.schemaRegistries.set(target, registry);
    }
    return registry;
  }

  private requireDocumentTreeSupport(): void {
    if (this.enabled && this.documentTreeEnabled) return;
    throw new StructuredDataError(
      'DATA_NOT_FOUND',
      'Copying document trees is off; set STRUCTURED_DATA_MVP and STRUCTURED_DOCUMENT_TREE before the extension loads.'
    );
  }

  private requireSchemaSupport(): void {
    if (this.schemaEnabled) return;
    throw new StructuredDataError(
      'INVALID_SCHEMA',
      'Schema support is off; set STRUCTURED_SCHEMA before the extension loads.'
    );
  }

  private schemaNotFound(reference: SchemaReference): never {
    throw new StructuredDataError(
      'SCHEMA_NOT_FOUND',
      `Schema does not exist: ${schemaKey(reference)}`,
      {schemaId: reference.id, schemaVersion: reference.version}
    );
  }

  private store(
    target: object,
    rawName: unknown,
    value: JsonValue,
    nativeRepresentation: 'json' | 'yaml'
  ): void {
    this.setBinding(target, this.name(rawName), value, nativeRepresentation);
  }

  private requireData(target: object, rawName: unknown): JsonValue {
    return this.requireDataByName(target, this.name(rawName));
  }

  private requireDataByName(target: object, name: string): JsonValue {
    const binding = this.registryFor(target).get(name);
    if (binding === undefined) this.dataNotFound(name);
    return binding.value;
  }

  private registryFor(target: object): Map<string, StructuredDataBinding> {
    let registry = this.registries.get(target);
    if (!registry) {
      registry = new Map();
      this.registries.set(target, registry);
    }
    return registry;
  }

  private setBinding(
    target: object,
    name: string,
    value: JsonValue,
    nativeRepresentation?: 'json' | 'yaml',
    schemaRef?: SchemaReference
  ): void {
    const registry = this.registryFor(target);
    const previous = registry.get(name);
    const retainedRepresentation =
      nativeRepresentation ?? previous?.nativeRepresentation ?? 'json';
    // A plain parse rebinds the name from scratch and drops any schema the old value carried;
    // a path update keeps the binding's schema so later candidates stay checked.
    const retainedSchemaRef =
      schemaRef ?? (nativeRepresentation === undefined ? previous?.schemaRef : undefined);
    registry.set(name, {
      value,
      revision: this.nextRevision,
      nativeRepresentation: retainedRepresentation,
      ...(retainedSchemaRef === undefined ? {} : {schemaRef: retainedSchemaRef})
    });
    this.nextRevision += 1;
  }

  private name(value: unknown): string {
    const name = this.scratch.Cast.toString(value).trim();
    if (name.length === 0) {
      throw new StructuredDataError('INVALID_NAME', 'Structured data name cannot be empty.');
    }
    return name;
  }

  private dataNotFound(name: string): never {
    throw new StructuredDataError('DATA_NOT_FOUND', `Structured data does not exist: ${name}`);
  }

  private currentIteration(thread: object): ActiveIteration {
    const current = this.iterationStacks.get(thread)?.at(-1);
    if (!current) {
      throw new StructuredDataError(
        'ITERATION_CONTEXT_REQUIRED',
        'This reporter is only valid inside an active iteration.'
      );
    }
    return current;
  }

  /** Reads a path relative to the innermost entry; the loop context is checked before the path. */
  private currentValueAt(thread: object, rawPath: unknown): JsonValue {
    const {value} = this.currentIteration(thread);
    return getAtPath(value, this.path(rawPath));
  }

  private stackFor(thread: object): ActiveIteration[] {
    let stack = this.iterationStacks.get(thread);
    if (!stack) {
      stack = [];
      this.iterationStacks.set(thread, stack);
    }
    return stack;
  }

  private path(value: unknown) {
    return parsePath(this.scratch.Cast.toString(value));
  }

  private clearRuntimeState(): void {
    for (const projection of this.sourceProjections) projection.clear();
    this.namedDataProvider?.clearSession();
    this.registries = new WeakMap();
    this.schemaRegistries = new WeakMap();
    this.schemaDrafts = new WeakMap();
    this.iterationStacks = new WeakMap();
    this.nextRevision = 1;
  }

  private toScratchBlock(block: BlockDefinition): Record<string, unknown> {
    return {
      opcode: block.opcode,
      blockType: this.scratch.BlockType[block.blockType],
      text: this.scratch.translate(block.text),
      arguments: Object.fromEntries(
        Object.entries(block.arguments).map(([name, argument]) => [
          name,
          {
            type: this.scratch.ArgumentType[argument.type],
            defaultValue: argument.defaultValue,
            ...(argument.menu === undefined ? {} : {menu: argument.menu})
          }
        ])
      )
    };
  }
}
