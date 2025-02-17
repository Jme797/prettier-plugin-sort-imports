import * as _generate from '@babel/generator';
import * as parser from '@babel/parser';
import * as _traverse from '@babel/traverse';
import * as t from '@babel/types';
import {parsers as babelParsers} from 'prettier/plugins/babel';
import {parsers as typescriptParsers} from 'prettier/plugins/typescript';

const traverse = _traverse.default;
const generate = _generate.default;

const NEW_LINE_CHARACTERS = '\n\n';

const UNKNOWN = '<UNKNOWN>';

interface SortImportsConfig {
    importOrder: string[];
}

export function sortImports(
    code: string,
    {importOrder: importOrderConfig = [UNKNOWN, '^../', '^./']}: SortImportsConfig
): string {
    const ast = parser.parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
        attachComment: true,
    });

    const importDeclarations: t.ImportDeclaration[] = [];
    const leadingCommentsMap: Map<t.Node, t.Comment[]> = new Map();

    traverse(ast, {
        ImportDeclaration(path: any) {
            importDeclarations.push(path.node);
        },
        Program(path: any) {
            if (path.node.body.length > 0 && path.node.body[0].leadingComments) {
                leadingCommentsMap.set(path.node.body[0], path.node.body[0].leadingComments);
            }
        },
    });

    // Remove trailing comments from every node
    importDeclarations.forEach(declaration => {
        declaration.trailingComments = null;
    });

    // Initialize the import groups object
    const importGroups: {[key: string]: t.ImportDeclaration[]} = {};
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

    // Sort each group alphabetically by path.node.source.value
    Object.keys(importGroups).forEach(groupKey => {
        importGroups[groupKey].sort((a, b) => {
            if (a.source.value < b.source.value) return -1;
            if (a.source.value > b.source.value) return 1;
            return 0;
        });
    });

    // Sort specifiers within each import declaration
    Object.keys(importGroups).forEach(groupKey => {
        importGroups[groupKey].forEach(declaration => {
            const defaultSpecifier = declaration.specifiers.find(specifier => t.isImportDefaultSpecifier(specifier));
            const namedSpecifiers = declaration.specifiers.filter(specifier => t.isImportSpecifier(specifier));

            namedSpecifiers.sort((a, b) => {
                if (a.local.name < b.local.name) return -1;
                if (a.local.name > b.local.name) return 1;
                return 0;
            });

            declaration.specifiers = defaultSpecifier ? [defaultSpecifier, ...namedSpecifiers] : namedSpecifiers;
        });
    });

    // Generate code for each group separately and join them with new lines
    const groupCodes: string[] = [];
    Object.keys(importGroups).forEach(groupKey => {
        if (importGroups[groupKey].length > 0) {
            const groupAst = {
                ...ast,
                program: {
                    ...ast.program,
                    body: [...importGroups[groupKey]],
                },
            };
            const {code: groupCode} = generate(groupAst, {retainLines: false, comments: true});
            groupCodes.push(groupCode.trim());
        }
    });

    const finalTransformedImports = groupCodes.join(NEW_LINE_CHARACTERS);

    return finalTransformedImports;
}

const preprocess = (code: string, options: any): string => {
    const ast = parser.parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
        attachComment: true,
    });

    let lastImportEnd = 0;
    traverse(ast, {
        ImportDeclaration(path: any) {
            lastImportEnd = path.node.loc.end.line;
        },
    });

    const originalLines = code.split('\n');
    const importEndLine = lastImportEnd;

    if (importEndLine === 0) {
        return code;
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
