import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../auth/entities/user.entity';
import { CreateUserDto, UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createDto: CreateUserDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: createDto.email },
    });
    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(createDto.password, 10);

    const user = this.userRepository.create({
      email: createDto.email,
      password: hashedPassword,
      nombres: createDto.nombres,
      apellidos: createDto.apellidos,
      role: createDto.role || 'reception',
    });

    return this.userRepository.save(user);
  }

  async findAll(page = 1, limit = 10) {
    const [data, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      select: ['id', 'email', 'nombres', 'apellidos', 'role', 'activo', 'createdAt'],
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'nombres', 'apellidos', 'role', 'activo', 'createdAt'],
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async update(id: string, updateDto: UpdateUserDto) {
    const user = await this.findOne(id);
    Object.assign(user, updateDto);
    return this.userRepository.save(user);
  }

  async toggleActive(id: string) {
    const user = await this.findOne(id);
    user.activo = !user.activo;
    return this.userRepository.save(user);
  }
}
