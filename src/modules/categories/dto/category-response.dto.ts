import { PaginationDto } from '@/modules/products';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class CategoryListItemDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  slug: string;

  @ApiProperty()
  @Expose()
  thumbnail: string;

  @ApiProperty({ required: false })
  @Expose()
  parentId?: string;
}

export class CategoryWithCountDto extends CategoryListItemDto {
  @ApiProperty()
  @Expose()
  productCount: number;
}

export class CategoryListingResponseDto {
  @ApiProperty({ type: [CategoryListItemDto] })
  @Expose()
  @Type(() => CategoryListItemDto)
  items: CategoryListItemDto[];

  @ApiProperty({ type: PaginationDto })
  @Expose()
  @Type(() => PaginationDto)
  pagination: PaginationDto;
}
