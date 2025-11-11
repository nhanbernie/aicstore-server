import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ProductImageResponseDto {
  @ApiProperty({ example: 'img-123' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'https://cdn.example.com/products/1.jpg' })
  @Expose()
  url: string;

  @ApiProperty({ example: 1 })
  @Expose()
  position: number;
}
