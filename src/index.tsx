import {parsers as babelParsers} from 'prettier/plugins/babel';
import {parsers as typescriptParsers} from 'prettier/plugins/typescript';

import parser from '@babel/parser';
import _traverse from '@babel/traverse';
import _generate from '@babel/generator';

const traverse = _traverse.default;
const generate = _generate.default;

const sortImports = (code: string): string => {
    const ast = parser.parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
    });

    const importDeclarations: any[] = [];

    traverse(ast, {
        ImportDeclaration(path: any) {
            importDeclarations.push(path.node);
        },
    });

    // Sort import declarations by source value
    importDeclarations.sort((a, b) => {
        if (a.source.value < b.source.value) return -1;
        if (a.source.value > b.source.value) return 1;
        return 0;
    });

    // Sort specifiers within each import declaration by local name
    importDeclarations.forEach(declaration => {
        declaration.specifiers.sort((a: any, b: any) => {
            if (a.local.name < b.local.name) return -1;
            if (a.local.name > b.local.name) return 1;
            return 0;
        });
    });

    const newAst = {
        ...ast,
        program: {
            ...ast.program,
            body: [...importDeclarations, ...ast.program.body.filter(node => node.type !== 'ImportDeclaration')],
        },
    };

    const {code: transformedCode} = generate(newAst, {retainLines: true});

    return transformedCode;
};

const preprocess = (code: string): string => {
    return sortImports(code);
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
