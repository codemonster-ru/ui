import { bootstrapShowcaseTheme } from './app-shell';

const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;

bootstrapShowcaseTheme(document.documentElement, window.localStorage, prefersDark);
