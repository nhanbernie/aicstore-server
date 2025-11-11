import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

/**
 * Configure Cloudinary with credentials from environment
 */
export const configureCloudinary = (configService: ConfigService) => {
  cloudinary.config({
    cloud_name: configService.get<string>('CLOUDINARY_CLOUD_NAME'),
    api_key: configService.get<string>('CLOUDINARY_API_KEY'),
    api_secret: configService.get<string>('CLOUDINARY_API_SECRET'),
  });

  return cloudinary;
};

/**
 * Get Cloudinary folder from environment
 */
export const getCloudinaryFolder = (configService: ConfigService): string => {
  return configService.get<string>('CLOUDINARY_FOLDER') || 'wdp-products';
};

export { cloudinary };
