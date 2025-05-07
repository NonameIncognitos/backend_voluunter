import { Injectable, ExecutionContext, UnauthorizedException, Logger, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class KeycloakAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(KeycloakAuthGuard.name);
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    this.logger.debug('Entering canActivate method');
    const request = context.switchToHttp().getRequest();
    this.logger.debug(`Request headers: ${JSON.stringify(request.headers)}`);

    const authHeader = request.headers.authorization;
    if (!authHeader) {
      this.logger.error('No authorization header found');
      throw new UnauthorizedException('No token provided');
    }

    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      this.logger.error('Invalid authorization header format');
      throw new UnauthorizedException('Invalid token format');
    }

    this.logger.debug(`Extracted token: ${token}`);

    return (super.canActivate(context) as Observable<boolean>).toPromise().then(
      (result) => {
        if (!result) {
          this.logger.error('User does not have required permissions');
          throw new ForbiddenException('You do not have permission to access this resource');
        }
        return result;
      }
    );
  }

  

  handleRequest(err, user, info) {
    this.logger.debug('Entering handleRequest method');
    this.logger.debug(`Error: ${err}`);
    this.logger.debug(`User: ${JSON.stringify(user)}`);
    this.logger.debug(`Info: ${JSON.stringify(info)}`);

    if (err || !user) {
      this.logger.error('Authentication failed:', err?.message || 'No user');
      throw err || new UnauthorizedException();
    }
    return user;
  }
}