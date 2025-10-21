import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { CategoryFacetDto } from './category-facet.dto';
import { FacetValueDto } from './facet-value.dto';
import { PriceRangeDto } from './price-range.dto';

export class FacetsDto {
  @ApiProperty({ type: [FacetValueDto] })
  @Expose()
  @Type(() => FacetValueDto)
  brands: FacetValueDto[];

  @ApiProperty({ type: [CategoryFacetDto] })
  @Expose()
  @Type(() => CategoryFacetDto)
  categories: CategoryFacetDto[];

  @ApiProperty({ type: PriceRangeDto })
  @Expose()
  @Type(() => PriceRangeDto)
  priceRange: PriceRangeDto;

  @ApiProperty({ example: { power: ['500W', '800W'], voltage: ['220V', '110V'] } })
  @Expose()
  specs: Record<string, string[]>;
}
