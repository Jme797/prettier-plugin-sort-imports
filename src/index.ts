const {parsers: babelParsers} = require('prettier/plugins/babel');
const {parsers: typescriptParsers} = require('prettier/plugins/typescript');

const parser = require('@babel/parser');
const _traverse = require('@babel/traverse');
const _generate = require('@babel/generator');
const t = require('@babel/types');

const generate = _generate.default;
const traverse = _traverse.default;

function removeUnusedImports(code: string): string {
    const ast = parser.parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
    });

    const usedIdentifiers = new Set<string>();

    traverse(ast, {
        Identifier(path: any) {
            if (path.isReferencedIdentifier()) {
                usedIdentifiers.add(path.node.name);
            }
        },
        JSXIdentifier(path: any) {
            if (path.isReferencedIdentifier()) {
                usedIdentifiers.add(path.node.name);
            }
        },
    });

    traverse(ast, {
        ImportDeclaration(path: any) {
            path.node.specifiers = path.node.specifiers.filter((specifier: any) =>
                usedIdentifiers.has(specifier.local.name)
            );

            if (path.node.specifiers.length === 0) {
                path.remove();
            }
        },
    });

    const {code: transformedCode} = generate(ast, {retainLines: true});

    return transformedCode;
}

const preprocess = (code: string): string => {
    const transformedCode = removeUnusedImports(code);
    return transformedCode;
};

module.exports = {
    parsers: {
        babel: {
            ...babelParsers.babel,
            preprocess,
        },
        typescript: {
            ...typescriptParsers.typescript,
            preprocess,
        },
    },
};
