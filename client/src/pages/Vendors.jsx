import { useEffect, useState } from 'react'
import { Box, Button, Container, Text, Flex, Tooltip, Center, Loader } from '@mantine/core'
import { showNotification } from '@mantine/notifications';
import axios from 'axios';
import moment from 'moment'
import { IconTicket } from '@tabler/icons-react';
import CustomTable from '../components/CustomTable'
import AddClientModal from '../components/AddClientModal';

function Vendors() {
  const [ merchantsData, setMerchantsData ] = useState([])
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
      setMerchantsData(res.data);
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
    const url = `${BASE_URL}/merchants/list`;
    fetchData(url)
  }, [])

  const submitMerchantForm = async () => {
    try {
      const url = `${BASE_URL}/merchants/create`
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
        const url = `${BASE_URL}/merchants/delete/${id}`
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
        const url = `${BASE_URL}/merchants/edit/${id}`
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
      <CustomTable 
        columns={columns} 
        data={merchantsData}
        // renderTopToolbarCustomActions={customTableOptions.renderTopToolbarCustomActions}
        renderRowActions={customTableOptions.renderRowActions}
        // onRowSelectionChange={customTableOptions.onRowSelectionChange}
        onRowClick={(row) => setSelectedResult(row)}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        checkedRow={checkedRow}
        setCheckedRow={setCheckedRow}
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

export default Vendors;