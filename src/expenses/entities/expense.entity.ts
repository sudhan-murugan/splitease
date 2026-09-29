import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Group } from '../../groups/entities/group.entity';
import { User } from '../../users/entities/user.entity';
import { ExpenseSplit } from './expense-split.entity';

@Entity('expenses')
@Index(['groupId', 'createdAt']) // serves the paginated per-group listing
@Check('"amount" > 0')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'group_id', type: 'uuid' })
  groupId!: string;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group!: Group;

  @Column({ name: 'paid_by_id', type: 'uuid' })
  paidById!: string;

  // RESTRICT: expense history must not silently lose its payer
  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'paid_by_id' })
  paidBy!: User;

  @Column({ length: 255 })
  description!: string;

  // Exact decimal in the DB; pg returns numeric as a string, which we keep
  // to avoid float rounding (arithmetic is done in integer cents).
  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => ExpenseSplit, (split) => split.expense)
  splits!: ExpenseSplit[];
}
