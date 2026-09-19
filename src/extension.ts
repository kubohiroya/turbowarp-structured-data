import definitions from './block-definitions.json';
import {
  bindNamedDataRegistryLifecycle,
  installNamedDataRegistry,
  type NamedDataProviderRegistration,
  type NamedDataRegistryService
} from '@kubohiroya/turbowarp-named-data/composition';
import {
  extensionConfig,
  isNamedDataRegistryMvpEnabled,
  isStructuredDataMvpEnabled
} from './config.js';
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

export class StructuredDataExtension implements TurboWarpExtension {
  private readonly enabled: boolean;
  private registries = new WeakMap<object, Map<string, StructuredDataBinding>>();
  private iterationStacks = new WeakMap<object, ActiveIteration[]>();
  private nextRevision = 1;
  private readonly namedDataProvider?: StructuredDataNamedDataProvider;
  private readonly namedDataRegistry?: NamedDataRegistryService;
  private readonly namedDataRegistration?: NamedDataProviderRegistration;
  private readonly unbindNamedDataRegistryLifecycle?: () => void;

  public constructor(
    enabled = isStructuredDataMvpEnabled(),
    namedDataEnabled = isNamedDataRegistryMvpEnabled()
  ) {
    this.enabled = enabled;
    if (namedDataEnabled) {
      this.namedDataProvider = new StructuredDataNamedDataProvider({
        get: (target, name) => this.registries.get(target)?.get(name)
      });
      const runtime = Scratch.vm?.runtime;
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
        runtime.on?.('RUNTIME_DISPOSED', () => {
          void this.dispose();
        });
      }
    }
    Scratch.vm?.runtime?.on?.('PROJECT_STOP_ALL', () => this.clearRuntimeState());
  }

  public getNamedDataProvider(): StructuredDataNamedDataProvider | undefined {
    return this.namedDataProvider;
  }

  public getNamedDataRegistry(): NamedDataRegistryService | undefined {
    return this.namedDataRegistry;
  }

  public async dispose(): Promise<void> {
    await this.namedDataRegistration?.unregister();
    this.unbindNamedDataRegistryLifecycle?.();
  }

  public getInfo(): Record<string, unknown> {
    return {
      id: extensionConfig.id,
      name: Scratch.translate(definitions.extensionName),
      docsURI: extensionConfig.docsURI,
      blockIconURI: extensionConfig.blockIconURI,
      blocks: this.enabled ? blockDefinitions.map((block) => this.toScratchBlock(block)) : []
    };
  }

  public parseJson(args: {TEXT: unknown; NAME: unknown}, util: ScratchBlockUtility): void {
    this.store(
      util.target,
      args.NAME,
      parseJsonDocument(Scratch.Cast.toString(args.TEXT)),
      'json'
    );
  }

  public parseYaml(args: {TEXT: unknown; NAME: unknown}, util: ScratchBlockUtility): void {
    this.store(
      util.target,
      args.NAME,
      parseYamlDocument(Scratch.Cast.toString(args.TEXT)),
      'yaml'
    );
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
      parseJsonValue(Scratch.Cast.toString(args.VALUE))
    );
    this.setBinding(util.target, name, updated);
  }

  public deleteAtPath(args: NamedPathArguments, util: ScratchBlockUtility): void {
    const name = this.name(args.NAME);
    const updated = deleteAtPath(
      this.requireDataByName(util.target, name),
      this.path(args.PATH)
    );
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
          Scratch.Cast.toNumber(args.MAX)
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
    nativeRepresentation?: 'json' | 'yaml'
  ): void {
    const registry = this.registryFor(target);
    const retainedRepresentation =
      nativeRepresentation ?? registry.get(name)?.nativeRepresentation ?? 'json';
    registry.set(name, {
      value,
      revision: this.nextRevision,
      nativeRepresentation: retainedRepresentation
    });
    this.nextRevision += 1;
  }

  private name(value: unknown): string {
    const name = Scratch.Cast.toString(value).trim();
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

  private stackFor(thread: object): ActiveIteration[] {
    let stack = this.iterationStacks.get(thread);
    if (!stack) {
      stack = [];
      this.iterationStacks.set(thread, stack);
    }
    return stack;
  }

  private path(value: unknown) {
    return parsePath(Scratch.Cast.toString(value));
  }

  private clearRuntimeState(): void {
    this.namedDataProvider?.clearSession();
    this.registries = new WeakMap();
    this.iterationStacks = new WeakMap();
    this.nextRevision = 1;
  }

  private toScratchBlock(block: BlockDefinition): Record<string, unknown> {
    return {
      opcode: block.opcode,
      blockType: Scratch.BlockType[block.blockType],
      text: Scratch.translate(block.text),
      arguments: Object.fromEntries(
        Object.entries(block.arguments).map(([name, argument]) => [
          name,
          {type: Scratch.ArgumentType[argument.type], defaultValue: argument.defaultValue}
        ])
      )
    };
  }
}
