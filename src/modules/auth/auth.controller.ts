import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiRegister,
  ApiLogin,
  ApiRefreshToken,
  ApiLogout,
  ApiLogoutAll,
  ApiGetProfile,
} from '../../common/decorators/swagger.decorator';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  AuthResponseDto,
  RefreshResponseDto,
} from './dto/auth-response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiRegister()
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiLogin()
  async login(@Request() req, @Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(req.user);
  }

  @Post('refresh')
  @ApiRefreshToken()
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<RefreshResponseDto> {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @ApiLogout()
  async logout(@Body() refreshTokenDto: RefreshTokenDto): Promise<{ message: string }> {
    return this.authService.logout(refreshTokenDto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @ApiLogoutAll()
  async logoutAll(@Request() req): Promise<{ message: string }> {
    return this.authService.logoutAllDevices(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiGetProfile()
  getProfile(@Request() req) {
    return req.user;
  }
}
