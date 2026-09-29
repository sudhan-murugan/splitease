import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Expense } from './expense.entity';

// One user's share of an expense. The composite key means a user appears
// at most once per expense. The shares of an expense sum to its amount.
@Entity('expense_splits')
@Check('"share_amount" >= 0')
export class ExpenseSplit {
  @PrimaryColumn({ name: 'expense_id', type: 'uuid' })
  expenseId!: string;

  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId!: string;

  // Same representation as Expense.amount (see the note there)
  @Column({ name: 'share_amount', type: 'numeric', precision: 12, scale: 2 })
  shareAmount!: string;

  @ManyToOne(() => Expense, (expense) => expense.splits, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'expense_id' })
  expense!: Expense;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
