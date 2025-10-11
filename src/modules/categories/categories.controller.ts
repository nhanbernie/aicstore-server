import { Controller, Get, Query } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { ApiCategoryListing } from '@/common/decorators/swagger.decorator';
import {
  ResponseMessage,
  ResponseMessages,
} from '@/common/decorators/response-message.decorator';
import { SearchCategoryQueryDto } from './dto/category.dto';
import { CategoryListingResponseDto } from './dto/category-response.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiCategoryListing()
  @ResponseMessage(ResponseMessages.RETRIEVED)
  async findAll(
    @Query() query: SearchCategoryQueryDto,
  ): Promise<CategoryListingResponseDto> {
    return await this.categoriesService.findAll(query);
  }
}
