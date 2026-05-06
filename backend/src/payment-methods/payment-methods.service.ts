import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';

@Injectable()
export class PaymentMethodsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic() {
    const items = await this.prisma.paymentMethod.findMany({
      where: { status: true },
      orderBy: { createdAt: 'asc' },
    });

    return items.map((item) => ({
      ...item,
      minDeposit: item.minDeposit.toString(),
      maxDeposit: item.maxDeposit.toString(),
    }));
  }

  async listAdmin() {
    const items = await this.prisma.paymentMethod.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: { deposits: true },
        },
      },
    });

    return items.map((item) => ({
      ...item,
      minDeposit: item.minDeposit.toString(),
      maxDeposit: item.maxDeposit.toString(),
    }));
  }

  async create(dto: CreatePaymentMethodDto) {
    if (dto.minDeposit > dto.maxDeposit) {
      throw new BadRequestException('Minimal deposit tidak boleh lebih besar dari maksimal.');
    }

    const item = await this.prisma.paymentMethod.create({
      data: {
        name: dto.name,
        accountNumber: dto.accountNumber,
        accountName: dto.accountName,
        logoUrl: dto.logoUrl,
        uniqueCodeEnabled: dto.uniqueCodeEnabled,
        minDeposit: new Prisma.Decimal(dto.minDeposit),
        maxDeposit: new Prisma.Decimal(dto.maxDeposit),
        expiryMinutes: dto.expiryMinutes,
        status: dto.status,
      },
    });

    return {
      ...item,
      minDeposit: item.minDeposit.toString(),
      maxDeposit: item.maxDeposit.toString(),
    };
  }

  async update(id: string, dto: UpdatePaymentMethodDto) {
    const existing = await this.prisma.paymentMethod.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Metode pembayaran tidak ditemukan.');
    }

    const minDeposit = dto.minDeposit ?? Number(existing.minDeposit);
    const maxDeposit = dto.maxDeposit ?? Number(existing.maxDeposit);

    if (minDeposit > maxDeposit) {
      throw new BadRequestException('Minimal deposit tidak boleh lebih besar dari maksimal.');
    }

    const item = await this.prisma.paymentMethod.update({
      where: { id },
      data: {
        name: dto.name ?? existing.name,
        accountNumber: dto.accountNumber ?? existing.accountNumber,
        accountName: dto.accountName ?? existing.accountName,
        logoUrl:
          Object.prototype.hasOwnProperty.call(dto, 'logoUrl')
            ? dto.logoUrl || null
            : existing.logoUrl,
        uniqueCodeEnabled: dto.uniqueCodeEnabled ?? existing.uniqueCodeEnabled,
        minDeposit: new Prisma.Decimal(minDeposit),
        maxDeposit: new Prisma.Decimal(maxDeposit),
        expiryMinutes: dto.expiryMinutes ?? existing.expiryMinutes,
        status: dto.status ?? existing.status,
      },
    });

    return {
      ...item,
      minDeposit: item.minDeposit.toString(),
      maxDeposit: item.maxDeposit.toString(),
    };
  }

  async remove(id: string) {
    const item = await this.prisma.paymentMethod.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Metode pembayaran tidak ditemukan.');
    }

    await this.prisma.paymentMethod.delete({ where: { id } });
    return { success: true };
  }

  async findActiveById(id: string) {
    const method = await this.prisma.paymentMethod.findFirst({
      where: { id, status: true },
    });

    if (!method) {
      throw new NotFoundException('Metode pembayaran tidak ditemukan.');
    }

    return method;
  }
}