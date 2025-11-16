import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RefreshTokenService } from './services/refresh-token.service';
import { UsersModule } from '../users/users.module';
import { VendorsModule } from '../vendors/vendors.module';
import { RefreshToken } from './entity/refresh-token.schema';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './services/email.service';
import { PasswordResetToken } from './entity/password-reset.schema';
import { PasswordResetService } from './services/password-reset.service';

@Module({
  imports: [
    UsersModule,
    VendorsModule,
    PassportModule,
    TypeOrmModule.forFeature([RefreshToken, PasswordResetToken]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const expiresIn =
          (configService.get<string>('jwt.expiresIn') ?? '15m') as any;
        return {
          secret: configService.get<string>('jwt.secret'),
          signOptions: {
            expiresIn,
          },
        };
      },
      inject: [ConfigService],
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('MAIL_HOST') || process.env.SMTP_HOST,
          port: parseInt(configService.get<string>('MAIL_PORT') || process.env.SMTP_PORT || '587', 10),
          secure: false, // true for 465, false for other ports
          auth: {
            user: configService.get<string>('MAIL_USER') || process.env.SMTP_USER,
            pass: configService.get<string>('MAIL_PASS') || process.env.SMTP_PASS,
          },
          // ⚠️ Quan trọng để tránh bị chặn
          tls: {
            rejectUnauthorized: false, // Chỉ dùng trong dev
          },
          connectionTimeout: 30000,
          greetingTimeout: 30000,
          socketTimeout: 30000,
        },
        defaults: {
          from: `"AICShop" <${configService.get<string>('MAIL_FROM')}>`,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    RefreshTokenService,
    LocalStrategy,
    JwtStrategy,
    GoogleStrategy,
    EmailService,
    PasswordResetService,
  ],
  exports: [AuthService, JwtStrategy, EmailService, PasswordResetService],
})
export class AuthModule {}
