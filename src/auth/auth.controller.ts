import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/register — 201 with the new user (password excluded)
  @Post('register')
  register(@Body() dto: RegisterDto): Promise<User> {
    return this.authService.register(dto);
  }

  // POST /auth/login — 200 with { accessToken }
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<{ accessToken: string }> {
    return this.authService.login(dto);
  }

  // GET /auth/me — requires "Authorization: Bearer <token>"
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: Request): User {
    // Set by JwtStrategy.validate()
    return req.user as User;
  }
}
