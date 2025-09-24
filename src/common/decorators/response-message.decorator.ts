import { SetMetadata } from '@nestjs/common';

export const RESPONSE_MESSAGE_KEY = 'response_message';

/**
 * Custom decorator to set response message
 * @param message - Custom message for the response
 */
export const ResponseMessage = (message: string) =>
  SetMetadata(RESPONSE_MESSAGE_KEY, message);

/**
 * Predefined response messages for common operations
 */
export const ResponseMessages = {
  // Success messages
  SUCCESS: 'Request thành công',
  CREATED: 'Tạo mới thành công',
  UPDATED: 'Cập nhật thành công',
  DELETED: 'Xóa thành công',
  RETRIEVED: 'Lấy dữ liệu thành công',
  
  // Auth messages
  LOGIN_SUCCESS: 'Đăng nhập thành công',
  REGISTER_SUCCESS: 'Đăng ký thành công',
  LOGOUT_SUCCESS: 'Đăng xuất thành công',
  TOKEN_REFRESHED: 'Làm mới token thành công',
  PROFILE_RETRIEVED: 'Lấy thông tin profile thành công',
  
  // User messages
  USER_CREATED: 'Tạo người dùng thành công',
  USER_UPDATED: 'Cập nhật người dùng thành công',
  USER_DELETED: 'Xóa người dùng thành công',
  USER_FOUND: 'Tìm thấy người dùng',
  USERS_RETRIEVED: 'Lấy danh sách người dùng thành công',
  
  // Error messages
  VALIDATION_FAILED: 'Dữ liệu không hợp lệ',
  UNAUTHORIZED: 'Không có quyền truy cập',
  FORBIDDEN: 'Bị cấm truy cập',
  NOT_FOUND: 'Không tìm thấy dữ liệu',
  CONFLICT: 'Dữ liệu đã tồn tại',
  INTERNAL_ERROR: 'Lỗi hệ thống',
} as const;
