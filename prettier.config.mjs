import sortImports from './dist/index.js';

export default {
    plugins: [sortImports],
    printWidth: 120,
    trailingComma: 'es5',
    tabWidth: 4,
    semi: true,
    singleQuote: true,
    arrowParens: 'avoid',
    bracketSpacing: false,
    singleAttributePerLine: true,
};
