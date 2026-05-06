import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, User, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(userId: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
  }

  async findByEmailOrUsername(identifier: string): Promise<User | null> {
    const normalized = identifier.trim().toLowerCase();

    return this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [{ email: normalized }, { username: normalized }],
      },
    });
  }

  async createUser(payload: {
    fullName: string;
    whatsapp: string;
    email: string;
    password: string;
    role?: UserRole;
  }) {
    const fullName = payload.fullName.trim();
    const email = payload.email.trim().toLowerCase();
    const whatsapp = this.normalizeWhatsapp(payload.whatsapp);
    const role = payload.role ?? UserRole.USER;

    const [emailExists, waExists] = await Promise.all([
      this.prisma.user.findUnique({ where: { email } }),
      this.prisma.user.findFirst({ where: { whatsapp, deletedAt: null } }),
    ]);

    if (emailExists) {
      throw new BadRequestException('Email sudah digunakan.');
    }

    if (waExists) {
      throw new BadRequestException('Nomor WhatsApp sudah digunakan.');
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const username = await this.generateUniqueUsername(fullName);

    const user = await this.prisma.user.create({
      data: {
        fullName,
        email,
        whatsapp,
        username,
        passwordHash,
        role,
      },
      select: {
        id: true,
        fullName: true,
        username: true,
        whatsapp: true,
        email: true,
        role: true,
        pinHash: true,
        createdAt: true,
      },
    });

    return user;
  }

  async validatePassword(user: User, plainPassword: string) {
    const valid = await bcrypt.compare(plainPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Email/username atau password salah.');
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new ForbiddenException('Akun dinonaktifkan oleh admin.');
    }

    return true;
  }

  async verifyUserPin(userId: string, pin: string) {
    const user = await this.ensureActiveUser(userId);
    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Admin tidak menggunakan PIN.');
    }

    if (!user.pinHash) {
      throw new BadRequestException('PIN belum dibuat.');
    }

    const valid = await bcrypt.compare(pin, user.pinHash);
    if (!valid) {
      throw new UnauthorizedException('PIN tidak valid.');
    }

    return true;
  }

  async setupPin(userId: string, pin: string) {
    const user = await this.ensureActiveUser(userId);
    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Admin tidak menggunakan PIN.');
    }

    if (user.pinHash) {
      throw new BadRequestException('PIN sudah pernah diset.');
    }

    const pinHash = await bcrypt.hash(pin, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        pinHash,
        pinSetAt: new Date(),
      },
    });

    return { success: true };
  }

  async changePin(userId: string, oldPin: string, newPin: string) {
    const user = await this.ensureActiveUser(userId);
    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Admin tidak menggunakan PIN.');
    }

    if (!user.pinHash) {
      throw new BadRequestException('PIN belum dibuat.');
    }

    const valid = await bcrypt.compare(oldPin, user.pinHash);
    if (!valid) {
      throw new UnauthorizedException('PIN lama tidak valid.');
    }

    const pinHash = await bcrypt.hash(newPin, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { pinHash },
    });

    return { success: true };
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.ensureActiveUser(userId);
    const valid = await bcrypt.compare(oldPassword, user.passwordHash);

    if (!valid) {
      throw new UnauthorizedException('Password lama tidak valid.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return { success: true };
  }

  async getProfile(userId: string) {
    const user = await this.ensureActiveUser(userId);

    return {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      whatsapp: user.whatsapp,
      email: user.email,
      role: user.role,
      balance: user.balance.toString(),
      hasPin: Boolean(user.pinHash),
      createdAt: user.createdAt,
    };
  }

  async ensureActiveUser(userId: string): Promise<User> {
    const user = await this.ensureExistingUser(userId);

    if (user.status === UserStatus.INACTIVE) {
      throw new ForbiddenException('Akun dinonaktifkan oleh admin.');
    }

    return user;
  }

  async ensureExistingUser(userId: string): Promise<User> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan.');
    }

    return user;
  }

  async adjustBalance(params: {
    userId: string;
    adjustedById: string;
    amount: number;
    note: string;
  }) {
    if (params.amount === 0) {
      throw new BadRequestException('Nominal penyesuaian tidak boleh 0.');
    }

    const user = await this.ensureExistingUser(params.userId);
    await this.ensureExistingUser(params.adjustedById);

    const updated = await this.prisma.$transaction(async (tx) => {
      const nextBalance = user.balance.add(new Prisma.Decimal(params.amount));
      if (nextBalance.lessThan(0)) {
        throw new BadRequestException('Saldo akhir tidak boleh negatif.');
      }

      const balanceAdjustment = await tx.balanceAdjustment.create({
        data: {
          userId: params.userId,
          adjustedById: params.adjustedById,
          amount: new Prisma.Decimal(params.amount),
          note: params.note,
        },
      });

      const nextUser = await tx.user.update({
        where: { id: params.userId },
        data: { balance: nextBalance },
      });

      await tx.transaction.create({
        data: {
          userId: params.userId,
          type: 'ADJUSTMENT',
          status: 'SUCCESS',
          amount: new Prisma.Decimal(params.amount),
          description: `Penyesuaian saldo admin: ${params.note}`,
          metadata: {
            adjustedById: params.adjustedById,
            adjustmentId: balanceAdjustment.id,
          },
        },
      });

      return nextUser;
    });

    return {
      balance: updated.balance.toString(),
    };
  }

  async listUsers() {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null, role: UserRole.USER },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        whatsapp: true,
        balance: true,
        status: true,
        createdAt: true,
      },
    });

    return users.map((user) => ({
      ...user,
      balance: user.balance.toString(),
    }));
  }

  async userDetail(userId: string) {
    const user = await this.ensureExistingUser(userId);

    const [transactions, deposits, orders] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { userId },
        include: {
          order: true,
          deposit: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.deposit.findMany({
        where: { userId },
        include: { paymentMethod: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.findMany({
        where: { userId, deletedAt: null },
        include: {
          product: true,
          service: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        whatsapp: user.whatsapp,
        status: user.status,
        balance: user.balance.toString(),
        createdAt: user.createdAt,
      },
      transactions: transactions.map((tx) => ({
        ...tx,
        amount: tx.amount.toString(),
      })),
      deposits: deposits.map((deposit) => ({
        ...deposit,
        amount: deposit.amount.toString(),
        transferAmount: deposit.transferAmount.toString(),
      })),
      orders: orders.map((order) => ({
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
    };
  }

  async toggleUserStatus(userId: string, status: UserStatus) {
    await this.ensureExistingUser(userId);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status },
      select: {
        id: true,
        status: true,
      },
    });

    return updated;
  }

  private async generateUniqueUsername(fullName: string) {
    const base = fullName
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '')
      .trim();

    const candidate = base || 'user';

    const exists = await this.prisma.user.findUnique({
      where: { username: candidate },
      select: { id: true },
    });

    if (!exists) {
      return candidate;
    }

    for (let i = 0; i < 10; i += 1) {
      const suffix = Math.floor(100 + Math.random() * 900);
      const next = `${candidate}${suffix}`;
      const nextExists = await this.prisma.user.findUnique({
        where: { username: next },
        select: { id: true },
      });
      if (!nextExists) {
        return next;
      }
    }

    const stamp = Date.now().toString().slice(-5);
    return `${candidate}${stamp}`;
  }

  private normalizeWhatsapp(value: string) {
    const digits = value.replace(/\D/g, '');

    if (digits.length < 10) {
      throw new BadRequestException('Nomor WhatsApp minimal 10 digit.');
    }

    if (digits.startsWith('62')) {
      return digits;
    }

    if (digits.startsWith('0')) {
      return `62${digits.slice(1)}`;
    }

    return `62${digits}`;
  }
}
