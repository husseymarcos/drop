import { join } from 'node:path';

process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

export const fixtureFile = join(process.cwd(), 'tests', 'bedtimestory.txt');
