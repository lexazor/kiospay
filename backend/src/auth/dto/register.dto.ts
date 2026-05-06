import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  fullName: string;

  @IsString()
  @Matches(/^[0-9+\-\s()]{10,}$/, {
    message: 'Nomor WhatsApp minimal 10 digit.',
  })
  whatsapp: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}