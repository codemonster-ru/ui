import { afterEach, describe, expect, it, vi } from 'vitest';

import { createPlaygroundSession } from '../src';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createPlaygroundSession', () => {
  it('emits run event', async () => {
    const iframe = { setAttribute: vi.fn(), srcdoc: '' } as unknown as HTMLIFrameElement;

    const session = createPlaygroundSession({
      runtime: 'browser',
      iframe,
      files: {
        '/index.html': '<html><body>Hello</body></html>'
      },
      entry: '/index.html'
    });

    const onRun = vi.fn();
    session.onRun(onRun);

    await session.run();

    expect(onRun).toHaveBeenCalledTimes(1);
  });

  it('emits error if browser runtime has no iframe', async () => {
    const session = createPlaygroundSession({
      runtime: 'browser',
      files: {
        '/index.html': '<html><body>Hello</body></html>'
      },
      entry: '/index.html'
    });

    const onError = vi.fn();
    session.onError(onError);

    await session.run();

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0].message).toContain('iframe');
  });

  it('updates files and reruns with new content', async () => {
    const iframe = { setAttribute: vi.fn(), srcdoc: '' } as unknown as HTMLIFrameElement;

    const session = createPlaygroundSession({
      runtime: 'browser',
      iframe,
      files: {
        '/index.html': '<html><body>A</body></html>'
      },
      entry: '/index.html'
    });

    await session.run();
    session.updateFiles({
      '/index.html': '<html><body>B</body></html>'
    });
    await session.run();

    expect(iframe.srcdoc).toContain('B');
  });

  it('accepts only validated messages from the configured iframe', () => {
    let messageListener: ((event: MessageEvent) => void) | null = null;
    const windowStub = {
      addEventListener: vi.fn((type: string, listener: (event: MessageEvent) => void) => {
        if (type === 'message') {
          messageListener = listener;
        }
      }),
      removeEventListener: vi.fn(),
    };
    vi.stubGlobal('window', windowStub);

    const iframeWindow = {} as Window;
    const iframe = {
      contentWindow: iframeWindow,
      setAttribute: vi.fn(),
      srcdoc: '',
    } as unknown as HTMLIFrameElement;
    const session = createPlaygroundSession({
      runtime: 'browser',
      iframe,
      files: { '/index.html': '<html></html>' },
      entry: '/index.html',
    });
    const onConsole = vi.fn();
    const onError = vi.fn();
    session.onConsole(onConsole);
    session.onError(onError);

    expect(messageListener).not.toBeNull();
    const dispatchMessage = (event: MessageEvent) => {
      const listener = messageListener as ((message: MessageEvent) => void) | null;
      if (!listener) {
        throw new Error('Expected the session to register a message listener.');
      }
      listener(event);
    };

    const validConsole = {
      __cm_playground: true,
      type: 'console',
      payload: { level: 'log', args: ['ready'], timestamp: 42 },
    };
    dispatchMessage({ source: {} as Window, data: validConsole } as MessageEvent);
    dispatchMessage({
      source: iframeWindow,
      data: { ...validConsole, payload: { level: 'trace', args: [], timestamp: 42 } },
    } as MessageEvent);
    dispatchMessage({
      source: iframeWindow,
      data: { ...validConsole, payload: { level: 'log', args: 'not-an-array', timestamp: 42 } },
    } as MessageEvent);
    dispatchMessage({
      source: iframeWindow,
      data: { __cm_playground: true, type: 'error', payload: { message: 500, source: 'runtime' } },
    } as MessageEvent);

    expect(onConsole).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();

    dispatchMessage({ source: iframeWindow, data: validConsole } as MessageEvent);
    dispatchMessage({
      source: iframeWindow,
      data: {
        __cm_playground: true,
        type: 'error',
        payload: {
          message: 'Runtime failed',
          source: 'runtime',
          code: 'unresolved',
          details: { specifier: 'missing', fromFile: '/main.js', reason: 'unresolved' },
        },
      },
    } as MessageEvent);

    expect(onConsole).toHaveBeenCalledOnce();
    expect(onConsole).toHaveBeenCalledWith(validConsole.payload);
    expect(onError).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Runtime failed' }));

    session.dispose();
    expect(windowStub.removeEventListener).toHaveBeenCalledWith('message', messageListener);
  });
});
