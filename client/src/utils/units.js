export const fmt = (n) => Number(n ?? 0).toLocaleString('en-US');
export const sortDesc = (levels = []) => [...levels].sort((a, b) => b.factor - a.factor);

// 340 base units -> ["3 Box", "4 Strip"]
export const stockParts = (levels, base) => {
  let remaining = base ?? 0;
  const parts = [];
  sortDesc(levels).forEach((l) => {
    const qty = Math.floor(remaining / l.factor);
    if (qty > 0) {
      parts.push(`${fmt(qty)} ${l.unit?.name ?? ''}`.trim());
      remaining -= qty * l.factor;
    }
  });
  return parts;
};