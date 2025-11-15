import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.logger.log('EmailService initialized with Gmail SMTP');
  }

  async sendPasswordReset(to: string, resetToken: string) {
    try {
      const clientUrl = this.configService.get<string>('CLIENT_URL') || 'http://localhost:3000';
      // Fix double slash issue
      const baseUrl = clientUrl.replace(/\/$/, '');
      const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

      this.logger.log(`Sending password reset email to: ${to}`);
      this.logger.debug(`Reset URL: ${resetUrl}`);

      await this.mailerService.sendMail({
        to,
        subject: 'Reset your password',
        html: `<p>Click here to reset your password: <a href="${resetUrl}">${resetUrl}</a></p>`,
        text: `Click here to reset your password: ${resetUrl}`,
      }); 

      this.logger.log(`Email sent successfully via SMTP to: ${to}`);
      this.logger.log(`Check inbox/spam folder for: ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${to}:`, error);
      if (error instanceof Error) {
        this.logger.error(`Error details: ${error.message}`);
        this.logger.error(`Stack: ${error.stack}`);
        
        // Provide user-friendly error messages
        if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
          throw new Error(
            'Không thể kết nối đến máy chủ email. ' +
            'Có thể do hạn chế mạng hoặc máy chủ email không khả dụng. ' +
            'Vui lòng thử lại sau hoặc liên hệ hỗ trợ.'
          );
        }
        if (error.message.includes('ECONNREFUSED') || error.message.includes('Connection refused')) {
          throw new Error(
            'Kết nối đến máy chủ email bị từ chối. ' +
            'Vui lòng kiểm tra cấu hình email hoặc thử lại sau.'
          );
        }
        if (error.message.includes('authentication') || error.message.includes('Invalid login')) {
          throw new Error(
            'Xác thực email không thành công. ' +
            'Vui lòng kiểm tra thông tin đăng nhập email.'
          );
        }
      }
      throw error;
    }
  }
}
