import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  // GET /health — simple liveness check
  @Get()
  check(): { status: string } {
    return { status: 'ok' };
  }
}
