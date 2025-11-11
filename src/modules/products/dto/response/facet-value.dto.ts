import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class FacetValueDto {
  @ApiProperty({ example: 'Bosch' })
  @Expose()
  value: string;

  @ApiProperty({ example: 120 })
  @Expose()
  count: number;
}
