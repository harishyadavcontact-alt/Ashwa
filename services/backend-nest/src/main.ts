import { randomUUID } from 'crypto';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { PrismaService } from './prisma.service';
import { validateRuntimeEnv } from './config';

async function bootstrap() {
  const env = validateRuntimeEnv();
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.use(helmet());
  app.use((req: any, res: any, next: () => void) => {
    const requestId = req.headers['x-request-id'] || randomUUID();
    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);
    const startedAt = Date.now();
    res.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      console.log(JSON.stringify({ requestId, method: req.method, path: req.url, statusCode: res.statusCode, durationMs }));
    });
    next();
  });
  const prisma = app.get(PrismaService);
  await prisma.enableShutdownHooks(app);
  await app.listen(env.PORT);
}
bootstrap();
