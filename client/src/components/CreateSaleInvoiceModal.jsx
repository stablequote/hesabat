import {
  Modal,
  Select,
  NumberInput,
  Button,
  Flex,
  Divider,
  Textarea,
  Group,
  Box,
  Text,
  ActionIcon,
  TextInput,
} from "@mantine/core";
import { IconTrash, IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import axios from "axios";
import { showNotification } from "@mantine/notifications";

const CreateSaleInvoiceModal = ({
  opened,
  setOpened,
  clients,
  inventoryData,
  token,
  BASE_URL,
  onSuccess,
  setAddClientModalOpened
}) => {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    client: "",
    products: [
      {
        product: "",
        quantity: 1,
        unit: "",
        salePrice: 0,
      },
    ],
    payments: [],
    discount: 0,
    notes: "",
  });

  // =========================
  // PRODUCT LOGIC
  // =========================

  const updateProduct = (index, field, value) => {
    const updated = [...form.products];
    updated[index][field] = value;

    // auto-fill price when selecting product
    if (field === "product") {
      const selected = inventoryData?.find((i) => i?.product?._id === value);
      if (selected) {
        updated[index].salePrice = selected.product.salePrice || 0;
      }
    }

    setForm((prev) => ({ ...prev, products: updated }));
  };

  const addProduct = () => {
    setForm((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        { product: "", quantity: 1, unit: "", salePrice: 0 },
      ],
    }));
  };

  const removeProduct = (index) => {
    setForm((prev) => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index),
    }));
  };

  // =========================
  // PAYMENTS (FIXED)
  // =========================

  const addPayment = () => {
    setForm((prev) => ({
      ...prev,
      payments: [
        ...prev.payments,
        {
          transactions: [{ amount: 0, method: "Cash", transactionNumber: "" }],
          notes: "",
        },
      ],
    }));
  };

  const updateTransaction = (pIndex, tIndex, field, value) => {
    const updated = [...form.payments];
    updated[pIndex].transactions[tIndex][field] = value;

    setForm((prev) => ({ ...prev, payments: updated }));
  };

  const addTransaction = (pIndex) => {
    const updated = [...form.payments];
    updated[pIndex].transactions.push({
      amount: 0,
      method: "Cash",
      transactionNumber: "",
    });

    setForm((prev) => ({ ...prev, payments: updated }));
  };

  const removeTransaction = (pIndex, tIndex) => {
    const updated = [...form.payments];

    updated[pIndex].transactions = updated[pIndex].transactions.filter(
      (_, i) => i !== tIndex
    );

    setForm((prev) => ({ ...prev, payments: updated }));
  };

  // =========================
  // TOTALS (FIXED)
  // =========================

  const totalSalePrice = form.products.reduce(
    (sum, p) => sum + p.quantity * p.salePrice,
    0
  );

  const discount = Number(form.discount || 0);

  const totalAfterDiscount = totalSalePrice - discount;

  const paidAmount = form.payments.reduce((sum, p) => {
    const txSum = p.transactions.reduce(
      (acc, t) => acc + Number(t.amount || 0),
      0
    );
    return sum + txSum;
  }, 0);

  const remaining = totalAfterDiscount - paidAmount;

  // =========================
  // SUBMIT
  // =========================

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // build payments correctly
      const formattedPayments = form.payments.map((p) => {
        const totalAmount = p.transactions.reduce(
          (sum, t) => sum + Number(t.amount || 0),
          0
        );

        return {
          totalAmount,
          transactions: p.transactions,
          notes: p.notes,
        };
      });

      const payload = {
        client: form.client,
        products: form.products.map((p) => ({
          product: p.product,
          quantity: p.quantity,
          unit: p.unit,
          salePrice: p.salePrice,
        })),
        payments: formattedPayments,
        notes: form.notes,
        discount, // optional if backend supports
      };

      const res = await axios.post(
        `${BASE_URL}/sale-invoices/create`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      showNotification({
        title: "Success",
        message: "Sale created successfully",
        color: "green",
      });

      onSuccess?.(res.data.invoice);
      setOpened(false);
    } catch (err) {
      showNotification({
        title: "Error",
        message: err.response?.data?.message || err.message,
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // UI
  // =========================

  return (
    <Modal opened={opened} onClose={() => setOpened(false)} size={1200} title="New Sale Invoice">

      {/* CLIENT */}
      <Group align="end">
        <Select
          label="Client"
          data={clients}
          value={form.client}
          onChange={(v) =>
            setForm((prev) => ({ ...prev, client: v }))
          }
          searchable
          style={{ flex: 1 }}
        />

        <Button
          variant="light"
          onClick={() => setAddClientModalOpened(true)}
        >
          + New
        </Button>
      </Group>

      <Divider my="md" />

      {/* PRODUCTS */}
      {form.products?.map((item, index) => {
        const stock =
          inventoryData?.find((i) => i?.product?._id === item?.product)?.quantity || 0;

        return (
       <Flex key={index} gap="sm" align="stretch" mt="sm">

  <Box style={{ flex: 1 }}>
    <Select
      label="Product"
      searchable
      data={inventoryData?.map((i) => ({
        value: i.product?._id,
        label: `${i?.product?.name} (Stock: ${i?.quantity})`,
      }))}
      value={item?.product}
      onChange={(v) => updateProduct(index, "product", v)}
    />
  </Box>

  <Box w={100}>
    <NumberInput
      label="Qty"
      value={item.quantity}
      onChange={(v) => updateProduct(index, "quantity", v)}
      min={1}
      error={item.quantity > stock ? "Exceeds stock" : false}
    />
  </Box>

  <Box w={120}>
    <Select
      label="Unit"
      data={["Kilo", "Barrel", "Piece"]}
      value={item.unit}
      onChange={(v) => updateProduct(index, "unit", v)}
    />
  </Box>

  <Box w={140}>
    <NumberInput
      label="Sale Price"
      value={item.salePrice}
      onChange={(v) => updateProduct(index, "salePrice", v)}
    />
  </Box>

  {/* 👇 FIXED ALIGNMENT */}
  <Box style={{ display: "flex", alignItems: "flex-end", paddingBottom: 6 }}>
    <Text fw={500}>
      {(item.quantity * item.salePrice).toLocaleString()} SDG
    </Text>
  </Box>

  <Box style={{ display: "flex", alignItems: "flex-end" }}>
    <ActionIcon color="red" onClick={() => removeProduct(index)}>
      <IconTrash size={18} />
    </ActionIcon>
  </Box>

</Flex>
        );
      })}

      <Button mt="sm" leftSection={<IconPlus />} onClick={addProduct}>
        Add Product
      </Button>

      <Divider my="md" />

      {/* PAYMENTS */}
      <Group justify="space-between">
        <Text fw={600}>Payments</Text>
        <Button size="xs" onClick={addPayment}>
          Add Payment
        </Button>
      </Group>

      {form.payments.map((payment, pIndex) => (
        <Box key={pIndex} mt="sm" p="sm" style={{ border: "1px solid #eee", borderRadius: 8 }}>
          {payment.transactions.map((t, tIndex) => (
            <Flex key={tIndex} gap="sm" mt="xs" align="end">
              <NumberInput
                label="Amount"
                value={t.amount}
                onChange={(v) =>
                  updateTransaction(pIndex, tIndex, "amount", v)
                }
              />

              <Select
                label="Method"
                data={["Cash", "Bankak"]}
                value={t.method}
                onChange={(v) =>
                  updateTransaction(pIndex, tIndex, "method", v)
                }
              />

              {t.method === "Bankak" && (
                <TextInput
                  label="Transaction #"
                  value={t.transactionNumber || ""}
                  onChange={(e) =>
                    updateTransaction(
                      pIndex,
                      tIndex,
                      "transactionNumber",
                      e.target.value
                    )
                  }
                />
              )}

              <ActionIcon
                color="red"
                onClick={() => removeTransaction(pIndex, tIndex)}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Flex>
          ))}

          <Button size="xs" mt="xs" onClick={() => addTransaction(pIndex)}>
            + Add Transaction
          </Button>
        </Box>
      ))}

      <Divider my="md" />

      {/* TOTALS */}
      <Group justify="space-between">
        <Text>Total: {totalSalePrice.toLocaleString()} SDG</Text>
        <Text>Discount: {discount.toLocaleString()} SDG</Text>
        <Text>Final: {totalAfterDiscount.toLocaleString()} SDG</Text>
        <Text>Paid: {paidAmount.toLocaleString()} SDG</Text>
        <Text color={remaining > 0 ? "red" : "green"}>
          Remaining: {remaining.toLocaleString()} SDG
        </Text>
      </Group>

      <NumberInput
        label="Discount"
        value={form.discount}
        onChange={(v) =>
          setForm((prev) => ({ ...prev, discount: v }))
        }
      />

      <Textarea
        label="Notes"
        value={form.notes}
        onChange={(e) =>
          setForm((prev) => ({ ...prev, notes: e.target.value }))
        }
      />

      <Group justify="flex-end" mt="md">
        <Button variant="light" onClick={() => setOpened(false)}>
          Cancel
        </Button>
        <Button loading={loading} onClick={handleSubmit}>
          Create Sale
        </Button>
      </Group>
    </Modal>
  );
};

export default CreateSaleInvoiceModal;