import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DepositStatus, Prisma, TransactionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentMethodsService } from '../payment-methods/payment-methods.service';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateDepositDto } from './dto/create-deposit.dto';

@Injectable()
export class DepositsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentMethodsService: PaymentMethodsService,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateDepositDto) {
    await this.usersService.ensureActiveUser(userId);
    const method = await this.paymentMethodsService.findActiveById(dto.paymentMethodId);

    const amount = new Prisma.Decimal(dto.amount);

    if (amount.lessThan(method.minDeposit) || amount.greaterThan(method.maxDeposit)) {
      throw new BadRequestException(
        `Nominal harus di antara ${method.minDeposit.toString()} dan ${method.maxDeposit.toString()}.`,
      );
    }

    const uniqueCode = method.uniqueCodeEnabled
      ? Math.floor(100 + Math.random() * 900)
      : 0;

    const transferAmount = amount.add(uniqueCode);
    const expiredAt =
      method.expiryMinutes > 0
        ? new Date(Date.now() + method.expiryMinutes * 60 * 1000)
        : null;

    const deposit = await this.prisma.deposit.create({
      data: {
        userId,
        paymentMethodId: method.id,
        amount,
        uniqueCode,
        transferAmount,
        expiredAt,
        status: DepositStatus.PENDING,
      },
      include: {
        paymentMethod: true,
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });

    await this.prisma.transaction.create({
      data: {
        userId,
        type: 'DEPOSIT',
        status: TransactionStatus.PENDING,
        amount,
        description: `Deposit via ${method.name}`,
        depositId: deposit.id,
      },
    });

    this.notificationsService.emitAdminDepositNew({
      id: deposit.id,
      userId,
      username: user?.username ?? '',
      amount: deposit.amount.toString(),
      transferAmount: deposit.transferAmount.toString(),
      createdAt: deposit.createdAt,
    });

    return this.mapDeposit(deposit);
  }

  async myDeposits(userId: string) {
    const items = await this.prisma.deposit.findMany({
      where: { userId },
      include: {
        paymentMethod: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return items.map((item) => this.mapDeposit(item));
  }

  async detail(userId: string, id: string) {
    const item = await this.prisma.deposit.findFirst({
      where: { id, userId },
      include: {
        paymentMethod: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Deposit tidak ditemukan.');
    }

    return this.mapDeposit(item);
  }

  async adminList(status?: string) {
    const items = await this.prisma.deposit.findMany({
      where: status ? { status: status as DepositStatus } : undefined,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        paymentMethod: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return items.map((item) => ({
      ...this.mapDeposit(item),
      user: item.user,
    }));
  }

  async uploadProof(userId: string, id: string, imageUrl: string) {
    const item = await this.prisma.deposit.findFirst({
      where: { id, userId },
    });

    if (!item) {
      throw new NotFoundException('Deposit tidak ditemukan.');
    }

    if (item.status !== DepositStatus.PENDING) {
      throw new BadRequestException('Bukti transfer hanya bisa diupload saat status PENDING.');
    }

    const updated = await this.prisma.deposit.update({
      where: { id },
      data: { proofImageUrl: imageUrl },
      include: {
        paymentMethod: true,
      },
    });

    return this.mapDeposit(updated);
  }

  async adminUpdateStatus(id: string, status: DepositStatus) {
    const item = await this.prisma.deposit.findUnique({
      where: { id },
      include: { transaction: true },
    });

    if (!item) {
      throw new NotFoundException('Deposit tidak ditemukan.');
    }

    if (item.status !== DepositStatus.PENDING) {
      throw new BadRequestException('Hanya deposit PENDING yang dapat diubah statusnya.');
    }

    const allowedStatuses: DepositStatus[] = [
      DepositStatus.CONFIRMED,
      DepositStatus.REJECTED,
      DepositStatus.EXPIRED,
    ];

    if (!allowedStatuses.includes(status)) {
      throw new BadRequestException('Status tidak valid untuk aksi admin.');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedDeposit = await tx.deposit.update({
        where: { id },
        data: { status },
        include: {
          paymentMethod: true,
        },
      });

      if (item.transaction) {
        const txStatus =
          status === DepositStatus.CONFIRMED
            ? TransactionStatus.SUCCESS
            : TransactionStatus.FAILED;

        await tx.transaction.update({
          where: { id: item.transaction.id },
          data: { status: txStatus },
        });
      }

      let nextBalance: Prisma.Decimal | null = null;

      if (status === DepositStatus.CONFIRMED) {
        const user = await tx.user.findUnique({ where: { id: item.userId } });
        if (!user) {
          throw new NotFoundException('User deposit tidak ditemukan.');
        }

        nextBalance = user.balance.add(item.amount);

        await tx.user.update({
          where: { id: item.userId },
          data: { balance: nextBalance },
        });
      }

      return {
        deposit: updatedDeposit,
        nextBalance,
      };
    });

    if (result.nextBalance) {
      this.notificationsService.emitBalanceUpdated(item.userId, {
        balance: result.nextBalance.toString(),
        at: new Date().toISOString(),
      });
    }

    this.notificationsService.emitDepositStatus(item.userId, {
      id: result.deposit.id,
      status: result.deposit.status,
      amount: result.deposit.amount.toString(),
      transferAmount: result.deposit.transferAmount.toString(),
    });

    return this.mapDeposit(result.deposit);
  }

  @Cron('* * * * *')
  async handleAutoExpired() {
    const now = new Date();

    const expired = await this.prisma.deposit.findMany({
      where: {
        status: DepositStatus.PENDING,
        expiredAt: {
          not: null,
          lte: now,
        },
      },
      include: {
        transaction: true,
        paymentMethod: true,
      },
    });

    for (const item of expired) {
      await this.prisma.$transaction(async (tx) => {
        await tx.deposit.update({
          where: { id: item.id },
          data: { status: DepositStatus.EXPIRED },
        });

        if (item.transaction) {
          await tx.transaction.update({
            where: { id: item.transaction.id },
            data: { status: TransactionStatus.FAILED },
          });
        }
      });

      this.notificationsService.emitDepositStatus(item.userId, {
        id: item.id,
        status: DepositStatus.EXPIRED,
        amount: item.amount.toString(),
        transferAmount: item.transferAmount.toString(),
      });
    }
  }

  private mapDeposit<T extends { amount: Prisma.Decimal; transferAmount: Prisma.Decimal }>(
    item: T,
  ) {
    return {
      ...item,
      amount: item.amount.toString(),
      transferAmount: item.transferAmount.toString(),
    };
  }
}