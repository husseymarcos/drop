import { DropCli } from './src/cli/cli.ts';

const cli = new DropCli();
await cli.run(process.argv.slice(2));
