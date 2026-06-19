import {
  Controller, Get, Post, Delete, Param, Query,
  UseInterceptors, UploadedFile, UploadedFiles, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { v4 as uuid } from 'uuid';
import { ApiTags, ApiOperation, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ROLES } from 'src/common/constants';

@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Subir un archivo' })
  @ApiQuery({ name: 'subdirectory', required: false, description: 'Subcarpeta en public/ (ej: contratos, archivos)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req: any, _file, cb) => {
          const sub = req.query.subdirectory || 'archivos';
          const dir = join(__dirname, '..', '..', '..', 'public', sub);
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname);
          cb(null, `${uuid()}${ext}`);
        },
      }),
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('subdirectory') subdirectory = 'archivos',
  ) {
    if (!file) throw new BadRequestException('Archivo no recibido');
    return this.filesService.saveMetadata(
      file.originalname, file.filename, file.mimetype, file.size, subdirectory,
    );
  }

  @Post('upload-multiple')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Subir múltiples archivos' })
  @ApiQuery({ name: 'subdirectory', required: false })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: (req: any, _file, cb) => {
          const sub = req.query.subdirectory || 'archivos';
          const dir = join(__dirname, '..', '..', '..', 'public', sub);
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname);
          cb(null, `${uuid()}${ext}`);
        },
      }),
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('subdirectory') subdirectory = 'archivos',
  ) {
    if (!files || files.length === 0) throw new BadRequestException('Archivos no recibidos');
    return Promise.all(
      files.map((file) =>
        this.filesService.saveMetadata(
          file.originalname, file.filename, file.mimetype, file.size, subdirectory,
        ),
      ),
    );
  }

  @Get()
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Listar archivos' })
  @ApiQuery({ name: 'subdirectory', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Query('subdirectory') subdirectory?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.filesService.findAll(subdirectory, +page, +limit);
  }

  @Get(':id')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Obtener metadatos de un archivo' })
  async findOne(@Param('id') id: string) {
    return this.filesService.findOne(id);
  }

  @Delete(':id')
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Eliminar archivo (DB + disco)' })
  async remove(@Param('id') id: string) {
    await this.filesService.remove(id);
    return { message: 'Archivo eliminado' };
  }
}
