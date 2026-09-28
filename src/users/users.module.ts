import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

// Registers the User entity so TypeORM creates the "users" table.
// Service/controller will be added with the auth feature.
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  exports: [TypeOrmModule],
})
export class UsersModule {}
