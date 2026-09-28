import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Close DB connections cleanly on SIGTERM/SIGINT (e.g. container shutdown)
  app.enableShutdownHooks();

  const port = app.get(ConfigService).get<number>('PORT', 3000);
  await app.listen(port);
  console.log(`SplitEase API running on http://localhost:${port}`);
}
void bootstrap();
