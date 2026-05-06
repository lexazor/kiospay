import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import { DepositsService } from './deposits.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PinVerifiedGuard } from '../common/guards/pin-verified.guard';
import { PinRequired } from '../common/decorators/pin-required.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { UpdateDepositStatusDto } from './dto/update-deposit-status.dto';
import { ListDepositsQueryDto } from './dto/list-deposits-query.dto';
import { UploadService } from '../upload/upload.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('deposits')
export class DepositsController {
  constructor(
    private readonly depositsService: DepositsService,
    private readonly uploadService: UploadService,
  ) {}

  @UseGuards(PinVerifiedGuard)
  @PinRequired()
  @Roles(UserRole.USER, UserRole.ADMIN)
  @Post()
  create(@CurrentUser('sub') userId: string, @Body() body: CreateDepositDto) {
    return this.depositsService.create(userId, body);
  }

  @UseGuards(PinVerifiedGuard)
  @PinRequired()
  @Roles(UserRole.USER, UserRole.ADMIN)
  @Get('me')
  myDeposits(@CurrentUser('sub') userId: string) {
    return this.depositsService.myDeposits(userId);
  }

  @UseGuards(PinVerifiedGuard)
  @PinRequired()
  @Roles(UserRole.USER, UserRole.ADMIN)
  @Get('me/:id')
  detail(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.depositsService.detail(userId, id);
  }

  @UseGuards(PinVerifiedGuard)
  @PinRequired()
  @Roles(UserRole.USER, UserRole.ADMIN)
  @Post('me/:id/upload-proof')
  @UseInterceptors(FileInterceptor('file'))
  uploadProof(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const url = this.uploadService.saveDepositProof(file);
    return this.depositsService.uploadProof(userId, id, url);
  }

  @Roles(UserRole.ADMIN)
  @Get('admin')
  listAdmin(@Query() query: ListDepositsQueryDto) {
    return this.depositsService.adminList(query.status);
  }

  @Roles(UserRole.ADMIN)
  @Patch('admin/:id/status')
  updateStatus(@Param('id') id: string, @Body() body: UpdateDepositStatusDto) {
    return this.depositsService.adminUpdateStatus(id, body.status);
  }
}