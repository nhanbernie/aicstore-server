import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Query,
  Patch,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  ApiRegister,
  ApiLogin,
  ApiRefreshToken,
  ApiLogout,
  ApiLogoutAll,
  ApiGetProfile,
  ApiForgotPassword,
  ApiVerifyResetToken,
  ApiResetPassword,
  ApiGoogleLogin,
  ApiGoogleCallback,
} from '../../common/decorators/swagger.decorator';
import {
  ResponseMessage,
  ResponseMessages,
} from '../../common/decorators/response-message.decorator';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { ConfigService } from '@nestjs/config';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  AuthResponseDto,
  RefreshResponseDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth-response.dto';
import { UpdateProfileDto } from '../users/dto/user.dto';
import { PasswordResetService } from './services/password-reset.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetService: PasswordResetService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @ApiRegister()
  @ResponseMessage(ResponseMessages.REGISTER_SUCCESS)
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiLogin()
  @ResponseMessage(ResponseMessages.LOGIN_SUCCESS)
  async login(
    @Request() req,
    @Body() loginDto: LoginDto,
  ): Promise<AuthResponseDto> {
    return this.authService.login(req.user);
  }

  @Post('refresh')
  @ApiRefreshToken()
  @ResponseMessage(ResponseMessages.TOKEN_REFRESHED)
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<RefreshResponseDto> {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @ApiLogout()
  @ResponseMessage(ResponseMessages.LOGOUT_SUCCESS)
  async logout(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<{ message: string }> {
    return this.authService.logout(refreshTokenDto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @ApiLogoutAll()
  @ResponseMessage(ResponseMessages.LOGOUT_SUCCESS)
  async logoutAll(@Request() req): Promise<{ message: string }> {
    return this.authService.logoutAllDevices(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiGetProfile()
  @ResponseMessage(ResponseMessages.PROFILE_RETRIEVED)
  async getProfile(@Request() req) {
    // Get fresh user data from database instead of relying on JWT payload
    const user = await this.authService.getUserProfile(req.user.userId);
    
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Update user profile',
    description: 'Allows logged-in users to update their own profile (firstName, lastName, phoneNumber)' 
  })
  @ResponseMessage('Cập nhật profile thành công')
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    const updatedUser = await this.authService.updateUserProfile(req.user.userId, updateProfileDto);
    return updatedUser;
  }

  @Post('forgot-password')
  @ApiForgotPassword()
  @ResponseMessage(ResponseMessages.PASSWORD_RESET_EMAIL_SENT)
  async requestPasswordReset(@Body() body: ForgotPasswordDto) {
    return this.passwordResetService.requestPasswordReset(body.email);
  }

  @Get('reset-password/verify')
  @ApiVerifyResetToken()
  @ResponseMessage(ResponseMessages.PASSWORD_RESET_TOKEN_VERIFIED)
  async verifyResetToken(@Query('token') token: string) {
    return this.passwordResetService.verifyToken(token);
  }

  @Post('reset-password')
  @ApiResetPassword()
  @ResponseMessage(ResponseMessages.PASSWORD_RESET_SUCCESS)
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.passwordResetService.resetPassword(
      body.token,
      body.newPassword,
    );
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiGoogleLogin()
  async googleAuth() {
    // Guard redirects to Google OAuth
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiGoogleCallback()
  async googleAuthRedirect(@Request() req, @Res() res: Response): Promise<void> {
    try {
      const authResult = await this.authService.login(req.user);
      
      const frontendUrl = this.configService.get<string>('CLIENT_URL') || 'http://localhost:3001';
      
      // Encode tokens để truyền qua URL (dùng hash fragment để an toàn hơn)
      const tokens = encodeURIComponent(JSON.stringify({
        accessToken: authResult.accessToken,
        refreshToken: authResult.refreshToken,
        user: authResult.user,
      }));
      
      // Trả về HTML page để redirect với hash fragment (tokens không xuất hiện trong server logs)
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Redirecting...</title>
          </head>
          <body>
            <script>
              // Redirect về FE với tokens trong hash fragment
              window.location.href = '${frontendUrl}/auth/callback#tokens=${tokens}';
            </script>
            <p>Redirecting...</p>
            <p>If you are not redirected, <a href="${frontendUrl}/auth/callback#tokens=${tokens}">click here</a>.</p>
          </body>
        </html>
      `;
      
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      const frontendUrl = this.configService.get<string>('CLIENT_URL') || 'http://localhost:3001';
      const errorMsg = error instanceof Error ? error.message : 'Authentication failed';
      
      // Redirect về FE với error trong hash fragment
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Error</title>
          </head>
          <body>
            <script>
              window.location.href = '${frontendUrl}/auth/callback#error=${encodeURIComponent(errorMsg)}';
            </script>
            <p>Redirecting...</p>
            <p>If you are not redirected, <a href="${frontendUrl}/auth/callback#error=${encodeURIComponent(errorMsg)}">click here</a>.</p>
          </body>
        </html>
      `;
      
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    }
  }
}
