import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Prisma } from '../../../infrastructure/database/prisma';
import { ConfigModule } from '@nestjs/config';
import { MailModule } from 'src/common/mail/send/mail.module';
import { PassportModule } from '@nestjs/passport';
import { tokenModule } from '../token';
import { JwtStrategy } from './strategy/jwt.strategy';

@Module({
  imports: [
    ConfigModule,
    MailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    tokenModule.tokenRefreshModule
  ],
  controllers: [AuthController],
  providers: [AuthService, Prisma.PrismaService, JwtStrategy],
  exports: [AuthService, JwtStrategy],
})
export class AuthModule {}