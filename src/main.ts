import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { CatchAllExceptionsFilter } from './common/filters/catch-all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { RedisIoAdapter } from './redis/redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));
  app.use(helmet());

  const configService = app.get(ConfigService);
  const redisIoAdapter = new RedisIoAdapter(app, configService);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  app.setGlobalPrefix('api');

  // CORS_ORIGIN 支持逗号分隔多个来源
  const corsOrigins = (configService.get<string>('CORS_ORIGIN') || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const enableCredentials = configService.get('CORS_CREDENTIALS') !== 'false';
  if (enableCredentials && corsOrigins.length === 0) {
    app.get(Logger).warn(
      'CORS_CREDENTIALS=true 且未配置 CORS_ORIGIN：所有跨域请求都会被静默拒绝。' +
        '如需浏览器/H5 跨域调试，请配置 CORS_ORIGIN（支持逗号分隔多个来源）。',
    );
  }
  app.enableCors({
    origin:
      corsOrigins.length > 0
        ? corsOrigins
        : enableCredentials
          ? []
          : '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: enableCredentials,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new CatchAllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('NightDeal API')
      .setDescription('阿瓦隆桌游辅助工具后端 API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 3000;
  // 让 PrismaService / RedisService 的 OnModuleDestroy 在进程退出时被执行
  app.enableShutdownHooks();
  await app.listen(port);
  app.get(Logger).log(`NightDeal backend is running on: http://localhost:${port}`);
  app.get(Logger).log(`Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap().catch((error) => {
  console.error('Fatal error during bootstrap:', error);
  process.exit(1);
});
