import { Module } from "@nestjs/common";
import { tokenService } from "../..";

@Module({
  providers: [tokenService.KeycloakTokenRefreshService],
  exports: [tokenService.KeycloakTokenRefreshService], 
 
})
export class TokenRefreshModule {}