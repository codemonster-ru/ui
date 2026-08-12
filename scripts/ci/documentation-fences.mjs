const documentationScriptLanguages = new Set(['bash', 'javascript', 'js', 'shell', 'sh', 'ts', 'typescript', 'vue']);

export function isDocumentationScriptLanguage(language) {
  return documentationScriptLanguages.has(language);
}
