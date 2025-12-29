/**
 * Web Worker sandbox for community plugins.
 *
 * Provides an isolated execution environment for untrusted plugin code.
 * Communication happens via message passing with strict capability enforcement.
 *
 * @module plugins/sandbox/workerSandbox
 */

import type { Capability, PluginManifest } from "@/plugins/schemas";

// ============================================================================
// Types
// ============================================================================

/**
 * Message types sent to the worker.
 */
export type WorkerInMessage =
  | { type: "init"; pluginId: string; capabilities: Capability[] }
  | { type: "activate" }
  | { type: "deactivate" }
  | { type: "call"; id: string; method: string; args: unknown[] }
  | { type: "response"; id: string; result?: unknown; error?: string };

/**
 * Message types received from the worker.
 */
export type WorkerOutMessage =
  | { type: "ready" }
  | { type: "activated" }
  | { type: "deactivated" }
  | { type: "call"; id: string; api: string; method: string; args: unknown[] }
  | { type: "response"; id: string; result?: unknown; error?: string }
  | { type: "error"; error: string };

/**
 * Sandbox options.
 */
export interface SandboxOptions {
  /** Plugin manifest */
  manifest: PluginManifest;
  /** Granted capabilities */
  capabilities: Capability[];
  /** Plugin code to execute */
  code: string;
  /** Timeout for operations (ms) */
  timeout?: number;
}

/**
 * Pending call tracker.
 */
interface PendingCall {
  resolve: (result: unknown) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

// ============================================================================
// Worker Code Template
// ============================================================================

/**
 * Template for the worker code.
 * This is injected into the worker to set up the sandbox environment.
 */
const WORKER_TEMPLATE = `
// ============================================================================
// Sandbox Environment Setup
// ============================================================================

// Remove dangerous globals
const blockedGlobals = [
  'eval',
  'Function',
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'importScripts',
];

// Store allowed versions before blocking
const _postMessage = self.postMessage.bind(self);

// Block globals
blockedGlobals.forEach(name => {
  try {
    Object.defineProperty(self, name, {
      value: undefined,
      writable: false,
      configurable: false,
    });
  } catch (e) {
    // Some globals cannot be redefined
  }
});

// ============================================================================
// Plugin API
// ============================================================================

let _capabilities = [];
let _pluginId = '';
let _callId = 0;
const _pendingCalls = new Map();

function generateCallId() {
  return 'call_' + (++_callId).toString(36);
}

function callHostAPI(api, method, ...args) {
  return new Promise((resolve, reject) => {
    const id = generateCallId();
    _pendingCalls.set(id, { resolve, reject });
    _postMessage({ type: 'call', id, api, method, args });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (_pendingCalls.has(id)) {
        _pendingCalls.delete(id);
        reject(new Error('API call timeout'));
      }
    }, 30000);
  });
}

function hasCapability(cap) {
  return _capabilities.includes(cap);
}

function requireCapability(cap) {
  if (!hasCapability(cap)) {
    throw new Error('Capability not granted: ' + cap);
  }
}

// Plugin API exposed to plugin code
const itemdeck = {
  storage: {
    get: async (key) => {
      requireCapability('storage:local');
      return callHostAPI('storage', 'get', key);
    },
    set: async (key, value) => {
      requireCapability('storage:local');
      return callHostAPI('storage', 'set', key, value);
    },
    delete: async (key) => {
      requireCapability('storage:local');
      return callHostAPI('storage', 'delete', key);
    },
    clear: async () => {
      requireCapability('storage:local');
      return callHostAPI('storage', 'clear');
    },
  },
  ui: {
    notify: (message, type = 'info') => {
      requireCapability('ui:notifications');
      return callHostAPI('ui', 'notify', message, type);
    },
    showModal: async (content) => {
      requireCapability('ui:modal');
      return callHostAPI('ui', 'showModal', content);
    },
  },
  collection: {
    getCards: async () => {
      requireCapability('collection:read');
      return callHostAPI('collection', 'getCards');
    },
    getSelectedCards: async () => {
      requireCapability('collection:read');
      return callHostAPI('collection', 'getSelectedCards');
    },
    getInfo: async () => {
      requireCapability('collection:read');
      return callHostAPI('collection', 'getInfo');
    },
  },
};

// ============================================================================
// Plugin Module Storage
// ============================================================================

let _pluginModule = null;

// ============================================================================
// Message Handler
// ============================================================================

self.onmessage = async (event) => {
  const message = event.data;

  try {
    switch (message.type) {
      case 'init':
        _pluginId = message.pluginId;
        _capabilities = message.capabilities;
        _postMessage({ type: 'ready' });
        break;

      case 'load':
        // Load the plugin code
        // Note: We use a limited eval-like mechanism here
        // The code is expected to export { activate, deactivate }
        try {
          const moduleExports = {};
          const moduleFunc = new (Object.getPrototypeOf(async function(){}).constructor)(
            'exports', 'itemdeck',
            message.code + '\\n//# sourceURL=plugin:' + _pluginId
          );
          await moduleFunc(moduleExports, itemdeck);
          _pluginModule = moduleExports;
          _postMessage({ type: 'loaded' });
        } catch (e) {
          _postMessage({ type: 'error', error: 'Failed to load plugin: ' + e.message });
        }
        break;

      case 'activate':
        if (_pluginModule && typeof _pluginModule.activate === 'function') {
          await _pluginModule.activate({ pluginId: _pluginId, itemdeck });
        }
        _postMessage({ type: 'activated' });
        break;

      case 'deactivate':
        if (_pluginModule && typeof _pluginModule.deactivate === 'function') {
          await _pluginModule.deactivate();
        }
        _postMessage({ type: 'deactivated' });
        break;

      case 'call':
        // Host is calling a method on the plugin
        if (_pluginModule && typeof _pluginModule[message.method] === 'function') {
          const result = await _pluginModule[message.method](...message.args);
          _postMessage({ type: 'response', id: message.id, result });
        } else {
          _postMessage({ type: 'response', id: message.id, error: 'Method not found: ' + message.method });
        }
        break;

      case 'response':
        // Host is responding to our API call
        const pending = _pendingCalls.get(message.id);
        if (pending) {
          _pendingCalls.delete(message.id);
          if (message.error) {
            pending.reject(new Error(message.error));
          } else {
            pending.resolve(message.result);
          }
        }
        break;
    }
  } catch (error) {
    _postMessage({ type: 'error', error: String(error) });
  }
};
`;

// ============================================================================
// Worker Sandbox Class
// ============================================================================

/**
 * Web Worker sandbox for isolated plugin execution.
 */
export class WorkerSandbox {
  private worker: Worker | null = null;
  private pendingCalls = new Map<string, PendingCall>();
  private callId = 0;
  private readonly options: Required<SandboxOptions>;
  private readonly apiHandlers: Map<string, Map<string, (...args: unknown[]) => Promise<unknown>>>;
  private isTerminated = false;

  constructor(options: SandboxOptions) {
    this.options = {
      ...options,
      timeout: options.timeout ?? 30000,
    };
    this.apiHandlers = new Map();
  }

  /**
   * Register an API handler.
   *
   * @param api - API name (e.g., "storage", "ui")
   * @param method - Method name (e.g., "get", "notify")
   * @param handler - Handler function
   */
  registerAPIHandler(
    api: string,
    method: string,
    handler: (...args: unknown[]) => Promise<unknown>
  ): void {
    if (!this.apiHandlers.has(api)) {
      this.apiHandlers.set(api, new Map());
    }
    this.apiHandlers.get(api)!.set(method, handler);
  }

  /**
   * Start the sandbox and load the plugin.
   */
  async start(): Promise<void> {
    if (this.isTerminated) {
      throw new Error("Sandbox has been terminated");
    }

    // Create worker from blob
    const workerCode = WORKER_TEMPLATE;
    const blob = new Blob([workerCode], { type: "application/javascript" });
    const workerUrl = URL.createObjectURL(blob);

    try {
      this.worker = new Worker(workerUrl);
      this.setupMessageHandler();

      // Wait for worker to be ready
      await this.waitForMessage("ready");

      // Initialize with plugin ID and capabilities
      this.sendMessage({
        type: "init",
        pluginId: this.options.manifest.id,
        capabilities: this.options.capabilities,
      });

      await this.waitForMessage("ready");

      // Load the plugin code
      this.sendMessage({
        type: "load" as unknown as "call",
        code: this.options.code,
      } as unknown as WorkerInMessage);

      await this.waitForMessage("loaded");
    } finally {
      URL.revokeObjectURL(workerUrl);
    }
  }

  /**
   * Activate the plugin.
   */
  async activate(): Promise<void> {
    if (!this.worker || this.isTerminated) {
      throw new Error("Sandbox not started");
    }

    this.sendMessage({ type: "activate" });
    await this.waitForMessage("activated");
  }

  /**
   * Deactivate the plugin.
   */
  async deactivate(): Promise<void> {
    if (!this.worker || this.isTerminated) {
      return;
    }

    this.sendMessage({ type: "deactivate" });
    await this.waitForMessage("deactivated");
  }

  /**
   * Call a method on the plugin.
   *
   * @param method - Method name
   * @param args - Method arguments
   * @returns Method result
   */
  async call<T = unknown>(method: string, ...args: unknown[]): Promise<T> {
    if (!this.worker || this.isTerminated) {
      throw new Error("Sandbox not started");
    }

    const id = this.generateCallId();

    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingCalls.delete(id);
        reject(new Error("Call timeout"));
      }, this.options.timeout);

      this.pendingCalls.set(id, {
        resolve: resolve as (result: unknown) => void,
        reject,
        timeout,
      });

      this.sendMessage({
        type: "call",
        id,
        method,
        args,
      });
    });
  }

  /**
   * Terminate the sandbox.
   */
  terminate(): void {
    this.isTerminated = true;

    // Reject all pending calls
    for (const [id, pending] of this.pendingCalls) {
      clearTimeout(pending.timeout);
      pending.reject(new Error("Sandbox terminated"));
      this.pendingCalls.delete(id);
    }

    // Terminate worker
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }

  /**
   * Check if sandbox is running.
   */
  isRunning(): boolean {
    return this.worker !== null && !this.isTerminated;
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private setupMessageHandler(): void {
    if (!this.worker) return;

    this.worker.onmessage = async (event: MessageEvent<WorkerOutMessage>) => {
      const message = event.data;

      switch (message.type) {
        case "call":
          // Plugin is calling host API
          await this.handleAPICall(message.id, message.api, message.method, message.args);
          break;

        case "response":
          // Plugin is responding to our call
          const pending = this.pendingCalls.get(message.id);
          if (pending) {
            clearTimeout(pending.timeout);
            this.pendingCalls.delete(message.id);

            if (message.error) {
              pending.reject(new Error(message.error));
            } else {
              pending.resolve(message.result);
            }
          }
          break;

        case "error":
          console.error(`[Sandbox ${this.options.manifest.id}] Error:`, message.error);
          break;
      }
    };

    this.worker.onerror = (event) => {
      console.error(`[Sandbox ${this.options.manifest.id}] Worker error:`, event);
    };
  }

  private async handleAPICall(
    id: string,
    api: string,
    method: string,
    args: unknown[]
  ): Promise<void> {
    try {
      const apiHandlers = this.apiHandlers.get(api);
      const handler = apiHandlers?.get(method);

      if (!handler) {
        this.sendMessage({
          type: "response",
          id,
          error: `Unknown API method: ${api}.${method}`,
        });
        return;
      }

      const result = await handler(...args);
      this.sendMessage({ type: "response", id, result });
    } catch (error) {
      this.sendMessage({
        type: "response",
        id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private sendMessage(message: WorkerInMessage): void {
    if (this.worker && !this.isTerminated) {
      this.worker.postMessage(message);
    }
  }

  private waitForMessage(type: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error("Worker not started"));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error(`Timeout waiting for ${type}`));
      }, this.options.timeout);

      const handler = (event: MessageEvent<WorkerOutMessage>) => {
        if (event.data.type === type) {
          clearTimeout(timeout);
          this.worker?.removeEventListener("message", handler);
          resolve();
        } else if (event.data.type === "error") {
          clearTimeout(timeout);
          this.worker?.removeEventListener("message", handler);
          reject(new Error(event.data.error));
        }
      };

      this.worker.addEventListener("message", handler);
    });
  }

  private generateCallId(): string {
    return `call_${++this.callId}_${Date.now().toString(36)}`;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new worker sandbox for a plugin.
 *
 * @param options - Sandbox options
 * @returns Worker sandbox instance
 */
export function createWorkerSandbox(options: SandboxOptions): WorkerSandbox {
  return new WorkerSandbox(options);
}
