import { useEffect, useState, useMemo } from 'react'
import { Box, Button, Container, Text, Flex, Tooltip, Center, Loader, Group, ActionIcon } from '@mantine/core'
import { showNotification } from '@mantine/notifications';
import axios from 'axios';
import moment from 'moment'
import { IconEdit, IconTicket, IconTrash } from '@tabler/icons-react';
// import CustomTable from '../components/CustomTable'
import AddClientModal from '../components/AddClientModal';
import EditClientModal from '../components/EditClientModal';
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
  const [clientForm, setClientForm] = useState({
    name: '',
    phone: '',
    location: '',
    email: "",
  })

  // edit client modal update
  const [editOpened, setEditOpened] = useState(false);
  const [editingClientId, setEditingClientId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    location: '',
    email: '',
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
  ])

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
    setClientForm((prev) => ({ ...prev, [field]: value }));
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

  const submitClientForm = async () => {
    try {
      const url = `${BASE_URL}/clients/create`
      console.log("URL", url)
      console.log(clientForm)

      const payload = {
        fullName: clientForm.name,
        contactDetails: {
          phone: clientForm.phone,
          location: clientForm.location,
          email: clientForm.email,
        }
      }
      const res = await axios.post(url, payload)
      if(res.status === 201) {
        showNotification({
          title: 'Success',
          message: 'client created succesfully',
          color: 'green'
        })
        setOpened(false)
      }
      setClientsData([...prev, res.data])
      // window.location.reload()
    } catch (error) {
      showNotification({
        title: 'Error creating a merchant',
        message: error,
        color: 'red'
      })
    }
  }

  const handleDeleteMerchant = async (row) => {
    const confirmDialog = window.confirm("هل أنت متأكد من حذف هذا العميل؟")
    if(!confirmDialog) return;
      try {
        const clientId = row.original._id
        console.log(clientId)
        const url = `${BASE_URL}/clients/delete/${clientId}`
        const res = await axios.delete(url)
        if(res.status === 200) {
          showNotification({
            title: "Success",
            message: "Merchant successfully deleted",
            color: "green"
          })
        }
        setClientsData(res.data)
        // window.location.reload()
    } catch (error) {
      showNotification({
        title: "Error",
        message: "Error occured while deleting merchant",
        color: "red"
      })
    }
  }
  
  const handleEditClick = (client) => {
    setEditingClientId(client._id);
    setEditForm({
      name: client.fullName ?? '',
      phone: client.contactDetails?.phone ?? '',
      location: client.contactDetails?.location ?? '',
      email: client.contactDetails?.email ?? '',
    });
    setEditOpened(true);
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const closeEditModal = () => {
    setEditOpened(false);
    setEditingClientId(null);
  };

  const submitEditForm = async () => {
    if (!editForm.name.trim()) {
      showNotification({
        title: 'Error',
        message: 'Client name is required',
        color: 'red',
      });
      return;
    }

    const payload = {
      fullName: editForm.name.trim(),
      contactDetails: {
        phone: editForm.phone,
        location: editForm.location,
        email: editForm.email,
      },
    };

    try {
      setEditSubmitting(true);
      const clientId = editingClientId;
      const url = `${BASE_URL}/clients/edit/${clientId}`;
      const res = await axios.put(url, payload);

      if (res.status === 200) {
        setClientsData((prev) =>
          prev.map((c) =>
            c._id === editingClientId
              ? {
                  ...c,
                  fullName: payload.fullName,
                  contactDetails: {
                    ...(c.contactDetails ?? {}),
                    ...payload.contactDetails,
                  },
                }
              : c
          )
        );
        closeEditModal();
        showNotification({
          title: 'Success',
          message: 'Client details successfully updated',
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
        title: 'Error updating client',
        message,
        color: 'red',
      });
    } finally {
      setEditSubmitting(false);
    }
  };

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
              handleEditClick(row.original)
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
              handleDeleteMerchant(row)
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
      <Button mb='sm' variant="filled" color="green" aria-label="create client" size="lg" onClick={() => setOpened(!opened)}>Add Client</Button>
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
        data={clientsData}
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
        onSelectionChange={setCheckedRow}
      />
      <AddClientModal
        opened={opened} 
        setOpened={setOpened} 
        clientForm={clientForm} 
        setClientForm={setClientForm} 
        handleChange={handleChange} 
        submitClientForm={submitClientForm}
      />
      <EditClientModal
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

export default Clients;