import { useEffect, useState } from "react";
import { DatePickerInput } from "@mantine/dates";
import "@mantine/dates/styles.css";
import axios from "axios";
 
import {
  Card,
  Text,
  Group,
  SimpleGrid,
  Badge,
  Button,
  Table,
  Progress,
  ThemeIcon,
  Stack,
  Loader,
  Center,
  Box,
  Collapse,
  ActionIcon,
  Divider,
} from "@mantine/core";
 
import {
  IconCash,
  IconShoppingCart,
  IconWallet,
  IconAlertCircle,
  IconTrendingUp,
  IconPackage,
  IconReportAnalytics,
  IconUsers,
  IconCalendar,
  IconChevronDown,
  IconChevronUp,
  IconFilter,
} from "@tabler/icons-react";
 
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
} from "recharts";
 
// ─── Responsive hook ────────────────────────────────────────────────────────
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
};
 
// ─── Metric Card ─────────────────────────────────────────────────────────────
const MetricCard = ({ icon: Icon, color, badge, label, value }) => (
  <Card shadow="md" radius="xl" p="lg" withBorder>
    <Group justify="space-between">
      <ThemeIcon size={46} radius="xl" color={color}>
        <Icon size={24} />
      </ThemeIcon>
      <Badge color={color} size="md">
        {badge}
      </Badge>
    </Group>
    <Text c="dimmed" mt="lg" size="sm">
      {label}
    </Text>
    <Text fw={800} size="1.6rem" mt={2}>
      {value}
    </Text>
  </Card>
);
 
// ─── Main component ───────────────────────────────────────────────────────────
const Overview = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({
    totalSales: 0,
    totalExpenses: 0,
    pendingSalesPayments: 0,
    pendingPurchasePayments: 0,
    topProducts: [],
    recentSales: [],
    charts: { dailySales: [], monthlySales: [] },
  });
 
  const [dateRange, setDateRange] = useState([null, null]);
  const [generatingFull, setGeneratingFull] = useState(false);
  const [generatingFiltered, setGeneratingFiltered] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
 
  const isMobile = useIsMobile();
 
  const BASE_URL = import.meta.env.VITE_URL;
  const token = localStorage.getItem("authToken");
 
  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/reports/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOverview(res.data);
    } catch (error) {
      console.error("Failed to fetch overview:", error);
    } finally {
      setLoading(false);
    }
  };
 
  useEffect(() => {
    fetchOverview();
  }, []);
 
  // ── Formatters ─────────────────────────────────────────────────────────────
  const formatCurrency = (value) =>
    `SDG ${Number(value || 0).toLocaleString()}`;
 
  // ── Chart data ─────────────────────────────────────────────────────────────
  const monthlyChartData =
    overview?.charts?.monthlySales?.map((item) => ({
      month: item._id.month,
      revenue: item.totalSales,
    })) || [];
 
  const dailyChartData =
    overview?.charts?.dailySales?.map((item) => ({
      day: item._id.day,
      revenue: item.totalSales,
    })) || [];
 
  // ── Generate report ────────────────────────────────────────────────────────
  const generateReport = async ({ filtered = false } = {}) => {
    try {
      filtered ? setGeneratingFiltered(true) : setGeneratingFull(true);
 
      const [startDate, endDate] = dateRange;
      const params = {};
      if (filtered && startDate) params.startDate = startDate.toISOString();
      if (filtered && endDate) params.endDate = endDate.toISOString();
 
      const response = await axios.get(`${BASE_URL}/reports/master`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
 
      const report = response.data.report;
 
      const { pdf } = await import("@react-pdf/renderer");
      const { default: ReportDocument } = await import(
        "../components/ReportDocument"
      );
 
      const blob = await pdf(
        <ReportDocument
          report={report}
          startDate={filtered ? startDate : null}
          endDate={filtered ? endDate : null}
        />
      ).toBlob();
 
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `financial-report-${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Report error:", error);
    } finally {
      setGeneratingFull(false);
      setGeneratingFiltered(false);
    }
  };
 
  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }
 
  const [startDate, endDate] = dateRange;
  const hasDateRange = startDate && endDate;
 
  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Box
      style={{
        background: "#f5f7fb",
        minHeight: "100vh",
        padding: isMobile ? "16px" : "24px",
      }}
    >
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <Box mb="xl">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <div>
            <Text
              size={isMobile ? "1.4rem" : "2rem"}
              fw={800}
              c="dark"
              style={{ lineHeight: 1.2 }}
            >
              Business Overview
            </Text>
            {!isMobile && (
              <Text c="dimmed" mt={4} size="sm">
                Financial analytics, sales metrics, revenue tracking, and
                expenses.
              </Text>
            )}
          </div>
 
          {/* Desktop: inline controls | Mobile: toggle button */}
          {isMobile ? (
            <ActionIcon
              variant={filterOpen ? "filled" : "light"}
              color="blue"
              size="lg"
              radius="xl"
              onClick={() => setFilterOpen((o) => !o)}
              aria-label="Toggle filters"
            >
              <IconFilter size={18} />
            </ActionIcon>
          ) : (
            <Group align="flex-end" gap="sm">
              <DatePickerInput
                type="range"
                placeholder="اختر نطاق التاريخ"
                value={dateRange}
                onChange={setDateRange}
                radius="xl"
                clearable
                valueFormat="YYYY/MM/DD"
                leftSection={<IconCalendar size={16} />}
                style={{ width: 260 }}
              />
              <Button
                radius="xl"
                variant="light"
                onClick={() => generateReport({ filtered: true })}
                loading={generatingFiltered}
                disabled={!hasDateRange}
                title={!hasDateRange ? "اختر نطاق تاريخ أولاً" : ""}
              >
                تقرير مفلتر
              </Button>
              <Button
                radius="xl"
                onClick={() => generateReport({ filtered: false })}
                loading={generatingFull}
              >
                التقرير الكامل
              </Button>
            </Group>
          )}
        </Group>
 
        {/* Mobile: collapsible filter panel */}
        {isMobile && (
          <Collapse in={filterOpen}>
            <Card radius="xl" shadow="sm" withBorder p="md" mt="sm">
              <Text size="sm" fw={600} mb="xs" c="dimmed">
                Generate Report
              </Text>
              <DatePickerInput
                type="range"
                placeholder="اختر نطاق التاريخ"
                value={dateRange}
                onChange={setDateRange}
                radius="xl"
                clearable
                valueFormat="YYYY/MM/DD"
                leftSection={<IconCalendar size={16} />}
                style={{ width: "100%" }}
                mb="sm"
              />
              <Group grow gap="sm">
                <Button
                  radius="xl"
                  variant="light"
                  onClick={() => generateReport({ filtered: true })}
                  loading={generatingFiltered}
                  disabled={!hasDateRange}
                  size="sm"
                >
                  تقرير مفلتر
                </Button>
                <Button
                  radius="xl"
                  onClick={() => generateReport({ filtered: false })}
                  loading={generatingFull}
                  size="sm"
                >
                  التقرير الكامل
                </Button>
              </Group>
            </Card>
          </Collapse>
        )}
      </Box>
 
      {/* ── METRICS ────────────────────────────────────────────────────────── */}
      <SimpleGrid cols={{ base: 2, sm: 2, lg: 4 }} spacing="md">
        <MetricCard
          icon={IconCash}
          color="green"
          badge="Revenue"
          label="Total Sales"
          value={formatCurrency(overview.totalSales)}
        />
        <MetricCard
          icon={IconWallet}
          color="orange"
          badge="Expenses"
          label="Total Expenses"
          value={formatCurrency(overview.totalExpenses)}
        />
        <MetricCard
          icon={IconShoppingCart}
          color="blue"
          badge="Pending"
          label="Pending Sales"
          value={formatCurrency(overview.pendingSalesPayments)}
        />
        <MetricCard
          icon={IconAlertCircle}
          color="red"
          badge="Purchases"
          label="Pending Purchases"
          value={formatCurrency(overview.pendingPurchasePayments)}
        />
      </SimpleGrid>
 
      {/* ── CHARTS ─────────────────────────────────────────────────────────── */}
      <SimpleGrid
        cols={{ base: 1, lg: 3 }}
        spacing="lg"
        mt="xl"
      >
        {/* Monthly bar chart — spans 2 cols on large, full width on mobile */}
        <Card
          radius="xl"
          shadow="md"
          withBorder
          p="lg"
          style={!isMobile ? { gridColumn: "span 2" } : {}}
        >
          <Group justify="space-between" mb="md">
            <div>
              <Text fw={700} size="lg">
                Monthly Sales
              </Text>
              <Text c="dimmed" size="xs">
                Monthly revenue overview
              </Text>
            </div>
            <ThemeIcon size={40} radius="xl" color="blue">
              <IconTrendingUp size={20} />
            </ThemeIcon>
          </Group>
          <div style={{ width: "100%", height: isMobile ? 220 : 360 }}>
            <ResponsiveContainer>
              <BarChart
                data={monthlyChartData}
                margin={{ top: 0, right: 8, left: isMobile ? -20 : 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                />
                <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                <Tooltip />
                <Bar dataKey="revenue" radius={[8, 8, 0, 0]} fill="#228be6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
 
        {/* Financial summary */}
        <Card radius="xl" shadow="md" withBorder p="lg">
          <Text fw={700} size="lg" mb="lg">
            Financial Summary
          </Text>
          <Stack gap="sm">
            <Card radius="xl" bg="green.0" p="md">
              <Text c="dimmed" size="xs">
                Net Profit
              </Text>
              <Text fw={800} size="1.4rem" c="green">
                {formatCurrency(overview.totalSales - overview.totalExpenses)}
              </Text>
            </Card>
            <Card radius="xl" bg="orange.0" p="md">
              <Text c="dimmed" size="xs">
                Pending Installments
              </Text>
              <Text fw={800} size="1.4rem" c="orange">
                {formatCurrency(overview.pendingSalesPayments)}
              </Text>
            </Card>
            <Card radius="xl" bg="blue.0" p="md">
              <Text c="dimmed" size="xs">
                Recent Sales
              </Text>
              <Text fw={800} size="1.4rem" c="blue">
                {overview.recentSales.length}
              </Text>
            </Card>
          </Stack>
        </Card>
      </SimpleGrid>
 
      {/* ── LOWER SECTION ──────────────────────────────────────────────────── */}
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg" mt="xl">
        {/* Top products */}
        <Card radius="xl" shadow="md" withBorder p="lg">
          <Group justify="space-between" mb="lg">
            <Text fw={700} size="lg">
              Top Selling Products
            </Text>
            <ThemeIcon radius="xl" size={38} color="grape">
              <IconPackage size={18} />
            </ThemeIcon>
          </Group>
          <Stack gap="sm">
            {overview.topProducts?.map((item) => (
              <Card key={item._id} radius="xl" bg="gray.0" p="sm">
                <Group justify="space-between" mb={6}>
                  <div>
                    <Text fw={700} size="sm">
                      {item.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {item.totalQty} units sold
                    </Text>
                  </div>
                </Group>
                <Progress
                  value={Math.min((item.totalQty / 1000) * 100, 100)}
                  radius="xl"
                  size="md"
                />
              </Card>
            ))}
          </Stack>
        </Card>
 
        {/* Recent sales */}
        <Card radius="xl" shadow="md" withBorder p="lg">
          <Group justify="space-between" mb="lg">
            <Text fw={700} size="lg">
              Recent Sales
            </Text>
            <ThemeIcon radius="xl" size={38} color="cyan">
              <IconReportAnalytics size={18} />
            </ThemeIcon>
          </Group>
 
          {isMobile ? (
            /* Mobile: card list instead of table */
            <Stack gap="sm">
              {overview.recentSales?.map((sale) => (
                <Card key={sale._id} radius="lg" withBorder p="sm" bg="gray.0">
                  <Group justify="space-between" mb={4}>
                    <Text fw={700} size="sm">
                      {sale.invoiceID}
                    </Text>
                    <Badge
                      color={
                        sale.status === "paid"
                          ? "green"
                          : sale.status === "partial"
                          ? "orange"
                          : "red"
                      }
                      radius="xl"
                      size="sm"
                    >
                      {sale.status}
                    </Badge>
                  </Group>
                  <Text size="xs" c="dimmed">
                    {sale.client?.fullName || "—"}
                  </Text>
                  <Text fw={600} size="sm" mt={4} c="dark">
                    {formatCurrency(sale.totalSalePrice)}
                  </Text>
                </Card>
              ))}
            </Stack>
          ) : (
            /* Desktop: table */
            <Table highlightOnHover verticalSpacing="md">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Invoice</Table.Th>
                  <Table.Th>Client</Table.Th>
                  <Table.Th>Amount</Table.Th>
                  <Table.Th>Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {overview.recentSales?.map((sale) => (
                  <Table.Tr key={sale._id}>
                    <Table.Td>{sale.invoiceID}</Table.Td>
                    <Table.Td>{sale.client?.fullName || "—"}</Table.Td>
                    <Table.Td>{formatCurrency(sale.totalSalePrice)}</Table.Td>
                    <Table.Td>
                      <Badge
                        color={
                          sale.status === "paid"
                            ? "green"
                            : sale.status === "partial"
                            ? "orange"
                            : "red"
                        }
                        radius="xl"
                      >
                        {sale.status}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Card>
      </SimpleGrid>
 
      {/* ── DAILY SALES ────────────────────────────────────────────────────── */}
      <Card radius="xl" shadow="md" withBorder p="lg" mt="xl">
        <Group justify="space-between" mb="lg">
          <div>
            <Text fw={700} size="lg">
              Daily Sales Analytics
            </Text>
            <Text c="dimmed" size="xs">
              Overall daily business performance
            </Text>
          </div>
          <ThemeIcon size={42} radius="xl" color="teal">
            <IconUsers size={20} />
          </ThemeIcon>
        </Group>
        <div style={{ width: "100%", height: isMobile ? 200 : 320 }}>
          <ResponsiveContainer>
            <AreaChart
              data={dailyChartData}
              margin={{ top: 0, right: 8, left: isMobile ? -20 : 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#228be6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#228be6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: isMobile ? 10 : 12 }}
              />
              <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#228be6"
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </Box>
  );
};
 
export default Overview;