import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class PaginationDto {
  @ApiProperty({ example: 1 })
  @Expose()
  page: number;

  @ApiProperty({ example: 24 })
  @Expose()
  limit: number;

  @ApiProperty({ example: 1287 })
  @Expose()
  total: number;

  @ApiProperty({ example: 54 })
  @Expose()
  totalPages: number;
}
