import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validate every request body against its DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties not in the DTO
      forbidNonWhitelisted: true, // ...and reject requests that send them
      transform: true, // turn payloads into DTO instances (runs @Transform)
    }),
  );

  // Applies @Exclude() etc. on returned entities (e.g. hides User.password)
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Close DB connections cleanly on SIGTERM/SIGINT (e.g. container shutdown)
  app.enableShutdownHooks();

  const port = app.get(ConfigService).get<number>('PORT', 3000);
  await app.listen(port);
  console.log(`SplitEase API running on http://localhost:${port}`);
}
void bootstrap();
