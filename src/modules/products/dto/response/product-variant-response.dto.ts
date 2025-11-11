import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ProductVariantResponseDto {
  @ApiProperty({ example: 'var-1' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'BOSCH-X200-13MM' })
  @Expose()
  sku: string;

  @ApiProperty({ example: 1299000 })
  @Expose()
  price?: number;

  @ApiProperty({ example: 50 })
  @Expose()
  stockQty: number;

  @ApiProperty({ example: { chuck_size: '13mm' } })
  @Expose()
  options: Record<string, string>;

  @ApiProperty({ required: false })
  @Expose()
  specs?: Record<string, any>;
}
