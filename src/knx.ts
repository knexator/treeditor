import * as fs from 'fs/promises';
import * as path from 'path';
import { Asdf } from './wobbly_model';
import { Env, myEval } from './base_interpreter';

const fileContents: string = await (async () => {
    const filePath: string | undefined = process.argv[2];
    if (filePath === undefined) {
        console.error('Error: Please provide a file path as a command-line argument.');
        process.exit(1);
    }
    const resolvedPath = path.resolve(filePath);
    try {
        return await fs.readFile(resolvedPath, 'utf8');
    }
    catch (err) {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        console.error(`Error reading file: ${(err as Error).message}`);
        process.exit(1);
    }
})();

const main = Asdf.fromCutre(fileContents);
console.time('eval time');
const result = myEval(main, Env.standard());
console.timeEnd('eval time');
if (result instanceof Asdf) {
    console.log(result.toCutreString());
}
else {
    console.log(result);
}
