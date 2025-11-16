import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();
      const token = this.extractToken(client);

      if (!token) {
        throw new WsException('Unauthorized: No token provided');
      }

      const payload = await this.jwtService.verifyAsync(token);
      client.data.user = payload;

      return true;
    } catch (error) {
      if (error instanceof WsException) {
        throw error;
      }

      let errorMessage = 'Unauthorized: Invalid token';
      
      if (error?.name === 'TokenExpiredError') {
        errorMessage = 'Unauthorized: Token expired';
      } else if (error?.name === 'JsonWebTokenError') {
        errorMessage = 'Unauthorized: Invalid token format';
      } else if (error?.name === 'NotBeforeError') {
        errorMessage = 'Unauthorized: Token not active yet';
      }

      throw new WsException(errorMessage);
    }
  }

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;
    if (authToken) {
      return authToken.replace(/^Bearer\s+/i, '').trim();
    }

    const headerToken = client.handshake.headers?.authorization;
    if (headerToken) {
      return headerToken.replace(/^Bearer\s+/i, '').trim();
    }

    return null;
  }
}
