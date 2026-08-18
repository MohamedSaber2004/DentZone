import { defineConfig } from 'vite';
import plugin from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [plugin()],
    server: {
        port: 12577,
        proxy: {
            '/api': {
                target: process.env.VITE_PROXY_TARGET ?? 'https://localhost:44361',
                changeOrigin: true,
                secure: false,
            },
        },
    }
})
