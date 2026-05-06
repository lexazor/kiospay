import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { slugify } from '../common/utils/slug.util';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic() {
    const categories = await this.prisma.category.findMany({
      where: { status: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return categories;
  }

  async listAdmin() {
    return this.prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        _count: {
          select: { services: true },
        },
      },
    });
  }

  async create(dto: CreateCategoryDto) {
    const slug = await this.resolveUniqueSlug(dto.name);

    return this.prisma.category.create({
      data: {
        name: dto.name.trim(),
        slug,
        imageUrl: dto.imageUrl,
        sortOrder: dto.sortOrder,
        status: dto.status,
        badge: dto.badge || null,
      },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.ensureExists(id);

    const payload: Record<string, unknown> = {
      ...dto,
    };

    if (dto.name) {
      payload.slug = await this.resolveUniqueSlug(dto.name, id);
      payload.name = dto.name.trim();
    }

    if (Object.prototype.hasOwnProperty.call(dto, 'badge')) {
      payload.badge = dto.badge || null;
    }

    return this.prisma.category.update({
      where: { id },
      data: payload,
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);

    const serviceCount = await this.prisma.service.count({
      where: { categoryId: id },
    });

    if (serviceCount > 0) {
      throw new BadRequestException(
        'Kategori tidak bisa dihapus karena masih memiliki layanan.',
      );
    }

    await this.prisma.category.delete({ where: { id } });

    return { success: true };
  }

  private async ensureExists(id: string) {
    const item = await this.prisma.category.findUnique({ where: { id } });

    if (!item) {
      throw new NotFoundException('Kategori tidak ditemukan.');
    }

    return item;
  }

  private async resolveUniqueSlug(name: string, exceptId?: string) {
    const base = slugify(name) || 'kategori';

    for (let i = 0; i < 50; i += 1) {
      const candidate = i === 0 ? base : `${base}-${i + 1}`;

      const exists = await this.prisma.category.findFirst({
        where: {
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