import { useEffect, useState, useMemo, useRef } from 'react';
import { ActionIcon, Box, Button, Flex, Group, Modal, Tooltip } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { IconDoorExit, IconEdit, IconHistory, IconMedicalCrossCircle, IconTrash } from '@tabler/icons-react';
import axios from 'axios';
import moment from 'moment';
import OrderForm from '../components/OrderForm';
import CustomTable from '../components/CustomTable';
import InvoiceTemplate from '../components/InvoiceTemplate';
import TanStackTable from '../components/TanStackTable';
import { useReactToPrint } from 'react-to-print';
import CreateSaleInvoiceModal from '../components/CreateSaleInvoiceModal';
import AddInstallmentModal from '../components/AddInstallmentModal';
import SalesInvoiceTemplate from '../components/SalesInvoiceTemplate';
import { showNotification } from '@mantine/notifications';
import AddClientModal from '../components/AddClientModal';

const SaleInvoices = () => {
  const [invoicesData, setInvoicesData] = useState([]);
  const [opened, setOpened] = useState(false);
  const [inventoryData, setInventoryData] = useState([]);
  const [clientsData, setClientsData] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const [installmentModalOpen, setInstallmentModalOpen] = useState(false);
  
  // state for the checked row
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // copied from ahs ==> states for table management
  // const [rowSelection, setRowSelection] = useState({});
  const [checkedRow, setCheckedRow] = useState([]);

  const [clientForm, setClientForm] = useState({
    name: '',
    phone: '',
    location: '',
    email: "",
  })
  const [addClientModalOpened, setAddClientModalOpened] = useState(false);

  const printRef = useRef();

  const { t } = useTranslation();
  const BASE_URL = import.meta.env.VITE_URL;
  const token = localStorage.getItem("authToken");

  const saleInvoiceInstallmentUrl = `${BASE_URL}/sale-invoices/payments/${selectedInvoice?.invoiceID}/pay`
  
  const orderColumns = useMemo(
    () => [
      { accessorKey: "invoiceID", header: t("Order-ID"), size: 100 },
      { accessorKey: "client.fullName", header: t("CLIENT"), size: 150 },
      { accessorKey: "saleDate", header: t("Invoice-Date"), sortingFn: 'datetime',size: 120, cell: ({ cell }) => ( <Box>{moment(cell.getValue()).format("DD-MMMM-YYYY")}</Box>)},
      // { accessorKey: "paymentMethod", header: t("Payment-Method"), size: 120 },
      { accessorKey: "paidAmount", header: t("Paid-Amount"), size: 80 },
      { accessorKey: "totalSalePrice", header: t("Total-Order-Cost"), size: 80 },
      { accessorKey: "remainingAmount", header: t("Remaining"), size: 80 },
      // {
      //   accessorKey: "isOrderPaid",
      //   header: t("Is-Order-Paid"),
      //   accessorFn: (row) => (row.isOrderPaid ? t("Yes") : t("No")),
      // },
      { accessorKey: "status", 
        header: t("Status"), 
        size: 120,
        cell: ({ getValue }) => {
          const value = getValue();

          return (
            <Box
              style={{
                backgroundColor: value === "paid" ? "#309330" : value === "pending" ? "#b7cb0b" : "#e55454",
                padding: "5px 10px",
                borderRadius: 20,
                textAlign: "center",
                color: "white",
                maxWidth: 70,
                marginLeft: 60,
              }}
            >
              { value && value.toUpperCase() }
            </Box>
          )
        }
       },
      // {
      //   accessorKey: "products",
      //   header: t("Ordered-Products"),
      //   accessorFn: (row) =>
      //     row.products?.length
      //       ? row.products.map((p) => p.product.product).join(", ")
      //       : t("No-Products"),
      // },
    ],
    [t]
  );

  const handleAddOrder = (newOrder) => {
    setInvoicesData((prevData) => [
      ...prevData,
      { ...newOrder, orderId: `ORD${(prevData.length + 1).toString().padStart(3, '0')}` },
    ]);
  };

  const handleInvoiceUpdate = (updatedInvoice) => {
    setInvoicesData((prev) =>
      prev.map((invoice) =>
        invoice._id === updatedInvoice._id
          ? updatedInvoice
          : invoice
      )
    );
  };

  const fetchInventory = async () => {
    const inventoryUrl = `${BASE_URL}/inventory/list`;
    const clientsUrl = `${BASE_URL}/clients/list`;

    try {
      const inventoryResponse = await axios.get(inventoryUrl);
      setInventoryData(inventoryResponse.data);

      const clientsResponse = await axios.get(clientsUrl);
      setClientsData(clientsResponse.data);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchInvoices = async () => {    
    try {
      const url = `${BASE_URL}/sale-invoices/list`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response.data)
      setInvoicesData(response.data);
      console.log(invoicesData)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    fetchInvoices();
    fetchInventory();
  }, [invoiceData?._id]);

  // Transform suppliers data for the Select component
  const clientsList = clientsData?.map((item) => ({
    value: item._id,
    label: item.fullName,
  }));

  // Transform products data for the Select component
  const productsList = inventoryData?.map((item) => ({
    value: item._id,
    label: item.product,
  }));

  const handleProductSelection = (selectedProductId) => {
    setSelectedProductId(selectedProductId); // Update the selected product ID
    console.log('Selected Product ID:', selectedProductId); // For debugging
  };

  const handleSupplierSelection = (selectedSupplierId) => {
    setSelectedSupplierId(selectedSupplierId); // Update the selected supplier ID
    console.log('Selected Supplier ID:', selectedSupplierId); // For debugging
  };

  const displayInvoice = async (row) => {
    setSelectedRow(row.original); // Store the clicked row's data
    setIsModalOpen(true); // Open the modal
    console.log(selectedRow)
    
    const url = `${BASE_URL}/orders/${row?.original?._id}`
    console.log(url)

    try {
      const response = await axios.get(url);
      if(response.status === 200) {
        setInvoiceData(response.data.order)
        console.log(invoiceData)
      }
    } catch (error) {
      console.log(error)
    }
  }

  const displayInvoice2 = async (row) => {
    console.log("row log: ", row)
    setSelectedRow(row); // Store the clicked row's data
    setIsModalOpen(true); // Open the modal
    // setInventoryData(row)
  }

  // const selectedRows = Object.keys(rowSelection).map((rowId) =>
  //   table.getRow(rowId)?.original
  // ).filter(Boolean);

  const customTableOptions = {
    renderTopToolbarCustomActions: ({ table }) => (
    <Box
      sx={{
        display: 'flex',
        gap: '16px',
        // padding: '8px',
        flexWrap: 'wrap',
      }}
    >
      <Button 
        color="lime" 
        // leftIcon={<IconUserPlus />} 
        mb="sm"
        onClick={() => setOpened(!opened)}
        disabled={
          table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()
        }
      >
        {t("دفع")}
      </Button>
      <Button
        color="green"
        //export all data that is currently in the table (ignore pagination, sorting, filtering, etc.)
        onClick={() => setAddProcedureOpened(!addProcedureOpened)}
        // leftIcon={<IconPlus />}
        variant="outline"
        disabled={
          !table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()
        }
      >
        {t("إضافة قسط")}
      </Button>
      <Button
        disabled={
          !table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()
        }
        //export all rows, including from the next page, (still respects filtering and sorting)
        // onClick={}
        leftIcon={<IconHistory />}
        variant="filled"
      >
        {t("عرض سجل الأقساط")}
      </Button>
      <Button
        disabled={
          !table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()
        }
        //export all rows as seen on the screen (respects pagination, sorting, filtering, etc.)
        onClick={() => setExitPermissionModal(true)}
        leftIcon={<IconDoorExit />}
        variant="outline"
        color='red'
      >
        {t("إرجاع")}
      </Button>
    </Box>
    ),
    renderRowActions: ({ row }) => {
      return (
        <Flex justify="flex-start">
          <Tooltip label="Delete" >
            <Button
              mr="md"
              color="red"
              onClick={() => handleDelete()}
            >
              <IconTrash color="white" />
            </Button>
          </Tooltip>
          <Tooltip label="Edit">
            <Button
              color="blue"
              onClick={() => setEditPatientModal(true)}
              // onClick={() => console.log(row.original)}
            >
              <IconEdit color="white" />
            </Button>
          </Tooltip>
        </Flex>
      );
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
            onClick={(e) => {
              e.stopPropagation(e);
              handleDeleteInvoice(row.original._id)
            }}
          >
            <IconTrash size={26} />
          </ActionIcon>
        </Tooltip>

      </Group>
    ),
  };

  const customToolbarOptions = {
    payInstallment: () =>
     <Button 
        color="green" 
        disabled={!selectedInvoice}
        onClick={() => {
          setInstallmentModalOpen(true)
          console.log("Selected invoice row: ", selectedInvoice)
        }
      }
    >
      Pay Installment
    </Button>,
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: selectedRow?.invoiceID || "Invoice",
  });

  const handleDeleteInvoice = async(invoiceId) => {
    const confirmDialog = window.confirm("هل أنت متأكد من حذف الفاتورة؟")
    if(!confirmDialog) return;
    
    try {
      const url = `${BASE_URL}/sale-invoices/delete/${invoiceId}`;

      const res = await axios.delete(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 200) {
        setInvoicesData((prev) =>
          prev.filter((invoice) => invoice._id !== invoiceId)
        );
      }
    } catch (error) {
      showNotification({
        title: "Error",
        message: "Erorr deleting invoice",
        color: "red"
      })
    }
  }

  const handleChange = (field, value) => {
    setClientForm((prev) => ({ ...prev, [field]: value }));
  };

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
        setClientsData((prev) => [...prev, res.data.newClient])
        setAddClientModalOpened(false);
      }
    } catch (error) {
      showNotification({
        title: 'Error creating a merchant',
        message: error,
        color: 'red'
      })
    }
  }

  return (
    <Box>
      {/* <InvoiceTemplate order={invoiceData} /> */}
      <Flex mb="xs" justify="flex-start">
        <Button variant="filled" color="green" onClick={() => setOpened(!opened)} leftIcon={<IconMedicalCrossCircle />}>
          {t("CREATE-INVOICE")}
        </Button>
      </Flex>
      <TanStackTable
        data={invoicesData}
        columns={orderColumns}
        renderRowActions={(row) => (
          <>
            <Button size="xs">Edit</Button>
            <Button size="xs" color="red">
              Delete
            </Button>
          </>
        )}
        onRowClick={displayInvoice2}
        actionsColumn={actionsColumn}
        customToolbarOptions={customToolbarOptions}
        onSelectionChange={setSelectedInvoice}
      />
      {/* <OrderForm
        opened={opened}
        setOpened={setOpened}
        handleAddOrder={handleAddOrder}
        suppliers={clientsList}
        // productsList={productsList}
        inventoryData={inventoryData}
        setInventoryData={setInventoryData}
        handleProductSelection={handleProductSelection}
        selectedProductId={selectedProductId}
        handleSupplierSelection={handleSupplierSelection}
        selectedSupplierId={selectedSupplierId}
        setInvoiceData={setInvoiceData}
        invoiceData={invoiceData}
        /> */}
      <CreateSaleInvoiceModal
        opened={opened}
        setOpened={setOpened}
        clients={clientsList}
        inventoryData={inventoryData}
        setInventoryData={setInventoryData}
        token={token}
        BASE_URL={BASE_URL}
        onSuccess={handleAddOrder}
        setAddClientModalOpened={setAddClientModalOpened}
      />
      {/* <InvoiceTemplate order={invoicesData} /> */}
      {/* Modal for Invoice */}
      <Modal
        opened={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size={"70rem"}
        // title="Invoice Details" 
      >
        {selectedRow && <SalesInvoiceTemplate ref={printRef} handlePrint={handlePrint} order={selectedRow} title="Sale Invoice" type="sale" />}
      </Modal>
      <AddInstallmentModal
        opened={installmentModalOpen}
        setOpened={setInstallmentModalOpen}
        invoice={selectedInvoice}
        token={token}
        SUBMIT_URL={saleInvoiceInstallmentUrl}
        onSuccess={handleInvoiceUpdate}
      />
      <AddClientModal
        opened={addClientModalOpened} 
        setOpened={setAddClientModalOpened} 
        clientForm={clientForm} 
        setClientForm={setClientForm} 
        handleChange={handleChange} 
        submitClientForm={submitClientForm}
      />
    </Box>
  );
};

export default SaleInvoices;