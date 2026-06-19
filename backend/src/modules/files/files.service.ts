import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { join } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { FileRecord } from './entities/file.entity';

@Injectable()
export class FilesService {
  private readonly uploadDir = join(__dirname, '..', '..', '..', 'public');

  constructor(
    @InjectRepository(FileRecord)
    private readonly fileRepository: Repository<FileRecord>,
  ) {}

  ensureSubdirectory(subdirectory: string): string {
    const dir = join(this.uploadDir, subdirectory);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  async saveMetadata(originalName: string, filename: string, mimeType: string, size: number, subdirectory: string): Promise<FileRecord> {
    const url = `/uploads/${subdirectory}/${filename}`;
    const file = this.fileRepository.create({ originalName, filename, mimeType, size, subdirectory, url });
    return this.fileRepository.save(file);
  }

  async findAll(subdirectory?: string, page = 1, limit = 10) {
    const where: any = {};
    if (subdirectory) where.subdirectory = subdirectory;

    const [data, total] = await this.fileRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const file = await this.fileRepository.findOne({ where: { id } });
    if (!file) throw new NotFoundException('Archivo no encontrado');
    return file;
  }

  async remove(id: string) {
    const file = await this.findOne(id);
    const filePath = join(this.uploadDir, file.subdirectory, file.filename);
    try { unlinkSync(filePath); } catch {}
    return this.fileRepository.remove(file);
  }
}
