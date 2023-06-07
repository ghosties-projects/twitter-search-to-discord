import { resolve } from 'path';
import JSON5 from 'json5';
import { readFileSync } from 'fs';

export const path = resolve(__dirname, '..', 'config.json5');
export const contents = readFileSync(path, 'utf-8');
export const config = JSON5.parse(contents);

export default config;