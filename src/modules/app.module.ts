import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@nestjs-modules/ioredis';

import dataSource from 'src/libs/typeorm.config';
import { env } from 'src/config';
import { AuthenModule } from './authen/authen.module';
import { ProfileModule } from './profile/profile.module';
import { HealthcheckModule } from './healthcheck/healthcheck.module';
import { AuthenService } from './authen/authen.service';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env', isGlobal: true }),
    TypeOrmModule.forRoot(dataSource.options),
    // RedisModule.forRoot({
    //   type: 'single',
    //   url: env.redis.url,
    //   options: {},
    // }),
    HealthcheckModule,
    AuthenModule,
    ProfileModule,
  ],
})
export class AppModule {}
