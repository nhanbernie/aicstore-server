import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { AddressesService } from './addresses.service';
import { CreateAddressDto, UpdateAddressDto, AddressResponseDto } from './dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { ResponseMessage, ResponseMessages } from '@decorators/response-message.decorator';

@ApiTags('Addresses')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create new address',
    description: 'Create a new shipping address (max 5 addresses per user)',
  })
  @ResponseMessage('Địa chỉ đã được tạo thành công')
  async create(
    @Request() req,
    @Body() createAddressDto: CreateAddressDto,
  ): Promise<AddressResponseDto> {
    return await this.addressesService.create(req.user.userId, createAddressDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all addresses',
    description: 'Get all shipping addresses of the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Addresses retrieved successfully',
    type: [AddressResponseDto],
  })
  @ResponseMessage(ResponseMessages.RETRIEVED)
  async findAll(@Request() req): Promise<AddressResponseDto[]> {
    return await this.addressesService.findAll(req.user.userId);
  }

  @Get('default')
  @ApiOperation({
    summary: 'Get default address',
    description: 'Get the default shipping address',
  })
  @ResponseMessage('Địa chỉ mặc định đã được lấy thành công')
  async findDefault(@Request() req): Promise<AddressResponseDto | null> {
    return await this.addressesService.findDefault(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get address by ID',
    description: 'Get a specific address by ID',
  })
  @ApiParam({ name: 'id', description: 'Address ID', type: 'string' })
  @ResponseMessage(ResponseMessages.RETRIEVED)
  async findOne(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AddressResponseDto> {
    return await this.addressesService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update address',
    description: 'Update an existing address',
  })
  @ApiParam({ name: 'id', description: 'Address ID', type: 'string' })
  @ResponseMessage(ResponseMessages.UPDATED)
  async update(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ): Promise<AddressResponseDto> {
    return await this.addressesService.update(id, req.user.userId, updateAddressDto);
  }

  @Patch(':id/set-default')
  @ApiOperation({
    summary: 'Set address as default',
    description: 'Set an address as the default shipping address',
  })
  @ApiParam({ name: 'id', description: 'Address ID', type: 'string' })
  @ResponseMessage('Địa chỉ đã được đặt làm mặc định')
  async setDefault(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AddressResponseDto> {
    return await this.addressesService.setDefault(id, req.user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete address',
    description: 'Delete an address',
  })
  @ApiParam({ name: 'id', description: 'Address ID', type: 'string' })
  @ResponseMessage(ResponseMessages.DELETED)
  async remove(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return await this.addressesService.remove(id, req.user.userId);
  }
}
