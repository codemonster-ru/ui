import { onBeforeUnmount, onMounted, toValue, type MaybeRefOrGetter, type Ref } from 'vue';

interface UseFocusTrapOptions {
  enabled?: MaybeRefOrGetter<boolean>;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function getFocusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => !element.hasAttribute('hidden') && element.getAttribute('aria-hidden') !== 'true',
  );
}

export function useFocusTrap(target: Ref<HTMLElement | null>, options: UseFocusTrapOptions = {}) {
  const listener = (event: KeyboardEvent) => {
    if (event.key !== 'Tab' || toValue(options.enabled) === false) {
      return;
    }

    const container = target.value;

    if (!container) {
      return;
    }

    const focusableElements = getFocusableElements(container);

    if (focusableElements.length === 0) {
      event.preventDefault();
      container.focus();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    if (event.shiftKey) {
      if (activeElement === firstElement || activeElement === container) {
        event.preventDefault();
        lastElement.focus();
      }

      return;
    }

    if (activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  onMounted(() => {
    document.addEventListener('keydown', listener);
  });

  onBeforeUnmount(() => {
    document.removeEventListener('keydown', listener);
  });
}
