import { registerAs } from '@nestjs/config';

export default registerAs('keycloak', () => ({
  realm: process.env.KEYCLOAK_REALM,
  authServerUrl: process.env.KEYCLOAK_AUTH_SERVER_URL,
  clientId: process.env.KEYCLOAK_CLIENT_ID,
  secret: process.env.KEYCLOAK_SECRET,
  grantType: 'client_credentials',
  scope: 'openid',
  adminUsername: process.env.KEYCLOAK_ADMIN_USERNAME,
  adminPassword: process.env.KEYCLOAK_ADMIN_PASSWORD,
}));