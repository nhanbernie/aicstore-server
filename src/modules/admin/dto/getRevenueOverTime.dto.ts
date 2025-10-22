import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export class GetRevenueOvertimeDto {
  // @ApiPropertyOptional({
  //   description: 'Time period for revenue calculation',
  //   example: 'month',
  //   enum: ['day', 'week', 'month', 'year'],
  // })
  // @IsOptional()
  // @IsEnum(['day', 'week', 'month', 'year'])
  // granularity?: 'day' | 'week' | 'month' | 'year' = 'month';

  @ApiPropertyOptional({})
  @IsOptional()
  month?: string;

  @ApiPropertyOptional({})
  @IsOptional()
  year?: string;
}
