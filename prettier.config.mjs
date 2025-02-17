import sortImports from './dist/index.js';

export default {
    plugins: [sortImports],
    importOrder: [],
    printWidth: 120,
    trailingComma: 'es5',
    tabWidth: 4,
    semi: true,
    singleQuote: true,
    arrowParens: 'avoid',
    bracketSpacing: false,
    singleAttributePerLine: true,
    importOrder: [
        '<UNKNOWN>',
        '^@veneer/(.*)$',
        '^@br/(.*)$',
        '^graphics',
        '^contexts',
        '^components',
        '^scripts',
        '^utils',
        '^styles',
        '^(.*).svg',
        '^(.*).scss',
        '^../',
        '^./',
    ],
};
