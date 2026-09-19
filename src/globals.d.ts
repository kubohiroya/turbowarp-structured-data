interface TurboWarpExtension {
  getInfo(): Record<string, unknown>;
}

interface ScratchTranslate {
  (text: string): string;
  (message: {default: string; description?: string}, placeholders?: Record<string, string | number>): string;
}

interface ScratchBlockUtility {
  thread: object;
  target: object;
  stackFrame: Record<string, unknown>;
  startBranch(branchNumber: number, isLoop: boolean): void;
}

interface ScratchApi {
  extensions: {
    unsandboxed: boolean;
    register(extension: TurboWarpExtension): void;
  };
  BlockType: Record<'COMMAND' | 'REPORTER' | 'BOOLEAN' | 'HAT' | 'LOOP', string>;
  ArgumentType: Record<'STRING' | 'NUMBER' | 'BOOLEAN', string>;
  Cast: {
    toString(value: unknown): string;
    toNumber(value: unknown): number;
    toBoolean(value: unknown): boolean;
  };
  translate: ScratchTranslate;
  vm?: {
    runtime?: {
      on(event: string, listener: () => void): void;
      off?(event: string, listener: () => void): void;
    };
  };
}

declare const Scratch: ScratchApi;
