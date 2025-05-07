import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {
    this.initializeNodemailer();
  }

  private initializeNodemailer() {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async sendPasswordEmail(email: string, password: string) {
    const mailOptions = {
      from: this.configService.get('SMTP_FROM'),
      to: email,
      subject: 'Ваша заявка одобрена',
      text: `Ваша заявка была одобрена. Ваш временный пароль: ${password}. Пожалуйста, измените его при первом входе.`,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Ошибка при отправке email: ${error.message}`, error.stack);
      throw new Error(`Ошибка при отправке email: ${error.message}`);
    }
  }
}