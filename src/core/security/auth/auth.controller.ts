import { Controller, Post, Body, Get, UseGuards, Param, HttpException, HttpStatus, Req, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';
import { KeycloakAuthGuard } from '../../../common/guards';
import { Roles } from '../../../common/decorators';
import { RolesGuard } from '../../../common/guards';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { Public } from 'src/core/decorators/public.decorator';
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 100000000, ttl: 7200 } }) // 5 requests per 2 hours (7200 seconds)
  async register(@Body() registerDto: AuthDto.RegisterDto) {
    return this.authService.register(
      registerDto.email,
      registerDto.phoneNumber,
      registerDto.firstName,
      registerDto.lastName
    );
  }

  @Public()
  @Post('login')
  async login(@Body() loginDto: AuthDto.LoginDto) {
    try {
      const result = await this.authService.validateUser(loginDto);
      return result;
    } catch (error) {
      this.logger.error(`Login failed for user ${loginDto.email}: ${error.message}`);
      throw new HttpException(error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('check-keycloak')
  @UseGuards(KeycloakAuthGuard)
  async checkKeycloakConnection() {
    return this.authService.checkKeycloakConnection();
  }

  @UseGuards(KeycloakAuthGuard)
  @Get('protected')
  async protectedRoute(@Req() req) {
    this.logger.debug(`Entering protectedRoute`);
    this.logger.debug(`Headers: ${JSON.stringify(req.headers)}`);
    this.logger.debug(`User in request: ${JSON.stringify(req.user)}`);

    if (!req.user) {
      this.logger.warn('No user found in request');
      throw new UnauthorizedException('User not authenticated');
    }

    // Извлекаем все роли из токена
    const allRoles = [
      ...(req.user.realm_access?.roles || []),
      ...Object.values(req.user.resource_access || {}).flatMap((resource: any) => resource.roles || [])
    ];

    return { 
      message: 'This is a protected route', 
      user: {
        ...req.user,
        allRoles: allRoles
      }
    };
  }
  @Post('approve-application')
   // Используем более специфичную роль
  async approveApplication(@Body() approveDto: AuthDto.ApproveApplicationDto) {
    return this.authService.approveApplication(approveDto.applicationId, approveDto.status);
  }

  @Get('applications')
   // Используем более специфичную роль
  async getAllApplications() {
    return this.authService.getAllApplications();
  }

  @Post('applications/revert-decision/:applicationId')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('realm-admin') // Используем более специфичную роль
  async revertApplicationDecision(@Param('applicationId') applicationId: string) {
    return this.authService.revertApplicationDecision(applicationId);
  }

}
