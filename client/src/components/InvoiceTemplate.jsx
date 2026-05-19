import { useTranslation } from "react-i18next";
import {
  Paper,
  Text,
  Title,
  Table,
  Group,
  Divider,
  Box,
  Badge,
  Grid,
  Stack,
  Button,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import { IconPrinter } from "@tabler/icons-react";
import { useReactToPrint } from "react-to-print";
import { forwardRef } from "react";

const InvoiceTemplate = forwardRef(({ order, handlePrint, title, type }, ref) => {
  const { t } = useTranslation();

  if (!order) return null;

  const formatCurrency = (num) =>
    Number(num || 0).toLocaleString();

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString() : "-";

  return (
    <div ref={ref} dir="rtl" style={{ direction: "rtl" }}>
      <Paper p="xl" radius="md" shadow="sm" style={{ maxWidth: 1100, margin: "auto" }}>
        
        {/* 🔷 HEADER */}
        <Group justify="space-between" mb="md">
          <div>
            <Title order={2}>{t(title)}</Title>
            <Text size="sm" c="dimmed">
              {t("Invoice ID")}: {order.invoiceID}
            </Text>
          </div>

          <Badge
            size="lg"
            color={
              order.status === "paid"
                ? "#2f9e44"
                : order.status === "partial"
                ? "#fab005"
                : "#fa5252"
            }
            variant="light"
          >
            {order.status?.toUpperCase()}
          </Badge>
        </Group>

        <Divider my="md" />

        {/* 🔷 META INFO */}
        <Grid mb="md">
          <Grid.Col span={6}>
            <Stack gap={4}>
              <Text size="sm">
                <strong>{t("Supplier")}:</strong> {order.vendor?.name}
              </Text>
              <Text size="sm">
                <strong>{t("Order Date")}:</strong> {formatDate(order.orderDate)}
              </Text>
              <Text size="sm">
                <strong>{t("Delivery Date")}:</strong> {formatDate(order.deliveryDate)}
              </Text>
            </Stack>
          </Grid.Col>

          <Grid.Col span={6}>
            <Stack gap={4} align="flex-end">
              <Text size="sm">
                <strong>{t("Payment Type")}:</strong> {order.paymentType}
              </Text>
              <Text size="sm">
                <strong>{t("Paid Amount")}:</strong> {formatCurrency(order.paidAmount)} SDG
              </Text>
              <Text size="sm">
                <strong>{t("Remaining")}:</strong> {formatCurrency(order.remainingAmount)} SDG
              </Text>
            </Stack>
          </Grid.Col>
        </Grid>

        {/* 🔷 PRODUCTS TABLE */}
        <Table striped highlightOnHover withTableBorder>
          <thead>
            <tr style={{ border: "1px solid gray" }}>
              <th style={{ borderLeft: "1px solid gray" }}>{t("Product")}</th>
              <th style={{ borderLeft: "1px solid gray" }}> {t("Qty")}</th>
              <th style={{ borderLeft: "1px solid gray" }}> {t("Unit")}</th>
              <th style={{ borderLeft: "1px solid gray" }}>{t("Unit-Price")}</th>
              <th style={{ borderLeft: "1px solid gray" }}>{t("Total")}</th>
            </tr>
          </thead>

          <tbody>
            {order.products?.map((item, idx) => (
              <tr key={idx} style={{ textAlign: "center" }}>
                <td>{item.product?.name || item.product}</td>
                <td>{item.quantity}</td>
                <td>{item.unit}</td>
                <td>{formatCurrency(item.unitPurchasePrice)}</td>
                <td>{formatCurrency(item.unitTotalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </Table>

        {/* 🔷 TOTAL */}
        <Group justify="flex-end" mt="md">
          <Box>
            <Text size="lg" fw={700}>
              {t("Total")}: {formatCurrency(order.totalOrderPrice)} SDG
            </Text>
          </Box>
        </Group>

        <Divider my="lg" />

        {/* 🔷 PAYMENTS SECTION */}
        <Title order={4} mb="sm">
          {t("Payment History")}
        </Title>

        <Table striped withTableBorder>
          <thead>
            <tr style={{ border: "1px solid gray" }}>
              <th style={{ borderLeft: "1px solid gray" }}>{t("Date")}</th>
              <th style={{ borderLeft: "1px solid gray" }}>{t("Method")}</th>
              <th style={{ borderLeft: "1px solid gray" }}>{t("Amount")}</th>
              <th style={{ borderLeft: "1px solid gray" }}>{t("Notes")}</th>
            </tr>
          </thead>

          <tbody>
            {order.payments?.length > 0 ? (
              order.payments.map((p, idx) => (
                <tr key={idx} style={{ textAlign: "center" }}>
                  <td>{formatDate(p.createdAt)}</td>
                  <td>{p.paymentMethod}</td>
                  <td>{formatCurrency(p.amount)}</td>
                  <td>{p.notes || "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4}>
                  <Text align="center" c="dimmed">
                    {t("No payments yet")}
                  </Text>
                </td>
              </tr>
            )}
          </tbody>
        </Table>

        {/* 🔷 SUMMARY BLOCK */}
        <Box mt="lg" p="md" bg="gray.0" style={{ borderRadius: 8 }}>
          <Group justify="space-between">
            <Text>{t("Total")}</Text>
            <Text fw={600}>{formatCurrency(order.totalOrderPrice)} SDG</Text>
          </Group>

          <Group justify="space-between">
            <Text>{t("Paid")}</Text>
            <Text c="green" fw={600}>
              {formatCurrency(order.paidAmount)} SDG
            </Text>
          </Group>

          <Group justify="space-between">
            <Text>{t("Remaining")}</Text>
            <Text c={order.remainingAmount > 0 ? "red" : "green"} fw={600}>
              {formatCurrency(order.remainingAmount)} SDG
            </Text>
          </Group>
        </Box>

        {/* 🔷 FOOTER */}
        <Divider my="lg" />

        <Tooltip label="Print">
          <ActionIcon
            size={42}
            onClick={handlePrint}
          >
            <IconPrinter size={32} />
          </ActionIcon>
        </Tooltip>

        <Text size="sm" c="dimmed" ta="center">
          {t("Automatically Generated by Hesabat system")} • {new Date().toLocaleString()}
        </Text>
      </Paper>
    </div>
  );
});

export default InvoiceTemplate;