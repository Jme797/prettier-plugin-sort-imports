const esbuild = require('esbuild');

esbuild.build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    outfile: 'dist/index.js',
    platform: 'node',
    format: 'cjs',
    sourcemap: false,
    minify: false,
    external: [
        'prettier',
        '@babel/parser',
        '@babel/traverse',
        '@babel/generator',
        '@babel/types'
    ],
}).then(() => {
    console.log('Build completed successfully.');
}).catch((error) => {
    console.error('Build failed:', error);
    process.exit(1);
});
