import { registerAs } from '@nestjs/config';

export default registerAs('smtp', () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? '587', 10); // 587 - стандартный порт для TLS
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  if (!host || !port || !user || !pass || !from) {
    console.error('⚠️ Ошибка: отсутствуют переменные SMTP в .env');
  }

  return { host, port, user, pass, from };
});
