import { defineConfig } from '@prisma/config';
import dotenv from 'dotenv';
dotenv.config();
import { databaseUrl } from './src/config/urls.js';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: databaseUrl(),
  },
});
