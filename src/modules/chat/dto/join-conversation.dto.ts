import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class JoinConversationDto {
  @ApiProperty({
    description: 'Vendor ID to chat with',
    example: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  vendorId: string;
}
