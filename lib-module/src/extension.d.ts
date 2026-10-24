import type { ScratchApi, TurboWarpExtension, ScratchBlockUtility } from './runtime-api.js';
import { type NamedDataRegistryService } from '@kubohiroya/turbowarp-named-data/composition';
import { StructuredDataNamedDataProvider } from './structured-provider.js';
interface NamedPathArguments {
    NAME: unknown;
    PATH: unknown;
}
export declare class StructuredDataExtension implements TurboWarpExtension {
    private readonly scratch;
    private readonly enabled;
    private disposed;
    private readonly releaseRuntimeListeners;
    private readonly unregisterSourceEditors;
    private readonly unregisterFixedInputEditors;
    private registries;
    private iterationStacks;
    private nextRevision;
    private readonly namedDataProvider?;
    private readonly namedDataRegistry?;
    private readonly namedDataRegistration?;
    private readonly unbindNamedDataRegistryLifecycle?;
    constructor(scratch: ScratchApi, enabled?: boolean, namedDataEnabled?: boolean);
    getNamedDataProvider(): StructuredDataNamedDataProvider | undefined;
    getNamedDataRegistry(): NamedDataRegistryService | undefined;
    dispose(): Promise<void>;
    getInfo(): Record<string, unknown>;
    parseJson(args: {
        TEXT: unknown;
        NAME: unknown;
    }, util: ScratchBlockUtility): void;
    parseYaml(args: {
        TEXT: unknown;
        NAME: unknown;
    }, util: ScratchBlockUtility): void;
    toJson(args: {
        NAME: unknown;
    }, util: ScratchBlockUtility): string;
    toYaml(args: {
        NAME: unknown;
    }, util: ScratchBlockUtility): string;
    hasStructuredData(args: {
        NAME: unknown;
    }, util: ScratchBlockUtility): boolean;
    deleteStructuredData(args: {
        NAME: unknown;
    }, util: ScratchBlockUtility): void;
    getJsonAtPath(args: NamedPathArguments, util: ScratchBlockUtility): string;
    hasPath(args: NamedPathArguments, util: ScratchBlockUtility): boolean;
    setJsonAtPath(args: NamedPathArguments & {
        VALUE: unknown;
    }, util: ScratchBlockUtility): void;
    deleteAtPath(args: NamedPathArguments, util: ScratchBlockUtility): void;
    keysAtPath(args: NamedPathArguments, util: ScratchBlockUtility): string;
    lengthAtPath(args: NamedPathArguments, util: ScratchBlockUtility): number;
    forEachAtPath(args: NamedPathArguments & {
        MAX: unknown;
    }, util: ScratchBlockUtility): void;
    currentKey(_args: Record<string, never>, util: ScratchBlockUtility): string;
    currentIndex(_args: Record<string, never>, util: ScratchBlockUtility): number;
    currentValueJson(_args: Record<string, never>, util: ScratchBlockUtility): string;
    private store;
    private requireData;
    private requireDataByName;
    private registryFor;
    private setBinding;
    private name;
    private dataNotFound;
    private currentIteration;
    private stackFor;
    private path;
    private clearRuntimeState;
    private toScratchBlock;
}
export {};
