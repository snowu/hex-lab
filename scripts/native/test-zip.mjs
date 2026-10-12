// Verify browser-created archives with Python's independent standard ZIP reader.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';

const context = vm.createContext({window: {}, TextEncoder, Blob});
vm.runInContext(fs.readFileSync(new URL('../../assets/game/native-zip.js', import.meta.url), 'utf8'), context);
const zip = context.window.nativeZip;
const python = String.raw`
import io,json,sys,zipfile
with zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read())) as archive:
    bad = archive.testzip()
    if bad:
        print(json.dumps({'badFile':bad}))
    else:
        print(json.dumps({'files':[
            {'path':info.filename, 'text':archive.read(info).decode('utf-8'),
             'crc':info.CRC, 'size':info.file_size, 'method':info.compress_type,
             'flags':info.flag_bits}
            for info in archive.infolist()
        ]},ensure_ascii=False))
`;
function read(bytes) {
  const result = spawnSync(process.env.PYTHON || 'python3', ['-c', python], {input: bytes, encoding: 'utf8'});
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}
async function bytes(files) { return Buffer.from(await zip(files).arrayBuffer()); }

const files = {
  'exercise.cpp': '#include "include/exercise.h"\nint answer() { return 42; }\n',
  'include/exercise.h': '#pragma once\nint answer();\n',
  'test/exercise_test.cpp': 'int main() { return answer() != 42; }\n',
  'INSTRUCTIONS.md': 'Café · 雪 · 🎮\nEdit, compile, and run the native tests.\n',
  'docs/été-雪.txt': 'Unicode filenames and contents survive extraction.\n',
  'empty.txt': '',
  'crc-vector.txt': '123456789',
};
const archive = await bytes(files);
assert.equal(zip(files).type, 'application/zip');
const actual = read(archive);
assert.equal(actual.files.length, Object.keys(files).length);
for (const [index, [path, text]] of Object.entries(files).entries()) {
  const info = actual.files[index];
  assert.equal(info.path, path);
  assert.equal(info.text, text);
  assert.equal(info.size, Buffer.byteLength(text, 'utf8'));
  assert.equal(info.method, 0, 'native archives use ZIP_STORED');
  assert.ok(info.flags & 0x800, 'filenames declare UTF-8');
}
assert.equal(actual.files.find(file => file.path === 'crc-vector.txt').crc, 0xcbf43926);
assert.deepEqual(read(await bytes({})), {files: []});
assert.deepEqual(read(await bytes({'empty.c': ''})).files.map(file => [file.path, file.text, file.size]), [['empty.c', '', 0]]);

// The independent reader must reject changed data rather than trusting the directory.
const corrupt = Buffer.from(archive);
const firstData = 30 + corrupt.readUInt16LE(26) + corrupt.readUInt16LE(28);
corrupt[firstData] ^= 1;
assert.equal(read(corrupt).badFile, 'exercise.cpp');
for (const path of ['/absolute.c', '../escape.c', 'nested/../escape.c']) {
  assert.throws(() => zip({[path]: 'source'}), /Invalid file path/);
}
console.log('Native ZIP content, Unicode, CRC, empty archives, and path checks passed');
