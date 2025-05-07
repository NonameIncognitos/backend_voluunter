
type GrantTypes = 'client_credentials' | 'password';

export class KeycloakConfigDto {
  realm: string;
  authServerUrl: string;
  clientId: string;
  secret: string;
  adminUsername: string;
  adminPassword: string;
  grantType: GrantTypes;
}

export class KeycloakTokenRequestDto {
  grant_type: GrantTypes;
  client_id: string;
  client_secret?: string;
  username?: string;
  password?: string;
}

export class KeycloakTokenResponseDto {
  access_token: string;
  expires_in: number;
  client_secret?: string;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  'not-before-policy': number;
  session_state: string;
  scope: string;
}