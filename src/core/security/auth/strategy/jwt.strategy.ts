import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: (request, rawJwtToken, done) => {
        const publicKey = this.configService.get<string>('KEYCLOAK_PUBLIC_KEY');
        if (!publicKey) {
          this.logger.error('KEYCLOAK_PUBLIC_KEY is not set in the environment');
          return done(new Error('KEYCLOAK_PUBLIC_KEY is not set'), null);
        }
        const completePublicKey = `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`;
        done(null, completePublicKey);
      },
      algorithms: ['RS256'],
      issuer: 'http://localhost:8080/realms/redcrescent',
      audience: ['realm-management', 'broker', 'account'],
    });
    this.logger.log('JwtStrategy initialized');
  }

  async validate(payload: any) {
    const roles = [
      ...(payload.realm_access?.roles || []),
      ...Object.values(payload.resource_access || {}).flatMap(
        (resource: any) => resource.roles || []
      ),
    ];

    return { 
      userId: payload.sub, 
      username: payload.preferred_username,
      email: payload.email,
      roles: roles
    };
  }
}