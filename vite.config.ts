/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import preact from '@preact/preset-vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [preact()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
