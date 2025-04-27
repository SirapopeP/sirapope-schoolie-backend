import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { autoSeedRootAdmin } from './utils/auto-seed-root-admin';

async function bootstrap() {
  
  await autoSeedRootAdmin();

  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: 'http://localhost:4200',
    methods: ['POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();