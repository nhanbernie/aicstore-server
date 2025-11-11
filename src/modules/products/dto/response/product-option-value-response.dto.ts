import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ProductOptionValueResponseDto {
  @ApiProperty({ example: 'val-1' })
  @Expose()
  id: string;

  @ApiProperty({ example: '10mm' })
  @Expose()
  value: string;
}
