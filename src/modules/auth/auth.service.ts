import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { RegisterDto, LoginDto, AuthResponseDto, RefreshResponseDto } from './dto/auth-response.dto';
import { User } from '../users/entity/user.schema';
import { ROLE } from '../../common/enums/auth.enums';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Create new user with default USER role
    const user = await this.usersService.create({
      ...registerDto,
      roles: [ROLE.USER],
    });

    // Generate tokens
    const { accessToken } = await this.generateAccessToken(user);
    const refreshTokenEntity = await this.refreshTokenService.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken: refreshTokenEntity.token,
      user: {
        id: user.id,
        email: user.email,
        roles: user.roles,
      },
    };
  }

  async login(user: User): Promise<AuthResponseDto> {
    const { accessToken } = await this.generateAccessToken(user);
    const refreshTokenEntity = await this.refreshTokenService.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken: refreshTokenEntity.token,
      user: {
        id: user.id,
        email: user.email,
        roles: user.roles,
      },
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && await user.validatePassword(password)) {
      return user;
    }
    return null;
  }

  async refreshTokens(refreshToken: string): Promise<RefreshResponseDto> {
    const user = await this.refreshTokenService.verifyRefreshToken(refreshToken);
    
    // Generate new tokens
    const { accessToken } = await this.generateAccessToken(user);
    const newRefreshTokenEntity = await this.refreshTokenService.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken: newRefreshTokenEntity.token,
    };
  }

  async logout(refreshToken: string): Promise<{ message: string }> {
    try {
      await this.refreshTokenService.revokeRefreshTokenByToken(refreshToken);
      return { message: 'Logged out successfully' };
    } catch (error) {
      // Even if the token is invalid, we consider logout successful
      return { message: 'Logged out successfully' };
    }
  }

  async logoutAllDevices(userId: string): Promise<{ message: string }> {
    await this.refreshTokenService.revokeRefreshTokensByUserId(userId);
    return { message: 'Logged out from all devices successfully' };
  }

  private async generateAccessToken(user: User): Promise<{ accessToken: string }> {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn'),
    });

    return { accessToken };
  }
}
