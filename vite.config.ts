import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// `base: './'` keeps asset URLs relative so the build works on GitHub Pages
// sub-paths, Netlify and Vercel without changes. Routing uses HashRouter.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: { target: 'es2020', chunkSizeWarningLimit: 900 },
});
