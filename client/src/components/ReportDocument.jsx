import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import CairoRegular from "../assets/Cairo/static/Cairo-Regular.ttf";
import CairoBold from "../assets/Cairo/static/Cairo-Bold.ttf";

Font.register({
  family: "Cairo",
  fonts: [
    { src: CairoRegular, fontWeight: "normal", fontStyle: "normal" },
    { src: CairoBold, fontWeight: "bold", fontStyle: "normal" },
  ],
});

Font.registerHyphenationCallback((word) => [word]);

const s = StyleSheet.create({
  page: {
    fontFamily: "Cairo",
    fontSize: 11,
    padding: 30,
    backgroundColor: "#fff",
    direction: "rtl",
  },

  // ── Header ──────────────────────────────────────────
  h1: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
    textAlign: "right",
  },
  dateText: {
    fontSize: 11,
    marginBottom: 20,
    textAlign: "right",
    color: "#444",
  },
  dateStrong: {
    fontWeight: "bold",
    color: "#000",
  },

  // ── Summary cards ────────────────────────────────────
  summaryRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginBottom: 28,
    gap: 8,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 6,
    textAlign: "right",
    color: "#333",
  },
  cardValue: {
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "right",
    color: "#222",
  },
  green: { color: "green" },
  red: { color: "red" },

  // ── Section heading ──────────────────────────────────
  section: { marginTop: 24 },
  h2: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "right",
    color: "#222",
  },

  // ── Table ────────────────────────────────────────────
  table: { width: "100%" },
  tableHeaderRow: {
    flexDirection: "row-reverse",
    backgroundColor: "#f3f3f3",
  },
  tableRow: {
    flexDirection: "row-reverse",
  },
  tableRowEven: { backgroundColor: "#fafafa" },
  tableRowOdd: { backgroundColor: "#fff" },

  th: {
    flex: 1,
    padding: 8,
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    borderWidth: 0.5,
    borderColor: "#ddd",
    color: "#222",
  },
  td: {
    flex: 1,
    padding: 8,
    fontSize: 10,
    textAlign: "center",
    borderWidth: 0.5,
    borderColor: "#ddd",
    color: "#333",
  },
});

const formatCurr = (v) => `${Number(v || 0).toLocaleString()} SDG`;
const formatDate = (d) => {
  if (!d) return "-";
  const date = new Date(d);
  const day   = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year  = date.getFullYear();
  return `${year}/${month}/${day}`;
};

// Compute expense categories from expenses array
const getExpenseCategories = (expenses) => {
  return expenses.reduce((acc, e) => {
    const cat = e.category || "أخرى";
    acc[cat] = (acc[cat] || 0) + (e.amount || 0);
    return acc;
  }, {});
};

const ReportPDF = ({ report, startDate, endDate }) => {

  const formatReportDate = (d) => {
    if (!d) return "الكل";
    const date = new Date(d);
    const day   = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year  = date.getFullYear();
    return `${year}/${month}/${day}`;
  };

  const displayStart = formatReportDate(startDate);
  const displayEnd   = formatReportDate(endDate);

  const {
    sales = [],
    purchases = [],
    expenses = [],
    totalSales,
    totalPurchases,
    totalExpenses,
    revenue,
  } = report;

  const expenseCategories = getExpenseCategories(expenses);

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* HEADER */}
        <Text style={s.h1}>التقرير المالي الشامل</Text>
        

        <Text style={s.dateText}>
          {`من: ${displayStart}  إلى: ${displayEnd}`}
        </Text>

        {/* SUMMARY CARDS */}
        <View style={s.summaryRow}>
          <View style={s.card}>
            <Text style={s.cardTitle}>إجمالي المبيعات</Text>
            <Text style={s.cardValue}>{formatCurr(totalSales)}</Text>
          </View>
          <View style={s.card}>
            <Text style={s.cardTitle}>إجمالي المشتريات</Text>
            <Text style={s.cardValue}>{formatCurr(totalPurchases)}</Text>
          </View>
          <View style={s.card}>
            <Text style={s.cardTitle}>المنصرفات</Text>
            <Text style={s.cardValue}>{formatCurr(totalExpenses)}</Text>
          </View>
          <View style={s.card}>
            <Text style={s.cardTitle}>صافي الربح</Text>
            <Text style={[s.cardValue, revenue >= 0 ? s.green : s.red]}>
              {formatCurr(revenue)}
            </Text>
          </View>
        </View>

        {/* SALES */}
        <View style={s.section}>
          <Text style={s.h2}>المبيعات</Text>
          <View style={s.table}>
            <View style={s.tableHeaderRow}>
              <Text style={s.th}>رقم الفاتورة</Text>
              <Text style={s.th}>العميل</Text>
              <Text style={s.th}>الإجمالي</Text>
              <Text style={s.th}>الحالة</Text>
              <Text style={s.th}>التاريخ</Text>
            </View>
            {sales.map((sale, i) => (
              <View
                key={i}
                style={[s.tableRow, i % 2 === 0 ? s.tableRowEven : s.tableRowOdd]}
              >
                <Text style={s.td}>{sale.invoiceID || "-"}</Text>
                <Text style={s.td}>{sale.client?.fullName || "-"}</Text>
                <Text style={s.td}>{sale.totalSalePrice?.toLocaleString() || "0"}</Text>
                <Text style={s.td}>{sale.status || "-"}</Text>
                <Text style={s.td}>{formatDate(sale.createdAt)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* PURCHASES */}
        <View style={s.section}>
          <Text style={s.h2}>المشتريات</Text>
          <View style={s.table}>
            <View style={s.tableHeaderRow}>
              <Text style={s.th}>رقم الفاتورة</Text>
              <Text style={s.th}>المورد</Text>
              <Text style={s.th}>الإجمالي</Text>
              <Text style={s.th}>الحالة</Text>
              <Text style={s.th}>التاريخ</Text>
            </View>
            {purchases.map((p, i) => (
              <View
                key={i}
                style={[s.tableRow, i % 2 === 0 ? s.tableRowEven : s.tableRowOdd]}
              >
                <Text style={s.td}>{p.invoiceID || "-"}</Text>
                <Text style={s.td}>{p.vendor?.name || p.vendor?.fullName || "-"}</Text>
                <Text style={s.td}>{p.totalOrderPrice?.toLocaleString() || "0"}</Text>
                <Text style={s.td}>{p.status || "-"}</Text>
                <Text style={s.td}>{formatDate(p.createdAt)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* EXPENSES */}
        <View style={s.section}>
          <Text style={s.h2}>المنصرفات</Text>
          <View style={s.table}>
            <View style={s.tableHeaderRow}>
              <Text style={s.th}>الوصف</Text>
              <Text style={s.th}>الفئة</Text>
              <Text style={s.th}>المبلغ</Text>
              <Text style={s.th}>التاريخ</Text>
            </View>
            {expenses.map((e, i) => (
              <View
                key={i}
                style={[s.tableRow, i % 2 === 0 ? s.tableRowEven : s.tableRowOdd]}
              >
                <Text style={s.td}>{e.description || "-"}</Text>
                <Text style={s.td}>{e.category || "-"}</Text>
                <Text style={s.td}>{e.amount?.toLocaleString() || "0"}</Text>
                <Text style={s.td}>{formatDate(e.createdAt)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* EXPENSE CATEGORIES */}
        <View style={s.section}>
          <Text style={s.h2}>المنصرفات حسب الفئة</Text>
          <View style={s.table}>
            <View style={s.tableHeaderRow}>
              <Text style={s.th}>الفئة</Text>
              <Text style={s.th}>الإجمالي</Text>
            </View>
            {Object.entries(expenseCategories).map(([cat, total], i) => (
              <View
                key={i}
                style={[s.tableRow, i % 2 === 0 ? s.tableRowEven : s.tableRowOdd]}
              >
                <Text style={s.td}>{cat}</Text>
                <Text style={s.td}>{total.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        </View>

      </Page>
    </Document>
  );
};

export default ReportPDF;