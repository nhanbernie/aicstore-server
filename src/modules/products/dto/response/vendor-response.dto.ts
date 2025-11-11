import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class VendorResponseDto {
  @ApiProperty({ example: 'v-001' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'Vật Tư ABC' })
  @Expose()
  businessName: string;

  @ApiProperty({ example: 'contact@vattuabc.com' })
  @Expose()
  businessEmail?: string;
}
