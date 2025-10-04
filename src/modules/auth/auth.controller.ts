import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
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
} from '../../common/decorators/swagger.decorator';
import {
  ResponseMessage,
  ResponseMessages,
} from '../../common/decorators/response-message.decorator';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  AuthResponseDto,
  RefreshResponseDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth-response.dto';
import { PasswordResetService } from './services/password-reset.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetService: PasswordResetService,
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
  getProfile(@Request() req) {
    return req.user;
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
}
