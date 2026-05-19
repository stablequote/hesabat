const buildDateFilter = (from, to, field = "createdAt") => {
  const filter = {};

  if (from || to) {
    filter[field] = {};

    if (from) {
      filter[field].$gte = new Date(from);
    }

    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);

      filter[field].$lte = end;
    }
  }

  return filter;
};

module.exports = buildDateFilter;