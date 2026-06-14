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
import { Roles } from 'src/common/decorators/roles.decorator';
import { ROLES } from 'src/common/constants';

@ApiTags('Hotel Config')
@Controller('hotel-config')
export class HotelConfigController {
  constructor(private readonly hotelConfigService: HotelConfigService) {}

  @Get()
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Obtener configuración del hotel' })
  @ApiResponse({ status: 200, description: 'Configuración obtenida' })
  async getConfig() {
    return this.hotelConfigService.getConfig();
  }

  @Post()
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Crear configuración inicial del hotel' })
  @ApiResponse({ status: 201, description: 'Configuración creada' })
  async createConfig(@Body() createDto: CreateHotelConfigDto) {
    return this.hotelConfigService.createConfig(createDto);
  }

  @Put()
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Actualizar configuración del hotel' })
  @ApiResponse({ status: 200, description: 'Configuración actualizada' })
  async updateConfig(@Body() updateDto: UpdateHotelConfigDto) {
    return this.hotelConfigService.updateConfig(updateDto);
  }

  @Post('logo')
  @Roles(ROLES.ADMIN)
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
