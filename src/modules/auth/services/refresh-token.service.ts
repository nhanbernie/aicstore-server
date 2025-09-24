import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RefreshToken } from '../schemas/refresh-token.schema';
import { User } from '../../users/schemas/user.schema';

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async generateRefreshToken(user: User): Promise<RefreshToken> {
    // Revoke existing refresh tokens for this user
    await this.revokeRefreshTokensByUserId(user.id);

    const payload = { sub: user.id, email: user.email, roles: user.roles };
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
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
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const refreshTokenEntity = await this.refreshTokenRepository.findOne({
        where: { token, userId: payload.sub },
        relations: ['user'],
      });

      if (!refreshTokenEntity) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (!refreshTokenEntity.isValid()) {
        await this.revokeRefreshToken(refreshTokenEntity.id);
        throw new UnauthorizedException('Refresh token expired or revoked');
      }

      return refreshTokenEntity.user;
    } catch (error) {
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

  async revokeRefreshTokensByUserId(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
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
    const expiresIn = this.configService.get<string>('jwt.refreshExpiresIn');
    const now = new Date();
    
    // Parse the expiration string (e.g., '7d', '24h', '60m')
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
