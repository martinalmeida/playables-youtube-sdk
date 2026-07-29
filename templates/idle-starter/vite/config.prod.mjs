import { defineConfig } from 'vite';

export default defineConfig({
    root: '.',
    base: './',
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        // Los Playables se sirven como bundle estático plano.
        // No usar rutas absolutas de servidor: base: './' garantiza que
        // funcione sin importar la ruta pública donde se aloje.
        rollupOptions: {
            output: {
                assetFileNames: 'assets/[name]-[hash][extname]',
                chunkFileNames: 'assets/[name]-[hash].js',
                entryFileNames: 'assets/[name]-[hash].js'
            }
        }
    },
    logLevel: 'warning'
});
