import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entity/category.entity';
import { Repository } from 'typeorm';
import { SearchCategoryQueryDto } from './dto/category.dto';
import { plainToClass } from 'class-transformer';
import {
  CategoryListingResponseDto,
  CategoryListItemDto,
  CategoryWithCountDto,
} from './dto/category-response.dto';
import { PaginationDto } from '../products';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async findAll(query: SearchCategoryQueryDto) {
    const { q, parentId, page = 1, limit = 10, productCount } = query;
    const qb = this.categoryRepository.createQueryBuilder('category');

    if (productCount === 'true') {
      qb.leftJoin('products', 'product', 'product.category_id = category.id')
        .addSelect('COUNT(product.id)', 'productCount')
        .groupBy('category.id');
    }

    if (q) {
      qb.andWhere('(category.name ILIKE :kw OR category.slug ILIKE :kw)', {
        kw: `%${q}%`,
      });
    }

    if (parentId) {
      qb.andWhere('category.parent_id = :parentId', { parentId });
    }

    const total = await qb.getCount();
    const totalPages = Math.ceil(total / limit);

    qb.orderBy('category.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const raw = await qb.getRawMany();

    const items = raw.map((row) =>
      plainToClass(CategoryListItemDto, {
        id: row.category_id ?? row.id,
        name: row.category_name ?? row.name,
        slug: row.category_slug ?? row.slug,
        thumbnail: row.category_thumbnail ?? row.thumbnail,
        parentId: row.category_parent_id ?? row.parentId,
        ...(productCount === 'true' && {
          productCount: Number(row.productCount),
        }),
      }),
    );

    const pagination: PaginationDto = {
      page,
      limit,
      total,
      totalPages,
    };

    const result: CategoryListingResponseDto = {
      items,
      pagination,
    };

    return result;
  }
}
