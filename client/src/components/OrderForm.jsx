import { useState } from "react";
import { TextInput, Group, Button, Modal, Select, Flex } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { showNotification } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import axios from "axios";

const OrderForm = ({ opened, setOpened, handleAddOrder, suppliers, productsList, inventoryData, setInventoryData }) => {
  const { t } = useTranslation();
  const BASE_URL = import.meta.env.VITE_URL

  const [newOrder, setNewOrder] = useState({
    supplierId: "",
    products: [{ product: "", quantity: 1, unit: "", unitPurchasePrice: 0, totalPrice: 0 }],
    orderDate: "",
    deliveryDate: "",
    status: "Pending",
    paymentMethod: "",
    paymentStatus: "Pending",
  });

  // Update product field
  const updateProduct = (index, field, value) => {
    const updatedProducts = [...newOrder.products];
    updatedProducts[index][field] = value;

    if (field === "quantity" || field === "unitPurchasePrice") {
      updatedProducts[index].totalPrice =
        updatedProducts[index].quantity * updatedProducts[index].unitPurchasePrice;
    }

    setNewOrder((prev) => ({ ...prev, products: updatedProducts }));
    console.log(newOrder)
  };

  // Add new product row
  const addProduct = () => {
    setNewOrder((prev) => ({
      ...prev,
      products: [...prev.products, { product: "", quantity: 1, unit: "", unitPurchasePrice: 0, totalPrice: 0 }],
    }));
    console.log("All current order details", newOrder)
  };

  // Remove product row
  const removeProduct = (index) => {
    const updatedProducts = newOrder.products.filter((_, i) => i !== index);
    setNewOrder((prev) => ({ ...prev, products: updatedProducts }));
  };

  // Submit form
  const handleSubmit = async () => {
    console.log(newOrder);
    const url = `${BASE_URL}/orders/create`;

    const payload = {
      supplierId: newOrder.supplierId,
      products: newOrder.products.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        unit: item.unit,
        unitPurchasePrice: item.unitPurchasePrice,
        totalPrice: item.totalPrice,
      })),
      paymentMethod: newOrder.paymentMethod,
      orderDate: newOrder.orderDate,
      deliveryDate: newOrder.deliveryDate,
      orderedBy: "Asaad",
      branch: "Thawra 30",
    };

    try {
      const response = await axios.post(url, payload);
      if (response.status === 201) {
        showNotification({ title: "Success", message: "Order placed successfully", color: "green" });
      } else {
        showNotification({ title: "Error", message: "Error placing order", color: "red" });
      }
    } catch (error) {
      showNotification({ title: "Error", message: error.message, color: "red" });
    }

    setOpened(false);
    setNewOrder({
      supplierId: "",
      products: [{ product: "", quantity: 1, unit: "", unitPurchasePrice: 0, totalPrice: 0 }],
      orderDate: "",
      deliveryDate: "",
      status: "Pending",
      paymentMethod: "",
      paymentStatus: "Pending",
    });
  };

  return (
    <Modal  opened={opened} onClose={() => setOpened(false)} title={t("Create-New-Order")} size={1200}>
      {/* Supplier Selection */}
      <Select
        label={t("SELECT-SUPPLIER")}
        value={newOrder.supplierId}
        onChange={(value) => setNewOrder((prev) => ({ ...prev, supplierId: value }))}
        data={suppliers}
        required
      />

      {/* Product List */}
      {newOrder.products.map((item, index) => (
        <Flex key={index} justify="space-between" mt="md">
          <Select
            label="Product"
            placeholder={t("Type-Product-Name")}
            searchable
            // nothingFound="No product found"
            maxDropdownHeight={280}
            value={item.product}
            onChange={(value) => updateProduct(index, "product", value)}
            // data={productsList}
            data={inventoryData.map((item) => ({
              value: item._id,
              label: item.product,
            }))}
            creatable
            getCreateLabel={(query) => `+ Create ${query}`}
            onCreate={(query) => {
              // Create a temporary product entry with a fake ID (since it’s not in the DB yet)
              const newFakeId = `new-${Date.now()}`;
              const newProduct = { _id: newFakeId, product: query };
          
              // Update inventoryData, which automatically updates productsList
              setInventoryData((prev) => [...prev, newProduct]);
          
              return { value: newFakeId, label: query }; // this is passed to onChange
            }}
          />
          <TextInput
            label={t("Quantity")}
            type="number"
            value={item.quantity}
            onChange={(e) => updateProduct(index, "quantity", Number(e.target.value))}
            required
          />
          <TextInput
            label={t("Unit-Price")}
            type="number"
            value={item.unitPurchasePrice}
            onChange={(e) => updateProduct(index, "unitPurchasePrice", Number(e.target.value))}
            required
          />
          <Select
            label={t("Unit")}
            value={item.unit}
            data={["Box", "Piece", "Bottle"]}
            onChange={(value) => updateProduct(index, "unit", value)}
            required
          />
          <TextInput label={t("Total-Price")} type="number" value={item.totalPrice} disabled />
          <Button mt="xl" color="red" onClick={() => removeProduct(index)} disabled={index === 0}>
            {t("Remove")}
          </Button>
        </Flex>
      ))}

      <Button fullWidth mt="md" onClick={addProduct}>{t("Add-Another-Product")}+</Button>

      {/* Order Date */}
      <DateInput
        label={t("Order-Date")}
        value={newOrder.orderDate ? new Date(newOrder.orderDate) : null}
        onChange={(date) => setNewOrder((prev) => ({ ...prev, orderDate: date?.toISOString().split("T")[0] }))}
        size="sm"
        allowDeselect
        allowFreeInput
        required
      />

      {/* Delivery Date */}
      <DateInput
        label={t("DELIVERY-DATE")}
        value={newOrder.deliveryDate ? new Date(newOrder.deliveryDate) : null}
        onChange={(date) => setNewOrder((prev) => ({ ...prev, deliveryDate: date?.toISOString().split("T")[0] }))}
        size="sm"
        allowDeselect
        allowFreeInput
      />

      <Select
        label={t("Payment-Method")}
        value={newOrder.paymentMethod}
        placeholder={t("Select-Payment-Method")}
        onChange={(value) => setNewOrder((prev) => ({ ...prev, paymentMethod: value }))}
        data={["Cash", "Bankak"]}
      />

      <Select
        label={t("Payment-Status")}
        value={newOrder.paymentStatus}
        onChange={(value) => setNewOrder((prev) => ({ ...prev, paymentStatus: value }))}
        data={[t("PENDING"), t("Paid")]}
        required
      />

      <Flex justify="space-between" mt="md">
        <Button variant="light" onClick={() => setOpened(false)}>{t("CANCEL")}</Button>
        <Button onClick={handleSubmit}>{t("CREATE-ORDER")}</Button>
      </Flex>
    </Modal>
  );
};

export default OrderForm;