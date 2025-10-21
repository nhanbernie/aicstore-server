import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CategoryResponseDto {
  @ApiProperty({ example: 'cat-tools' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'Dụng cụ điện' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'dung-cu-dien' })
  @Expose()
  slug: string;
}
