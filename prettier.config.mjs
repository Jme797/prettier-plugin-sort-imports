import removeUnusedImports from './src/out.js';

export default {
    plugins: [removeUnusedImports],
    printWidth: 120,
    trailingComma: 'es5',
    tabWidth: 4,
    semi: true,
    singleQuote: true,
    arrowParens: 'avoid',
    bracketSpacing: false,
    singleAttributePerLine: true,
};
