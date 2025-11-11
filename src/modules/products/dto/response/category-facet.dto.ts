import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CategoryFacetDto {
  @ApiProperty({ example: 'cat-tools' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'Dụng cụ điện' })
  @Expose()
  name: string;

  @ApiProperty({ example: 205 })
  @Expose()
  count: number;
}
