import {parsers as babelParsers} from 'prettier/plugins/babel';
import {parsers as typescriptParsers} from 'prettier/plugins/typescript';

import parser from '@babel/parser';
import _traverse, {NodePath} from '@babel/traverse';
import _generate from '@babel/generator';
import * as t from '@babel/types';

// @ts-expect-error
const generate = _generate.default;
// @ts-expect-error
const traverse = _traverse.default;

function removeUnusedImports(code: string): string {
    const ast = parser.parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
    });

    const usedIdentifiers = new Set<string>();

    traverse(ast, {
        Identifier(path: NodePath) {
            if (path.isReferencedIdentifier()) {
                usedIdentifiers.add(path.node.name);
            }
        },
    });

    traverse(ast, {
        ImportDeclaration(path: NodePath<t.ImportDeclaration>) {
            path.node.specifiers = path.node.specifiers.filter(specifier => usedIdentifiers.has(specifier.local.name));

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

export default {
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
