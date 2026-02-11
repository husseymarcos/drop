import { DropCli } from './src/cli/cli.ts';

const cli = new DropCli();
const args = process.argv.slice(2);
await cli.run(args);
