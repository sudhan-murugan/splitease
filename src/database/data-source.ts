import 'dotenv/config';
import { DataSource } from 'typeorm';
import { buildDatabaseOptions } from './database.config';

// Used by the TypeORM CLI (migration:generate / run / revert); see package.json scripts
export default new DataSource(buildDatabaseOptions());
