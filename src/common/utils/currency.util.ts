/**
 * Currency formatting utilities
 */
export class CurrencyUtil {
  /**
   * Format number to Vietnamese currency format
   * @param amount - Amount as string or number (e.g., "429000.00" or 429000)
   * @returns Formatted string (e.g., "429.000 ₫")
   */
  static formatVND(amount: string | number): string {
    // Convert string to number if needed
    const numericAmount = typeof amount === 'string' 
      ? parseFloat(amount) 
      : amount;

    // Handle invalid numbers
    if (isNaN(numericAmount)) {
      return '0 ₫';
    }

    // Format with Vietnamese locale (dot as thousand separator)
    const formatted = new Intl.NumberFormat('vi-VN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numericAmount);

    return `${formatted} ₫`;
  }

  /**
   * Format currency based on currency code
   * @param amount - Amount as string or number
   * @param currency - Currency code ("VND", "USD", etc.)
   * @returns Formatted string
   */
  static format(amount: string | number, currency: string = 'VND'): string {
    const numericAmount = typeof amount === 'string' 
      ? parseFloat(amount) 
      : amount;

    if (isNaN(numericAmount)) {
      return currency === 'VND' ? '0 ₫' : '$0.00';
    }

    switch (currency.toUpperCase()) {
      case 'VND':
        return this.formatVND(numericAmount);
      
      case 'USD':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(numericAmount);
      
      default:
        return `${numericAmount.toLocaleString()} ${currency}`;
    }
  }

  /**
   * Format multiple money fields in an object
   * @param obj - Object containing money fields
   * @param fields - Array of field names to format
   * @param currency - Currency code
   * @returns New object with formatted fields
   */
  static formatMoneyFields<T extends Record<string, any>>(
    obj: T,
    fields: (keyof T)[],
    currency: string = 'VND',
  ): T {
    const result = { ...obj };
    
    fields.forEach((field) => {
      if (result[field] !== null && result[field] !== undefined) {
        result[field] = this.format(result[field], currency) as any;
      }
    });

    return result;
  }
}
