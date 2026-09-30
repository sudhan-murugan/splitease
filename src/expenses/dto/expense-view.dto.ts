import { ApiProperty } from '@nestjs/swagger';
import { PublicUser } from '../../users/public-user';

// Response shapes for the expenses endpoints (classes so Swagger can read them)

export class ExpenseSplitView extends PublicUser {
  @ApiProperty({ example: '30.00', description: "This member's share" })
  shareAmount!: string;
}

export class ExpenseView {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Dinner' })
  description!: string;

  @ApiProperty({ example: '90.00', description: '2-decimal string' })
  amount!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ type: PublicUser })
  paidBy!: PublicUser;

  @ApiProperty({ type: [ExpenseSplitView] })
  splits!: ExpenseSplitView[];
}

export class PaginationMeta {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 3 })
  totalPages!: number;
}

export class PaginatedExpenses {
  @ApiProperty({ type: [ExpenseView] })
  data!: ExpenseView[];

  @ApiProperty({ type: PaginationMeta })
  meta!: PaginationMeta;
}
