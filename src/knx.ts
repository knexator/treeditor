import * as fs from 'fs';
import * as path from 'path';
import { Asdf } from './wobbly_model';
import { Env, myEval } from './base_interpreter';

const filePath: string | undefined = process.argv[2];
if (filePath === undefined) {
    console.error('Error: Please provide a file path as a command-line argument.');
    process.exit(1);
}
const resolvedPath = path.resolve(filePath);
const fileContents = fs.readFileSync(resolvedPath, 'utf8');

const main = Asdf.fromCutre(fileContents);
console.time('eval time');
const env = Env.standard();
env.add('__file__', new Asdf(resolvedPath));
const result = myEval(main, env);
console.timeEnd('eval time');
if (result instanceof Asdf) {
    console.log(result.toCutreString());
}
else {
    console.log(result);
}
