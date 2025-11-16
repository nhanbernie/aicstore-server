import { ProductVariant } from '@products/entities/product-variant.entity';
import { Product } from '@products/entities/product.entity';
import { DataSource } from 'typeorm';

/**
 * Script to sync product.stockQty with sum of all variants' stockQty
 * Run this once to fix existing data
 */
export async function syncAllProductStocks(dataSource: DataSource): Promise<void> {
  console.log('🔄 Starting product stock synchronization...');

  const productRepository = dataSource.getRepository(Product);
  const variantRepository = dataSource.getRepository(ProductVariant);

  // Get all products that have variants
  const products = await productRepository
    .createQueryBuilder('product')
    .leftJoin('product.variants', 'variant')
    .where('variant.id IS NOT NULL')
    .select('product.id')
    .groupBy('product.id')
    .getRawMany();

  let updatedCount = 0;

  for (const { product_id } of products) {
    // Calculate total stock from all variants
    const result = await variantRepository
      .createQueryBuilder('variant')
      .select('SUM(variant.stock_qty)', 'total')
      .where('variant.product_id = :productId', { productId: product_id })
      .getRawOne();

    const totalVariantStock = parseInt(result.total) || 0;

    // Update product stock
    await productRepository.update({ id: product_id }, { stockQty: totalVariantStock });

    updatedCount++;

    if (updatedCount % 10 === 0) {
      console.log(`✅ Synced ${updatedCount} products...`);
    }
  }

  console.log(`✅ Successfully synced stock for ${updatedCount} products with variants`);
}

/**
 * Verify the sync results
 */
export async function verifyProductStocks(dataSource: DataSource): Promise<void> {
  console.log('\n🔍 Verifying product stock synchronization...');

  const result = await dataSource.query(`
    SELECT 
      p.id,
      p.name,
      p.stock_qty as product_stock,
      COALESCE(SUM(v.stock_qty), 0) as variants_total_stock,
      COALESCE(SUM(v.stock_qty), 0) - p.stock_qty as difference
    FROM products p
    LEFT JOIN product_variants v ON v.product_id = p.id
    WHERE v.id IS NOT NULL
    GROUP BY p.id, p.name, p.stock_qty
    HAVING COALESCE(SUM(v.stock_qty), 0) - p.stock_qty != 0
    LIMIT 10
  `);

  if (result.length === 0) {
    console.log('✅ All products are in sync!');
  } else {
    console.log('⚠️  Found products with mismatched stock:');
    result.forEach((row) => {
      console.log(
        `  - ${row.name}: Product=${row.product_stock}, Variants=${row.variants_total_stock}, Diff=${row.difference}`,
      );
    });
  }
}
