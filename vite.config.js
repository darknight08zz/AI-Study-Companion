import { fileURLToPath, URL } from 'url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import environment from 'vite-plugin-environment';

const ii_url =
    process.env.DFX_NETWORK === 'local'
        ? `http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:8081/`
        : `https://identity.internetcomputer.org/`;

process.env.II_URL = process.env.II_URL || ii_url;
process.env.STORAGE_GATEWAY_URL = process.env.STORAGE_GATEWAY_URL || 'https://blob.caffeine.ai';

import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    logLevel: 'info',
    build: {
        emptyOutDir: true,
        sourcemap: false,
        minify: false
    },
    css: {
        postcss: './postcss.config.js'
    },
    optimizeDeps: {
        esbuildOptions: {
            define: {
                global: 'globalThis'
            }
        }
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:4943',
                changeOrigin: true
            }
        }
    },
    plugins: [
        environment('all', { prefix: 'CANISTER_' }),
        environment('all', { prefix: 'DFX_' }),
        environment(['II_URL']),
        environment(['STORAGE_GATEWAY_URL']),
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['pwa-icon.svg'],
            workbox: {
                maximumFileSizeToCacheInBytes: 5 * 1024 * 1024 // 5MB
            },
            manifest: {
                name: 'AI Study Companion',
                short_name: 'StudyBuddy',
                description: 'Your personal AI-powered study assistant',
                theme_color: '#020817', // Match dark mode background
                background_color: '#020817',
                display: 'standalone',
                scope: '/',
                start_url: '/',
                orientation: 'portrait',
                icons: [
                    {
                        src: 'pwa-icon.svg',
                        sizes: '192x192',
                        type: 'image/svg+xml'
                    },
                    {
                        src: 'pwa-icon.svg',
                        sizes: '512x512',
                        type: 'image/svg+xml'
                    }
                ]
            }
        })
    ],
    resolve: {
        alias: [
            {
                find: 'declarations',
                replacement: fileURLToPath(new URL('../declarations', import.meta.url))
            },
            {
                find: '@',
                replacement: fileURLToPath(new URL('./src', import.meta.url))
            }
        ],
        dedupe: ['@dfinity/agent']
    }
});
