import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    create: jest.Mock;
    findByEmailWithPassword: jest.Mock;
  };
  let jwtService: { signAsync: jest.Mock };

  beforeEach(async () => {
    usersService = { create: jest.fn(), findByEmailWithPassword: jest.fn() };
    jwtService = { signAsync: jest.fn().mockResolvedValue('signed.jwt.token') };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  describe('register', () => {
    it('stores a bcrypt hash, never the plain password', async () => {
      usersService.create.mockImplementation(async (data) => data);

      await service.register({
        name: 'Alice',
        email: 'alice@x.com',
        password: 'secret-pass',
      });

      const saved = usersService.create.mock.calls[0][0];
      expect(saved).toMatchObject({ name: 'Alice', email: 'alice@x.com' });
      expect(saved.password).not.toBe('secret-pass');
      await expect(bcrypt.compare('secret-pass', saved.password)).resolves.toBe(
        true,
      );
    });
  });

  describe('login', () => {
    const user = { id: 'u1', email: 'alice@x.com' } as User;

    beforeAll(async () => {
      user.password = await bcrypt.hash('secret-pass', 4); // low cost for speed
    });

    it('returns a JWT for valid credentials', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(user);

      const result = await service.login({
        email: 'alice@x.com',
        password: 'secret-pass',
      });

      expect(result).toEqual({ accessToken: 'signed.jwt.token' });
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'u1',
        email: 'alice@x.com',
      });
    });

    it('rejects a wrong password', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(user);

      await expect(
        service.login({ email: 'alice@x.com', password: 'wrong-pass' }),
      ).rejects.toThrow(UnauthorizedException);
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('rejects an unknown email with the same error', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@x.com', password: 'secret-pass' }),
      ).rejects.toThrow('Invalid email or password');
    });
  });
});
