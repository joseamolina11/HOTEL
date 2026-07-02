import {
  Controller, Get, Post, Put, Body, UseInterceptors,
  UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { HotelConfigService } from './hotel-config.service';
import { CreateHotelConfigDto, UpdateHotelConfigDto } from './dto/hotel-config.dto';
import { Permissions } from 'src/common/decorators/permissions.decorator';

@ApiTags('Hotel Config')
@Controller('hotel-config')
export class HotelConfigController {
  constructor(private readonly hotelConfigService: HotelConfigService) {}

  @Get()
  @Permissions('hotel-config:view')
  @ApiOperation({ summary: 'Obtener configuración del hotel' })
  @ApiResponse({ status: 200, description: 'Configuración obtenida' })
  async getConfig() {
    return this.hotelConfigService.getConfig();
  }

  @Post()
  @Permissions('hotel-config:edit')
  @ApiOperation({ summary: 'Crear configuración inicial del hotel' })
  @ApiResponse({ status: 201, description: 'Configuración creada' })
  async createConfig(@Body() createDto: CreateHotelConfigDto) {
    return this.hotelConfigService.createConfig(createDto);
  }

  @Put()
  @Permissions('hotel-config:edit')
  @ApiOperation({ summary: 'Actualizar configuración del hotel' })
  @ApiResponse({ status: 200, description: 'Configuración actualizada' })
  async updateConfig(@Body() updateDto: UpdateHotelConfigDto) {
    return this.hotelConfigService.updateConfig(updateDto);
  }

  @Post('logo')
  @Permissions('hotel-config:edit')
  @ApiOperation({ summary: 'Subir logo del hotel' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(__dirname, '..', '..', '..', 'public'),
        filename: (_req: any, file: Express.Multer.File, cb: any) => {
          const ext = extname(file.originalname);
          cb(null, `logo${ext}`);
        },
      }),
      fileFilter: (_req: any, file: Express.Multer.File, cb: any) => {
        if (!file.mimetype.match(/^image\//)) {
          cb(new BadRequestException('Solo se permiten imágenes'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Archivo no recibido');
    const logoUrl = `/uploads/${file.filename}`;
    await this.hotelConfigService.updateConfig({ logo: logoUrl });
    return { logo: logoUrl };
  }
}
