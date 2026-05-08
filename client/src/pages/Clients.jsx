import { useEffect, useState, useMemo } from 'react'
import { Box, Button, Container, Text, Flex, Tooltip, Center, Loader } from '@mantine/core'
import { showNotification } from '@mantine/notifications';
import axios from 'axios';
import moment from 'moment'
import { IconTicket } from '@tabler/icons-react';
import CustomTable from '../components/CustomTable'
import AddClientModal from '../components/AddClientModal';
import TanStackTable from '../components/TanStackTable';

export const clientsSeed = [
  {
    _id: "1",
    fullName: "Client 1",
    contactDetails: {
      phone: "048984284",
      email: "client1@test.com",
      location: "London",
    },
    createdAt: "2026-05-01T10:30:00.000Z",
  },
  {
    _id: "2",
    fullName: "Client 2",
    contactDetails: {
      phone: "0912345678",
      email: "client2@test.com",
      location: "Khartoum",
    },
    createdAt: "2026-05-02T14:10:00.000Z",
  },
  {
    _id: "3",
    fullName: "Client 3",
    contactDetails: {
      phone: "",
      email: "",
      location: "Cairo",
    },
    createdAt: "2026-05-03T08:00:00.000Z",
  },
  {
    _id: "4",
    fullName: "Client 4",
    contactDetails: null, // 🔥 edge case
    createdAt: "2026-05-04T18:45:00.000Z",
  },
];

function Clients() {
  const [clientsData, setClientsData] = useState([]);
  const [opened, setOpened] = useState(false);
  const [merchantForm, setMerchantForm] = useState({
    shopName: '',
    ownerName: '',
    phone: '',
    location: '',
    unitSalePrice: 0,
  })
  const [loading, setLoading] = useState(false);

  // state imports for MRT
  const [selectedResult, setSelectedResult] = useState(null);
  const [checkedRow, setCheckedRow] = useState([])
  const [rowStatuses, setRowStatuses] = useState({});
  const [selectedRow, setSelectedRow] = useState(null);
  const [rowSelection, setRowSelection] = useState({});
  // import ends here

  const BASE_URL = import.meta.env.VITE_URL;

  const columns = useMemo( () =>
    [
      {
      accessorKey: "fullName",
      header: "Client Name",
      
    },
    {
      accessorFn: (row) => row.contactDetails?.location || "—",
      id: "location",
      header: "Location",
    },
    {
      accessorFn: (row) => row.contactDetails?.phone || "—",
      id: "phone",
      header: "Phone",
    },
    {
      accessorKey: "createdAt",
      header: "Added on",
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
  ], [])

  const customTableOptions = {
    renderRowActions: ({ row }) => {
      const rowId = row.original._id;
      const status = rowStatuses[rowId] ?? row.original.status; // fallback to original status
      // console.log(row.original.status)
      // console.log(status)

      return (
        <Flex justify="flex-start">
          <Tooltip label="Delete">
            <Button
              mr="md"
              color="red"
              onClick={() => handleDeleteMerchant(row)}
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
  };

  const handleChange = (field, value) => {
    setMerchantForm((prev) => ({ ...prev, [field]: value }));
  };

  const fetchData = async (url) => {
    try {
      setLoading(true)
      const res = await axios.get(url);
      console.log("Clients: ", res.data)
      setClientsData(res.data);
    } catch (error) {
      showNotification({
        title: "Error",
        message: "An error occured while fetching data",
        color: "red"
      })
    } finally {
      setLoading(false)
    }
  };
  
  useEffect(() => {
    const url = `${BASE_URL}/clients/list`;
    fetchData(url)
  }, [])

  const submitMerchantForm = async () => {
    try {
      const url = `${BASE_URL}/clients/create`
      console.log("URL", url)
      console.log(merchantForm)
      const res = await axios.post(url, merchantForm)
      if(res.status === 201) {
        showNotification({
          title: 'Success',
          message: 'Merchant created succesfully',
          color: 'green'
        })
        setOpened(false)
      }
      window.location.reload()
    } catch (error) {
      showNotification({
        title: 'Error creating a merchant',
        message: error,
        color: 'red'
      })
    }
  }

  const handleDeleteMerchant = async (row) => {
    const confirmDialog = window.confirm("هل أنت متأكد من حذف عملية البيع هذه؟")
    if(!confirmDialog) return;
      try {
        const id = row.original._id
        console.log(id)
        const url = `${BASE_URL}/clients/delete/${id}`
        const res = await axios.delete(url)
        if(res.status === 200) {
          showNotification({
            title: "Success",
            message: "Merchant successfully deleted",
            color: "green"
          })
        }
        window.location.reload()
    } catch (error) {
      showNotification({
        title: "Error",
        message: "Error occured while deleting merchant",
        color: "red"
      })
    }
  }
  const handleEditMerchant = async (row) => {
    const confirmDialog = window.confirm("هل أنت متأكد من حذف عملية البيع هذه؟")
    if(!confirmDialog) return;
      try {
        const id = row.original._id
        console.log(id)
        const url = `${BASE_URL}/clients/edit/${id}`
        const res = await axios.put(url)
        if(res.status === 200) {
          showNotification({
            title: "Success",
            message: "Merchant details successfully updated",
            color: "green"
          })
        }
        window.location.reload()
    } catch (error) {
      showNotification({
        title: "Error",
        message: "Error occured while updating merchant details",
        color: "red"
      })
    }
  }

  

  return (
    <Container size="100%">
      <Button mb='sm' color="green" onClick={() => setOpened(!opened)}>Add Merchant</Button>
      {/* <CustomTable 
        columns={columns} 
        data={clientsSeed}
        // renderTopToolbarCustomActions={customTableOptions.renderTopToolbarCustomActions}
        renderRowActions={customTableOptions.renderRowActions}
        // onRowSelectionChange={customTableOptions.onRowSelectionChange}
        onRowClick={(row) => setSelectedResult(row)}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        checkedRow={checkedRow}
        setCheckedRow={setCheckedRow}
      />
      <Box my={80}>

      </Box> */}
      <TanStackTable
        data={clientsSeed}
        columns={columns}
        renderRowActions={(row) => (
          <>
            <Button size="xs">Edit</Button>
            <Button size="xs" color="red">
              Delete
            </Button>
          </>
        )}
      />
      <AddClientModal
        opened={opened} 
        setOpened={setOpened} 
        merchantForm={merchantForm} 
        setMerchantForm={setMerchantForm} 
        handleChange={handleChange} 
        submitMerchantForm={submitMerchantForm}
      />
      {
        loading &&
        <Center>
          <Loader size={36} color="green" variant='dots' />
        </Center>
      }
    </Container>
  )
}

export default Clients;