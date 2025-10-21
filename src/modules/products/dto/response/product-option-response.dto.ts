import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ProductOptionValueResponseDto } from './product-option-value-response.dto';

export class ProductOptionResponseDto {
  @ApiProperty({ example: 'opt-1' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'chuck_size' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'Kích thước đầu kẹp' })
  @Expose()
  displayName?: string;

  @ApiProperty({ type: [ProductOptionValueResponseDto] })
  @Expose()
  @Type(() => ProductOptionValueResponseDto)
  values: ProductOptionValueResponseDto[];
}
