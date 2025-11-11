import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { memoryStorage } from 'multer';

// Allowed image extensions
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Multer configuration for image upload (memory storage for Cloudinary)
 */
export const imageUploadConfig = {
  storage: memoryStorage(), // Store in memory for Cloudinary upload
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb) => {
    const ext = file.originalname.toLowerCase().match(/\.[^.]+$/)?.[0];
    if (!ext || !ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
      return cb(
        new BadRequestException(
          `Chỉ chấp nhận file ảnh: ${ALLOWED_IMAGE_EXTENSIONS.join(', ')}`,
        ),
        false,
      );
    }
    cb(null, true);
  },
};

/**
 * Multer configuration for multiple images upload
 */
export const multipleImagesUploadConfig = {
  ...imageUploadConfig,
  limits: {
    ...imageUploadConfig.limits,
    files: 10, // Maximum 10 images per upload
  },
};
