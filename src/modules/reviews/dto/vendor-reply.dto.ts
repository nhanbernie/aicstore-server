import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class VendorReplyDto {
  @ApiProperty({
    description: 'Vendor reply to review',
    maxLength: 500,
    example: 'Cảm ơn bạn đã ủng hộ shop!',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  vendorReply: string;
}
