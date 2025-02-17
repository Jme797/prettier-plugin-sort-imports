import * as _generate from '@babel/generator';
import * as parser from '@babel/parser';
import * as _traverse from '@babel/traverse';
import * as t from '@babel/types';
import { parsers as babelParsers } from 'prettier/plugins/babel';
import { parsers as typescriptParsers } from 'prettier/plugins/typescript';

const traverse = _traverse.default;
const generate = _generate.default;

const { expressionStatement, stringLiteral } = t;

const NEW_LINE_CHARACTERS = '\n\n';
const NEW_LINE_PLACE_HOLDER_NODE = 'NEW_LINE_PLACE_HOLDER_NODE';
const NEW_LINE = expressionStatement(stringLiteral(NEW_LINE_PLACE_HOLDER_NODE));

const UNKNOWN = '<UNKNOWN>';

interface SortImportsConfig {
    importOrder: string[];
}

export function sortImports(
    code: string,
    { importOrder: importOrderConfig = [UNKNOWN, '^../', '^./'] }: SortImportsConfig
): string {
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
    const importGroups: { [key: string]: t.ImportDeclaration[] } = {};
    if (importOrderConfig) {
        importOrderConfig.forEach(order => {
            importGroups[order] = [];
        });
    }
    if (!importOrderConfig.includes(UNKNOWN)) {
        importGroups[UNKNOWN] = [];
    }

    // Function to get the group key based on the importOrder patterns
    const getGroupKey = (importPath: string): string => {
        if (!importOrderConfig) return UNKNOWN;
        for (let i = 0; i < importOrderConfig.length; i++) {
            const pattern = importOrderConfig[i];
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
    if (importOrderConfig) {
        importOrderConfig.forEach(order => {
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
    if (!importOrderConfig.includes(UNKNOWN) && importGroups[UNKNOWN].length > 0) {
        importGroups[UNKNOWN].forEach(declaration => {
            declaration.specifiers.sort((a, b) => {
                if (a.local.name < b.local.name) return -1;
                if (a.local.name > b.local.name) return 1;
                return 0;
            });
        });
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
            body: [...sortedImports],
        },
    };

    const restAst = {
        ...ast,
        program: {
            ...ast.program,
            body: [...ast.program.body.filter(node => node.type !== 'ImportDeclaration')],
        },
    };

    const { code: transformedImports } = generate(newAst, { retainLines: false });

    const importsCode = transformedImports
        .replace(new RegExp(`"${NEW_LINE_PLACE_HOLDER_NODE}";`, 'gi'), NEW_LINE_CHARACTERS)
        .trim();

    return importsCode;
}

const preprocess = (code: string, options: any): string => {
    // Find the line where the import statements end in the original code
    const originalLines = code.split('\n');
    let importEndLine = 0;
    let insideImport = false;
    for (let i = 0; i < originalLines.length; i++) {
        const line = originalLines[i].trim();
        if (line.startsWith('import') || line.startsWith('//') || line.startsWith('/*') || insideImport) {
            if (line.endsWith(';') || line.endsWith('*/')) {
                insideImport = false;
            } else if (line.startsWith('import') || line.startsWith('/*')) {
                insideImport = true;
            }
        } else if (line !== '') {
            importEndLine = i;
            break;
        }
    }

    // Transform the code to sort imports
    const transformedImports = sortImports(code, options);

    // Extract the rest of the original code
    const nonImportCode = originalLines.slice(importEndLine).join('\n');

    // Combine processed imports with the rest of the original code
    const finalCode = `${transformedImports}${NEW_LINE_CHARACTERS}${nonImportCode}`;

    return finalCode;
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
