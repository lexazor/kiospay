import { IsString, Matches } from 'class-validator';

export class SetupPinDto {
  @IsString()
  @Matches(/^\d{6}$/, { message: 'PIN harus 6 digit angka.' })
  pin: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'Konfirmasi PIN harus 6 digit angka.' })
  confirmPin: string;
}