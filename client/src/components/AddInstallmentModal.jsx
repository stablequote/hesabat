import {
  Modal,
  Button,
  Group,
  NumberInput,
  Select,
  TextInput,
  Textarea,
  Box,
  Flex,
  Text,
  ActionIcon,
  Divider,
} from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { showNotification } from "@mantine/notifications";

const AddInstallmentModal = ({
  opened,
  setOpened,
  invoice, // full invoice object
  SUBMIT_URL,
  token,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);

  const [payment, setPayment] = useState({
    transactions: [
      { amount: 0, method: "Cash", transactionNumber: "" },
    ],
    notes: "",
  });

  // useEffect(() => {
  //   console.log("inside useeffect: ", invoice)
  // }, [invoice])

  // =========================
  // TRANSACTIONS
  // =========================

  const updateTransaction = (index, field, value) => {
    const updated = [...payment.transactions];
    updated[index][field] = value;

    setPayment((prev) => ({
      ...prev,
      transactions: updated,
    }));
  };

  const addTransaction = () => {
    setPayment((prev) => ({
      ...prev,
      transactions: [
        ...prev.transactions,
        { amount: 0, method: "Cash", transactionNumber: "" },
      ],
    }));
  };

  const removeTransaction = (index) => {
    setPayment((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((_, i) => i !== index),
    }));
  };

  // =========================
  // CALCULATIONS
  // =========================

  const totalAmount = payment.transactions.reduce(
    (sum, t) => sum + Number(t.amount || 0),
    0
  );

  const remainingBefore = invoice?.remainingAmount || 0;
  const remainingAfter = remainingBefore - totalAmount;

  // =========================
  // SUBMIT
  // =========================

  const handleSubmit = async () => {
    try {
      if (totalAmount <= 0) {
        throw new Error("Payment amount must be greater than 0");
      }

      if (totalAmount > remainingBefore) {
        throw new Error("Payment exceeds remaining amount");
      }

      setLoading(true);

      const payload = {
        payment: {
          totalAmount,
          transactions: payment.transactions,
          notes: payment.notes,
        },
      };

      const res = await axios.post(
        SUBMIT_URL,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      showNotification({
        title: "Success",
        message: "Installment added successfully",
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
    <Modal
      opened={opened}
      onClose={() => setOpened(false)}
      title="Add Installment"
      size="lg"
    >
      {/* Invoice Info */}
      <Box mb="sm">
        <Text fw={600}>Invoice: {invoice?.invoiceID}</Text>
        <Text>Total: {invoice?.paidAmount?.toLocaleString()} SDG</Text>
        <Text>Paid: {invoice?.paidAmount?.toLocaleString()} SDG</Text>
        <Text color="red">
          Remaining: {remainingBefore?.toLocaleString()} SDG
        </Text>
      </Box>

      <Divider my="sm" />

      {/* Transactions */}
      <Group justify="space-between">
        <Text fw={600}>Transactions</Text>
        <Button size="xs" onClick={addTransaction} leftSection={<IconPlus size={14} />}>
          Add
        </Button>
      </Group>

      {payment.transactions.map((t, index) => (
        <Flex key={index} gap="sm" mt="sm" align="end">
          <NumberInput
            label="Amount"
            value={t.amount}
            onChange={(v) => updateTransaction(index, "amount", v)}
            min={0}
          />

          <Select
            label="Method"
            data={["Cash", "Bankak"]}
            value={t.method}
            onChange={(v) => updateTransaction(index, "method", v)}
          />

          {t.method === "Bankak" && (
            <TextInput
              label="Transaction #"
              value={t.transactionNumber || ""}
              onChange={(e) =>
                updateTransaction(index, "transactionNumber", e.target.value)
              }
            />
          )}

          <ActionIcon
            color="red"
            onClick={() => removeTransaction(index)}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Flex>
      ))}

      <Divider my="sm" />

      {/* Totals */}
      <Box>
        <Text>Total Payment: {totalAmount.toLocaleString()} SDG</Text>
        <Text color={remainingAfter < 0 ? "red" : "green"}>
          Remaining After: {remainingAfter.toLocaleString()} SDG
        </Text>
      </Box>

      <Textarea
        label="Notes"
        mt="sm"
        value={payment.notes}
        onChange={(e) =>
          setPayment((prev) => ({ ...prev, notes: e.target.value }))
        }
      />

      <Group justify="flex-end" mt="md">
        <Button variant="light" onClick={() => setOpened(false)}>
          Cancel
        </Button>
        <Button loading={loading} onClick={handleSubmit}>
          Add Installment
        </Button>
      </Group>
    </Modal>
  );
};

export default AddInstallmentModal;