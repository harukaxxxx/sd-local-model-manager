import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const clientPort = parseInt(env.CLIENT_PORT || '5173', 10);
  const serverPort = env.PORT || '3001';

  return {
    plugins: [vue(), tailwindcss()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    server: {
      port: clientPort,
      proxy: {
        '/api': {
          target: `http://localhost:${serverPort}`,
          changeOrigin: true,
        },
        '/previews': {
          target: `http://localhost:${serverPort}`,
          changeOrigin: true,
        },
        '/socket.io': {
          target: `http://localhost:${serverPort}`,
          ws: true,
        },
      },
    },
  };
});
