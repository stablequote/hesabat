import { useEffect, useState, useMemo } from 'react'
import { Box, Button, Container, Text, Flex, Tooltip, Center, Loader, ActionIcon, Group } from '@mantine/core'
import { showNotification } from '@mantine/notifications';
import axios from 'axios';
import moment from 'moment'
import { IconEdit, IconPlusFilled, IconTicket, IconTrash } from '@tabler/icons-react';
// import CustomTable from '../components/CustomTable'
import AddVendorModal from '../components/AddVendorModal';
import TanStackTable from '../components/TanStackTable';

function Vendors() {
  const [vendorsData, setVendorsData] = useState([]);
  const [opened, setOpened] = useState(false);
  const [vendorForm, setVendorForm] = useState({
    name: '',
    vendorID: '',
    location: '',
    phone: '',
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

  const columns = useMemo(() =>
    [
      { accessorKey: "name", header: "Vendor Name" },
      { accessorKey: "vendorID", header: "Vendor ID" },
      { accessorKey: "contactDetails.location", header: "Location" },
      { accessorKey: "contactDetails.phone", header: "Phone" },
      // { accessorKey: "createdAt", header: "Added on", 
      //   Cell: ({ cell }) => (
      //     <Box>{moment(cell.getValue()).format("DD-MM-YYYY h:mm a")}</Box>
      //   )
      // },
    ]
  )

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
              onClick={() => handleDeleteVendor(row)}
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
    setVendorForm((prev) => ({ ...prev, [field]: value }));
  };

  const fetchData = async (url) => {
    try {
      setLoading(true)
      const res = await axios.get(url);
      setVendorsData(res.data.vendor);
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
    const url = `${BASE_URL}/vendors/list`;
    fetchData(url)
  }, [])

  const submitVendorForm = async () => {
    try {
      const url = `${BASE_URL}/vendors/create`
    
      const payload = {
        name: vendorForm.name,
        vendorID: vendorForm.vendorID,
        contactDetails: {
          phone: vendorForm.phone,
          location: vendorForm.location
        }
      }

      console.log(payload)

      const res = await axios.post(url, payload)
      if(res.status === 201) {
        showNotification({
          title: 'Success',
          message: 'Merchant created succesfully',
          color: 'green'
        })
        setOpened(false)
        // settting state
        setVendorsData((prev) => [...prev, res.data.vendor])
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

  const handleDeleteVendor = async (row) => {
    const confirmDialog = window.confirm("هل أنت متأكد؟")
    if(!confirmDialog) return;
      try {
        const id = row.original._id
        console.log(id)
        const url = `${BASE_URL}/vendors/delete/${id}`
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

  const handleEditVendor = async (row) => {
    const confirmDialog = window.confirm("هل أنت متأكد؟")
    if(!confirmDialog) return;
      try {
        const id = row.original._id
        console.log(id)
        const url = `${BASE_URL}/vendors/edit/${id}`
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
              e.stopPropagation(e);
              handleEditVendor(row)
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
              e.stopPropagation(e);
              handleDeleteVendor(row)
            }}
          >
            <IconTrash size={26} />
          </ActionIcon>
        </Tooltip>
      </Group>
    ),
  };

  const customToolbarOptions = {
    exportClientsToExcel: (checkedRow) =>
     <Button 
        color="blue" 
        // disabled={checkedRow?.length === 0} 
        onClick={() => {
          console.log("checked row: ", checkedRow)
        }
      }
    >
      Export
    </Button>,
    exportSelectedClientsToExcel: (checkedRow) =>
     <Button 
        color="blue" 
        disabled={checkedRow?.length === 0} 
        onClick={() => {
          console.log("checked row: ", checkedRow)
        }
      }
    >
      Export Selected
    </Button>,
  };
  
  return (
    <Container size="100%">
      {/* <Button mb='sm' color="green" onClick={() => setOpened(!opened)}>Create Vendor</Button> */}
      <ActionIcon mb='sm' variant="filled" color="green" aria-label="create vendor" size="lg" onClick={() => setOpened(!opened)}>
        <IconPlusFilled size={32} />
      </ActionIcon>
       <TanStackTable
        data={vendorsData}
        columns={columns}
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
      />
      <AddVendorModal
        opened={opened} 
        setOpened={setOpened} 
        vendorForm={vendorForm} 
        setVendorForm={setVendorForm} 
        submitVendorForm={submitVendorForm}
        handleChange={handleChange} 
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

export default Vendors;