import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { slugify } from '../common/utils/slug.util';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async listAdmin() {
    const items = await this.prisma.product.findMany({
      include: {
        service: {
          include: {
            category: true,
          },
        },
      },
      orderBy: [{ service: { name: 'asc' } }, { nominal: 'asc' }],
    });

    return items.map((item) => ({
      ...item,
      nominal: item.nominal.toString(),
      sellingPrice: item.sellingPrice.toString(),
    }));
  }

  async listByService(serviceId: string) {
    const items = await this.prisma.product.findMany({
      where: { serviceId, status: true },
      orderBy: [{ tabType: 'asc' }, { nominal: 'asc' }],
    });

    return items.map((item) => ({
      ...item,
      nominal: item.nominal.toString(),
      sellingPrice: item.sellingPrice.toString(),
    }));
  }

  async create(dto: CreateProductDto) {
    await this.ensureService(dto.serviceId);

    const slug = await this.resolveUniqueSlug(dto.serviceId, dto.name);

    const item = await this.prisma.product.create({
      data: {
        serviceId: dto.serviceId,
        name: dto.name.trim(),
        slug,
        tabType: dto.tabType || null,
        nominal: new Prisma.Decimal(dto.nominal),
        sellingPrice: new Prisma.Decimal(dto.sellingPrice),
        status: dto.status,
        stock: dto.stock ?? null,
      },
    });

    return {
      ...item,
      nominal: item.nominal.toString(),
      sellingPrice: item.sellingPrice.toString(),
    };
  }

  async update(id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Produk tidak ditemukan.');
    }

    const serviceId = dto.serviceId ?? existing.serviceId;
    if (dto.serviceId) {
      await this.ensureService(dto.serviceId);
    }

    const slug = dto.name
      ? await this.resolveUniqueSlug(serviceId, dto.name, id)
      : existing.slug;

    const item = await this.prisma.product.update({
      where: { id },
      data: {
        serviceId,
        name: dto.name?.trim() ?? existing.name,
        slug,
        tabType: Object.prototype.hasOwnProperty.call(dto, 'tabType')
          ? dto.tabType || null
          : existing.tabType,
        nominal:
          dto.nominal !== undefined
            ? new Prisma.Decimal(dto.nominal)
            : existing.nominal,
        sellingPrice:
          dto.sellingPrice !== undefined
            ? new Prisma.Decimal(dto.sellingPrice)
            : existing.sellingPrice,
        status: dto.status ?? existing.status,
        stock:
          dto.stock !== undefined
            ? dto.stock
            : existing.stock,
      },
    });

    return {
      ...item,
      nominal: item.nominal.toString(),
      sellingPrice: item.sellingPrice.toString(),
    };
  }

  async bulkToggleStatus(ids: string[], status: boolean) {
    if (!ids.length) {
      throw new BadRequestException('Daftar ID produk tidak boleh kosong.');
    }

    await this.prisma.product.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });

    return { success: true };
  }

  async remove(id: string) {
    const item = await this.prisma.product.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Produk tidak ditemukan.');
    }

    await this.prisma.product.delete({ where: { id } });

    return { success: true };
  }

  async findActiveById(id: string) {
    const item = await this.prisma.product.findFirst({
      where: { id, status: true, service: { status: true, category: { status: true } } },
      include: {
        service: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Produk tidak ditemukan.');
    }

    return item;
  }

  private async ensureService(serviceId: string) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException('Layanan tidak ditemukan.');
    }

    return service;
  }

  private async resolveUniqueSlug(serviceId: string, name: string, exceptId?: string) {
    const base = slugify(name) || 'produk';

    for (let i = 0; i < 50; i += 1) {
      const candidate = i === 0 ? base : `${base}-${i + 1}`;

      const exists = await this.prisma.product.findFirst({
        where: {
          serviceId,
          slug: candidate,
          ...(exceptId ? { id: { not: exceptId } } : {}),
        },
      });

      if (!exists) {
        return candidate;
      }
    }

    return `${base}-${Date.now()}`;
  }
}