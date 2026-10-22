import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {readFileSync} from 'fs';
import {defineConfig} from 'vite';

const pkg = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'));

export default defineConfig(() => {
  return {
    base: './',
    // Facts about this build, shown on the admin System Status page.
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __APP_COMMIT__: JSON.stringify(process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || ''),
    },
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          // Stable vendor chunks: cached across deploys and loaded only by the screens that need them.
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'vendor-react';
            if (id.includes('@supabase')) return 'vendor-supabase';
            if (/[\\/]node_modules[\\/](recharts|d3-[^\\/]+|victory-vendor|internmap|decimal\.js-light|es-toolkit|immer|reselect|@reduxjs|react-redux|redux)[\\/]/.test(id)) return 'vendor-charts';
            if (id.includes('@stripe')) return 'vendor-stripe';
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
