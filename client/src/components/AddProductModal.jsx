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
import axios from "axios";

export default function AddProductModal({ opened, setOpened, onSubmit }) {
  const BASE_URL = import.meta.env.VITE_URL;

  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [category, setCategory] = useState("");
  const [image, setImage] = useState(null);

  const handleSubmit = async () => {
  if (!name || !price || !category || !image) return;

  // 1️⃣ Update parent state for UI purposes (using preview URL for immediate feedback)
  const previewPayload = {
    name,
    price,
    category,
    quantity: 5000,
    image: URL.createObjectURL(image), // preview only (not sent to backend)
  };
  onSubmit(previewPayload);

  try {
    // 2️⃣ Prepare FormData for backend
    const formData = new FormData();
    formData.append("name", name);
    formData.append("price", price);
    formData.append("category", category);
    formData.append("quantity", 5000);
    formData.append("image", image); // raw File object

    // 3️⃣ Send to backend
    const url = `${BASE_URL}/products/create`;
    const res = await axios.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("Product created:", res.data);
  } catch (error) {
    console.error("Error creating product:", error);
  }

  // 4️⃣ Close modal and reset form
  setOpened(false);
  setName("");
  setPrice(0);
  setCategory("");
  setImage(null);
};

  return (
    <Modal
      opened={opened}
      onClose={() => setOpened(false)}
      title="Add New Product"
      size="lg"
    >
      <TextInput
        label="Product Name"
        placeholder="Enter product name"
        value={name}
        onChange={(e) => setName(e.currentTarget.value)}
        mb="sm"
      />
      <NumberInput
        label="Price (SDG)"
        placeholder="Enter price"
        value={price}
        onChange={setPrice}
        min={0}
        mb="sm"
      />
      <Select
        label="Category"
        placeholder="Select category"
        data={["Sandwiches", "Drinks", "Portions", "Bakes", "Extras"]}
        value={category}
        onChange={setCategory}
        mb="sm"
        searchable
      />
      <FileInput
        label="Product Image"
        placeholder="Select image"
        accept="image/*"
        value={image}
        onChange={setImage}
        mb="sm"
      />
      <Group position="right" mt="md">
        <Button onClick={handleSubmit}>Add Product</Button>
      </Group>
    </Modal>
  );
}