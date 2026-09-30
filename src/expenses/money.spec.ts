import { formatCents, splitEqually, toCents } from './money';

describe('money helpers', () => {
  describe('toCents', () => {
    it('converts numbers and pg numeric strings to integer cents', () => {
      expect(toCents(12.34)).toBe(1234);
      expect(toCents('90.00')).toBe(9000);
      // 0.1 + 0.2 style float noise is rounded away
      expect(toCents(0.29)).toBe(29);
    });
  });

  describe('formatCents', () => {
    it('formats cents as a 2-decimal string', () => {
      expect(formatCents(0)).toBe('0.00');
      expect(formatCents(5)).toBe('0.05');
      expect(formatCents(123456)).toBe('1234.56');
      expect(formatCents(-50)).toBe('-0.50');
    });
  });

  describe('splitEqually', () => {
    it('splits evenly when the total divides exactly', () => {
      expect(splitEqually(9000, 3)).toEqual([3000, 3000, 3000]);
    });

    it('gives the leftover cents to the first shares and sums to the total', () => {
      const shares = splitEqually(10000, 3);
      expect(shares).toEqual([3334, 3333, 3333]);
      expect(shares.reduce((a, b) => a + b, 0)).toBe(10000);
    });
  });
});
