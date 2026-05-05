import { describe, expect, it, vi } from 'vitest';

import { createPlaygroundSession } from '../src';

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
});
