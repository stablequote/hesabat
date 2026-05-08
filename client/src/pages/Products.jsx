import { useEffect, useState } from 'react'
import { Container, Flex, Image, Title, Box, Button, Tooltip } from '@mantine/core'
import { IconBookmarkEdit, IconDownload, IconHistory, IconPlus, IconReportMedical, IconUpload } from '@tabler/icons-react';
import axios from 'axios';
import moment from 'moment'
import CustomTable from '../components/CustomTable'
import AddProdutModal from '../components/AddProductModal'

function Products() {
  const BASE_URL = import.meta.env.VITE_URL;

  const productsColumns = [
    { accessorKey: 'image', header: 'Product Name',
       Cell: ({ cell }) => (
        <Box>
          <Image 
            src={`${BASE_URL}${cell.getValue()}`}
            height={50}
            fit="contain"
            alt={cell.getValue()}
          />
        </Box>
    )},
    { accessorKey: 'name', header: 'Product Name' },
    { accessorKey: 'category', header: 'Category' },
    { accessorKey: 'price', header: 'Price' },
    { accessorKey: 'quantity', header: 'Quantity' },
    { accessorKey: 'createdAt', header: 'Creation Date', size: 100,
      Cell: ({ cell }) => (
        <Box>{moment(cell.getValue()).format("DD-MMMM-YYYY")}</Box>
    )},
  ];

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [opened, setOpened] = useState(false);
  const [rowStatuses, setRowStatuses] = useState({});
  const [selectedRow, setSelectedRow] = useState(null);
  const [rowSelection, setRowSelection] = useState({});
  const [checkedRow, setCheckedRow] = useState([])
  const [modalOpened, setModalOpened] = useState(false);
  const [products, setProducts] = useState([]);

  const handleAddProduct = (newProduct) => {
    setProducts([...products, newProduct]);
    console.log(products)
    const res = axios.post(url, products)
  };


  const fetchProducts = async (url) => {
    const products = await axios.get(url);
    console.log(products)
    setLoading(!loading)
    setData(products.data)
    console.log(data)
  }

  useEffect(()=> {
    const url = `${BASE_URL}/products`
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

  return (
    <Container size="xl">
      <CustomTable
        columns={productsColumns}
        data={data}
        renderTopToolbarCustomActions={customTableOptions.renderTopToolbarCustomActions}
        renderRowActions={customTableOptions.renderRowActions}
        onRowClick={(row) => printRow(row)}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        checkedRow={checkedRow}
        setCheckedRow={setCheckedRow}
      />
      <AddProdutModal
        opened={modalOpened}
        setOpened={setModalOpened}
        onSubmit={handleAddProduct}
      />
    </Container>
  )
}

export default Products;