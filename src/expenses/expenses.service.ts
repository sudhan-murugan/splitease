import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { GroupMember } from '../groups/entities/group-member.entity';
import { GroupsService } from '../groups/groups.service';
import { toPublicUser } from '../users/public-user';
import { calculateBalances } from './balances';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseView, PaginatedExpenses } from './dto/expense-view.dto';
import { GroupBalances } from './dto/group-balances.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { ExpenseSplit } from './entities/expense-split.entity';
import { Expense } from './entities/expense.entity';
import { formatCents, splitEqually, toCents } from './money';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Expense)
    private readonly expensesRepo: Repository<Expense>,
    @InjectRepository(ExpenseSplit)
    private readonly splitsRepo: Repository<ExpenseSplit>,
    @InjectRepository(GroupMember)
    private readonly membersRepo: Repository<GroupMember>,
    private readonly groupsService: GroupsService,
  ) {}

  // Creates the expense and its equal splits in one transaction:
  // either every row is written or none are.
  async create(
    groupId: string,
    dto: CreateExpenseDto,
    requesterId: string,
  ): Promise<ExpenseView> {
    await this.groupsService.assertMember(groupId, requesterId);

    const totalCents = toCents(dto.amount);
    const shares = splitEqually(totalCents, dto.participantIds.length);

    const expenseId = await this.dataSource.transaction(async (manager) => {
      // The payer and every participant must belong to this group
      const userIds = [...new Set([dto.paidById, ...dto.participantIds])];
      const members = await manager.find(GroupMember, {
        select: { userId: true },
        where: { groupId, userId: In(userIds) },
      });
      const memberIds = new Set(members.map((m) => m.userId));
      const outsiders = userIds.filter((id) => !memberIds.has(id));
      if (outsiders.length > 0) {
        throw new BadRequestException(
          `Not members of this group: ${outsiders.join(', ')}`,
        );
      }

      const expense = await manager.save(
        manager.create(Expense, {
          groupId,
          paidById: dto.paidById,
          description: dto.description,
          amount: formatCents(totalCents),
        }),
      );
      await manager.insert(
        ExpenseSplit,
        dto.participantIds.map((userId, i) => ({
          expenseId: expense.id,
          userId,
          shareAmount: formatCents(shares[i]),
        })),
      );
      return expense.id;
    });

    const expense = await this.expensesRepo.findOneOrFail({
      where: { id: expenseId },
      relations: { paidBy: true, splits: { user: true } },
    });
    return toExpenseView(expense);
  }

  // Newest first; id breaks ties so pages are stable
  async findAll(
    groupId: string,
    { page, limit }: PaginationQueryDto,
    requesterId: string,
  ): Promise<PaginatedExpenses> {
    await this.groupsService.assertMember(groupId, requesterId);

    const [expenses, total] = await this.expensesRepo.findAndCount({
      where: { groupId },
      relations: { paidBy: true, splits: { user: true } },
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data: expenses.map(toExpenseView),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // Totals are aggregated in SQL; the net/settlement math lives in balances.ts
  async getBalances(
    groupId: string,
    requesterId: string,
  ): Promise<GroupBalances> {
    await this.groupsService.assertMember(groupId, requesterId);

    const [members, paidRows, owedRows] = await Promise.all([
      this.membersRepo.find({ where: { groupId }, relations: { user: true } }),
      this.expensesRepo
        .createQueryBuilder('e')
        .select('e.paidById', 'userId')
        .addSelect('SUM(e.amount)', 'total')
        .where('e.groupId = :groupId', { groupId })
        .groupBy('e.paidById')
        .getRawMany<{ userId: string; total: string }>(),
      this.splitsRepo
        .createQueryBuilder('s')
        .innerJoin('s.expense', 'e')
        .select('s.userId', 'userId')
        .addSelect('SUM(s.shareAmount)', 'total')
        .where('e.groupId = :groupId', { groupId })
        .groupBy('s.userId')
        .getRawMany<{ userId: string; total: string }>(),
    ]);

    const paid = new Map(paidRows.map((r) => [r.userId, toCents(r.total)]));
    const owed = new Map(owedRows.map((r) => [r.userId, toCents(r.total)]));
    return calculateBalances(
      members.map((m) => toPublicUser(m.user)),
      paid,
      owed,
    );
  }
}

function toExpenseView(expense: Expense): ExpenseView {
  return {
    id: expense.id,
    description: expense.description,
    amount: expense.amount,
    createdAt: expense.createdAt,
    paidBy: toPublicUser(expense.paidBy),
    splits: expense.splits
      .map((s) => ({ ...toPublicUser(s.user), shareAmount: s.shareAmount }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}
