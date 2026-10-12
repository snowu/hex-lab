import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';

const cachedClang = path.join(os.homedir(), '.cache/native-tools/clang-format/clang_format/data/bin/clang-format');
export const clangFormat = process.env.CLANG_FORMAT || (fs.existsSync(cachedClang) ? cachedClang : 'clang-format');
const cachedZig = path.join(os.homedir(), '.cache/native-tools/zig/zig');
export const zigFormat = process.env.ZIG || (fs.existsSync(cachedZig) ? cachedZig : 'zig');
export function formatCode(filename, source) {
    if (/\.(c|h|cpp|hpp|cc)$/.test(filename)) {
        // Long literal splitting can make clang-format adjust call wrapping on
        // its next pass. Store the fixed point, not an intermediate layout.
        let current = source;
        for (let pass = 0; pass < 5; ++pass) {
            const next = execFileSync(clangFormat, ['--assume-filename=' + path.basename(filename), '-style={BasedOnStyle: LLVM, IndentWidth: 4, ColumnLimit: 88}'], {input: current, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024});
            if (next === current) return current;
            current = next;
        }
        throw new Error('clang-format did not converge for ' + filename);
    }
    if (filename.endsWith('.zig')) {
        return execFileSync(zigFormat, ['fmt', '--stdin'], {input: source, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024});
    }
    return source;
}
export function formatBundle(bundle) {
    for (const section of ['starter', 'solution', 'tests']) {
        for (const [filename, source] of Object.entries(bundle[section])) bundle[section][filename] = formatCode(filename, source);
    }
    return bundle;
}
