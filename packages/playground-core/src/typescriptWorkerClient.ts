interface TranspileRequest {
  type: 'transpile';
  id: number;
  sources: string[];
}

interface TranspileResult {
  type: 'result';
  id: number;
  outputs: string[];
}

interface TranspileError {
  type: 'error';
  id: number;
  message: string;
}

interface PendingRequest {
  resolve: (outputs: string[]) => void;
  reject: (error: Error) => void;
}

let worker: Worker | null = null;
let nextRequestId = 0;
const pendingRequests = new Map<number, PendingRequest>();

function rejectPendingRequests(error: Error): void {
  for (const request of pendingRequests.values()) {
    request.reject(error);
  }
  pendingRequests.clear();
}

function getWorker(): Worker {
  if (worker) {
    return worker;
  }

  worker = new Worker(new URL('./typescriptWorker.js', import.meta.url), { type: 'module' });
  worker.addEventListener('message', (event: MessageEvent<TranspileResult | TranspileError>) => {
    const response = event.data;
    if (!response || (response.type !== 'result' && response.type !== 'error')) {
      return;
    }

    const pending = pendingRequests.get(response.id);
    if (!pending) {
      return;
    }
    pendingRequests.delete(response.id);

    if (response.type === 'error') {
      pending.reject(new Error(response.message));
      return;
    }
    pending.resolve(response.outputs);
  });
  worker.addEventListener('error', () => {
    rejectPendingRequests(new Error('TypeScript compiler worker failed.'));
    worker?.terminate();
    worker = null;
  });
  return worker;
}

export function transpileTypeScript(sources: string[]): Promise<string[]> {
  if (sources.length === 0) {
    return Promise.resolve([]);
  }

  const id = ++nextRequestId;
  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
    const request: TranspileRequest = { type: 'transpile', id, sources };
    try {
      getWorker().postMessage(request);
    } catch (error) {
      pendingRequests.delete(id);
      reject(error instanceof Error ? error : new Error('Unable to start TypeScript compiler worker.'));
    }
  });
}
