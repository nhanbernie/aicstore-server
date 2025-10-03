import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { PasswordResetToken } from '../entity/password-reset.schema';
import { User } from '../../users/entity/user.schema';
import { EmailService } from './email.service';
import { UsersService } from 'src/modules/users';

@Injectable()
export class PasswordResetService {
  constructor(
    @InjectRepository(PasswordResetToken)
    private readonly resetTokenRepository: Repository<PasswordResetToken>,
    private readonly userService: UsersService,
    private readonly emailService: EmailService,
  ) {}

  async requestPasswordReset(email: string): Promise<void> {
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // vô hiệu hóa token cũ (nếu có)
    await this.resetTokenRepository.update(
      { userId: user.id, isUsed: false },
      { isUsed: true },
    );

    // Tạo token mới
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 phút

    // Lưu token vào db
    const resetTokenEntity = this.resetTokenRepository.create({
      token,
      userId: user.id,
      expiresAt,
      isUsed: false,
    });
    await this.resetTokenRepository.save(resetTokenEntity);

    // Gửi email
    await this.emailService.sendPasswordReset(user.email, token);
  }

  async verifyToken(token: string): Promise<User> {
    if (!token) {
      throw new BadRequestException('Token is required');
    }

    const resetToken = await this.resetTokenRepository.findOne({
      where: { token },
      relations: ['user'],
    });

    if (!resetToken || !resetToken.isValid()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    return resetToken.user;
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const resetToken = await this.resetTokenRepository.findOne({
      where: { token },
      relations: ['user'],
    });

    if (!resetToken || !resetToken.isValid()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    await this.userService.update(resetToken.user.id, {
      password: newPassword,
    });

    resetToken.isUsed = true;
    await this.resetTokenRepository.save(resetToken);
  }
}
