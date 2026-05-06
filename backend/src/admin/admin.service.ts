import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboardOverview() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalTransactionsToday,
      totalDepositsToday,
      pendingDeposits,
      recentOrders,
      recentDeposits,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: 'USER', deletedAt: null } }),
      this.prisma.order.count({
        where: {
          createdAt: { gte: startOfDay },
          deletedAt: null,
        },
      }),
      this.prisma.deposit.aggregate({
        _sum: { amount: true },
        where: {
          createdAt: { gte: startOfDay },
          status: 'CONFIRMED',
        },
      }),
      this.prisma.deposit.count({ where: { status: 'PENDING' } }),
      this.prisma.order.findMany({
        take: 5,
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              username: true,
              fullName: true,
            },
          },
          product: true,
        },
      }),
      this.prisma.deposit.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              username: true,
              fullName: true,
            },
          },
          paymentMethod: true,
        },
      }),
    ]);

    const totalRevenue = await this.prisma.order.aggregate({
      _sum: {
        total: true,
      },
      where: {
        status: 'SUCCESS',
        deletedAt: null,
      },
    });

    return {
      stats: {
        totalUsers,
        totalTransactionsToday,
        totalDepositsToday: totalDepositsToday._sum.amount?.toString() ?? '0',
        totalRevenue: totalRevenue._sum.total?.toString() ?? '0',
        pendingDeposits,
      },
      recentOrders: recentOrders.map((order) => ({
        ...order,
        price: order.price.toString(),
        fee: order.fee.toString(),
        total: order.total.toString(),
        product: {
          ...order.product,
          nominal: order.product.nominal.toString(),
          sellingPrice: order.product.sellingPrice.toString(),
        },
      })),
      recentDeposits: recentDeposits.map((deposit) => ({
        ...deposit,
        amount: deposit.amount.toString(),
        transferAmount: deposit.transferAmount.toString(),
      })),
    };
  }
}