import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: 'Alice' })
  @Column({ length: 100 })
  name!: string;

  @ApiProperty({ example: 'alice@example.com' })
  @Column({ unique: true, length: 255 })
  email!: string;

  // bcrypt hash. Not selected by default, and @Exclude strips it from any
  // response serialized by the global ClassSerializerInterceptor.
  @ApiHideProperty()
  @Exclude()
  @Column({ select: false })
  password!: string;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
