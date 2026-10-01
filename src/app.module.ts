import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { buildDatabaseOptions } from './database/database.config';
import { ExpensesModule } from './expenses/expenses.module';
import { GroupsModule } from './groups/groups.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // Loads .env into process.env and makes ConfigService available everywhere
    ConfigModule.forRoot({ isGlobal: true }),

    // DB settings come from the environment (shared with the TypeORM CLI)
    TypeOrmModule.forRootAsync({
      useFactory: () => buildDatabaseOptions(),
    }),

    AuthModule,
    ExpensesModule,
    GroupsModule,
    HealthModule,
    UsersModule,
  ],
})
export class AppModule {}
