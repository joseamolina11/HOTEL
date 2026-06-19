import { Transform } from 'class-transformer';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('files')
export class FileRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  originalName: string;

  @Column()
  filename: string;

  @Column()
  mimeType: string;

  @Column()
  size: number;

  @Column()
  subdirectory: string;

  @Column({
    transformer: {
      to: (value: string) => value,
      from: (value: string) =>
        `${process.env.BACKEND_URL}${value}`,
    },
  })
  url: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
