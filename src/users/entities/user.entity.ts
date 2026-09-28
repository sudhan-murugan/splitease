import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ unique: true, length: 255 })
  email!: string;

  // Will store a bcrypt hash (added with auth); excluded from default SELECTs
  @Column({ select: false })
  password!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
