import { useState } from "react";
import { TextInput, Group, Button, Modal, Select, Flex, Textarea, Center, Loader, Divider } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { showNotification } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import axios from "axios";

const OrderForm = ({ opened, setOpened, handleAddOrder, suppliers, productsList, inventoryData, setInventoryData, loading, setLoading, setOrdersData}) => {
  const [purchaseInvoice, setPurchaseInvoice] = useState({
    vendor: "",
    products: [
      {
        product: "",
        quantity: 1,
        unit: "Piece",
        unitPurchasePrice: 0,
        unitTotalPrice: 0,
      },
    ],
    paymentType: "later",
    payments: [
      {
        amount: 0,
        paymentMethod: "Cash",
        notes: "",
      },
    ],
    orderDate: null,
    deliveryDate: null,
    notes: "",
  });

  const { t } = useTranslation();
  const BASE_URL = import.meta.env.VITE_URL;
  const token = localStorage.getItem("authToken");

  // Update product field
  // const updateProduct = (index, field, value) => {
  //   const updatedProducts = [...purchaseInvoice.products];
  //   updatedProducts[index][field] = value;

  //   if (field === "quantity" || field === "unitPurchasePrice") {
  //     updatedProducts[index].totalPrice =
  //       updatedProducts[index].quantity * updatedProducts[index].unitPurchasePrice;
  //   }

  //   setPurchaseInvoice((prev) => ({ ...prev, products: updatedProducts }));
  //   console.log(purchaseInvoice)
  // };

  const updateProduct = (index, field, value) => {
    const updated = [...purchaseInvoice.products];

    updated[index][field] = value;

    if (field === "quantity" || field === "unitPurchasePrice") {
      updated[index].unitTotalPrice =
        Number(updated[index].quantity) *
        Number(updated[index].unitPurchasePrice);
    }

    setPurchaseInvoice((prev) => ({
      ...prev,
      products: updated,
    }));
  };

  // Add new product row
  const addProduct = () => {
    setPurchaseInvoice((prev) => ({
      ...prev,
      products: [...prev.products, { product: "", quantity: 1, unit: "", unitPurchasePrice: 0, totalPrice: 0 }],
    }));
    console.log("All current order details", purchaseInvoice)
  };

  // Remove product row
  const removeProduct = (index) => {
    const updatedProducts = purchaseInvoice.products.filter((_, i) => i !== index);
    setPurchaseInvoice((prev) => ({ ...prev, products: updatedProducts }));
  };

  // Submit form
  const handleSubmit = async () => {
    console.log(purchaseInvoice);
    const url = `${BASE_URL}/purchase-invoices/create`;
    setLoading(true);

    // const payload = {
    //   vendor: purchaseInvoice.vendor,
    //   products: purchaseInvoice.products?.map((item) => ({
    //     product: item.product,
    //     quantity: item.quantity,
    //     unit: item.unit,
    //     unitPurchasePrice: item.unitPurchasePrice,
    //     unitTotalPrice: item.totalPrice,
    //   })),
    //   paymentType: purchaseInvoice.paymentType,
    //   payments: purchaseInvoice.payments,
    //   orderDate: purchaseInvoice.orderDate,
    //   deliveryDate: purchaseInvoice.deliveryDate,
    //   notes: purchaseInvoice.notes,
    // };
    
    const payload = {
      vendor: purchaseInvoice.vendor,
      products: purchaseInvoice.products.map((item) => ({
        product: item.product,
        quantity: Number(item.quantity),
        unit: item.unit,
        unitPurchasePrice: Number(item.unitPurchasePrice),
        unitTotalPrice: Number(item.unitTotalPrice),
      })),
      paymentType: purchaseInvoice.paymentType,
      payments: purchaseInvoice.payments.map((p) => ({
        amount: Number(p.amount),
        paymentMethod: p.paymentMethod,
        notes: p.notes,
      })),
      orderDate: purchaseInvoice.orderDate?.toISOString(),
      deliveryDate: purchaseInvoice.deliveryDate?.toISOString(),
      notes: purchaseInvoice.notes,
    };

    try {
      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 201) {
        showNotification({ title: "Success", message: "Order placed successfully", color: "green" });
        // setOrdersData((prev) => [...prev, response.data.invoice])
        // window.location.reload();
        setOrdersData((prev) => [...prev, response.data.invoice]);
        setOpened(false);

        // setPurchaseInvoice({
        //   vendor: "",
        //   products: [
        //     {
        //       product: "",
        //       quantity: 1,
        //       unit: "Piece",
        //       unitPurchasePrice: 0,
        //       unitTotalPrice: 0,
        //     },
        //   ],
        //   paymentType: "later",
        //   payments: [
        //     {
        //       amount: 0,
        //       paymentMethod: "Cash",
        //       notes: "",
        //     },
        //   ],
        //   orderDate: null,
        //   deliveryDate: null,
        //   notes: "",
        // });
      }
    } catch (error) {
      showNotification({ title: "Error creating invoice", message: error.message, color: "red" });
    } finally {
      setOpened(false);
      setLoading(false);
    }
  };

  const addPayment = () => {
    setPurchaseInvoice((prev) => ({
      ...prev,
      payments: [
        ...prev.payments,
        { amount: "", paymentMethod: "", transactionNumber: "", notes: "" },
      ],
    }));
  };

  const updatePayment = (index, field, value) => {
    const updated = [...purchaseInvoice.payments];
    updated[index][field] = value;

    setPurchaseInvoice((prev) => ({
      ...prev,
      payments: updated,
    }));
  };

  const removePayment = (index) => {
    const updated = purchaseInvoice.payments.filter((_, i) => i !== index);
    setPurchaseInvoice((prev) => ({
      ...prev,
      payments: updated,
    }));
  };

  return (
    <Modal  opened={opened} onClose={() => setOpened(false)} title={t("Create-New-Order")} size={1200}>
      {/* Supplier Selection */}
      <Select
        label={t("SELECT-SUPPLIER")}
        value={purchaseInvoice.vendor}
        onChange={(value) => setPurchaseInvoice((prev) => ({ ...prev, vendor: value }))}
        data={suppliers}
        required
      />

      {/* Product List */}
      {purchaseInvoice?.products?.map((item, index) => (
        <Flex key={index} justify="space-between" mt="md">
          <Select
            label="Product"
            placeholder={t("Type-Product-Name")}
            searchable
            // nothingFound="No product found"
            maxDropdownHeight={280}
            value={item?.product}
            onChange={(value) => updateProduct(index, "product", value)}
            // data={productsList}
            data={inventoryData.map((item) => ({
              value: item.product?._id,
              label: item.product?.name,
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
            value={item?.quantity}
            onChange={(e) => updateProduct(index, "quantity", Number(e.target.value))}
            required
          />
          <TextInput
            label={t("Unit-Price")}
            type="number"
            value={item?.unitPurchasePrice}
            onChange={(e) => updateProduct(index, "unitPurchasePrice", Number(e.target.value))}
            required
          />
          <Select
            label={t("Unit")}
            value={item?.unit}
            data={[
              { value: "Kilo", label: "Kilo" },
              { value: "Barrel", label: "Barrel" },
              { value: "Piece", label: "Piece" },
            ]}
            onChange={(value) => updateProduct(index, "unit", value)}
            required
          />
          <TextInput label={t("Total-Price")} type="number" value={item?.totalPrice} disabled />
          <Button mt="xl" color="red" onClick={() => removeProduct(index)} disabled={index === 0}>
            {t("Remove")}
          </Button>
        </Flex>
      ))}

      <Button fullWidth mt="md" onClick={addProduct}>{t("Add-Another-Product")}+</Button>

      {/* Order Date */}
      <DateInput
        label={t("Order-Date")}
        value={purchaseInvoice?.orderDate ? new Date(purchaseInvoice.orderDate) : null}
        onChange={(date) => setPurchaseInvoice((prev) => ({ ...prev, orderDate: date}))}
        size="sm"
        allowDeselect
        allowFreeInput
        required
      />

      {/* Delivery Date */}
      <DateInput
        label={t("DELIVERY-DATE")}
        value={purchaseInvoice?.deliveryDate ? new Date(purchaseInvoice.deliveryDate) : null}
        onChange={(date) => setPurchaseInvoice((prev) => ({ ...prev, deliveryDate: date}))}
        size="sm"
        allowDeselect
        allowFreeInput
      />
      <Select
        label={t("Payment-Type")}
        placeholder={t("Select-Payment-Type")}
        data={[
          { value: "advanced", label: "Advanced" },
          { value: "later", label: "Later" },
        ]}
        value={purchaseInvoice?.paymentType}
        onChange={(value) => setPurchaseInvoice((prev) => ({ ...prev, paymentType: value }))}
      />

      {/* <Select
        label={t("Payment-Status")}
        placeholder={t("Select-Payment-Status")}
        value={purchaseInvoice.paymentStatus}
        data={[t("paid"), t("pending")]}
        onChange={(value) => setPurchaseInvoice((prev) => ({ ...prev, paymentStatus: value }))}
        required
      /> */}

      {/* hanlding payments UI */}
      {["advanced", "partial"].includes(purchaseInvoice.paymentType) && (
        <>
          <Divider my="md" label="Payments" />

          {purchaseInvoice.payments.map((payment, index) => (
            <Flex key={index} gap="sm" mt="sm" align="end">
              
              <TextInput
                label="Amount"
                type="number"
                value={payment.amount}
                onChange={(e) =>
                  updatePayment(index, "amount", Number(e.target.value))
                }
                required
              />

              <Select
                label="Method"
                value={payment?.paymentMethod}
                data={["Cash", "Bankak"]}
                onChange={(value) =>
                  updatePayment(index, "paymentMethod", value)
                }
                required
              />

              {payment.paymentMethod === "Bankak" && (
                <TextInput
                  label="Transaction #"
                  value={payment?.transactionNumber}
                  onChange={(e) =>
                    updatePayment(index, "transactionNumber", e.target.value)
                  }
                />
              )}

              <TextInput
                label="Notes"
                value={payment?.notes}
                onChange={(e) =>
                  updatePayment(index, "notes", e.target.value)
                }
              />

              <Button
                color="red"
                onClick={() => removePayment(index)}
                disabled={index === 0}
              >
                Remove
              </Button>
            </Flex>
          ))}

          <Button mt="sm" onClick={addPayment}>
            + Add Payment
          </Button>
        </>
      )}

      <Textarea 
        label="Notes"
        placeholder="Write a note"
        size="xl"
        value={purchaseInvoice?.notes}
        onChange={(e) =>
          setPurchaseInvoice((prev) => ({
            ...prev,
            notes: e.target.value,
          }))
        }
      />

      <Flex justify="space-between" mt="md">
        <Button variant="light" onClick={() => setOpened(false)}>{t("CANCEL")}</Button>
        <Button onClick={handleSubmit}>{t("CREATE-ORDER")}</Button>
      </Flex>
      {
        loading &&
        <Center>
          <Loader size={32} color="green" />
        </Center>
      }
    </Modal>
  );
};

export default OrderForm;