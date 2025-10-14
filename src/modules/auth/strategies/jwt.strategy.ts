import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private usersService: UsersService,
  ) {
    console.log('JWT Strategy Constructor called');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') || 'default-secret',
    });

    console.log('JWT Strategy Config:', {
      secret: configService.get<string>('jwt.secret'),
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload) {
    console.log('JWT Strategy Debug:', {
      payload,
      userId: payload.sub,
      email: payload.email,
      roles: payload.roles,
    });

    const user = await this.usersService.findById(payload.sub);
    console.log('JWT Strategy - User found:', user ? 'YES' : 'NO');

    if (!user) {
      console.log('JWT Strategy - User not found for ID:', payload.sub);
      throw new UnauthorizedException('User not found');
    }

    console.log('JWT Strategy - User validated successfully');
    return {
      userId: payload.sub,
      email: payload.email,
      roles: payload.roles,
    };
  }
}
