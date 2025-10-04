import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendPasswordReset(to: string, resetToken: string) {
    const resetUrl = `${this.configService.get<string>('CLIENT_URL') || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    await this.mailerService.sendMail({
      to,
      subject: 'Reset your password',
      text: `Click here to reset your password: ${resetUrl}`,
      html: `<p>Click here to reset your password: <a href="${resetUrl}">${resetUrl}</a></p>`,
    });
  }
}
