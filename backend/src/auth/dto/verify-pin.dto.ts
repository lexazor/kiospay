import { IsString, Matches } from 'class-validator';

export class VerifyPinDto {
  @IsString()
  @Matches(/^\d{6}$/, { message: 'PIN harus 6 digit angka.' })
  pin: string;
}