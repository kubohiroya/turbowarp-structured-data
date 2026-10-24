import {parseFixedNumberInput} from '@kubohiroya/turbowarp-extension-data-editor';
import type {FixedInputEditorOptions} from '@kubohiroya/turbowarp-extension-data-editor';
import {extensionConfig} from './config.js';
import {fixedInputSchemaBundle} from './fixed-input-schema.js';


export const fixedInputEditorDefinitions: readonly FixedInputEditorOptions[] = [{
  apiVersion: 1, extensionId: extensionConfig.id, editorId: 'forEachAtPath-fixed-inputs',
  opcodes: [`${extensionConfig.id}_forEachAtPath`],
  contractId: 'turbowarp-structured-data:forEachAtPath.MAX', contractRevision: 'fixed-inputs-v1',
  bindings: [{argument: 'MAX', schemaBundle: fixedInputSchemaBundle,
    control: {kind: 'number', label: 'MAX'},
    read(value) {
      if (typeof value !== 'string' && typeof value !== 'number') throw new TypeError('Expected a literal maximum.');
      if (typeof value === 'string' && value.trim() === '') throw new TypeError('Blank maximum stays readonly.');
      // Existing nonempty finite Number aliases may project; no-op saving retains the exact raw token.
      const number = Number(value);
      if (!Number.isFinite(number)) throw new TypeError('Maximum must be finite.');
      return number;
    },
    encode(value) {
      const parsed = parseFixedNumberInput(value);
      if (parsed.kind !== 'valid') throw new TypeError('Expected a finite numeric token.');
      return parsed.token;
    },
    validateCandidate(value) {
      const parsed = parseFixedNumberInput(value);
      return parsed.kind === 'valid' && Number.isInteger(parsed.value) && parsed.value >= 1 && parsed.value <= 1000 ? []
        : [{path: '/inputs/MAX', message: 'Maximum must be an integer from 1 to 1000.'}];
    }
  }],
  validationContext: () => ({consumerId: extensionConfig.id, nowMs: Date.now(), settings: null})
}];

interface RuntimeLifetime {
  on?: (event: string, listener: () => void) => void;
  off?: (event: string, listener: () => void) => void;
}

/** Register metadata only; the GUI startup capability owns editor activation. */
export function registerFixedInputEditors(
  scratch: unknown, definitions: readonly FixedInputEditorOptions[], runtimeOverride?: RuntimeLifetime
): () => void {
  const host = scratch as {gui?: {blockEditors?: {apiVersion?: number;
    registerFixedInputEditor?: (options: FixedInputEditorOptions) => () => void}};
    vm?: {runtime?: RuntimeLifetime}};
  const api = host.gui?.blockEditors;
  if (!definitions.length || api?.apiVersion !== 1 || typeof api.registerFixedInputEditor !== 'function') return () => {};
  const runtime = runtimeOverride ?? host.vm?.runtime;
  const removers: (() => void)[] = [];
  let active = true;
  const dispose = () => {
    if (!active) return;
    active = false;
    runtime?.off?.('RUNTIME_DISPOSED', dispose);
    for (const remove of removers.splice(0).reverse()) remove();
  };
  try {
    for (const definition of definitions) {
      const remove = api.registerFixedInputEditor.call(api, definition);
      if (typeof remove !== 'function') throw new TypeError('Invalid fixed input registration disposer.');
      removers.push(remove);
    }
    runtime?.on?.('RUNTIME_DISPOSED', dispose);
  } catch (error) {dispose(); throw error;}
  return dispose;
}
