import * as path from 'path';
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: path.join('prisma', 'schema'),
  datasource: {
    url: env('DATABASE_URL')
  }
});
