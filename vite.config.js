import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// './' makes all asset paths relative, so the app works regardless of
// whether GitHub Pages serves it at /repo-name/ or a custom domain root.
export default defineConfig({
  plugins: [react()],
  base: './',
});
