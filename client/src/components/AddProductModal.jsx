import { useState } from "react";

import {
  Modal,
  TextInput,
  NumberInput,
  Select,
  Button,
  Group,
  FileInput,
} from "@mantine/core";

import { DateInput } from "@mantine/dates";

export default function AddProductModal({
  opened,
  setOpened,
  onSubmit,
}) {

  const [form, setForm] = useState({
    name: "",
    manufacturer: "",
    category: "",
    unit: "",
    expiryDate: null,
    unitPurchasePrice: 0,
    unitSalePrice: 0,
    image: null,
  });

  // =========================
  // HANDLE SUBMIT
  // =========================

  const handleSubmit = () => {

    if (
      !form.name ||
      !form.category ||
      !form.unit
    ) {
      return;
    }

    onSubmit(form);

    // reset form
    setForm({
      name: "",
      manufacturer: "",
      category: "",
      unit: "",
      expiryDate: null,
      unitPurchasePrice: 0,
      unitSalePrice: 0,
      image: null,
    });

    setOpened(false);
  };

  // =========================
  // UI
  // =========================

  return (
    <Modal
      opened={opened}
      onClose={() => setOpened(false)}
      title="Add New Product"
      size="lg"
      centered
    >

      <TextInput
        label="Product Name"
        placeholder="Enter product name"
        value={form.name}
        onChange={(e) =>
          setForm((prev) => ({
            ...prev,
            name: e.target.value,
          }))
        }
        mb="sm"
        required
      />

      <TextInput
        label="Manufacturer"
        placeholder="Enter manufacturer"
        value={form.manufacturer}
        onChange={(e) =>
          setForm((prev) => ({
            ...prev,
            manufacturer: e.target.value,
          }))
        }
        mb="sm"
      />

      <Select
        label="Category"
        placeholder="Select category"
        data={[
          "Tablets",
          "Capsules",
          "Syrups",
          "Infusions",
          "Creams",
          "Cosmetics",
          "Injections",
          "Medical Supplies",
        ]}
        value={form.category}
        onChange={(value) =>
          setForm((prev) => ({
            ...prev,
            category: value,
          }))
        }
        searchable
        mb="sm"
        required
      />

      <Select
        label="Unit"
        placeholder="Select unit"
        data={[
          "Kilo",
          "Barrel",
          "Piece",
        ]}
        value={form.unit}
        onChange={(value) =>
          setForm((prev) => ({
            ...prev,
            unit: value,
          }))
        }
        mb="sm"
        required
      />

      <DateInput
        label="Expiry Date"
        placeholder="Pick expiry date"
        value={form.expiryDate}
        onChange={(value) =>
          setForm((prev) => ({
            ...prev,
            expiryDate: value,
          }))
        }
        mb="sm"
      />

      <NumberInput
        label="Purchase Price"
        placeholder="Enter purchase price"
        value={form.unitPurchasePrice}
        onChange={(value) =>
          setForm((prev) => ({
            ...prev,
            unitPurchasePrice: value || 0,
          }))
        }
        min={0}
        mb="sm"
      />

      <NumberInput
        label="Sale Price"
        placeholder="Enter sale price"
        value={form.unitSalePrice}
        onChange={(value) =>
          setForm((prev) => ({
            ...prev,
            unitSalePrice: value || 0,
          }))
        }
        min={0}
        mb="sm"
      />

      <FileInput
        label="Product Image"
        placeholder="Select image"
        accept="image/*"
        value={form.image}
        onChange={(value) =>
          setForm((prev) => ({
            ...prev,
            image: value,
          }))
        }
        mb="sm"
      />

      <Group justify="flex-end" mt="lg">
        <Button
          variant="light"
          onClick={() => setOpened(false)}
        >
          Cancel
        </Button>

        <Button onClick={handleSubmit}>
          Add Product
        </Button>
      </Group>

    </Modal>
  );
}