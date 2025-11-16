import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { VendorsService } from '../vendors/vendors.service';
import { RefreshTokenService } from './services/refresh-token.service';
import {
  RegisterDto,
  LoginDto,
  AuthResponseDto,
  RefreshResponseDto,
} from './dto/auth-response.dto';
import { User } from '../users/entity/user.schema';
import { ROLE } from '../../common/enums/auth.enums';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly vendorsService: VendorsService,
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
    const refreshTokenEntity =
      await this.refreshTokenService.generateRefreshToken(user);

    // Lấy vendor status (sẽ là null vì user mới tạo có role USER)
    const approvedStatus = await this.getVendorStatus(user);

    return {
      accessToken,
      refreshToken: refreshTokenEntity.token,
      user: {
        id: user.id,
        email: user.email,
        roles: user.roles,
        approvedStatus,
      },
    };
  }

  async login(user: User): Promise<AuthResponseDto> {
    const { accessToken } = await this.generateAccessToken(user);
    const refreshTokenEntity =
      await this.refreshTokenService.generateRefreshToken(user);

    // Lấy vendor status nếu user có role VENDOR
    const approvedStatus = await this.getVendorStatus(user);

    return {
      accessToken,
      refreshToken: refreshTokenEntity.token,
      user: {
        id: user.id,
        email: user.email,
        roles: user.roles,
        approvedStatus,
      },
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && user.password && (await user.validatePassword(password))) {
      return user;
    }
    return null;
  }

  async refreshTokens(refreshToken: string): Promise<RefreshResponseDto> {
    const user =
      await this.refreshTokenService.verifyRefreshToken(refreshToken);

    // Generate new tokens
    const { accessToken } = await this.generateAccessToken(user);
    const newRefreshTokenEntity =
      await this.refreshTokenService.generateRefreshToken(user);

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

  private async generateAccessToken(
    user: User,
  ): Promise<{ accessToken: string }> {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: (this.configService.get<string>('jwt.expiresIn') ?? '15m') as any,
    });

    return { accessToken };
  }

  async getVendorStatus(user: User): Promise<string | null> {
    try {
      // Chỉ lấy vendor status nếu user có role VENDOR
      if (user.roles.includes(ROLE.VENDOR)) {
        const vendor = await this.vendorsService.findByUserId(user.id);
        return vendor ? vendor.status : null;
      }
      return null;
    } catch (error) {
      // Nếu có lỗi, trả về null
      return null;
    }
  }

  async getUserProfile(userId: string) {
    // Get fresh user data from database
    const user = await this.usersService.findById(userId);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get vendor status if user has VENDOR role
    const approvedStatus = await this.getVendorStatus(user);

    return {
      userId: user.id,
      email: user.email,
      roles: user.roles,
      approvedStatus,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateUserProfile(userId: string, updateDto: any) {
    // User can only update their own profile
    const user = await this.usersService.findById(userId);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update user profile (only allowed fields)
    const updatedUser = await this.usersService.update(userId, {
      firstName: updateDto.firstName,
      lastName: updateDto.lastName,
      phoneNumber: updateDto.phoneNumber,
    });

    return this.getUserProfile(userId);
  }

  async validateGoogleUser(googleProfile: {
    email: string;
    firstName?: string;
    lastName?: string;
    picture?: string;
  }): Promise<User> {
    // Check if user exists
    let user = await this.usersService.findByEmail(googleProfile.email);

    if (!user) {
      // Create new user if doesn't exist (OAuth users don't need password)
      user = await this.usersService.createOAuthUser({
        email: googleProfile.email,
        firstName: googleProfile.firstName,
        lastName: googleProfile.lastName,
        roles: [ROLE.USER],
      });
    } else {
      // Update user info if exists but doesn't have name
      if (!user.firstName && googleProfile.firstName) {
        await this.usersService.update(user.id, {
          firstName: googleProfile.firstName,
          lastName: googleProfile.lastName,
        });
        // Refresh user data
        user = await this.usersService.findById(user.id);
      }
    }

    return user;
  }
}
