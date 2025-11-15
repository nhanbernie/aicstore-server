import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('google.clientId') || '',
      clientSecret: configService.get<string>('google.clientSecret') || '',
      callbackURL: configService.get<string>('server.googleCallbackUrl') || '',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;
    const user = {
      email: emails?.[0]?.value,
      firstName: name?.givenName || name?.displayName?.split(' ')[0] || null,
      lastName: name?.familyName || name?.displayName?.split(' ').slice(1).join(' ') || null,
      picture: photos?.[0]?.value || null,
      accessToken,
    };
    
    if (!user.email) {
      return done(new Error('No email found in Google profile'), false);
    }
    
    try {
      const authenticatedUser = await this.authService.validateGoogleUser(user);
      done(null, authenticatedUser);
    } catch (error) {
      done(error as Error, false);
    }
  }
}
