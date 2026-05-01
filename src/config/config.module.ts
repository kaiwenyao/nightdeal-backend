import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
        WX_APPID: Joi.string().required(),
        WX_SECRET: Joi.string().required(),
        WX_LOGIN_TIMEOUT_MS: Joi.number().default(8000),
        JWT_SECRET: Joi.string().min(32).required(),
        OSS_ACCESS_KEY_ID: Joi.string().required(),
        OSS_ACCESS_KEY_SECRET: Joi.string().required(),
        OSS_ENDPOINT: Joi.string().required(),
        OSS_BUCKET: Joi.string().required(),
        OSS_REGION: Joi.string().required(),
        OSS_AVATAR_KEY_PREFIX: Joi.string().default('avatars/'),
        AVATAR_URL_PREFIX: Joi.string().required(),
      }),
    }),
  ],
})
export class AppConfigModule {}
