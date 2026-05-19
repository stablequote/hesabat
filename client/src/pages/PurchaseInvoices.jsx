import { useEffect, useState, useMemo, useRef } from 'react';
import { ActionIcon, Box, Button, Flex, Group, Modal, Tooltip } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { IconDoorExit, IconDownload, IconEdit, IconHistory, IconMedicalCrossCircle, IconMoneybagMove, IconPdf, IconTrash } from '@tabler/icons-react';
import axios from 'axios';
import moment from 'moment';
import OrderForm from '../components/OrderForm';
// import CustomTable from '../components/CustomTable';
import InvoiceTemplate from '../components/InvoiceTemplate';
import TanStackTable from '../components/TanStackTable';
import { useReactToPrint } from "react-to-print";
import AddInstallmentModal from '../components/AddInstallmentModal';
import { showNotification } from '@mantine/notifications';

const PurchaseInvoices = () => {
  const [invoicesData, setInvoicesData] = useState([]);
  const [opened, setOpened] = useState(false);
  const [inventoryData, setInventoryData] = useState([]);
  const [vendorsData, setVendorsData] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [installmentModalOpen, setInstallmentModalOpen] = useState(false);

  // copied from ahs ==> states for table management
  const [rowSelection, setRowSelection] = useState({});
  const [checkedRow, setCheckedRow] = useState([]);

  // state for the checked row
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const printRef = useRef();

  const BASE_URL = import.meta.env.VITE_URL;
  const purchaseInvoiceInstallmentUrl = `${BASE_URL}/purchase-invoices/payments/${selectedInvoice?.invoiceID}/pay`
  const { t } = useTranslation();
  const token = localStorage.getItem("authToken");
  
  const orderColumns = useMemo(
    () => [
      { accessorKey: "invoiceID", header: t("Order-ID"), size: 100 },
      { accessorKey: "vendor.name", header: t("Supplier"), size: 150 },
      { accessorKey: "supplier.supplierID", header: t("Supplier-ID"), size: 150 },
      { accessorKey: "orderDate", 
        header: t("Order-Date"), 
        sortingFn: 'datetime',
        size: 120,
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
              {value ? moment(value).format("DD-MM-YYYY HH:MM") : "-"}
            </Box>
          );
        },
      },
      { accessorKey: "paymentType", header: t("Payment-Method"), size: 120 },
      { accessorKey: "totalOrderPrice", header: t("Total-Order-Cost"), size: 120 },
      { accessorKey: "remainingAmount", header: t("Remaining-Amount"), size: 120 },
      {
        accessorKey: "isOrderPaid",
        header: t("Is-Order-Paid"),
        accessorFn: (row) => (row.isOrderPaid ? t("Yes") : t("No")),
      },
      { accessorKey: "status", 
        header: t("Status"), 
        size: 120,
        cell: ({ getValue }) => {
          const value = getValue();

          return (
            <Box
              style={{
                backgroundColor: value === "paid" ? "#309330" : value === "pending" ? "#ebe72f" : "#e55454",
                padding: "5px 10px",
                borderRadius: 20,
                textAlign: "center",
                color: "white",
                maxWidth: 80,
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
    const vendorUrl = `${BASE_URL}/vendors/list`;

    try {
      const inventoryResponse = await axios.get(inventoryUrl);
      setInventoryData(inventoryResponse.data);

      const vendorResponse = await axios.get(vendorUrl);
      setVendorsData(vendorResponse.data.vendor);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchInvoices = async () => {    
    try {
      const url = `${BASE_URL}/purchase-invoices/list`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response.data.invoices)
      setInvoicesData(response.data.invoices);
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    fetchInvoices();
    fetchInventory();
  }, [invoiceData?._id]);

  // Transform suppliers data for the Select component
  const suppliersList = vendorsData?.map((item) => ({
    value: item._id,
    label: item.name,
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

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: selectedRow?.invoiceID || "Invoice",
  });

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
              e.stopPropagation(e);
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
              handleDeleteInvoice(row.original._id);
            }}
          >
            <IconTrash size={26} />
          </ActionIcon>
        </Tooltip>
      </Group>
    ),
  };

  const customToolbarOptions = {
    exportToPdf: (checkedRow) =>
      <Button
        // disabled={checkedRow?.length === 0} 
        onClick={() => {
          console.log("checked row: ", checkedRow)
        }
      }
    >
      Download pdf
      <IconDownload />
    </Button>,
    payInstallment: (checkedRow) =>
      <Button 
        color="green" 
        disabled={!selectedInvoice}
        onClick={() => {
          setInstallmentModalOpen(true)
          console.log("Selected invoice row: ", selectedInvoice)
        }
      }
    >
      Pay
      <IconMoneybagMove />
    </Button>,
  };

  const handleDeleteInvoice = async(invoiceId) => {
    const confirmDialog = window.confirm("هل أنت متأكد من حذف الفاتورة؟")
    if(!confirmDialog) return;
    
    try {
      const url = `${BASE_URL}/purchase-invoices/delete/${invoiceId}`;

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

  return (
    <Box>
      {/* <InvoiceTemplate order={invoiceData} /> */}
      <Flex mb="xs" justify="flex-start">
        <Button variant="filled" color="green" onClick={() => setOpened(!opened)} leftIcon={<IconMedicalCrossCircle />}>
          {t("CREATE-INVOICE")}
        </Button>
      </Flex>
      {/* <CustomTable
        data={invoicesData} 
        columns={orderColumns} 
        onRowClick={(row) => displayInvoice2(row)}
        renderTopToolbarCustomActions={customTableOptions.renderTopToolbarCustomActions}
        renderRowActions={customTableOptions.renderRowActions}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        checkedRow={checkedRow}
        setCheckedRow={setCheckedRow}
      /> */}
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
      <OrderForm
        opened={opened}
        setOpened={setOpened}
        handleAddOrder={handleAddOrder}
        suppliers={suppliersList}
        // productsList={productsList}
        inventoryData={inventoryData}
        setInventoryData={setInventoryData}
        handleProductSelection={handleProductSelection}
        selectedProductId={selectedProductId}
        handleSupplierSelection={handleSupplierSelection}
        selectedSupplierId={selectedSupplierId}
        invoiceData={invoiceData}
        setInvoiceData={setInvoiceData}
        loading={loading}
        setLoading={setLoading}
        serOrdersData={setInvoicesData}
      />
      {/* <InvoiceTemplate order={invoicesData} /> */}
      {/* Modal for Invoice */}
      <Modal
        opened={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size={"70rem"}
        // title="Invoice Details"
        // fullScreen
        zIndex={999999}
      >
        {selectedRow && 
          <div dir="rtl" style={{ direction: "rtl" }}>
            <InvoiceTemplate ref={printRef} handlePrint={handlePrint} order={selectedRow} title="Purchase Invoice" type="purchase"/>
          </div>
        }
      </Modal>
       <AddInstallmentModal
        opened={installmentModalOpen}
        setOpened={setInstallmentModalOpen}
        invoice={selectedInvoice}
        token={token}
        SUBMIT_URL={purchaseInvoiceInstallmentUrl}
        onSuccess={handleInvoiceUpdate}
      />
    </Box>
  );
};

export default PurchaseInvoices;