import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './core/security/auth/auth.module';
import { PrismaService } from './infrastructure/database/prisma/prisma.service';
import keycloakConfig from './config/keycloak.config';
import smptConfig from './config/smpt.config';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [keycloakConfig, smptConfig],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 10,
      }
    ]),
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, ],
})
export class AppModule { }