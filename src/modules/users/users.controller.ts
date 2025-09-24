import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ROLE } from '../../common/enums/auth.enums';
import { plainToClass } from 'class-transformer';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(ROLE.ADMIN)
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.usersService.create(createUserDto);
    return plainToClass(UserResponseDto, user, { excludeExtraneousValues: true });
  }

  @Get()
  @Roles(ROLE.ADMIN, ROLE.MODERATOR)
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersService.findAll();
    return users.map(user => 
      plainToClass(UserResponseDto, user, { excludeExtraneousValues: true })
    );
  }

  @Get(':id')
  @Roles(ROLE.ADMIN, ROLE.MODERATOR, ROLE.USER)
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    const user = await this.usersService.findById(id);
    return plainToClass(UserResponseDto, user, { excludeExtraneousValues: true });
  }

  @Patch(':id')
  @Roles(ROLE.ADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.update(id, updateUserDto);
    return plainToClass(UserResponseDto, user, { excludeExtraneousValues: true });
  }

  @Delete(':id')
  @Roles(ROLE.ADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    await this.usersService.remove(id);
    return { message: 'User deleted successfully' };
  }
}
