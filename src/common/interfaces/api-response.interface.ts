import { ApiProperty } from '@nestjs/swagger';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T | null;
  errors: any | null;
  statusCode?: number;
}

export class ApiResponseDto<T = any> {
  @ApiProperty({
    description: 'Indicates if the request was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Request successful',
  })
  message: string;

  @ApiProperty({
    description: 'Response data',
    nullable: true,
  })
  data: T | null;

  @ApiProperty({
    description: 'Error details if any',
    nullable: true,
    example: null,
  })
  errors: any | null;


  @ApiProperty({
    description: 'HTTP status code',
    example: 200,
    required: false,
  })
  statusCode?: number;
}
