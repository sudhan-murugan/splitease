import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Rejects requests without a valid Bearer token (401)
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
