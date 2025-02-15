const esbuild = require('esbuild');

esbuild.build({
    entryPoints: ['src/index.tsx'],
    bundle: true,
    outfile: 'dist/index.js',
    platform: 'node',
    target: 'es6',
    external: ['prettier'],
    sourcemap: true,
    minify: true,
}).then(() => {
    console.log('Build completed successfully.');
}).catch((error) => {
    console.error('Build failed:', error);
    process.exit(1);
});
