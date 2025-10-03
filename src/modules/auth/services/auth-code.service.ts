import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { User } from '../../users/entity/user.schema';
import { EmailService } from './email.service';
import { UsersService } from 'src/modules/users';
import { AuthCode } from '../entity/auth-code.schema';
import { RefreshTokenService } from './refresh-token.service';
import { AuthService } from '../auth.service';
import { ROLE } from '@/common/enums/auth.enums';
import { AuthResponseDto } from '../dto/auth-response.dto';

@Injectable()
export class AuthCodeService {
  constructor(
    @InjectRepository(AuthCode)
    private readonly authCodeRepository: Repository<AuthCode>,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  async generateAuthCode(
    userId: string,
    redirectUri?: string,
    expiresInMinutes = 5,
  ) {
    // vô hiệu hóa code cũ (nếu có)
    await this.authCodeRepository.update(
      { userId, isUsed: false },
      { isUsed: true },
    );

    // Tạo code mới
    const code = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    const authCode = this.authCodeRepository.create({
      code,
      userId,
      redirectUri,
      expiresAt,
      isUsed: false,
    });

    await this.authCodeRepository.save(authCode);

    return authCode;
  }

  async oAuthLogin(email: string, redirectUri: string): Promise<string> {
    let user = await this.usersService.findByEmail(email);

    if (!user) {
      user = await this.usersService.create({
        email,
        roles: [ROLE.USER],
      });
    }

    const authCode = await this.generateAuthCode(user.id, redirectUri);
    return authCode.code;
  }

  async validateAuthCode(code: string): Promise<AuthResponseDto> {
    // 1. Tìm code trong DB
    const authCode = await this.authCodeRepository.findOne({ where: { code } });
    if (!authCode) {
      throw new NotFoundException('Auth code not found');
    }

    // 2. Kiểm tra hợp lệ
    if (!authCode.isValid()) {
      throw new BadRequestException('Auth code is invalid or expired');
    }

    // 3. Đánh dấu code đã dùng (one-time)
    authCode.isUsed = true;
    await this.authCodeRepository.save(authCode);

    const userId = authCode.userId;

    // 4. Tạo Access Token và Refresh Token
    const user = await this.usersService.findById(userId);
    const { accessToken } = await this.authService.generateAccessToken(user);
    const refreshToken =
      await this.refreshTokenService.generateRefreshToken(user);

    return { accessToken, refreshToken: refreshToken.token, user };
  }
}
