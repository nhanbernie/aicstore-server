import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Query,
  Patch,
} from '@nestjs/common';
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
import { UpdateProfileDto } from '../users/dto/user.dto';
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
  @ApiResponse({ 
    status: 200, 
    description: 'Profile updated successfully' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing token' 
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
}
