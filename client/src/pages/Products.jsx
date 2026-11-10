import { useEffect, useState, useMemo } from 'react';
import { Container, Flex, Image, Title, Box, Button, Tooltip, ActionIcon, Group, Avatar, Badge, Stack, Text } from '@mantine/core';
import { IconBarrel, IconBookmarkEdit, IconDownload, IconEdit, IconHistory, IconPlus, IconReportMedical, IconTrash, IconUpload } from '@tabler/icons-react';
import axios from 'axios';
import moment from 'moment';
import AddProdutModal from '../components/AddProductModal';
import EditProductModal from '../components/EditProductModal';
import TanStackTable from '../components/TanStackTable';
import { showNotification } from '@mantine/notifications';
import useUnits from "../hooks/useUnits";

function Products() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [opened, setOpened] = useState(false);
  const [rowStatuses, setRowStatuses] = useState({});
  const [selectedRow, setSelectedRow] = useState(null);
  const [rowSelection, setRowSelection] = useState({});
  const [checkedRow, setCheckedRow] = useState([])
  const [modalOpened, setModalOpened] = useState(false);
  const [products, setProducts] = useState([]);

  const [editOpened, setEditOpened] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const { units, createUnit } = useUnits();

  const BASE_URL = import.meta.env.VITE_URL;

  // utlility to output clean columns
  const fmt = (n) => Number(n ?? 0).toLocaleString('en-US');
  const sortDesc = (levels = []) => [...levels].sort((a, b) => b.factor - a.factor);

  // 340 base units -> ["3 Box", "4 Strip"]
  const stockParts = (levels, base) => {
    let remaining = base ?? 0;
    const parts = [];
    sortDesc(levels).forEach((l) => {
      const qty = Math.floor(remaining / l.factor);
      if (qty > 0) {
        parts.push(`${fmt(qty)} ${l.unit?.name ?? ''}`.trim());
        remaining -= qty * l.factor;
      }
    });
    return parts;
  };

  const productsColumns = useMemo(
    () => [
      {
        id: 'product',
        header: 'Product',
        size: 280,
        // searchable by name and manufacturer
        accessorFn: (row) => `${row.name ?? ''} ${row.manufacturer ?? ''}`.trim(),
        cell: ({ row }) => {
          const { name, manufacturer, image } = row.original;
          return (
            <Group gap="sm" wrap="nowrap">
              <Avatar
                src={image ? `${BASE_URL}${image}` : null}
                radius="sm"
                size={44}
                color="green"
              >
                {name?.[0]?.toUpperCase()}
              </Avatar>
              <Box>
                <Text fw={600} size="sm" lh={1.3}>{name}</Text>
                {manufacturer && <Text size="xs" c="dimmed">{manufacturer}</Text>}
              </Box>
            </Group>
          );
        },
      },
      {
        accessorKey: 'category',
        header: 'Category',
        size: 170,
        cell: ({ getValue }) =>
          getValue() ? (
            <Badge variant="light" color="gray" tt="none">{getValue()}</Badge>
          ) : (
            <Text c="dimmed">—</Text>
          ),
      },
      {
        id: 'stock',
        header: () => <Box ta="center">Stock</Box>,
        size: 160,
        accessorFn: (row) => row.quantityBase ?? 0, // sorts numerically
        cell: ({ row }) => {
          const { unitLevels = [], quantityBase = 0 } = row.original;

          if (quantityBase <= 0) {
            return (
              <Box ta="center">
                <Badge color="red" variant="light">Out of stock</Badge>
              </Box>
            );
          }

          const baseUnit = unitLevels.find((l) => l.factor === 1)?.unit?.name;
          return (
            <Stack gap={0} align="center">
              <Text fw={600} size="sm">{stockParts(unitLevels, quantityBase).join(' · ')}</Text>
              {unitLevels.length > 1 && (
                <Text size="xs" c="dimmed">{fmt(quantityBase)} {baseUnit}</Text>
              )}
            </Stack>
          );
        },
      },
      {
        id: 'prices',
        header: 'Sale price',
        size: 220,
        enableSorting: false,
        accessorFn: (row) => row.unitLevels?.map((l) => l.unit?.name).join(' ') ?? '',
        cell: ({ row }) => (
          <Stack gap={2} w={200}>
            {sortDesc(row.original.unitLevels).map((l) => (
              <Group key={l.unit?._id ?? l.factor} justify="space-between" wrap="nowrap" gap="md">
                <Text size="sm">
                  {l.unit?.name ?? '—'}
                  {l.factor > 1 && (
                    <Text span size="xs" c="dimmed"> ×{fmt(l.factor)}</Text>
                  )}
                </Text>
                <Text size="sm" fw={600}>{fmt(l.salePrice)}</Text>
              </Group>
            ))}
          </Stack>
        ),
      },
    ],
    [BASE_URL]
  );

  const handleAddProduct = (newProduct) => {
    setProducts([...products, newProduct]);
    console.log(products)
    const res = axios.post(url, products)
  };

  const handleCreateProduct = async (data, imageFile) => {
    try {
      const formData = new FormData();

      formData.append("name", data.name);
      formData.append("manufacturer", data.manufacturer || "");
      formData.append("category", data.category || "");

      // nested data must be sent as JSON strings in multipart requests
      formData.append("unitLevels", JSON.stringify(data.unitLevels));

      if (data.openingStock) {
        formData.append("openingStock", JSON.stringify(data.openingStock));
      }

      if (imageFile) {
        formData.append("image", imageFile);
      }

      const res = await axios.post(`${BASE_URL}/products/create`, formData);

      if(res.status === 201) {
        showNotification({
          title: "success",
          message: "Product added successfully",
          color: "green"
        })
      }
      // update state in line
      setData((prev) => [...prev, res.data.product])
    } catch (error) {
      showNotification({
        title: "Error",
        message: "An error occured while creating the product",
        color: "red"
      })
      console.error(error);
    }
  };

  const fetchProducts = async (url) => {
    const res = await axios.get(url);
    console.log(res)
    setLoading(!loading)
    setData(res.data.products)
    console.log(res.data)
  }

  useEffect(()=> {
    const url = `${BASE_URL}/products/list`
    fetchProducts(url)
  }, [])

  const customTableOptions = {
    renderTopToolbarCustomActions: ({ table }) => (
    <Box
      sx={{
        display: 'flex',
        gap: '16px',
        padding: '8px',
        flexWrap: 'wrap',
      }}
    >
      <Button
        color="green"
        //export all data that is currently in the table (ignore pagination, sorting, filtering, etc.)
        onClick={() => setModalOpened(!modalOpened)}
        leftIcon={<IconPlus />}
        variant="filled"
      >
        ADD Product
      </Button>
      <Button
        disabled={
          !table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()
        }
        //only export selected rows
        // onClick={}
        leftIcon={<IconUpload />}
        variant="light"
      >
        Export data
      </Button>
    </Box>
    ),
    renderRowActions: ({ row }) => {
      const rowId = row.original._id;
      const status = rowStatuses[rowId] ?? row.original.status; // fallback to original status
      // console.log(row.original.status)
      // console.log(status)

      return (
        <Flex justify="space-between">
          <Tooltip label="Delete">
            <Button
              color="red"
              onClick={() => handleActionClick(rowId)}
              // disabled={isDone}
              compact
            >
              Delete
            </Button>
          </Tooltip>
          <Tooltip label="Edit">
            <Button
              color="blue"
              onClick={() => handleActionClick(rowId)}
              // disabled={isDone}
              compact
            >
              Edit
            </Button>
          </Tooltip>
        </Flex>
      );
    },
    onRowSelectionChange: (updater) => {
      const newRowSelection =
        typeof updater === 'function' ? updater(rowSelection) : updater;

      setRowSelection(newRowSelection);

      // testing
      setCheckedRow(Object.keys(newRowSelection).map((rowId) => table.getRow(rowId).original))
      console.log(checkedRow)

      // If using MRT table instance (like with useMantineReactTable)
      const selectedData = Object.keys(newRowSelection).map((rowId) =>
        table.getRow(rowId).original
      );

      setCheckedRow(selectedData)

      // console.log('✅ Selected row data:', selectedData);
    },
  }

  const actionsColumn = {
    id: "actions",
    header: () => <Box ta="center">Actions</Box>,
    cell: ({ row }) => (
      <Group gap="lg" justify="start" wrap="nowrap" onClick={(e) => e.stopPropagation()}>
        {/* EDIT */}
        <Tooltip label="Edit" >
          <ActionIcon
            variant="light"
            color="blue"
            onClick={(e) => {
              e.stopPropagation();
              handleEditClick(row.original);
            }}
          >
            <IconEdit size={26} />
          </ActionIcon>
        </Tooltip>

        {/* DELETE */}
        <Tooltip label="Delete">
          <ActionIcon
            variant="light"
            color="red"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteProduct(row.original);
            }}
          >
            <IconTrash size={26} />
          </ActionIcon>
        </Tooltip>

      </Group>
    ),
  };

  const customToolbarOptions = {
  };

  const errorMessage = (error) => {
    const d = error.response?.data;
    return (typeof d === 'string' && d) || d?.message || d?.error || error.message;
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setEditOpened(true);
  };

  const closeEditModal = () => {
    setEditOpened(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (product) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    try {
      await axios.delete(`${BASE_URL}/products/delete/${product._id}`);
      setData((prev) => prev.filter((p) => p._id !== product._id));
      showNotification({ title: 'Success', message: 'Product deleted', color: 'green' });
    } catch (error) {
      showNotification({ title: 'Error deleting product', message: errorMessage(error), color: 'red' });
    }
  };

  const submitEdit = async (payload, imageFile) => {
    try {
      setEditSubmitting(true);
      const formData = new FormData();
      formData.append('name', payload.name);
      formData.append('manufacturer', payload.manufacturer || '');
      formData.append('category', payload.category || '');
      formData.append('unitLevels', JSON.stringify(payload.unitLevels));
      if (imageFile) formData.append('image', imageFile);

      const res = await axios.put(`${BASE_URL}/products/edit/${editingProduct._id}`, formData);
      const updated = res.data.product;

      setData((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
      closeEditModal();
      showNotification({ title: 'Success', message: 'Product updated', color: 'green' });
    } catch (error) {
      showNotification({ title: 'Error updating product', message: errorMessage(error), color: 'red' });
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <Container size="100%">
      <Button 
        mb="sm" 
        color="green"
        onClick={() => setModalOpened(true)}
      >
        Add Product</Button>
      <TanStackTable
        data={data}
        columns={productsColumns}
        renderRowActions={(row) => (
          <>
            <Button size="xs">Edit</Button>
            <Button size="xs" color="red">
              Delete
            </Button>
          </>
        )}
        actionsColumn={actionsColumn}
        customToolbarOptions={customToolbarOptions}
        onSelectionChange={setCheckedRow}
      />
      <AddProdutModal
        opened={modalOpened}
        setOpened={setModalOpened}
        onSubmit={handleCreateProduct}
        units={units}
        onCreateUnit={createUnit}
      />
      <EditProductModal
        opened={editOpened}
        onClose={closeEditModal}
        product={editingProduct}
        units={units}
        onCreateUnit={createUnit}
        onSubmit={submitEdit}
        loading={editSubmitting}
      />
    </Container>
  )
}

export default Products;