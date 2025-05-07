import { Module } from '@nestjs/common';
import { MailService } from './mail.service';

@Module({
  providers: [MailService],
  exports: [MailService], // ✅ Нужно, чтобы другие модули могли его использовать
})
export class MailModule {}
