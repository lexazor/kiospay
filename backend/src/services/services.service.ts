import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { slugify } from '../common/utils/slug.util';
import { ListServicesQueryDto } from './dto/list-services-query.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic(query: ListServicesQueryDto) {
    const where = {
      status: true,
      ...(query.categorySlug
        ? {
            category: {
              slug: query.categorySlug,
              status: true,
            },
          }
        : {
            category: {
              status: true,
            },
          }),
    };

    return this.prisma.service.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }],
    });
  }

  async listAdmin() {
    return this.prisma.service.findMany({
      include: {
        category: true,
        inputFields: {
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { products: true },
        },
      },
      orderBy: [{ category: { sortOrder: 'asc' } }, { createdAt: 'desc' }],
    });
  }

  async detailBySlug(categorySlug: string, serviceSlug: string) {
    const item = await this.prisma.service.findFirst({
      where: {
        slug: serviceSlug,
        status: true,
        category: {
          slug: categorySlug,
          status: true,
        },
      },
      include: {
        category: true,
        inputFields: {
          orderBy: { sortOrder: 'asc' },
        },
        products: {
          where: { status: true },
          orderBy: [{ tabType: 'asc' }, { nominal: 'asc' }],
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Layanan tidak ditemukan.');
    }

    return {
      ...item,
      products: item.products.map((product) => ({
        ...product,
        nominal: product.nominal.toString(),
        sellingPrice: product.sellingPrice.toString(),
      })),
    };
  }

  async create(dto: CreateServiceDto) {
    await this.ensureCategory(dto.categoryId);
    const slug = await this.resolveUniqueSlug(dto.categoryId, dto.name);

    return this.prisma.service.create({
      data: {
        categoryId: dto.categoryId,
        name: dto.name.trim(),
        slug,
        logoUrl: dto.logoUrl,
        description: dto.description,
        status: dto.status,
        inputFields: dto.inputFields?.length
          ? {
              create: dto.inputFields.map((field, index) => ({
                label: field.label,
                key: slugify(field.label),
                type: field.type,
                required: field.required,
                placeholder: field.placeholder,
                optionsJson: field.options?.length ? field.options : undefined,
                sortOrder: index,
              })),
            }
          : undefined,
      },
      include: {
        inputFields: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async update(id: string, dto: UpdateServiceDto) {
    const existing = await this.prisma.service.findUnique({
      where: { id },
      include: { inputFields: true },
    });

    if (!existing) {
      throw new NotFoundException('Layanan tidak ditemukan.');
    }

    const categoryId = dto.categoryId ?? existing.categoryId;
    if (dto.categoryId) {
      await this.ensureCategory(dto.categoryId);
    }

    const slug = dto.name
      ? await this.resolveUniqueSlug(categoryId, dto.name, id)
      : existing.slug;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.service.update({
        where: { id },
        data: {
          categoryId,
          name: dto.name?.trim() ?? existing.name,
          slug,
          logoUrl: dto.logoUrl ?? existing.logoUrl,
          description: dto.description ?? existing.description,
          status: dto.status ?? existing.status,
        },
      });

      if (dto.inputFields) {
        await tx.serviceInputField.deleteMany({ where: { serviceId: id } });

        if (dto.inputFields.length > 0) {
          await tx.serviceInputField.createMany({
            data: dto.inputFields.map((field, index) => ({
              serviceId: id,
              label: field.label,
              key: slugify(field.label),
              type: field.type,
              required: field.required,
              placeholder: field.placeholder,
              optionsJson: field.options?.length ? field.options : undefined,
              sortOrder: index,
            })),
          });
        }
      }

      return tx.service.findUnique({
        where: { id: updated.id },
        include: {
          inputFields: {
            orderBy: { sortOrder: 'asc' },
          },
          category: true,
        },
      });
    });
  }

  async remove(id: string) {
    const item = await this.prisma.service.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Layanan tidak ditemukan.');
    }

    const productCount = await this.prisma.product.count({
      where: { serviceId: id },
    });

    if (productCount > 0) {
      throw new BadRequestException(
        'Layanan tidak bisa dihapus karena masih memiliki produk.',
      );
    }

    await this.prisma.service.delete({ where: { id } });
    return { success: true };
  }

  private async ensureCategory(categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Kategori tidak ditemukan.');
    }

    return category;
  }

  private async resolveUniqueSlug(
    categoryId: string,
    name: string,
    exceptId?: string,
  ) {
    const base = slugify(name) || 'layanan';

    for (let i = 0; i < 50; i += 1) {
      const candidate = i === 0 ? base : `${base}-${i + 1}`;

      const exists = await this.prisma.service.findFirst({
        where: {
          categoryId,
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