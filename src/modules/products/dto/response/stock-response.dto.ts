import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class StockResponseDto {
  @ApiProperty({ example: 120 })
  @Expose()
  quantity: number;

  @ApiProperty({ example: 'cái' })
  @Expose()
  unit: string;
}
