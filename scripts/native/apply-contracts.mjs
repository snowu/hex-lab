import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {formatBundle} from './format-code.mjs';
const root = path.resolve(import.meta.dirname, '../..');
const contracts = path.join(import.meta.dirname, 'contracts');
export function applyContracts(bundle) {
    const folder = path.join(contracts, bundle.slug + '-' + bundle.language);
    if (!fs.existsSync(folder)) return bundle;
    for (const section of ['starter', 'solution', 'tests']) {
        const directory = path.join(folder, section);
        if (!fs.existsSync(directory)) continue;
        for (const filename of fs.readdirSync(directory)) bundle[section][filename] = fs.readFileSync(path.join(directory, filename), 'utf8');
    }
    return bundle;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    for (const folder of fs.readdirSync(contracts)) {
        const file = path.join(root, 'content/katas/native', folder + '.json');
        const bundle = JSON.parse(fs.readFileSync(file, 'utf8'));
        applyContracts(bundle);
        formatBundle(bundle);
        fs.writeFileSync(file, JSON.stringify(bundle));
        console.log('Applied ' + folder);
    }
}
