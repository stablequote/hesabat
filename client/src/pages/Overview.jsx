import { useEffect, useState } from "react";
import { useRef } from "react";
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

const Overview = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({
    totalSales: 0,
    totalExpenses: 0,
    pendingSalesPayments: 0,
    pendingPurchasePayments: 0,
    topProducts: [],
    recentSales: [],
    charts: {
      dailySales: [],
      monthlySales: [],
    },
  });

  // Date range: [startDate, endDate]
  const [dateRange, setDateRange] = useState([null, null]);
  const [generatingFull, setGeneratingFull] = useState(false);
  const [generatingFiltered, setGeneratingFiltered] = useState(false);

  const BASE_URL = import.meta.env.VITE_URL;
  const token = localStorage.getItem("authToken");

  // =========================
  // FETCH OVERVIEW
  // =========================

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

  // =========================
  // FORMATTERS
  // =========================

  const formatCurrency = (value) =>
    `SDG ${Number(value || 0).toLocaleString()}`;

  // =========================
  // CHART DATA
  // =========================

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

  // =========================
  // GENERATE REPORT
  // =========================

  const generateReport = async ({ filtered = false } = {}) => {
    try {
      filtered ? setGeneratingFiltered(true) : setGeneratingFull(true);

      const [startDate, endDate] = dateRange;

      const params = {};
      if (filtered && startDate) params.startDate = startDate.toISOString();
      if (filtered && endDate)   params.endDate   = endDate.toISOString();

      const response = await axios.get(`${BASE_URL}/reports/master`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      const report = response.data.report;

      const { pdf } = await import("@react-pdf/renderer");
      const { default: ReportDocument } = await import("../components/ReportDocument");

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
      link.download = `financial-report-${new Date().toISOString().slice(0, 10)}.pdf`;
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

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  const [startDate, endDate] = dateRange;
  const hasDateRange = startDate && endDate;

  return (
    <Box style={{ background: "#f5f7fb", minHeight: "100vh", padding: "24px" }}>

      {/* HEADER */}
      <Group justify="space-between" mb="xl" align="flex-start">
        <div>
          <Text size="2rem" fw={800} c="dark">
            Business Overview
          </Text>
          <Text c="dimmed" mt={4}>
            Financial analytics, sales metrics, revenue tracking, and expenses.
          </Text>
        </div>

        <Group align="flex-end" gap="sm">
          {/* Date range picker */}
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

          {/* Filtered report */}
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

          {/* Full report */}
          <Button
            radius="xl"
            onClick={() => generateReport({ filtered: false })}
            loading={generatingFull}
          >
            التقرير الكامل
          </Button>
        </Group>
      </Group>

      {/* METRICS */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
        <Card shadow="md" radius="xl" p="lg" withBorder>
          <Group justify="space-between">
            <ThemeIcon size={54} radius="xl" color="green">
              <IconCash size={28} />
            </ThemeIcon>
            <Badge color="green" size="lg">Revenue</Badge>
          </Group>
          <Text c="dimmed" mt="lg">Total Sales</Text>
          <Text fw={800} size="2rem" mt={4}>
            {formatCurrency(overview.totalSales)}
          </Text>
        </Card>

        <Card shadow="md" radius="xl" p="lg" withBorder>
          <Group justify="space-between">
            <ThemeIcon size={54} radius="xl" color="orange">
              <IconWallet size={28} />
            </ThemeIcon>
            <Badge color="orange" size="lg">Expenses</Badge>
          </Group>
          <Text c="dimmed" mt="lg">Total Expenses</Text>
          <Text fw={800} size="2rem" mt={4}>
            {formatCurrency(overview.totalExpenses)}
          </Text>
        </Card>

        <Card shadow="md" radius="xl" p="lg" withBorder>
          <Group justify="space-between">
            <ThemeIcon size={54} radius="xl" color="blue">
              <IconShoppingCart size={28} />
            </ThemeIcon>
            <Badge color="blue" size="lg">Pending</Badge>
          </Group>
          <Text c="dimmed" mt="lg">Pending Sales Payments</Text>
          <Text fw={800} size="2rem" mt={4}>
            {formatCurrency(overview.pendingSalesPayments)}
          </Text>
        </Card>

        <Card shadow="md" radius="xl" p="lg" withBorder>
          <Group justify="space-between">
            <ThemeIcon size={54} radius="xl" color="red">
              <IconAlertCircle size={28} />
            </ThemeIcon>
            <Badge color="red" size="lg">Purchases</Badge>
          </Group>
          <Text c="dimmed" mt="lg">Pending Purchase Payments</Text>
          <Text fw={800} size="2rem" mt={4}>
            {formatCurrency(overview.pendingPurchasePayments)}
          </Text>
        </Card>
      </SimpleGrid>

      {/* CHARTS */}
      <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="lg" mt="xl">
        <Card
          radius="xl"
          shadow="md"
          withBorder
          p="lg"
          style={{ gridColumn: "span 2" }}
        >
          <Group justify="space-between" mb="md">
            <div>
              <Text fw={700} size="xl">Monthly Sales</Text>
              <Text c="dimmed" size="sm">Monthly revenue overview</Text>
            </div>
            <ThemeIcon size={48} radius="xl" color="blue">
              <IconTrendingUp size={24} />
            </ThemeIcon>
          </Group>
          <div style={{ width: "100%", height: 360 }}>
            <ResponsiveContainer>
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" radius={[8, 8, 0, 0]} fill="#228be6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card radius="xl" shadow="md" withBorder p="lg">
          <Text fw={700} size="xl" mb="lg">Financial Summary</Text>
          <Stack>
            <Card radius="xl" bg="green.0" p="md">
              <Text c="dimmed" size="sm">Net Profit</Text>
              <Text fw={800} size="2rem" c="green">
                {formatCurrency(overview.totalSales - overview.totalExpenses)}
              </Text>
            </Card>
            <Card radius="xl" bg="orange.0" p="md">
              <Text c="dimmed" size="sm">Pending Installments</Text>
              <Text fw={800} size="2rem" c="orange">
                {formatCurrency(overview.pendingSalesPayments)}
              </Text>
            </Card>
            <Card radius="xl" bg="blue.0" p="md">
              <Text c="dimmed" size="sm">Recent Sales</Text>
              <Text fw={800} size="2rem" c="blue">
                {overview.recentSales.length}
              </Text>
            </Card>
          </Stack>
        </Card>
      </SimpleGrid>

      {/* LOWER SECTION */}
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg" mt="xl">
        <Card radius="xl" shadow="md" withBorder p="lg">
          <Group justify="space-between" mb="lg">
            <Text fw={700} size="xl">Top Selling Products</Text>
            <ThemeIcon radius="xl" size={42} color="grape">
              <IconPackage size={20} />
            </ThemeIcon>
          </Group>
          <Stack>
            {overview.topProducts?.map((item) => (
              <Card key={item._id} radius="xl" bg="gray.0" p="md">
                <Group justify="space-between" mb="xs">
                  <div>
                    <Text fw={700}>{item.name}</Text>
                    <Text size="sm" c="dimmed">{item.totalQty} units sold</Text>
                  </div>
                </Group>
                <Progress
                  value={Math.min((item.totalQty / 1000) * 100, 100)}
                  radius="xl"
                  size="lg"
                />
              </Card>
            ))}
          </Stack>
        </Card>

        <Card radius="xl" shadow="md" withBorder p="lg">
          <Group justify="space-between" mb="lg">
            <Text fw={700} size="xl">Recent Sales</Text>
            <ThemeIcon radius="xl" size={42} color="cyan">
              <IconReportAnalytics size={20} />
            </ThemeIcon>
          </Group>
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
                  <Table.Td>{sale.client?.fullName || "-"}</Table.Td>
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
        </Card>
      </SimpleGrid>

      {/* DAILY SALES */}
      <Card radius="xl" shadow="md" withBorder p="lg" mt="xl">
        <Group justify="space-between" mb="lg">
          <div>
            <Text fw={700} size="xl">Daily Sales Analytics</Text>
            <Text c="dimmed" size="sm">Overall daily business performance</Text>
          </div>
          <ThemeIcon size={50} radius="xl" color="teal">
            <IconUsers size={24} />
          </ThemeIcon>
        </Group>
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <AreaChart data={dailyChartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#228be6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#228be6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
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