import {renderJsonDocument, renderYamlDocument} from './codecs.js';
import type {JsonValue} from './core.js';
import {
  NamedDataError,
  type NamedDataBody,
  type NamedDataMetadata,
  type NamedDataProvider,
  type NamedDataReference,
  type NamedDataRepresentation,
  type NamedDataResolveContext
} from '@kubohiroya/turbowarp-named-data/composition';

export const STRUCTURED_DATA_NAMESPACE = 'structured';
export const STRUCTURED_BODY_MAX_BYTES = 256 * 1024;

export interface StructuredDataBinding {
  value: JsonValue;
  revision: number;
  nativeRepresentation: 'json' | 'yaml';
}

export interface StructuredDataBindingStore {
  get(target: object, name: string): StructuredDataBinding | undefined;
}

export class StructuredDataNamedDataProvider implements NamedDataProvider {
  public readonly namespace = STRUCTURED_DATA_NAMESPACE;
  public readonly kind = 'structured' as const;
  private readonly openBodies = new Set<symbol>();
  private released = false;

  public constructor(
    private readonly store: StructuredDataBindingStore,
    private readonly maxBodyBytes = STRUCTURED_BODY_MAX_BYTES
  ) {}

  public canResolve(
    reference: NamedDataReference,
    representation: NamedDataRepresentation
  ): boolean {
    return (
      reference.namespace === this.namespace &&
      reference.kind === this.kind &&
      reference.scope === 'target' &&
      (representation === 'json' || representation === 'yaml')
    );
  }

  public stat(
    reference: NamedDataReference,
    representation: NamedDataRepresentation,
    context: NamedDataResolveContext
  ): NamedDataMetadata {
    const resolved = this.resolve(reference, representation, context);
    return this.metadata(
      reference,
      resolved.nativeRepresentation,
      representation,
      resolved.bytes.byteLength,
      resolved.revision
    );
  }

  public openBody(
    reference: NamedDataReference,
    representation: NamedDataRepresentation,
    context: NamedDataResolveContext
  ): NamedDataBody {
    const resolved = this.resolve(reference, representation, context);
    const handle = Symbol('structured-body');
    this.openBodies.add(handle);
    let released = false;
    return {
      ...this.metadata(
        reference,
        resolved.nativeRepresentation,
        representation,
        resolved.bytes.byteLength,
        resolved.revision
      ),
      body: resolved.bytes,
      release: () => {
        if (released) return;
        released = true;
        this.openBodies.delete(handle);
      }
    };
  }

  public release(): void {
    this.released = true;
    this.openBodies.clear();
  }

  public clearSession(): void {
    this.openBodies.clear();
  }

  private resolve(
    reference: NamedDataReference,
    representation: NamedDataRepresentation,
    context: NamedDataResolveContext
  ): {bytes: Uint8Array; revision: number; nativeRepresentation: 'json' | 'yaml'} {
    if (this.released) {
      throw new NamedDataError('NAMED_DATA_PROVIDER_RELEASED', 'The structured provider was released.');
    }
    this.validateReference(reference, context);
    this.throwIfAborted(context.signal);
    const binding = this.store.get(context.target as object, reference.name);
    if (!binding) {
      throw new NamedDataError(
        'NAMED_DATA_NOT_FOUND',
        `Structured data does not exist: ${reference.name}`
      );
    }
    const text = this.render(binding.value, representation);
    const bytes = new TextEncoder().encode(text);
    if (bytes.byteLength > this.maxBodyBytes) {
      throw new NamedDataError(
        'NAMED_DATA_BODY_TOO_LARGE',
        `Encoded body is ${bytes.byteLength} bytes; maximum is ${this.maxBodyBytes}.`
      );
    }
    this.throwIfAborted(context.signal);
    return {
      bytes,
      revision: binding.revision,
      nativeRepresentation: binding.nativeRepresentation
    };
  }

  private validateReference(
    reference: NamedDataReference,
    context: NamedDataResolveContext
  ): void {
    if (reference.namespace !== this.namespace || reference.name.trim().length === 0) {
      throw new NamedDataError('NAMED_DATA_INVALID_REF', 'Invalid structured data reference.');
    }
    if (reference.kind !== this.kind) {
      throw new NamedDataError(
        'NAMED_DATA_KIND_MISMATCH',
        `Expected ${this.kind}, received ${reference.kind}.`
      );
    }
    if (reference.scope !== 'target' || !context.target) {
      throw new NamedDataError(
        'NAMED_DATA_SCOPE_MISMATCH',
        'Structured data currently requires a target scope and target context.'
      );
    }
  }

  private render(value: JsonValue, representation: NamedDataRepresentation): string {
    if (representation === 'json') return renderJsonDocument(value);
    if (representation === 'yaml') return renderYamlDocument(value);
    throw new NamedDataError(
      'NAMED_DATA_REPRESENTATION_UNSUPPORTED',
      `Structured data cannot be rendered as ${representation}.`
    );
  }

  private metadata(
    reference: NamedDataReference,
    nativeRepresentation: 'json' | 'yaml',
    representation: NamedDataRepresentation,
    byteLength: number,
    revision: number
  ): NamedDataMetadata {
    return {
      reference: {...reference},
      nativeRepresentation,
      representation,
      mediaType:
        representation === 'json'
          ? 'application/json; charset=utf-8'
          : 'application/yaml; charset=utf-8',
      byteLength,
      revision: String(revision),
      replayable: true
    };
  }

  private throwIfAborted(signal: AbortSignal | undefined): void {
    if (signal?.aborted) {
      throw new NamedDataError('NAMED_DATA_ABORTED', 'Body resolution was aborted.');
    }
  }
}
