import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'GhostType',
    description: 'Anonymous Writing for the AI Era. Protect your linguistic fingerprint.',
    version: '0.1.0',
    permissions: ['activeTab', 'storage', 'sidePanel'],
    web_accessible_resources: [
      {
        resources: ['transformers/*'],
        matches: ['<all_urls>'],
      },
    ],
  },
  vite: () => ({
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ['@huggingface/transformers'],
    },
  }),
});
