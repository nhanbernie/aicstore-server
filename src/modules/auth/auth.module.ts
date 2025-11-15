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
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const mailHost = configService.get<string>('MAIL_HOST');
        const mailPort = configService.get<number>('MAIL_PORT') || 587;
        const mailUser = configService.get<string>('MAIL_USER');
        const mailPass = configService.get<string>('MAIL_PASS');
        
        // Determine secure and TLS settings based on port
        const isSecurePort = mailPort === 465;
        const isTlsPort = mailPort === 587;
        
        return {
          transport: {
            host: mailHost,
            port: mailPort,
            secure: isSecurePort, 
            requireTLS: isTlsPort,
            auth: mailUser && mailPass ? {
              user: mailUser,
              pass: mailPass,
            } : undefined,
            connectionTimeout: 30000,
            greetingTimeout: 30000,
            socketTimeout: 30000,
            pool: true,
            maxConnections: 5,
            maxMessages: 100,
          },
          defaults: {
            from: `"AICShop" <${configService.get<string>('MAIL_FROM')}>`,
          },
        };
      },
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
