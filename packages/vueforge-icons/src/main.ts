import { createApp } from 'vue';
import '../../core/src/styles/foundation.css';
import App from './App.vue';

// eslint's project service cannot resolve App.vue's type here, though vue-tsc does; the report is
// the resolver's blind spot rather than an untyped value.
// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
const app = createApp(App);

app.mount('#app');
