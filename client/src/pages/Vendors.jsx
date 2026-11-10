import { useEffect, useState, useMemo } from 'react'
import { Box, Button, Container, Text, Flex, Tooltip, Center, Loader, ActionIcon, Group } from '@mantine/core'
import { showNotification } from '@mantine/notifications';
import axios from 'axios';
import moment from 'moment'
import { IconEdit, IconPlusFilled, IconTicket, IconTrash } from '@tabler/icons-react';
// import CustomTable from '../components/CustomTable'
import AddVendorModal from '../components/AddVendorModal';
import EditVendorModal from '../components/EditVendorModal';
import TanStackTable from '../components/TanStackTable';
import PageHeader from '../components/PageHeader';
import { RowActions, DateTimeCell } from '../components/TableCells';

function Vendors() {
  const [vendorsData, setVendorsData] = useState([]);
  const [opened, setOpened] = useState(false);
  const [vendorForm, setVendorForm] = useState({
    name: '',
    vendorID: '',
    location: '',
    phone: '',
  })

  // edit vendor update
  const [editOpened, setEditOpened] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    vendorID: '',
    location: '',
    phone: '',
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  // state imports for MRT
  const [selectedResult, setSelectedResult] = useState(null);
  const [checkedRow, setCheckedRow] = useState([])
  const [rowStatuses, setRowStatuses] = useState({});
  const [selectedRow, setSelectedRow] = useState(null);
  const [rowSelection, setRowSelection] = useState({});
  // import ends here

  const BASE_URL = import.meta.env.VITE_URL;

  // const columns = useMemo(() =>
  //   [
  //     { accessorKey: "name", header: "Vendor Name" },
  //     { accessorKey: "vendorID", header: "Vendor ID" },
  //     { accessorKey: "contactDetails.location", header: "Location" },
  //     { accessorKey: "contactDetails.phone", header: "Phone" },
  //     // { accessorKey: "createdAt", header: "Added on", 
  //     //   Cell: ({ cell }) => (
  //     //     <Box>{moment(cell.getValue()).format("DD-MM-YYYY h:mm a")}</Box>
  //     //   )
  //     // },
  //   ]
  // )

  const columns = useMemo(() => [
    { accessorKey: "name", header: "Vendor Name",
      cell: ({ getValue }) => <span className="tc-strong">{getValue()}</span> },
    { accessorFn: (row) => row.contactDetails?.phone || "—", id: "phone", header: "Phone" },
    { accessorFn: (row) => row.contactDetails?.location || "—", id: "location", header: "Location" },
    { accessorKey: "createdAt", header: "Added on",
      cell: ({ getValue }) => <DateTimeCell value={getValue()} /> },
  ], []);

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
          message: 'Vendor created succesfully',
          color: 'green'
        })
        setOpened(false)
        // settting state
        setVendorsData((prev) => [...prev, res.data.vendor])
      }
      // window.location.reload()
    } catch (error) {
      showNotification({
        title: 'Error creating a vendor',
        message: error,
        color: 'red'
      })
    }
  }

  const handleDeleteVendor = async (row) => {
    const confirmDialog = window.confirm("هل أنت متأكد؟")
    if(!confirmDialog) return;
      try {
        const id = row.original._id;
   
        const url = `${BASE_URL}/vendors/delete/${id}`;
        const res = await axios.delete(url);

        if(res.status === 200) {
          setVendorsData(prev =>
            prev.filter(vendor => vendor._id !== id)
          );

          showNotification({
            title: "Success",
            message: "Vendor successfully deleted",
            color: "green"
          })
        }
        // window.location.reload()
    } catch (error) {
      showNotification({
        title: "Error",
        message: error.message,
        color: "red"
      })
    }
  }

  const handleEditClick = (vendor) => {
    setEditingVendorId(vendor._id);
    setEditForm({
      name: vendor.name ?? '',
      vendorID: vendor.vendorID ?? '',
      location: vendor.contactDetails?.location ?? '',
      phone: vendor.contactDetails?.phone ?? '',
    });
    setEditOpened(true);
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const closeEditModal = () => {
    setEditOpened(false);
    setEditingVendorId(null);
  };

  const submitEditForm = async () => {
    if (!editForm.name.trim()) {
      showNotification({
        title: 'Error',
        message: 'Vendor name is required',
        color: 'red',
      });
      return;
    }

    const payload = {
      name: editForm.name.trim(),
      vendorID: editForm.vendorID,
      contactDetails: {
        phone: editForm.phone,
        location: editForm.location,
      },
    };

    try {
      setEditSubmitting(true);
      const url = `${BASE_URL}/vendors/edit/${editingVendorId}`;
      const res = await axios.put(url, payload);

      if (res.status === 200) {
        const updated = res.data?.vendor;
        setVendorsData((prev) =>
          prev.map((v) =>
            v._id === editingVendorId
              ? updated ?? {
                  ...v,
                  ...payload,
                  contactDetails: { ...(v.contactDetails ?? {}), ...payload.contactDetails },
                }
              : v
          )
        );
        closeEditModal();
        showNotification({
          title: 'Success',
          message: 'Vendor details successfully updated',
          color: 'green',
        });
      } else {
        showNotification({
          title: 'Error',
          message: `Unexpected response status: ${res.status}`,
          color: 'red',
        });
      }
    } catch (error) {
      const data = error.response?.data;
      const message =
        (typeof data === 'string' && data) ||
        data?.message ||
        data?.error ||
        error.message;
      showNotification({
        title: 'Error updating vendor',
        message,
        color: 'red',
      });
    } finally {
      setEditSubmitting(false);
    }
  };

  // const actionsColumn = {
  //   id: "actions",
  //   header: () => <Box ta="center">Actions</Box>,

  //   cell: ({ row }) => (
  //     <Group gap="lg" justify="start" wrap="nowrap" onClick={(e) => e.stopPropagation()}>
        
  //       {/* EDIT */}
  //       <Tooltip label="Edit" >
  //         <ActionIcon
  //           variant="light"
  //           color="blue"
  //           onClick={(e) => {
  //             e.stopPropagation(e);
  //             handleEditClick(row.original)
  //           }}
  //         >
  //           <IconEdit size={26} />
  //         </ActionIcon>
  //       </Tooltip>

  //       {/* DELETE */}
  //       <Tooltip label="Delete">
  //         <ActionIcon
  //           variant="light"
  //           color="red"
  //           onClick={(e) => {
  //             e.stopPropagation(e);
  //             handleDeleteVendor(row)
  //           }}
  //         >
  //           <IconTrash size={26} />
  //         </ActionIcon>
  //       </Tooltip>
  //     </Group>
  //   ),
  // };

  const actionsColumn = {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <RowActions
        onEdit={() => handleEditClick(row.original)}
        onDelete={() => handleDeleteVendor(row)}
      />
    ),
  };

  const customToolbarOptions = {
    exportClientsToExcel: (checkedRow) =>
     <Button 
        color="#1971c2" 
        // disabled={checkedRow?.length === 0} 
        onClick={() => {
          console.log("checked row: ", checkedRow)
          }}
        >
        Export
      </Button>
    ,
    exportSelectedClientsToExcel: (checkedRow) =>
     <Button 
        color="#1971c2" 
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
      {/* <Button mb='sm' variant="filled" color="green" aria-label="create vendor" size="lg" radius={12} onClick={() => setOpened(!opened)}>Create Vendor</Button> */}
       
        <PageHeader
          title="Vendors"
          subtitle={`${vendorsData.length} vendors`}
          actionLabel="Add Vendor"
          onAction={() => setOpened(true)}
        />

       <TanStackTable
        data={vendorsData}
        columns={columns}
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
      <EditVendorModal
        opened={editOpened}
        onClose={closeEditModal}
        editForm={editForm}
        handleChange={handleEditChange}
        onSubmit={submitEditForm}
        loading={editSubmitting}
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