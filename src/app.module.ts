import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ExpensesModule } from './expenses/expenses.module';
import { GroupsModule } from './groups/groups.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // Loads .env into process.env and makes ConfigService available everywhere
    ConfigModule.forRoot({ isGlobal: true }),

    // DB settings come from .env via ConfigService — nothing hard-coded
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.getOrThrow<string>('DB_HOST'),
        port: Number(config.get('DB_PORT', 5432)),
        username: config.getOrThrow<string>('DB_USERNAME'),
        password: config.getOrThrow<string>('DB_PASSWORD'),
        database: config.getOrThrow<string>('DB_NAME'),
        ssl:
          config.get('DB_SSL') === 'true'
            ? { rejectUnauthorized: false }
            : false,
        // Picks up every entity registered via TypeOrmModule.forFeature()
        autoLoadEntities: true,
        // Dev convenience only; switch to migrations before production
        synchronize: config.get('DB_SYNCHRONIZE') === 'true',
      }),
    }),

    AuthModule,
    ExpensesModule,
    GroupsModule,
    HealthModule,
    UsersModule,
  ],
})
export class AppModule {}
