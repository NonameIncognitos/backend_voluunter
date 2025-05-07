import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { AuthDto, KeycLoakDto } from './dto';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import KcAdminClient from '@keycloak/keycloak-admin-client';
import * as https from 'https';
import { MailService } from '../../../common/mail/send/mail.service';
import { tokenService } from '../token';
@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private keycloakConfig: KeycLoakDto.KeycloakConfigDto;
  private kcAdminClient: KcAdminClient;
  private refreshTokenService: tokenService.KeycloakTokenRefreshService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {
    this.keycloakConfig = this.configService.getOrThrow<KeycLoakDto.KeycloakConfigDto>('keycloak');
  }

  async onModuleInit() {
    try {
      this.logger.log('Initializing Keycloak Admin Client', {
        baseUrl: this.keycloakConfig.authServerUrl,
        realmName: this.keycloakConfig.realm,
      });

      this.kcAdminClient = new KcAdminClient({
        baseUrl: this.keycloakConfig.authServerUrl,
        realmName: this.keycloakConfig.realm,
        requestConfig: {
          httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        },
      } as any);

      await this.kcAdminClient.auth({
        grantType: 'client_credentials',
        clientId: this.keycloakConfig.clientId,
        clientSecret: this.keycloakConfig.secret,
      });

      this.logger.log('Keycloak Admin Client initialized successfully');
    } catch (error) {
      this.logger.error('Error initializing Keycloak Admin Client', error);
      throw new InternalServerErrorException('Ошибка при инициализации сервисов');
    }
  }

  private generatePassword(length = 12): string {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  private async requestToken(searchParams: Record<string, string>): Promise<KeycLoakDto.KeycloakTokenResponseDto> {
    try {
      this.logger.log('Sending token request with params:', searchParams);
      
      const response = await axios.post<KeycLoakDto.KeycloakTokenResponseDto>(
        `${this.keycloakConfig.authServerUrl}/realms/${this.keycloakConfig.realm}/protocol/openid-connect/token`,
        new URLSearchParams(searchParams),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      );
      
      this.logger.log('Token received successfully:', response.data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        this.logger.error('Token request error:', error.response.data);
        throw new InternalServerErrorException(
          `Ошибка при запросе токена: ${JSON.stringify(error.response.data)}`
        );
      }
      this.logger.error('Unexpected error during token request', error);
      throw new InternalServerErrorException('Неизвестная ошибка при запросе токена');
    }
  }


  async register(email: string, phoneNumber: string, firstName: string, lastName: string) {
  try {
    const existing = await this.prisma.applications.findFirst({
      where: {
        OR: [
          { email },
          { phoneNumber },
        ],
      },
    });

    if (existing) {
      throw new BadRequestException('Пользователь с таким email или номером телефона уже подал заявку');
    }

    const newApplication = await this.prisma.applications.create({
      data: {
        email,
        phoneNumber,
        firstName,
        lastName,
        status: 'PENDING',
      },
    });

    return {
      success: true,
      message: 'Заявка успешно отправлена',
      application: newApplication,
    };
  } catch (error) {
    this.logger.error('Ошибка при регистрации', error);

    // 🔥 Проброс если это HttpException
    if (error instanceof UnauthorizedException ||
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException) {
      throw error;
    }

    throw new InternalServerErrorException('Ошибка при регистрации');
  }
}

  

  async validateUser(loginDto: AuthDto.LoginDto) {
    try {
      const searchParams: Record<string, string> = {
        grant_type: 'password',
        client_id: this.keycloakConfig.clientId,
        client_secret: this.keycloakConfig.secret,
        username: loginDto.email,
        password: loginDto.password,
      };

      this.logger.log(`Attempting to authenticate user: ${loginDto.email}`);

      const tokenResponse = await this.requestToken(searchParams);

      if (tokenResponse?.access_token) {
        this.logger.log(`User authenticated: ${loginDto.email}`);
        const user = await this.prisma.applications.findUnique({
          where: { email: loginDto.email },
        });

        if (user && user.status === 'APPROVED') {
          return {
            success: true,
            message: 'Вход выполнен успешно',
            user,
            access_token: tokenResponse.access_token,
            refresh_token: tokenResponse.refresh_token,
          };
        } else {
          this.logger.warn(`User ${loginDto.email} not approved or not found`);
          throw new ForbiddenException('Учетная запись не одобрена или не найдена');
        }
      }
      throw new UnauthorizedException('Неверные учетные данные');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        this.logger.warn(`Authentication error for user ${loginDto.email}:`, error.response.data);
        switch (error.response.status) {
          case 400:
            throw new BadRequestException('Неверный запрос аутентификации');
          case 401:
            throw new UnauthorizedException('Неверные учетные данные');
          case 403:
            throw new ForbiddenException('Доступ запрещен');
          case 404:
            throw new NotFoundException('Ресурс не найден');
          case 500:
            throw new InternalServerErrorException('Внутренняя ошибка сервера');
          default:
            throw new InternalServerErrorException('Ошибка аутентификации');
        }
      }
      this.logger.error(`Unexpected error during authentication for user ${loginDto.email}:`, error);
      throw new InternalServerErrorException('Ошибка аутентификации');
    }
  }

  async login(loginDto: AuthDto.LoginDto) {
    return this.validateUser(loginDto);
  }

  async checkKeycloakConnection(): Promise<boolean> {
    try {
      const searchParams: Record<string, string> = {
        grant_type: 'client_credentials',
        client_id: this.keycloakConfig.clientId,
        client_secret: this.keycloakConfig.secret,
      };

      const tokenResponse = await this.requestToken(searchParams);

      if (tokenResponse.access_token) {
        this.logger.log('Успешное подключение к Keycloak');
        return true;
      } else {
        this.logger.warn('Подключение к Keycloak выполнено, но токен не получен');
        return false;
      }
    } catch (error) {
      this.logger.error(`Ошибка подключения к Keycloak: ${error.message}`, error.response?.data);
      return false;
    }
  }

  async createKeycloakUser(userData: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
  }) {
    try {
      const user = await this.kcAdminClient.users.create({
        realm: this.keycloakConfig.realm,
        username: userData.email,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        enabled: true,
        emailVerified: true,
      });

      await this.kcAdminClient.users.resetPassword({
        realm: this.keycloakConfig.realm,
        id: user.id,
        credential: {
          temporary: false,
          type: 'password',
          value: userData.password,
        },
      });

      this.logger.log(`Пользователь создан в Keycloak с id: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error('Ошибка создания пользователя в Keycloak', error);
      throw new InternalServerErrorException('Не удалось создать пользователя в Keycloak');
    }
  }



  async approveApplication(applicationId: string, status: 'APPROVED' | 'REJECTED') {
    try {
      const application = await this.prisma.applications.findUnique({
        where: { id: applicationId },
      });

      if (!application) {
        throw new NotFoundException('Заявка не найдена');
      }

      if (application.status !== 'PENDING') {
        throw new BadRequestException('Заявка не в статусе PENDING');
      }

      if (status === 'APPROVED') {
        const password = this.generatePassword();

        const keycloakUser = await this.createKeycloakUser({
          email: application.email,
          firstName: application.firstName,
          lastName: application.lastName,
          password: password,
        });

        if (!keycloakUser) {
          throw new InternalServerErrorException('Не удалось создать пользователя в Keycloak');
        }

        await this.prisma.applications.update({
          where: { id: applicationId },
          data: { status: 'APPROVED' },
        });

        await this.mailService.sendPasswordEmail(application.email, password);

        return { message: 'Заявка одобрена, пользователь создан в Keycloak и уведомлен по email' };
      } else if (status === 'REJECTED') {
        await this.prisma.applications.update({
          where: { id: applicationId },
          data: { status: 'REJECTED' },
        });

        return { message: 'Заявка отклонена' };
      } else {
        throw new BadRequestException('Неверный статус');
      }
    } catch (error) {
      this.logger.error('Ошибка при обработке заявки', error);
      throw new InternalServerErrorException('Ошибка при обработке заявки');
    }
  }



  
  async revertApplicationDecision(applicationId: string) {
    try {
      const application = await this.prisma.applications.findUnique({
        where: { id: applicationId },
      });

      if (!application) {
        throw new NotFoundException('Заявка не найдена');
      }

      if (application.status === 'PENDING') {
        throw new BadRequestException('Заявка уже находится в состоянии PENDING');
      }

      if (application.status === 'APPROVED') {
        try {
          const users = await this.kcAdminClient.users.find({
            email: application.email,
            realm: this.keycloakConfig.realm,
          });

          if (users && users.length > 0) {
            for (const user of users) {
              await this.kcAdminClient.users.del({
                id: user.id,
                realm: this.keycloakConfig.realm,
              } as any);
              this.logger.log(`Пользователь Keycloak с id ${user.id} удалён`);
            }
          }
        } catch (err) {
          this.logger.error('Ошибка при удалении пользователя Keycloak', err);
          throw new InternalServerErrorException('Ошибка при отмене принятия заявки');
        }
      }

      await this.prisma.applications.update({
        where: { id: applicationId },
        data: { status: 'PENDING' },
      });

      return { message: 'Решение по заявке отменено, статус сброшен на PENDING' };
    } catch (error) {
      this.logger.error('Ошибка при отмене решения по заявке', error);
      throw new InternalServerErrorException('Ошибка при отмене решения по заявке');
    }
  }

  async getAllApplications() {
    try {
      const applications = await this.prisma.applications.findMany();
      return { success: true, applications };
    } catch (error) {
      this.logger.error('Ошибка при получении заявок', error);
      return { success: false, message: 'Ошибка при получении заявок', error: error.message };
    }
  }
}
