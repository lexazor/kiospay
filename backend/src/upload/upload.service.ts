import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';

@Injectable()
export class UploadService {
  private readonly baseUploadDir = process.env.UPLOADS_DIR || 'public/uploads';

  saveDepositProof(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File bukti transfer wajib diupload.');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File harus berupa gambar.');
    }

    const dir = path.resolve(process.cwd(), this.baseUploadDir, 'deposits');
    fs.mkdirSync(dir, { recursive: true });

    const ext = path.extname(file.originalname || '.jpg') || '.jpg';
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const targetPath = path.join(dir, fileName);

    try {
      fs.writeFileSync(targetPath, file.buffer);
    } catch {
      throw new InternalServerErrorException('Gagal menyimpan file upload.');
    }

    const normalized = path
      .join(this.baseUploadDir, 'deposits', fileName)
      .replace(/\\/g, '/');

    return `/${normalized}`;
  }
}