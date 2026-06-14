import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle(process.env.SWAGGER_TITLE || 'Hotel PMS API')
    .setDescription(process.env.SWAGGER_DESCRIPTION || 'Property Management System for Hotels')
    .setVersion(process.env.SWAGGER_VERSION || '1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Autenticación y control de acceso')
    .addTag('Hotel Config', 'Configuración del hotel')
    .addTag('Room Types', 'Tipos de habitación')
    .addTag('Amenities', 'Amenidades')
    .addTag('Rooms', 'Gestión de habitaciones')
    .addTag('Guests', 'Gestión de huéspedes')
    .addTag('Reservations', 'Gestión de reservas')
    .addTag('Check-In', 'Registro de entrada')
    .addTag('Check-Out', 'Registro de salida')
    .addTag('Inventory', 'Gestión de inventario')
    .addTag('Consumptions', 'Consumos de huéspedes')
    .addTag('Dashboard', 'Dashboard operativo')
    .addTag('OTA', 'Integración con OTAs')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(process.env.SWAGGER_PATH || 'api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'method',
    },
  });
}
