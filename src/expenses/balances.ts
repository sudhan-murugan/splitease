import { PublicUser } from '../users/public-user';
import { GroupBalances, Settlement } from './dto/group-balances.dto';
import { formatCents } from './money';

// Pure balance calculation, kept free of DB access so it can be unit tested.
// `paid` and `owed` map userId -> total cents; members missing from a map are 0.
// net = paid - owed; nets always sum to zero because each expense's shares
// sum to its amount.
export function calculateBalances(
  members: PublicUser[],
  paid: Map<string, number>,
  owed: Map<string, number>,
): GroupBalances {
  const rows = members
    .map((user) => ({
      user,
      paidCents: paid.get(user.id) ?? 0,
      owedCents: owed.get(user.id) ?? 0,
    }))
    .sort((a, b) => a.user.name.localeCompare(b.user.name));

  return {
    balances: rows.map(({ user, paidCents, owedCents }) => ({
      ...user,
      paid: formatCents(paidCents),
      owed: formatCents(owedCents),
      net: formatCents(paidCents - owedCents),
    })),
    settlements: settle(
      rows.map((r) => ({ user: r.user, net: r.paidCents - r.owedCents })),
    ),
  };
}

// Turns net balances into "who pays whom": repeatedly match the largest
// debtor with the largest creditor. Produces at most n-1 transfers.
export function settle(
  nets: { user: PublicUser; net: number }[],
): Settlement[] {
  const byMagnitude = (a: { net: number }, b: { net: number }) =>
    Math.abs(b.net) - Math.abs(a.net);
  const creditors = nets
    .filter((n) => n.net > 0)
    .map((n) => ({ ...n }))
    .sort(byMagnitude);
  const debtors = nets
    .filter((n) => n.net < 0)
    .map((n) => ({ ...n }))
    .sort(byMagnitude);

  const settlements: Settlement[] = [];
  let c = 0;
  let d = 0;
  while (c < creditors.length && d < debtors.length) {
    const amount = Math.min(creditors[c].net, -debtors[d].net);
    settlements.push({
      from: debtors[d].user,
      to: creditors[c].user,
      amount: formatCents(amount),
    });
    creditors[c].net -= amount;
    debtors[d].net += amount;
    if (creditors[c].net === 0) c++;
    if (debtors[d].net === 0) d++;
  }
  return settlements;
}
