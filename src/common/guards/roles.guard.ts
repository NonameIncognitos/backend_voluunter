import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    this.logger.debug(`Required roles: ${JSON.stringify(requiredRoles)}`);

    if (!requiredRoles) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    this.logger.debug(`User roles: ${JSON.stringify(user.roles)}`);

    const hasRole = requiredRoles.some((role) => user.roles.includes(role));
    this.logger.debug(`Has required role: ${hasRole}`);

    return hasRole;
  }
}