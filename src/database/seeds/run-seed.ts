import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';
import { SeedService } from './seed.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeedModule);
  const seedService = app.get(SeedService);

  try {
    const command = process.argv[2];

    switch (command) {
      case 'clear':
        await seedService.clearAll();
        break;
      case 'seed':
        await seedService.seedAll();
        break;
      case 'refresh':
        await seedService.clearAll();
        await seedService.seedAll();
        break;
      default:
        console.log('Available commands:');
        console.log('  npm run seed:run seed    - Seed database with sample data');
        console.log('  npm run seed:run clear   - Clear all data');
        console.log('  npm run seed:run refresh - Clear and re-seed data');
        break;
    }
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
