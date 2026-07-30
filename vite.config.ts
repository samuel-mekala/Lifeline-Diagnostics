import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(async () => {
  let tailwindcssPlugin;
  try {
    const tailwindModule = await import('@tailwindcss/vite');
    tailwindcssPlugin = tailwindModule.default;
  } catch (e) {
    console.warn('@tailwindcss/vite not loaded, proceeding with Vite React configuration.');
  }

  return {
    plugins: [
      react(),
      ...(tailwindcssPlugin ? [tailwindcssPlugin()] : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    build: {
      outDir: path.resolve(__dirname, 'dist'),
      emptyOutDir: true,
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
