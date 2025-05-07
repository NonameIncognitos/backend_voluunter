import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @IsString()
  @IsNotEmpty()
  readonly password: string;
}

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @IsString()
  @IsNotEmpty()
  readonly lastName: string;

  @IsString()
  @IsNotEmpty()
  readonly firstName: string;

  @IsString()
  @IsNotEmpty()
  readonly phoneNumber: string;
}


export class CreateApplicationDto {
  @IsString()
  @IsNotEmpty()
  readonly email: string;


  @IsString()
  @IsNotEmpty()
  readonly phoneNumber: string;


  @IsString()
  @IsNotEmpty()
  readonly firstName: string;

  @IsString()
  @IsNotEmpty()
  readonly lastName: string;
}



export class ApproveApplicationDto {
  @IsString()
  @IsNotEmpty()
  readonly applicationId: string;

  @IsString()
  @IsNotEmpty()
  readonly status: 'APPROVED' | 'REJECTED';
}