import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PinRequired } from '../common/decorators/pin-required.decorator';
import { PinVerifiedGuard } from '../common/guards/pin-verified.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ChangePinDto } from './dto/change-pin.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AdjustBalanceDto } from './dto/adjust-balance.dto';
import { ToggleUserStatusDto } from './dto/toggle-user-status.dto';
import { ListTransactionDto } from './dto/list-transaction.dto';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
  ) {}

  @UseGuards(PinVerifiedGuard)
  @PinRequired()
  @Get('me')
  me(@CurrentUser('sub') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @UseGuards(PinVerifiedGuard)
  @PinRequired()
  @Patch('me/password')
  changePassword(
    @CurrentUser('sub') userId: string,
    @Body() body: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(userId, body.oldPassword, body.newPassword);
  }

  @UseGuards(PinVerifiedGuard)
  @PinRequired()
  @Patch('me/pin')
  changePin(@CurrentUser('sub') userId: string, @Body() body: ChangePinDto) {
    return this.usersService.changePin(userId, body.oldPin, body.newPin);
  }

  @UseGuards(PinVerifiedGuard)
  @PinRequired()
  @Get('me/transactions')
  async myTransactions(
    @CurrentUser('sub') userId: string,
    @Query() query: ListTransactionDto,
  ) {
    const where = {
      userId,
      ...(query.type ? { type: query.type as never } : {}),
    };

    const items = await this.prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          include: {
            product: true,
            service: true,
          },
        },
        deposit: {
          include: {
            paymentMethod: true,
          },
        },
      },
    });

    return items.map((item) => ({
      ...item,
      amount: item.amount.toString(),
      order: item.order
        ? {
            ...item.order,
            price: item.order.price.toString(),
            fee: item.order.fee.toString(),
            total: item.order.total.toString(),
            product: {
              ...item.order.product,
              nominal: item.order.product.nominal.toString(),
              sellingPrice: item.order.product.sellingPrice.toString(),
            },
          }
        : null,
      deposit: item.deposit
        ? {
            ...item.deposit,
            amount: item.deposit.amount.toString(),
            transferAmount: item.deposit.transferAmount.toString(),
          }
        : null,
    }));
  }

  @Roles(UserRole.ADMIN)
  @Get('admin/list')
  listUsers() {
    return this.usersService.listUsers();
  }

  @Roles(UserRole.ADMIN)
  @Get('admin/:id')
  detailUser(@Param('id') userId: string) {
    return this.usersService.userDetail(userId);
  }

  @Roles(UserRole.ADMIN)
  @Patch('admin/:id/status')
  toggleStatus(@Param('id') userId: string, @Body() body: ToggleUserStatusDto) {
    return this.usersService.toggleUserStatus(userId, body.status);
  }

  @Roles(UserRole.ADMIN)
  @Patch('admin/:id/adjust-balance')
  adjustBalance(
    @Param('id') userId: string,
    @CurrentUser('sub') adminId: string,
    @Body() body: AdjustBalanceDto,
  ) {
    return this.usersService.adjustBalance({
      userId,
      adjustedById: adminId,
      amount: body.amount,
      note: body.note,
    });
  }
}
