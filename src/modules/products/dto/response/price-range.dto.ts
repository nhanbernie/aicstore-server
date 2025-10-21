import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class PriceRangeDto {
  @ApiProperty({ example: 50000 })
  @Expose()
  min: number;

  @ApiProperty({ example: 12000000 })
  @Expose()
  max: number;
}
