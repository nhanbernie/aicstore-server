import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const ParseBoolean = createParamDecorator(
  (paramName: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const value = request.query[paramName];
    
    if (value === undefined || value === null) {
      return undefined;
    }
    
    if (value === 'true' || value === true) {
      return true;
    }
    
    if (value === 'false' || value === false) {
      return false;
    }
    
    return undefined;
  },
);
