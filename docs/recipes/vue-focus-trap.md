# Contain Tab focus in an authored Vue overlay

`useFocusTrap` is available from `@codemonster-ru/ui-vue/historical`. Use it with authored overlays
that need to keep Tab and Shift+Tab within a template ref while open.

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useFocusTrap } from '@codemonster-ru/ui-vue/historical';

const open = ref(false);
const panel = ref<HTMLElement | null>(null);
useFocusTrap(panel, { enabled: open });
</script>
```

Bind `ref="panel"` to the overlay element and set `tabindex="-1"` so it can receive focus when
it has no tabbable descendants. The latest active trap takes precedence in the same document.
When it closes or unmounts, the previous trap resumes. Supply the overlay's accessible name,
dismissal behavior, and initial and return focus as part of the component that opens it.

CodeMonster Dialog, Drawer, and CommandPalette use the browser's native dialog focus scope.
