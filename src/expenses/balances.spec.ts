import { PublicUser } from '../users/public-user';
import { calculateBalances } from './balances';
import { splitEqually, toCents } from './money';

const alice: PublicUser = { id: 'a', name: 'Alice', email: 'alice@x.com' };
const bob: PublicUser = { id: 'b', name: 'Bob', email: 'bob@x.com' };
const carol: PublicUser = { id: 'c', name: 'Carol', email: 'carol@x.com' };

// Builds the paid/owed totals the service would aggregate in SQL, from a list
// of equally split expenses — same splitting rule as ExpensesService.create.
function totals(
  expenses: { paidBy: string; amount: number; participants: string[] }[],
) {
  const paid = new Map<string, number>();
  const owed = new Map<string, number>();
  for (const e of expenses) {
    const cents = toCents(e.amount);
    paid.set(e.paidBy, (paid.get(e.paidBy) ?? 0) + cents);
    splitEqually(cents, e.participants.length).forEach((share, i) => {
      const id = e.participants[i];
      owed.set(id, (owed.get(id) ?? 0) + share);
    });
  }
  return { paid, owed };
}

const netOf = (result: ReturnType<typeof calculateBalances>, id: string) =>
  result.balances.find((b) => b.id === id)!.net;

describe('calculateBalances', () => {
  it('equal split among 3 members: payer is owed, others owe their share', () => {
    const { paid, owed } = totals([
      { paidBy: 'a', amount: 90, participants: ['a', 'b', 'c'] },
    ]);

    const result = calculateBalances([alice, bob, carol], paid, owed);

    expect(result.balances).toEqual([
      { ...alice, paid: '90.00', owed: '30.00', net: '60.00' },
      { ...bob, paid: '0.00', owed: '30.00', net: '-30.00' },
      { ...carol, paid: '0.00', owed: '30.00', net: '-30.00' },
    ]);
    // Each debtor pays the payer their share
    expect(result.settlements).toEqual([
      { from: bob, to: alice, amount: '30.00' },
      { from: carol, to: alice, amount: '30.00' },
    ]);
  });

  it('empty group returns no balances and no settlements', () => {
    const result = calculateBalances([], new Map(), new Map());

    expect(result).toEqual({ balances: [], settlements: [] });
  });

  it('group with members but no expenses returns zero balances', () => {
    const result = calculateBalances([alice, bob, carol], new Map(), new Map());

    for (const b of result.balances) {
      expect(b).toMatchObject({ paid: '0.00', owed: '0.00', net: '0.00' });
    }
    expect(result.settlements).toEqual([]);
  });

  it('uneven split keeps nets summing to exactly zero', () => {
    // 100.00 / 3 → shares of 33.34, 33.33, 33.33
    const { paid, owed } = totals([
      { paidBy: 'b', amount: 100, participants: ['a', 'b', 'c'] },
    ]);

    const result = calculateBalances([alice, bob, carol], paid, owed);

    expect(netOf(result, 'a')).toBe('-33.34');
    expect(netOf(result, 'b')).toBe('66.67');
    expect(netOf(result, 'c')).toBe('-33.33');
    const sum = result.balances.reduce((s, b) => s + toCents(b.net), 0);
    expect(sum).toBe(0);
  });

  it('nets out multiple expenses paid by different members', () => {
    const { paid, owed } = totals([
      { paidBy: 'a', amount: 90, participants: ['a', 'b', 'c'] }, // a +60
      { paidBy: 'b', amount: 60, participants: ['a', 'b', 'c'] }, // b +40
    ]);

    const result = calculateBalances([alice, bob, carol], paid, owed);

    expect(netOf(result, 'a')).toBe('40.00'); // 90 - 50
    expect(netOf(result, 'b')).toBe('10.00'); // 60 - 50
    expect(netOf(result, 'c')).toBe('-50.00'); // 0 - 50
    expect(result.settlements).toEqual([
      { from: carol, to: alice, amount: '40.00' },
      { from: carol, to: bob, amount: '10.00' },
    ]);
  });

  it('a payer not in the split is owed the full amount', () => {
    const { paid, owed } = totals([
      { paidBy: 'a', amount: 50, participants: ['b', 'c'] },
    ]);

    const result = calculateBalances([alice, bob, carol], paid, owed);

    expect(netOf(result, 'a')).toBe('50.00');
    expect(netOf(result, 'b')).toBe('-25.00');
    expect(netOf(result, 'c')).toBe('-25.00');
  });

  it('sorts balances by member name', () => {
    const result = calculateBalances([carol, alice, bob], new Map(), new Map());

    expect(result.balances.map((b) => b.name)).toEqual([
      'Alice',
      'Bob',
      'Carol',
    ]);
  });
});
