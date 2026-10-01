import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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

  // OpenAPI docs at /api/docs (raw JSON at /api/docs-json)
  const swaggerConfig = new DocumentBuilder()
    .setTitle('SplitEase API')
    .setDescription('Expense-splitting REST API: groups, expenses and balances')
    .setVersion('0.1.0')
    .addBearerAuth() // enables the "Authorize" button for JWT routes
    .build();
  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig, {
      autoTagControllers: false, // use only our explicit @ApiTags
    }),
  );

  // PORT is injected by the host (e.g. Render); bind 0.0.0.0 so it's reachable from outside the container
  const port = Number(app.get(ConfigService).get('PORT', 3000));
  await app.listen(port, '0.0.0.0');
  console.log(`SplitEase API listening on port ${port}`);
  console.log(`API docs at /api/docs`);
}
void bootstrap();
