import { useEffect, useState, useMemo } from 'react';
import { Box, Button, Flex, Modal, Tooltip } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { IconDoorExit, IconEdit, IconHistory, IconMedicalCrossCircle, IconTrash } from '@tabler/icons-react';
import axios from 'axios';
import moment from 'moment';
import OrderForm from '../components/OrderForm';
import CustomTable from '../components/CustomTable';
import InvoiceTemplate from '../components/InvoiceTemplate';

const SaleInvoices = () => {
  const { t } = useTranslation();
  
  const orderColumns = useMemo(
    () => [
      { accessorKey: "orderID", header: t("Order-ID"), size: 100 },
      { accessorKey: "supplier.name", header: t("Supplier"), size: 150 },
      { accessorKey: "supplier.supplierID", header: t("Supplier-ID"), size: 150 },
      { accessorKey: "orderDate", header: t("Order-Date"), sortingFn: 'datetime',size: 120, Cell: ({ cell }) => ( <Box>{moment(cell.getValue()).format("DD-MMMM-YYYY")}</Box>)},
      { accessorKey: "paymentMethod", header: t("Payment-Method"), size: 120 },
      { accessorKey: "totalOrderPrice", header: t("Total-Order-Cost"), size: 120 },
      {
        accessorKey: "isOrderPaid",
        header: t("Is-Order-Paid"),
        accessorFn: (row) => (row.isOrderPaid ? t("Yes") : t("No")),
      },
      { accessorKey: "status", header: t("Status"), size: 120 },
      {
        accessorKey: "products",
        header: t("Ordered-Products"),
        accessorFn: (row) =>
          row.products?.length
            ? row.products.map((p) => p.product.product).join(", ")
            : t("No-Products"),
      },
    ],
    [t]
  );

  const BASE_URL = import.meta.env.VITE_URL

  const [ordersData, setOrdersData] = useState([]);
  const [opened, setOpened] = useState(false);
  const [inventoryData, setInventoryData] = useState([]);
  const [suppliersData, setSuppliersData] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);

  // copied from ahs ==> states for table management
  const [rowSelection, setRowSelection] = useState({});
  const [checkedRow, setCheckedRow] = useState([])

  const handleAddOrder = (newOrder) => {
    setOrdersData((prevData) => [
      ...prevData,
      { ...newOrder, orderId: `ORD${(prevData.length + 1).toString().padStart(3, '0')}` },
    ]);
  };

  const fetchInventory = async () => {
    const inventoryUrl = `${BASE_URL}/inventory/list-all`;
    const supplierUrl = `${BASE_URL}/supplier/list`;

    try {
      const inventoryResponse = await axios.get(inventoryUrl);
      setInventoryData(inventoryResponse.data);

      const supplierResponse = await axios.get(supplierUrl);
      setSuppliersData(supplierResponse.data.supplier);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchOrders = async () => {    
    try {
      const url = `${BASE_URL}/orders/list`;
      const response = await axios.get(url);
      console.log(response.data.orders)
      setOrdersData(response.data.orders);
      console.log(ordersData)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    fetchOrders();
    fetchInventory();
  }, [invoiceData?._id]);

  // Transform suppliers data for the Select component
  const suppliersList = suppliersData.map((item) => ({
    value: item._id,
    label: item.name,
  }));

  // Transform products data for the Select component
  const productsList = inventoryData.map((item) => ({
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

  return (
    <Box>
      {/* <InvoiceTemplate order={invoiceData} /> */}
      <Flex mb="xs" justify="flex-start">
        <Button variant="filled" color="green" onClick={() => setOpened(!opened)} leftIcon={<IconMedicalCrossCircle />}>
          {t("CREATE-ORDER")}
        </Button>
      </Flex>
      {/* <DataGrid 
        data={ordersData} 
        columns={orderColumns} 
        isModalOpen={isModalOpen} 
        setIsModalOpen={setIsModalOpen} 
        displayInvoice={displayInvoice2} 
      /> */}
      <CustomTable
        data={ordersData} 
        columns={orderColumns} 
        onRowClick={(row) => displayInvoice2(row)}
        renderTopToolbarCustomActions={customTableOptions.renderTopToolbarCustomActions}
        renderRowActions={customTableOptions.renderRowActions}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        checkedRow={checkedRow}
        setCheckedRow={setCheckedRow}
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
        setInvoiceData={setInvoiceData}
        invoiceData={invoiceData}
      />
      {/* <InvoiceTemplate order={ordersData} /> */}
      {/* Modal for Invoice */}
      <Modal
        opened={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size={"70rem"}
        // title="Invoice Details"
        fullScreen        
      >
        {selectedRow && <InvoiceTemplate order={selectedRow} />}
      </Modal>
    </Box>
  );
};

export default SaleInvoices;