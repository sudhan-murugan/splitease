import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { GroupMember } from '../groups/entities/group-member.entity';
import { GroupsService } from '../groups/groups.service';
import { ExpenseSplit } from './entities/expense-split.entity';
import { Expense } from './entities/expense.entity';
import { ExpensesService } from './expenses.service';

// Minimal chainable stand-in for TypeORM's SelectQueryBuilder
function queryBuilderReturning(rows: { userId: string; total: string }[]) {
  const qb: Record<string, jest.Mock> = {};
  for (const m of ['select', 'addSelect', 'innerJoin', 'where', 'groupBy']) {
    qb[m] = jest.fn().mockReturnValue(qb);
  }
  qb.getRawMany = jest.fn().mockResolvedValue(rows);
  return qb;
}

describe('ExpensesService.getBalances', () => {
  const user = (id: string, name: string) => ({
    id,
    name,
    email: `${name.toLowerCase()}@x.com`,
  });
  const members = [user('a', 'Alice'), user('b', 'Bob'), user('c', 'Carol')];

  let service: ExpensesService;
  let groupsService: { assertMember: jest.Mock };
  let membersRepo: { find: jest.Mock };
  let expensesRepo: { createQueryBuilder: jest.Mock };
  let splitsRepo: { createQueryBuilder: jest.Mock };

  beforeEach(async () => {
    groupsService = { assertMember: jest.fn().mockResolvedValue(undefined) };
    membersRepo = { find: jest.fn() };
    expensesRepo = { createQueryBuilder: jest.fn() };
    splitsRepo = { createQueryBuilder: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ExpensesService,
        { provide: DataSource, useValue: {} },
        { provide: getRepositoryToken(Expense), useValue: expensesRepo },
        { provide: getRepositoryToken(ExpenseSplit), useValue: splitsRepo },
        { provide: getRepositoryToken(GroupMember), useValue: membersRepo },
        { provide: GroupsService, useValue: groupsService },
      ],
    }).compile();
    service = moduleRef.get(ExpensesService);
  });

  it('maps SQL totals (pg numeric strings) into net balances', async () => {
    // One 90.00 expense paid by Alice, split equally among all three
    membersRepo.find.mockResolvedValue(members.map((u) => ({ user: u })));
    expensesRepo.createQueryBuilder.mockReturnValue(
      queryBuilderReturning([{ userId: 'a', total: '90.00' }]),
    );
    splitsRepo.createQueryBuilder.mockReturnValue(
      queryBuilderReturning([
        { userId: 'a', total: '30.00' },
        { userId: 'b', total: '30.00' },
        { userId: 'c', total: '30.00' },
      ]),
    );

    const result = await service.getBalances('g1', 'a');

    expect(groupsService.assertMember).toHaveBeenCalledWith('g1', 'a');
    expect(result.balances.map((b) => [b.name, b.net])).toEqual([
      ['Alice', '60.00'],
      ['Bob', '-30.00'],
      ['Carol', '-30.00'],
    ]);
    expect(result.settlements).toHaveLength(2);
  });

  it('returns zero balances for a group with no expenses', async () => {
    membersRepo.find.mockResolvedValue(members.map((u) => ({ user: u })));
    expensesRepo.createQueryBuilder.mockReturnValue(queryBuilderReturning([]));
    splitsRepo.createQueryBuilder.mockReturnValue(queryBuilderReturning([]));

    const result = await service.getBalances('g1', 'a');

    expect(result.balances.every((b) => b.net === '0.00')).toBe(true);
    expect(result.settlements).toEqual([]);
  });

  it('rejects non-members before touching expense data', async () => {
    groupsService.assertMember.mockRejectedValue(new ForbiddenException());

    await expect(service.getBalances('g1', 'outsider')).rejects.toThrow(
      ForbiddenException,
    );
    expect(expensesRepo.createQueryBuilder).not.toHaveBeenCalled();
  });
});
