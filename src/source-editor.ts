import type {SchemaBundle, SchemaDocument, SchemaJsonValue, SourceBinding, SourceEditorOptions} from '@kubohiroya/turbowarp-extension-data-editor/schema';

export function canonicalBundle(ownerId: string, contractId: string, document: SchemaDocument, ownerSource: {path: string; symbol: string}): SchemaBundle {
  const path = `schemas/${contractId}.schema.json`;
  const source = {repository: ownerId, path};
  return {
    identity: {ownerId, contractId, revision: 'source-forms-v1', variantId: 'default'},
    dialect: '2020-12',
    root: {retrievalUri: `https://kubohiroya.github.io/${ownerId}/schemas/${contractId}.schema.json`, document,
      artifact: {role: 'canonical-schema', source}},
    resources: [], provenance: {canonicalSources: [source, {repository: ownerId, ...ownerSource}], generatedFiles: [], referenceSchemas: [], generationSources: []}
  };
}

export function sourceBinding(argument: string, bundle: SchemaBundle,
  read: (source: string) => unknown, check: (source: string) => unknown = read,
  format: 'json' | 'yaml' = 'json', uiSchema?: SourceBinding['variants'][number]['uiSchema']): SourceBinding {
  return {
    argument,
    variants: [{variantId: 'default', format, schemaBundle: bundle, ...(uiSchema ? {uiSchema} : {})}],
    decode(source) {return {source, format, variantId: 'default', data: read(source) as SchemaJsonValue};},
    validateSource(source, context) {
      try {read(source);}
      catch {return {source, result: {kind: 'invalid', diagnostics: [{code: 'source-decode-invalid'}]}};}
      try {
        const descriptors = Object.getOwnPropertyDescriptors(context);
        if (typeof descriptors.consumerId?.value !== 'string' ||
            typeof descriptors.nowMs?.value !== 'number' || !Number.isFinite(descriptors.nowMs.value) ||
            !descriptors.settings || !('value' in descriptors.settings)) {
          return {source, result: {kind: 'execution-error', diagnostics: [{code: 'owner-context-invalid'}]}};
        }
      } catch {return {source, result: {kind: 'execution-error', diagnostics: [{code: 'owner-context-invalid'}]}};}
      // The GUI checks Schema constraints; the owner checks the exact source without compiling.
      try {check(source);}
      catch {return {source, result: {kind: 'invalid', diagnostics: [{code: 'source-owner-invalid'}]}};}
      return {source, result: {kind: 'valid', diagnostics: []}};
    }
  };
}

/**
 * The optional capability keeps legacy hosts and the startup flag safely inactive.
 * Every project load disposes the runtime, which releases the registrations, but the extension
 * stays loaded for the next project, so they are registered again once that project has loaded.
 * Only the returned owner dispose is final.
 */
export function registerSourceEditors(scratch: unknown, definitions: readonly SourceEditorOptions[]): () => void {
  const host = scratch as {gui?: {blockEditors?: {apiVersion?: number; registerSourceEditor?: (options: SourceEditorOptions) => () => void}};
    vm?: {runtime?: {on?: (event: string, listener: () => void) => void; off?: (event: string, listener: () => void) => void}}};
  const api = host.gui?.blockEditors;
  if (api?.apiVersion !== 1 || typeof api.registerSourceEditor !== 'function') return () => {};
  const runtime = host.vm?.runtime;
  const removers: (() => void)[] = [];
  let active = true;
  let released = false;
  const release = () => {for (const remove of removers.splice(0).reverse()) remove();};
  const register = () => {
    try {
      for (const definition of definitions) removers.push(api.registerSourceEditor!.call(api, definition));
    } catch (error) {release(); throw error;}
  };
  const releaseForProjectLoad = () => {
    if (!active || released) return;
    released = true;
    release();
  };
  const restoreAfterProjectLoad = () => {
    if (!active || !released) return;
    register();
    released = false;
  };
  const dispose = () => {
    if (!active) return;
    active = false;
    runtime?.off?.('RUNTIME_DISPOSED', releaseForProjectLoad);
    runtime?.off?.('PROJECT_LOADED', restoreAfterProjectLoad);
    release();
  };
  try {
    register();
    runtime?.on?.('RUNTIME_DISPOSED', releaseForProjectLoad);
    runtime?.on?.('PROJECT_LOADED', restoreAfterProjectLoad);
  } catch (error) {dispose(); throw error;}
  return dispose;
}
