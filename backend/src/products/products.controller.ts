import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ProductsService } from './products.service';
import {
  BulkToggleProductsDto,
  CreateProductDto,
} from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Roles(UserRole.ADMIN)
  @Get('admin')
  listAdmin() {
    return this.productsService.listAdmin();
  }

  @Roles(UserRole.ADMIN)
  @Post('admin')
  create(@Body() body: CreateProductDto) {
    return this.productsService.create(body);
  }

  @Roles(UserRole.ADMIN)
  @Patch('admin/:id')
  update(@Param('id') id: string, @Body() body: UpdateProductDto) {
    return this.productsService.update(id, body);
  }

  @Roles(UserRole.ADMIN)
  @Patch('admin/bulk-status')
  bulkStatus(@Body() body: BulkToggleProductsDto) {
    return this.productsService.bulkToggleStatus(body.ids, body.status);
  }

  @Roles(UserRole.ADMIN)
  @Delete('admin/:id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Roles(UserRole.USER, UserRole.ADMIN)
  @Get('service/:serviceId')
  listByService(@Param('serviceId') serviceId: string) {
    return this.productsService.listByService(serviceId);
  }
}