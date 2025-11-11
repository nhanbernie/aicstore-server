import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CurrencyUtil } from '../utils/currency.util';

/**
 * Interceptor to automatically add formatted currency fields to response
 * Adds "*Formatted" fields for any money field (e.g., totalAmount -> totalAmountFormatted)
 */
@Injectable()
export class CurrencyFormatInterceptor implements NestInterceptor {
  // Money field patterns to detect - COMPREHENSIVE LIST
  private readonly moneyFields = [
    // Amounts
    'amount',
    'totalamount',
    'subtotal',
    'total',
    
    // Prices
    'price',
    'unitprice',
    'saleprice',
    'originalprice',
    'discountprice',
    
    // Fees & Charges
    'fee',
    'shippingfee',
    'servicefee',
    'handlingfee',
    'processingfee',
    
    // Taxes & Discounts
    'tax',
    'taxamount',
    'discount',
    'discountamount',
    
    // Financial
    'spent',
    'totalspent',
    'revenue',
    'totalrevenue',
    'cost',
    'totalcost',
    'balance',
    'payment',
    'refund',
    'salary',
    'wage',
    
    // Order/Transaction related
    'shipping',
    'totalprice',
  ];

  // Fields that should NOT be formatted (counts, quantities, IDs, etc.)
  private readonly excludeFields = [
    'totalorders',
    'ordercount',
    'itemscount',
    'itemcount',
    'count',
    'quantity',
    'qty',
    'stock',
    'stockqty',
    'stockquantity',
    'id',
    'userid',
    'productid',
    'orderid',
    'vendorid',
    'categoryid',
    'variantid',
    'totalsold',
    'sold',
  ];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((response) => {
        // Only format if response has data
        if (!response || !response.data) {
          return response;
        }

        // Format the data
        const formattedData = this.formatData(response.data);

        return {
          ...response,
          data: formattedData,
        };
      }),
    );
  }

  private formatData(data: any): any {
    if (Array.isArray(data)) {
      // Handle arrays
      return data.map((item) => this.formatData(item));
    } else if (data instanceof Date) {
      // Preserve Date objects as-is
      return data;
    } else if (data && typeof data === 'object') {
      // Handle objects
      const formatted = { ...data };

      // Check if object has a currency field
      const currency = formatted.currency || 'VND';

      // Recursively format nested objects
      Object.keys(formatted).forEach((key) => {
        // Skip Date objects and arrays (arrays are handled separately)
        if (
          formatted[key] && 
          typeof formatted[key] === 'object' && 
          !(formatted[key] instanceof Date) &&
          !Array.isArray(formatted[key])
        ) {
          formatted[key] = this.formatData(formatted[key]);
        }

        // Add formatted field for money fields
        if (
          this.isMoneyField(key) &&
          formatted[key] !== null &&
          formatted[key] !== undefined
        ) {
          const formattedKey = `${key}Formatted`;
          formatted[formattedKey] = CurrencyUtil.format(
            formatted[key],
            currency,
          );
        }
      });

      // Handle special case: meta object (pagination)
      if (formatted.data && formatted.meta) {
        formatted.data = this.formatData(formatted.data);
      }

      return formatted;
    }

    return data;
  }

  private isMoneyField(fieldName: string): boolean {
    const lowerField = fieldName.toLowerCase();

    // Check if field should be excluded (counts, IDs, quantities)
    const shouldExclude = this.excludeFields.some((excludePattern) =>
      lowerField.includes(excludePattern),
    );

    if (shouldExclude) {
      return false;
    }

    // Check if field matches money patterns
    return this.moneyFields.some((pattern) => lowerField.includes(pattern));
  }
}
