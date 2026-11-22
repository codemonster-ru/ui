import type { ObjectDirective } from 'vue';

const sources = new WeakMap<HTMLIFrameElement, string>();
const pending = new Set<HTMLIFrameElement>();
const loading = new Map<HTMLIFrameElement, () => void>();
let observer: IntersectionObserver | undefined;

function release(frame: HTMLIFrameElement) {
  loading.get(frame)?.();
  loading.delete(frame);
}

function loadPending() {
  if (loading.size >= 2 || pending.size === 0) return;
  const queue = [...pending].map((frame) => {
    const { top, height } = frame.getBoundingClientRect();
    return { frame, distance: Math.abs(top + height / 2 - window.innerHeight / 2) };
  });
  queue.sort((left, right) => left.distance - right.distance);
  for (const { frame } of queue) {
    if (loading.size >= 2) return;
    pending.delete(frame);

    const url = sources.get(frame);
    if (!url) continue;
    observer?.unobserve(frame);
    const onLoad = () => {
      if (frame.contentDocument?.URL === 'about:blank') return;
      release(frame);
      loadPending();
    };
    loading.set(frame, () => frame.removeEventListener('load', onLoad));
    frame.addEventListener('load', onLoad);
    frame.src = url;
  }
}

export const vDevPreview: ObjectDirective<HTMLIFrameElement, string | undefined> = {
  mounted(frame, { value }) {
    if (!value) return;
    // Vite resolves a separate dependency graph in each preview document.
    observer ??= new IntersectionObserver(
      (entries) => {
        for (const { target, isIntersecting } of entries) {
          const preview = target as HTMLIFrameElement;
          if (isIntersecting && sources.has(preview)) pending.add(preview);
          else pending.delete(preview);
        }
        loadPending();
      },
      { rootMargin: '800px 0px' },
    );
    sources.set(frame, value);
    observer.observe(frame);
  },
  beforeUnmount(frame) {
    if (!sources.delete(frame)) return;
    observer?.unobserve(frame);
    pending.delete(frame);
    release(frame);
    queueMicrotask(loadPending);
  },
};
