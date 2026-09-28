import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { User } from './entities/user.entity';

// Postgres error code for unique constraint violations
const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
  ) {}

  findById(id: string): Promise<User | null> {
    return this.usersRepo.findOneBy({ id });
  }

  // Explicitly selects the password hash (hidden by default) for login checks
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async create(data: Pick<User, 'name' | 'email' | 'password'>): Promise<User> {
    try {
      return await this.usersRepo.save(this.usersRepo.create(data));
    } catch (err) {
      // The unique index is the source of truth, so concurrent sign-ups can't both succeed
      if (
        err instanceof QueryFailedError &&
        (err.driverError as { code?: string }).code === PG_UNIQUE_VIOLATION
      ) {
        throw new ConflictException('Email is already registered');
      }
      throw err;
    }
  }
}
