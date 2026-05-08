import { useEffect } from 'react';
import { Paper, Text, Title, Table, Group, Divider } from '@mantine/core';
import { useTranslation } from 'react-i18next';

const InvoiceTemplate = ({ order }) => {
  const { t } = useTranslation();

  useEffect(() => {
    console.log("Order from inside InvoiceTemplate: ", order)
  }, [])
  return (
    <Paper p="md" style={{ maxWidth: 1200, margin: 'auto' }}>
      {/* Invoice Header */}
      <Group position="apart" mb="lg">
        <div>
          <Title order={2}>{t("Purchase-Invoice")}</Title>
          <Text size="sm" color="dimmed">
            {t("Order-ID")}: {order?.orderID}
          </Text>
        </div>
        <div>
          <Text size="sm" align="right">
            <strong>{t("Supplier")}:</strong> {order?.supplierName}
          </Text>
          <Text size="sm" align="right">
            <strong>{t("Supplier-ID")}:</strong> {order?.supplier.supplierID}
          </Text>
        </div>
      </Group>

      <Divider mb="lg" />

      {/* Order Details */}
      <Group position="apart" mb="lg">
        <div>
          <Text size="sm">
            <strong>{t("Order-Date")}:</strong> {new Date(order.orderDate).toLocaleDateString()}
          </Text>
          <Text size="sm">
            <strong>{t("DELIVERY-DATE")}:</strong> {new Date(order.deliveryDate).toLocaleDateString()}
          </Text>
        </div>
        <div>
          <Text size="sm" align="right">
            <strong>{t("Payment-Method")}:</strong> {order.paymentMethod}
          </Text>
          <Text size="sm" align="right">
            <strong>{t("Payment-Status")}:</strong> {order.isOrderPaid ? t('PAID') : t('PENDING')}
          </Text>
        </div>
      </Group>

      {/* Products Table */}
      <Table striped highlightOnHover>
        <thead>
          <tr>
            <th>{t("Product")}</th>
            <th>{t("Quantity")}</th>
            <th>{t("Unit")}</th>
            <th>{t("Unit-Price")} (SDG)</th>
            <th>{t("Total-Price")} (SDG)</th>
          </tr>
        </thead>
        <tbody>
          {order?.products.map((product, index) => (
            <tr key={index}>
              <td>{product.product.product || product.product}</td>
              <td>{product.quantity}</td>
              <td>{product.unit}</td>
              <td>{product.unitPurchasePrice.toLocaleString()}</td>
              <td>{product.unitTotalPrice.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Total Order Price */}
      <Group position="right" mt="lg">
        <Text size="lg" weight={700}>
          {t("Total-Order-Cost")}: {order.totalOrderPrice.toLocaleString()} SDG
        </Text>
      </Group>

      {/* Footer */}
      <Divider mt="lg" />
      <Text size="sm" color="dimmed" align="center" mt="sm">
        Thank you for your business!
      </Text>
    </Paper>
  );
};

export default InvoiceTemplate;