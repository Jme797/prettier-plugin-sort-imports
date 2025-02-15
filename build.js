import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import esbuild from 'esbuild';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Clean the dist folder
const distPath = path.resolve(__dirname, 'dist');
if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, {recursive: true, force: true});
}

esbuild
    .build({
        entryPoints: ['src/index.tsx'],
        bundle: true,
        outfile: 'dist/index.js',
        platform: 'node',
        format: 'esm',
        sourcemap: false,
        minify: false,
        external: ['prettier', '@babel/parser', '@babel/traverse', '@babel/generator', '@babel/types'],
    })
    .then(() => {
        console.log('Build completed successfully.');
    })
    .catch(error => {
        console.error('Build failed:', error);
        process.exit(1);
    });
