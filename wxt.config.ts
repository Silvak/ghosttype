import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'GhostType',
    description: 'Anonymous Writing for the AI Era. Protect your linguistic fingerprint.',
    version: '0.1.0',
    permissions: ['activeTab', 'storage', 'sidePanel', 'offscreen', 'tabs'],
    host_permissions: [
      'https://huggingface.co/*',
      'https://*.huggingface.co/*',
      'https://hf.co/*',
      'https://*.hf.co/*',
    ],
    options_ui: {
      page: 'options.html',
      open_in_tab: true,
    },
    icons: {
      16: 'icons/icon-16.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png',
    },
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
