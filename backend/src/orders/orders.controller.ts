import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PinVerifiedGuard } from '../common/guards/pin-verified.guard';
import { PinRequired } from '../common/decorators/pin-required.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(PinVerifiedGuard)
  @PinRequired()
  @Roles(UserRole.USER, UserRole.ADMIN)
  @Post()
  create(@CurrentUser('sub') userId: string, @Body() body: CreateOrderDto) {
    return this.ordersService.create(userId, body);
  }

  @UseGuards(PinVerifiedGuard)
  @PinRequired()
  @Roles(UserRole.USER, UserRole.ADMIN)
  @Get('me')
  myOrders(@CurrentUser('sub') userId: string) {
    return this.ordersService.listMyOrders(userId);
  }

  @Roles(UserRole.ADMIN)
  @Get('admin')
  listAdmin(@Query() query: ListOrdersQueryDto) {
    return this.ordersService.listAdmin(query.status);
  }

  @Roles(UserRole.ADMIN)
  @Get('admin/:id')
  detail(@Param('id') id: string) {
    return this.ordersService.detail(id);
  }

  @Roles(UserRole.ADMIN)
  @Patch('admin/:id/status')
  updateStatus(@Param('id') id: string, @Body() body: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, body.status);
  }
}