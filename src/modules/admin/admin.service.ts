import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order, OrderStatus } from '../orders/entities';
import { Repository } from 'typeorm';
import { Payment } from '../payments/entitiy/payment.entity';
import { GetRevenueOvertimeDto } from './dto/getRevenueOverTime.dto';
import { PaymentStatus } from '../payments';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Order) private readonly orderRes: Repository<Order>,
    @InjectRepository(Payment) private readonly paymentRes: Repository<Payment>,
  ) {}

  async getAllOrdersByStatus() {
    const total = await this.orderRes.count();

    const result = await this.orderRes
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(order.id)', 'count')
      .groupBy('order.status')
      .getRawMany();

    return {
      total,
      data: result,
    };
  }

  async getRevenueOverTime(GetRevenueOvertimeDto: GetRevenueOvertimeDto) {
    const { month, year } = GetRevenueOvertimeDto;

    const today = new Date();
    let selectedYear: number;
    let selectedMonth: number;
    let granularity: 'day' | 'month' = 'month';
    let startDate: Date = new Date(today.getFullYear(), 0, 1);
    let endDate: Date = new Date(today.getFullYear(), 11, 31);
    const periods = new Map<
      string,
      {
        period: string;
        revenue: number;
      }
    >();
    for (let m = 1; m <= 12; m++) {
      periods.set(new Date(today.getFullYear(), m - 1, 1).toISOString(), {
        period: new Date(today.getFullYear(), m - 1, 1).toISOString(),
        revenue: 0,
      });
    }
    if (!month && !year) {
      selectedYear = new Date().getFullYear();
    } else if (year && !month) {
      selectedYear = parseInt(year, 10);
      if (isNaN(selectedYear))
        throw new BadRequestException('Year must be a valid number');
    } else if (month && !year) {
      throw new BadRequestException('Year is required when month is provided');
    } else {
      selectedYear = parseInt(year!, 10);
      selectedMonth = parseInt(month!, 10);
      granularity = 'day';
      if (isNaN(selectedYear))
        throw new BadRequestException('Year must be a valid number');
      if (isNaN(selectedMonth) || selectedMonth < 1 || selectedMonth > 12) {
        throw new BadRequestException('Month must be between 1 and 12');
      }
      startDate = new Date(selectedYear, selectedMonth - 1, 1);
      endDate = new Date(selectedYear, selectedMonth, 0);
      periods.clear();
      for (let d = 1; d <= endDate.getDate(); d++) {
        periods.set(
          new Date(selectedYear, selectedMonth - 1, d).toISOString(),
          {
            period: new Date(selectedYear, selectedMonth - 1, d).toISOString(),
            revenue: 0,
          },
        );
      }
    }

    const qb = this.paymentRes
      .createQueryBuilder('payment')
      .innerJoin('payment.order', 'order')
      .select(`DATE_TRUNC('${granularity}', payment.createdAt)`, 'period')
      .addSelect('SUM(payment.amount)', 'revenue')
      .where('payment.status = :payStatus', {
        payStatus: PaymentStatus.SUCCESS,
      })
      .andWhere('order.status = :orderStatus', {
        orderStatus: OrderStatus.DELIVERED,
      })
      .andWhere('payment.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('period')
      .orderBy('period', 'ASC');

    const result = await qb.getRawMany();
    result.forEach((item) => {
      if (periods.has(item.period.toISOString())) {
        periods.set(item.period.toISOString(), {
          period: item.period.toISOString(),
          revenue: parseFloat(item.revenue),
        });
      }
    });

    return {
      data: Array.from(periods.values()),
      granularity,
    };
  }
}
