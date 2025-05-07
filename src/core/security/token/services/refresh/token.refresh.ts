import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import KcAdminClient from '@keycloak/keycloak-admin-client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KeycloakTokenRefreshService implements OnModuleInit {
  private readonly logger = new Logger(KeycloakTokenRefreshService.name);
  private kcAdminClient: KcAdminClient;
  private refreshInterval: NodeJS.Timeout;

  constructor(private readonly configService: ConfigService) {
    this.kcAdminClient = new KcAdminClient({
      baseUrl: this.configService.get<string>('keycloak.authServerUrl'),
      realmName: this.configService.get<string>('keycloak.realm'),
    });
  }

  async onModuleInit() {
    await this.authenticate();
    this.startTokenRefresh();
  }

  private async authenticate() {
    try {
      await this.kcAdminClient.auth({
        grantType: 'client_credentials',
        clientId: this.configService.get<string>('keycloak.clientId') ?? '',
        clientSecret: this.configService.get<string>('keycloak.secret'),
      });
      this.logger.log('Keycloak token refreshed successfully');
    } catch (error) {
      this.logger.error('Failed to refresh Keycloak token', error);
    }
  }

  private startTokenRefresh() {
    this.refreshInterval = setInterval(async () => {
      await this.authenticate();
    }, 1000 * 60 * 10);
  }

  onModuleDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
}
