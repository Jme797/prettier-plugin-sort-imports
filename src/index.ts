import * as _generate from '@babel/generator';
import * as parser from '@babel/parser';
import * as _traverse from '@babel/traverse';
import * as t from '@babel/types';
import {parsers as babelParsers} from 'prettier/plugins/babel';
import {parsers as typescriptParsers} from 'prettier/plugins/typescript';

const traverse = _traverse.default;
const generate = _generate.default;

const {expressionStatement, stringLiteral} = t;

const NEW_LINE_CHARACTERS = '\n\n';
const NEW_LINE_PLACE_HOLDER_NODE = 'NEW_LINE_PLACE_HOLDER_NODE';
const NEW_LINE = expressionStatement(stringLiteral(NEW_LINE_PLACE_HOLDER_NODE));

const UNKNOWN = '<UNKNOWN>';

interface SortImportsConfig {
    importOrder: string[];
}

export function sortImports(code: string, config: SortImportsConfig): string {
    const ast = parser.parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
    });

    const importDeclarations: t.ImportDeclaration[] = [];

    traverse(ast, {
        ImportDeclaration(path: any) {
            importDeclarations.push(path.node);
        },
    });

    // Initialize the import groups object
    const importGroups: {[key: string]: t.ImportDeclaration[]} = {};
    if (config.importOrder) {
        config.importOrder.forEach(order => {
            importGroups[order] = [];
        });
    }
    if (!config.importOrder.includes(UNKNOWN)) {
        importGroups[UNKNOWN] = [];
    }

    // Function to get the group key based on the importOrder patterns
    const getGroupKey = (importPath: string): string => {
        if (!config.importOrder) return UNKNOWN;
        for (let i = 0; i < config.importOrder.length; i++) {
            const pattern = config.importOrder[i];
            const regex = new RegExp(pattern);
            if (regex.test(importPath)) {
                return pattern;
            }
        }
        return UNKNOWN;
    };

    // Group import declarations by custom order or source value
    importDeclarations.forEach(declaration => {
        const groupKey = getGroupKey(declaration.source.value);
        importGroups[groupKey].push(declaration);
    });

    // Join the import groups back together, maintaining the order specified in the config
    const sortedImports: (t.ImportDeclaration | t.ExpressionStatement)[] = [];
    if (config.importOrder) {
        config.importOrder.forEach(order => {
            if (importGroups[order].length > 0) {
                importGroups[order].forEach(declaration => {
                    declaration.specifiers.sort((a, b) => {
                        if (a.local.name < b.local.name) return -1;
                        if (a.local.name > b.local.name) return 1;
                        return 0;
                    });
                });
                sortedImports.push(...importGroups[order]);
                sortedImports.push(NEW_LINE);
            }
        });
    }
    if (!config.importOrder.includes(UNKNOWN) && importGroups[UNKNOWN].length > 0) {
        sortedImports.push(...importGroups[UNKNOWN]);
        sortedImports.push(NEW_LINE);
    }

    // Remove the last blank line if it exists
    if (sortedImports.length > 0 && t.isEmptyStatement(sortedImports[sortedImports.length - 1])) {
        sortedImports.pop();
    }

    const newAst = {
        ...ast,
        program: {
            ...ast.program,
            body: [...sortedImports, ...ast.program.body.filter(node => node.type !== 'ImportDeclaration')],
        },
    };

    const {code: transformedCode} = generate(newAst, {retainLines: true});

    return transformedCode.replace(new RegExp(`"${NEW_LINE_PLACE_HOLDER_NODE}";`, 'gi'), NEW_LINE_CHARACTERS).trim();
}

const preprocess = (code: string, options: any): string => {
    const config: SortImportsConfig = {
        importOrder: options.importOrder,
    };
    return sortImports(code, config);
};

export const options = {
    importOrder: {
        type: 'path',
        array: true,
        default: [UNKNOWN, '^../', '^./'],
        category: 'Global',
        description: 'Configuration for sorting imports.',
    },
};

export const parsers = {
    babel: {
        ...babelParsers.babel,
        preprocess,
    },
    typescript: {
        ...typescriptParsers.typescript,
        preprocess,
    },
};
