import { ApiProperty } from '@nestjs/swagger';
import { PublicUser } from '../../users/public-user';

// Response shapes for GET /groups/:id/balances

export class MemberBalance extends PublicUser {
  @ApiProperty({ example: '90.00', description: 'Total this member paid' })
  paid!: string;

  @ApiProperty({
    example: '30.00',
    description: "Total of this member's shares",
  })
  owed!: string;

  @ApiProperty({
    example: '60.00',
    description: 'paid - owed: positive is owed money, negative owes money',
  })
  net!: string;
}

export class Settlement {
  @ApiProperty({ type: PublicUser, description: 'Debtor' })
  from!: PublicUser;

  @ApiProperty({ type: PublicUser, description: 'Creditor' })
  to!: PublicUser;

  @ApiProperty({ example: '30.00' })
  amount!: string;
}

export class GroupBalances {
  @ApiProperty({ type: [MemberBalance] })
  balances!: MemberBalance[];

  @ApiProperty({
    type: [Settlement],
    description: 'Suggested transfers to settle up',
  })
  settlements!: Settlement[];
}
