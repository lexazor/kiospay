import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma, TransactionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    const user = await this.usersService.ensureActiveUser(userId);
    const product = await this.productsService.findActiveById(dto.productId);

    const fee = new Prisma.Decimal(dto.fee ?? 0);
    const total = product.sellingPrice.add(fee);

    if (user.balance.lessThan(total)) {
      throw new BadRequestException('Saldo tidak mencukupi.');
    }

    const dataMap = dto.customerData.reduce<Record<string, string>>((acc, cur) => {
      acc[cur.key] = cur.value;
      return acc;
    }, {});

    const result = await this.prisma.$transaction(async (tx) => {
      const nextBalance = user.balance.sub(total);

      const order = await tx.order.create({
        data: {
          userId,
          serviceId: product.serviceId,
          productId: product.id,
          customerData: dataMap,
          price: product.sellingPrice,
          fee,
          total,
          status: OrderStatus.PENDING,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { balance: nextBalance },
      });

      const transaction = await tx.transaction.create({
        data: {
          userId,
          type: 'ORDER',
          status: TransactionStatus.PENDING,
          amount: total.negated(),
          description: `Order ${product.name}`,
          orderId: order.id,
          metadata: {
            serviceName: product.service.name,
            productName: product.name,
          },
        },
      });

      return {
        order,
        transaction,
        nextBalance,
      };
    });

    this.notificationsService.emitBalanceUpdated(userId, {
      balance: result.nextBalance.toString(),
      at: new Date().toISOString(),
    });

    this.notificationsService.emitOrderStatus(userId, {
      id: result.order.id,
      status: result.order.status,
      total: result.order.total.toString(),
      productName: product.name,
    });

    return {
      ...result.order,
      price: result.order.price.toString(),
      fee: result.order.fee.toString(),
      total: result.order.total.toString(),
    };
  }

  async listMyOrders(userId: string) {
    const items = await this.prisma.order.findMany({
      where: { userId, deletedAt: null },
      include: {
        product: true,
        service: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return items.map((item) => ({
      ...item,
      price: item.price.toString(),
      fee: item.fee.toString(),
      total: item.total.toString(),
      product: {
        ...item.product,
        nominal: item.product.nominal.toString(),
        sellingPrice: item.product.sellingPrice.toString(),
      },
    }));
  }

  async listAdmin(status?: string) {
    const where = {
      deletedAt: null,
      ...(status ? { status: status as OrderStatus } : {}),
    };

    const items = await this.prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        product: true,
        service: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return items.map((item) => ({
      ...item,
      price: item.price.toString(),
      fee: item.fee.toString(),
      total: item.total.toString(),
      product: {
        ...item.product,
        nominal: item.product.nominal.toString(),
        sellingPrice: item.product.sellingPrice.toString(),
      },
    }));
  }

  async detail(id: string) {
    const item = await this.prisma.order.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        product: true,
        service: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Order tidak ditemukan.');
    }

    return {
      ...item,
      price: item.price.toString(),
      fee: item.fee.toString(),
      total: item.total.toString(),
      product: {
        ...item.product,
        nominal: item.product.nominal.toString(),
        sellingPrice: item.product.sellingPrice.toString(),
      },
    };
  }

  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.prisma.order.findFirst({
      where: { id, deletedAt: null },
      include: {
        transaction: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order tidak ditemukan.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.order.update({
        where: { id },
        data: { status },
      });

      if (order.transaction) {
        const txStatus =
          status === OrderStatus.SUCCESS
            ? TransactionStatus.SUCCESS
            : status === OrderStatus.FAILED
              ? TransactionStatus.FAILED
              : TransactionStatus.PENDING;

        await tx.transaction.update({
          where: { id: order.transaction.id },
          data: { status: txStatus },
        });
      }

      if (order.status !== OrderStatus.FAILED && status === OrderStatus.FAILED) {
        const user = await tx.user.findUnique({ where: { id: order.userId } });
        if (!user) {
          throw new NotFoundException('User order tidak ditemukan.');
        }

        const nextBalance = user.balance.add(order.total);

        await tx.user.update({
          where: { id: order.userId },
          data: { balance: nextBalance },
        });

        return {
          order: next,
          refundedBalance: nextBalance,
        };
      }

      return { order: next, refundedBalance: null };
    });

    if (updated.refundedBalance) {
      this.notificationsService.emitBalanceUpdated(order.userId, {
        balance: updated.refundedBalance.toString(),
        at: new Date().toISOString(),
      });
    }

    this.notificationsService.emitOrderStatus(order.userId, {
      id: updated.order.id,
      status: updated.order.status,
      total: updated.order.total.toString(),
    });

    return {
      ...updated.order,
      price: updated.order.price.toString(),
      fee: updated.order.fee.toString(),
      total: updated.order.total.toString(),
    };
  }
}