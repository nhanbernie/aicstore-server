import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RefreshToken } from '../entity/refresh-token.schema';
import { User } from '../../users/entity/user.schema';

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async generateRefreshToken(user: User): Promise<RefreshToken> {
    await this.revokeRefreshTokensByUserId(user.id);

    const payload = { sub: user.id, email: user.email, roles: user.roles };
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret');
    const refreshExpiresIn = this.configService.get<string>(
      'jwt.refreshExpiresIn',
    );

    if (!refreshSecret) {
      throw new Error('JWT refresh secret is not configured');
    }

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn,
    });

    const refreshTokenEntity = this.refreshTokenRepository.create({
      token: refreshToken,
      userId: user.id,
      expiresAt: this.getExpirationDate(),
    });

    return this.refreshTokenRepository.save(refreshTokenEntity);
  }

  async verifyRefreshToken(token: string): Promise<User> {
    try {
      const refreshSecret = this.configService.get<string>('jwt.refreshSecret');
      if (!refreshSecret) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      let payload: any;
      try {
        payload = this.jwtService.verify(token, {
          secret: refreshSecret,
        });
      } catch (jwtError: any) {
        if (jwtError.name === 'TokenExpiredError') {
          throw new UnauthorizedException('Refresh token expired');
        } else if (jwtError.name === 'JsonWebTokenError') {
          throw new UnauthorizedException('Invalid refresh token format');
        } else if (jwtError.name === 'NotBeforeError') {
          throw new UnauthorizedException('Refresh token not active yet');
        }
        throw jwtError;
      }

      const refreshTokenEntity = await this.refreshTokenRepository.findOne({
        where: { token, userId: payload.sub },
        relations: ['user'],
      });

      if (!refreshTokenEntity) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (!refreshTokenEntity.isValid()) {
        if (refreshTokenEntity.isRevoked) {
          throw new UnauthorizedException('Refresh token revoked');
        }
        if (refreshTokenEntity.isExpired()) {
          await this.revokeRefreshToken(refreshTokenEntity.id);
          throw new UnauthorizedException('Refresh token expired');
        }
      }

      return refreshTokenEntity.user;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async revokeRefreshToken(refreshTokenId: string): Promise<void> {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { id: refreshTokenId },
    });

    if (!refreshToken) {
      throw new NotFoundException('Refresh token not found');
    }

    refreshToken.isRevoked = true;
    await this.refreshTokenRepository.save(refreshToken);
  }

  async revokeRefreshTokensByUserId(userId: string): Promise<number> {
    const result = await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
    return result.affected || 0;
  }

  async revokeRefreshTokenByToken(token: string): Promise<void> {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token },
    });

    if (refreshToken) {
      refreshToken.isRevoked = true;
      await this.refreshTokenRepository.save(refreshToken);
    }
  }

  private getExpirationDate(): Date {
    const expiresIn = this.configService.get<string>('jwt.refreshExpiresIn') || '7d';
    const now = new Date();
    
    const match = expiresIn.match(/^(\d+)([dhm])$/);
    if (!match) {
      throw new Error('Invalid JWT refresh expiration format');
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'd':
        now.setDate(now.getDate() + value);
        break;
      case 'h':
        now.setHours(now.getHours() + value);
        break;
      case 'm':
        now.setMinutes(now.getMinutes() + value);
        break;
      default:
        throw new Error('Unsupported JWT refresh expiration unit');
    }

    return now;
  }
}
