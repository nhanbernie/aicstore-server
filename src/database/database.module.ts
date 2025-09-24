import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../modules/users/schemas/user.schema';
import { RefreshToken } from '../modules/auth/schemas/refresh-token.schema';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [User, RefreshToken],
        synchronize: configService.get('database.synchronize'),
        logging: configService.get('database.logging'),
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
