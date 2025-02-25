import * as prettier from 'prettier';

import * as plugin from '../src/index';

const format = async (code: string, importOrder?: string[]) => {
    return await prettier.format(code, {
        parser: 'typescript',
        plugins: [plugin],
        singleQuote: true,
        tabWidth: 4,
        importOrder: importOrder,
    });
};

describe('Prettier Sort Imports Plugin', () => {
    it('should separate imports by groups as configured', async () => {
        const code = [
            "import z from 'z';",
            "import a from 'a';",
            "import b from 'b';",
            "import * as c from 'c';",
            "import { e, d } from 'd';",
            "import f from '../f';",
            "import g from './g';",
            '',
        ].join('\n');
        const expected = [
            "import a from 'a';",
            "import b from 'b';",
            "import * as c from 'c';",
            "import { d, e } from 'd';",
            "import z from 'z';",
            '',
            "import f from '../f';",
            '',
            "import g from './g';",
            '',
        ].join('\n');
        const result = await format(code, ['<UNKNOWN>', '^../', '^./']);
        expect(result).toBe(expected);
    });

    it('should not affect imports in the format import * as something from', async () => {
        const code = ["import * as a from 'a';", "import * as b from 'b';", "import c from 'c';"].join('\n');
        const expected = ["import * as a from 'a';", "import * as b from 'b';", "import c from 'c';", ''].join('\n');
        const result = await format(code, ['<UNKNOWN>', '^../', '^./']);
        expect(result).toBe(expected);
    });

    it('should keep default imports as default imports and specifiers as specifiers', async () => {
        const code = ["import a, { b, c } from 'a';", "import d from 'd';"].join('\n');
        const expected = ["import a, { b, c } from 'a';", "import d from 'd';", ''].join('\n');
        const result = await format(code, ['<UNKNOWN>', '^../', '^./']);
        expect(result).toBe(expected);
    });

    it('should sort imports alphabetically inside each group', async () => {
        const code = ["import z from 'z';", "import a from 'a';", "import b from 'b';"].join('\n');
        const expected = ["import a from 'a';", "import b from 'b';", "import z from 'z';", ''].join('\n');
        const result = await format(code, ['<UNKNOWN>', '^../', '^./']);
        expect(result).toBe(expected);
    });

    it('should separate groups by a line break', async () => {
        const code = ["import a from 'a';", "import b from 'b';", "import c from '../c';", "import d from './d';"].join(
            '\n'
        );
        const expected = [
            "import a from 'a';",
            "import b from 'b';",
            '',
            "import c from '../c';",
            '',
            "import d from './d';",
            '',
        ].join('\n');
        const result = await format(code, ['<UNKNOWN>', '^../', '^./']);
        expect(result).toBe(expected);
    });

    it('should not affect formatting outside of top-level imports', async () => {
        const code = ["import a from 'a';", "import b from 'b';", '', 'const x = 1;', 'const y = 2;'].join('\n');
        const expected = ["import a from 'a';", "import b from 'b';", '', 'const x = 1;', 'const y = 2;', ''].join(
            '\n'
        );
        const result = await format(code, ['<UNKNOWN>']);
        expect(result).toBe(expected);
    });

    it('should keep comments attached to the trailing nodes when sorted', async () => {
        const code = ['// comment for a', "import a from 'a';", '// comment for b', "import b from 'b';"].join('\n');
        const expected = [
            '// comment for a',
            "import a from 'a';",
            '',
            '// comment for b',
            "import b from 'b';",
            '',
        ].join('\n');
        const result = await format(code, ['^a', '^b']);
        expect(result).toBe(expected);
    });

    it('should work with different importOrder configurations', async () => {
        const code = [
            "import z from 'z';",
            "import a from 'a';",
            "import b from 'b';",
            "import * as c from 'c';",
            "import { d, e } from 'd';",
            "import f from '../f';",
            "import g from './g';",
        ].join('\n');
        const expected = [
            "import a from 'a';",
            "import b from 'b';",
            "import * as c from 'c';",
            "import { d, e } from 'd';",
            "import z from 'z';",
            '',
            "import f from '../f';",
            '',
            "import g from './g';",
            '',
        ].join('\n');
        const result = await format(code, ['<UNKNOWN>', '^../', '^./']);
        expect(result).toBe(expected);

        const expectedDifferentOrder = [
            "import f from '../f';",
            '',
            "import g from './g';",
            '',
            "import a from 'a';",
            "import b from 'b';",
            "import * as c from 'c';",
            "import { d, e } from 'd';",
            "import z from 'z';",
            '',
        ].join('\n');
        const resultDifferentOrder = await format(code, ['^../', '^./', '<UNKNOWN>']);
        expect(resultDifferentOrder).toBe(expectedDifferentOrder);
    });

    it('Injects the code back in to the code at the same location it was removed', async () => {
        const code = [
            '// Some comment',
            'const abc = () => "abc";',
            '',
            '',
            'import c from "c";',
            'import a from "a";',
            '',
            'const def = () => "def";',
            ''
        ].join('\n')
        const expectedFormatted = [
            '// Some comment',
            "const abc = () => 'abc';",
            '',
            "import a from 'a';",
            "import c from 'c';",
            '',
            "const def = () => 'def';",
            ''
        ].join('\n')

        const result = await format(code, ['<UNKNOWN>']);
        expect(result).toBe(expectedFormatted);
    })
});
