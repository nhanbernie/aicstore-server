import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { FacetsDto } from './facets.dto';
import { PaginationDto } from './pagination.dto';
import { ProductListingItemDto } from './product-listing-item.dto';

export class ProductListingResponseDto {
  @ApiProperty({ type: [ProductListingItemDto] })
  @Expose()
  @Type(() => ProductListingItemDto)
  items: ProductListingItemDto[];

  @ApiProperty({ type: FacetsDto, required: false })
  @Expose()
  @Type(() => FacetsDto)
  facets?: FacetsDto;

  @ApiProperty({ type: PaginationDto })
  @Expose()
  @Type(() => PaginationDto)
  pagination: PaginationDto;
}
