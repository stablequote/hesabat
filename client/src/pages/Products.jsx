import { useEffect, useState } from 'react'
import { Container, Flex, Image, Title, Box, Button, Tooltip, ActionIcon, Group } from '@mantine/core'
import { IconBarrel, IconBookmarkEdit, IconDownload, IconEdit, IconHistory, IconPlus, IconReportMedical, IconTrash, IconUpload } from '@tabler/icons-react';
import axios from 'axios';
import moment from 'moment'
// import CustomTable from '../components/CustomTable'
import AddProdutModal from '../components/AddProductModal'
import TanStackTable from '../components/TanStackTable';
import { showNotification } from '@mantine/notifications';

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

  const BASE_URL = import.meta.env.VITE_URL;

  const productsColumns = [
    { accessorKey: 'image', header: 'Image',
       cell: ({ cell }) => (
        <Box>
          <Image
            src={`${BASE_URL}${cell.getValue()}`}
            height={50}
            fit="contain"
            alt={cell.getValue()}
            fallbackSrc="https://via.placeholder.com/50"
          />
        </Box>
    )},
    { accessorKey: 'name', header: 'Product Name' },
    { accessorKey: 'category', header: 'Category' },
    { accessorKey: 'manufacturer', header: 'Manufacturer' },
    { accessorKey: 'unitPurchasePrice', header: 'Purchase Price' },
    { accessorKey: 'unitSalePrice', header: 'Sale Price' },
    { accessorKey: 'unit', header: 'Unit' },
    { accessorKey: 'expiryDate', header: 'Expiry Date',
      cell: ({ getValue }) => {
        const value = getValue();

        return (
          <Box
            style={{
              borderRadius: "4px",
              padding: "4px",
              whiteSpace: "nowrap",
              direction: "ltr",
              unicodeBidi: "embed",
              textAlign: "right",
            }}
          >
            {value ? moment(value).format("DD-MM-YYYY hh:mm a") : "-"}
          </Box>
        );
      },
    },
    { accessorKey: 'createdAt', header: 'Creation Date', size: 100,
      cell: ({ getValue }) => {
        const value = getValue();

        return (
          <Box
            style={{
              borderRadius: "4px",
              padding: "4px",
              whiteSpace: "nowrap",
              direction: "ltr",
              unicodeBidi: "embed",
              textAlign: "right",
            }}
          >
            {value ? moment(value).format("DD-MM-YYYY hh:mm a") : "-"}
          </Box>
        );
      },
    },
    { accessorKey: 'updatedAt', header: 'Last Update', size: 100,
      cell: ({ getValue }) => {
        const value = getValue();

        return (
          <Box
            style={{
              borderRadius: "4px",
              padding: "4px",
              whiteSpace: "nowrap",
              direction: "ltr",
              unicodeBidi: "embed",
              textAlign: "right",
            }}
          >
            {value ? moment(value).format("DD-MM-YYYY hh:mm a") : "-"}
          </Box>
        );
      },
    },
  ];

  const handleAddProduct = (newProduct) => {
    setProducts([...products, newProduct]);
    console.log(products)
    const res = axios.post(url, products)
  };

  const handleCreateProduct = async (data) => {
  try {

    const formData = new FormData();

    formData.append("name", data.name);

    formData.append(
      "manufacturer",
      data.manufacturer
    );

    formData.append(
      "category",
      data.category
    );

    formData.append(
      "unit",
      data.unit
    );

    formData.append(
      "expiryDate",
      data.expiryDate
        ? new Date(data.expiryDate).toISOString()
        : ""
    );

    formData.append(
      "unitPurchasePrice",
      data.unitPurchasePrice
    );

    formData.append(
      "unitSalePrice",
      data.unitSalePrice
    );

    if (data.image) {
      formData.append("image", data.image);
    }

    const res = await axios.post(
      `${BASE_URL}/products/create`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log(res.data);

  } catch (error) {
    console.error(error);
  }
};

  const fetchProducts = async (url) => {
    const products = await axios.get(url);
    console.log(products)
    setLoading(!loading)
    setData(products.data)
    console.log(data)
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
            onClick={() => {
              e.stopPropagation();
              renderRowActions?.onEdit?.(row.original)
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
            onClick={() => {
              e.stopPropagation();
              renderRowActions?.onDelete?.(row.original)
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

  return (
    <Container size="100%">
      <Button 
        mb="sm" 
        color="green"
        onClick={() => setModalOpened(true)}
      >
        Add Product</Button>
      {/* <CustomTable
        columns={productsColumns}
        data={data}
        renderTopToolbarCustomActions={customTableOptions.renderTopToolbarCustomActions}
        renderRowActions={customTableOptions.renderRowActions}
        onRowClick={(row) => printRow(row)}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        checkedRow={checkedRow}
        setCheckedRow={setCheckedRow}
      /> */}
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
        {/* <Box>
          <Image
            src={`http://localhost:5006/uploads/1778107409360.jpg`}
            height={50}
            fit="contain"
            alt={"http://localhost:5006/uploads/1778107409360.jpg"}
            fallbackSrc="https://via.placeholder.com/50"
          />
        </Box> */}
      <AddProdutModal
        opened={modalOpened}
        setOpened={setModalOpened}
        onSubmit={handleCreateProduct}
      />
    </Container>
  )
}

export default Products;