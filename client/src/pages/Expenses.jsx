import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {ActionIcon, Box, Button, Center, Container, Flex, Group, Loader, Modal, Text, Tooltip} from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import axios, { Axios } from 'axios';
import moment from 'moment';
import { IconDoorExit, IconDownload, IconEdit, IconFileExport, IconHistory, IconMoneybagMinus, IconTrash } from '@tabler/icons-react';
import { download, generateCsv, mkConfig } from 'export-to-csv';
import CustomTable from '../components/CustomTable';
import AddExpenseModal from '../components/AddExpenseModal';
import TanStackTable from '../components/TanStackTable';

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [open, setOpen] = useState(false)
  const [expenseForm, setExpenseForm] = useState({
    amount: 0,
    description: '',
    category: '',
    paymentMethod: '',
    transactionNumber: '',
  })
  const [loading, setLoading] = useState(false);

  // copied from ahs ==> states for table management
  const [rowSelection, setRowSelection] = useState({});
  const [checkedRow, setCheckedRow] = useState([])
  const [opened, setOpened] = useState(false);
  const [tableData, setTableData] = useState([]);

  const [editRow, setEditRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [salesData, setSalesData] = useState([]);

  const { t } = useTranslation();

  const expensesColumns = useMemo(
    () => [
      { accessorKey: "description", header: t("Description"), size: 120},
      { accessorKey: "amount", header: t("Amount"), size: 120},
      { accessorKey: "paymentMethod", header: t("Payment-Method"), size: 30 },
      { accessorKey: "transactionNumber", header: t("Transaction Number"), size: 30 },
      { accessorKey: "category", header: t("Category"), size: 30 },
      { accessorKey: "createdBy.fullName", header: t("Created-By"), size: 30 },
      // {
      //   accessorFn: (data) => moment(data.createdAt).format("DD-MM-YYYY h:mm a"),
      //   id: "createdAt",
      //   header: t("Date"),
      //   size: 120,
      // },
      {
        accessorKey: "createdAt",
        header: t("Date"),
        size: 100,
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
              {value ? moment(value).format("DD-MM-YYYY hh:mm") : "-"}
            </Box>
          );
        },
      },
    ],
    [t]
  );

  const BASE_URL = import.meta.env.VITE_URL;
  const user = JSON.parse(localStorage.getItem("user"));
  
  const fetchInventoryData = async (url) => {
    setLoading(true)
    try {
      const res = await axios.get(url);
      setExpenses(res.data);
      console.log(res.data)
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      setSalesData([]); // Set to empty array in case of error
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    const url = `${BASE_URL}/expenses/list`;
    const res = axios.get(url);
    console.log(res)
    fetchInventoryData(url)
  }, [])

  const handleChange = (field, value) => {
    setExpenseForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("User ID: ", user?.id)
      const url = `${BASE_URL}/expenses/add`;

      const payload = {
        amount: expenseForm.amount,
        description: expenseForm.description,
        category: expenseForm.category,
        paymentMethod: expenseForm.paymentMethod,
        transactionNumber: expenseForm.transactionNumber,
        createdBy: user?.id,
      }

      const res = await axios.post(url, payload)
      if(res.status === 201) {
        showNotification({
          title: "Success",
          message: "Expense created successfully!",
          color: "green"
        })
        setExpenseForm({amount: 0, description: '', paymentMethod: ''})
        setExpenses((prev) => [...prev, res.data.newExpense])
      }
    } catch (error) {
      showNotification({
        title: "Error",
        message: error,
        color: "red"
      })
    }
    setOpen(!open)
  }

  const isToday = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    return date >= start && date <= end;
  };

  const todayExpenses = expenses.filter(exp => isToday(exp.createdAt));
  // const totalTodayExpenses = todayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const expensesSum = expenses.reduce((acc, exp) => acc + exp.amount, 0)
  console.log("expenses state: ", expensesSum)

  // console.log("💸 Total Expenses for Today:", totalTodayExpenses);

  const handleSaveEdit = async () => {
    // console.log(editRow)
    // setData((prev) =>
    //   prev.map((item) => (item.id === editRow.id ? editRow : item)))
    try {
      const id = editRow._id
      console.log(id)
      const url = `${BASE_URL}/expenses/edit/${id}`
      const res = await axios.put(url, editRow)
      console.log(res)
    } catch (error) {
      console.log(error)
    } finally {
      setEditModalOpen(false);
    }
  };

  // Delete Modal Handlers
  const handleDelete = (row) => {
    console.log(row.original)
    setDeleteRow(row.original);
    setDeleteModalOpen(true);
  };

  // confirm deletion function
  const confirmDelete = async () => {
    // const product = window.confirm("Are you sure you want to delete this product?")
    // if(!product) return;
    try {
      const id = deleteRow._id;
      const url = `${BASE_URL}/expenses/delete/${id}`
      // send axios delete
      const response = await axios.delete(url, id);
      if(response.status === 200) {
        showNotification({
          title: "success",
          message: "You have successfully deleted an item",
          color: "green"
        })
        // updating state
        setExpenses((prev) => prev.filter((item) => item._id !== id));
      }
    } catch (error) {
      showNotification({
        title: "Server error",
        message: "An error on the server, please try again",
        color: "red"
      })
    }
    setDeleteModalOpen(!deleteModalOpen)
  };

  const handleSaveCell = (cell, value) => {
    //if using flat data and simple accessorKeys/ids, you can just do a simple assignment here
    tableData[cell.row.index][cell.column.id] = value;
    //send/receive api updates here
    setTableData([...tableData]); //re-render with new data
  };

  const csvConfig = mkConfig({
    fieldSeparator: ',',
    decimalSeparator: '.',
    useKeysAsHeaders: true,
  });

  const handleExportRows = (rows) => {
    const rowData = rows.map((row) => row.original);
    const csv = generateCsv(csvConfig)(rowData);
    download(csvConfig)(csv);
  };

  const handleExportData = () => {
    const csv = generateCsv(csvConfig)(expenses);
    download(csvConfig)(csv);
  };

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
          color="lightblue"
          //export all data that is currently in the table (ignore pagination, sorting, filtering, etc.)
          onClick={handleExportData}
          leftIcon={<IconDownload />}
          variant="filled"
        >
          {t("EXPORT-ALL-DATA")}
        </Button>
        <Button
          disabled={table.getPrePaginationRowModel().rows.length === 0}
          //export all rows, including from the next page, (still respects filtering and sorting)
          onClick={() =>
            handleExportRows(table.getPrePaginationRowModel().rows)
          }
          leftIcon={<IconDownload />}
          variant="filled"
        >
          {t("EXPORT-ALL-ROWS")}
        </Button>
        <Button
          disabled={table.getRowModel().rows.length === 0}
          //export all rows as seen on the screen (respects pagination, sorting, filtering, etc.)
          onClick={() => handleExportRows(table.getRowModel().rows)}
          leftIcon={<IconDownload />}
          variant="filled"
        >
          {t("EXPORT-PAGE-ROWS")}
        </Button>
        <Button
          disabled={
            !table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()
          }
          //only export selected rows
          onClick={() => handleExportRows(table.getSelectedRowModel().rows)}
          leftIcon={<IconDownload />}
          variant="filled"
        >
          {t("EXPORT-SELECTED-ROWS")}
        </Button>
      </Box>
    ),
    renderRowActions: ({ row, table }) => {
      return (
        <Flex justify="flex-start">
          <Tooltip label="Delete" >
            <Button
              mr="md"
              color="red"
              // onClick={() => handleActionClick(row.original)}
              onClick={() => handleDelete(row)}
            >
              <IconTrash color="white" />
            </Button>
          </Tooltip>
          <Tooltip label="Edit">
            <Button
              color="blue"
              onClick={() => table.setEditingRow(row)}
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
    onEditingRowSave: async ({table, row, values}) => {
      //if using flat data and simple accessorKeys/ids, you can just do a simple assignment here.
      tableData[row.index] = values;
      console.log(row.original)
      console.log(values)
      const id = row.original._id;
      try {
        const url = `${BASE_URL}/expenses/edit/${id}`
        const res = await axios.put(url, values)
        // console.log(res)
        if(res.status === 200) {
          setTableData([res.data]);
          showNotification({
            title: "success",
            message: "Expense successfully updated!",
            color: "green"
          })
          table.setEditingRow(null); //exit editing mode
        }
      } catch (error) {
        console.log(error)
      }
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
    payInstallment: (checkedRow) =>
     <Button
      color="green" 
      // disabled={checkedRow?.length === 0}
      onClick={() => {
        setInstallmentModalOpen(true)
        console.log("checked row: ", checkedRow)
      }
      }
    >
      Export
      <IconFileExport />
    </Button>,
  };

  return (
    <Container size="100%">
      <ActionIcon color='yellow' size={32} mb="xs" onClick={() => setOpen(!open)}>
        <IconMoneybagMinus />
      </ActionIcon>
      {/* <CustomTable
        columns={expensesColumns}
        data={expenses}
        renderTopToolbarCustomActions={customTableOptions.renderTopToolbarCustomActions}
        renderRowActions={customTableOptions.renderRowActions}
        onEditingRowSave={customTableOptions.onEditingRowSave}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        checkedRow={checkedRow}
        setCheckedRow={setCheckedRow}
      /> */}
      <TanStackTable
        data={expenses}
        columns={expensesColumns}
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
      {
        loading && (
          <Center>
            <Loader size={32} color="green" variant="oval" />
          </Center>
        )
      }
      <AddExpenseModal 
        open={open} 
        setOpen={setOpen} 
        expenseForm={expenseForm}  
        handleChange={handleChange}
        handleSubmit={handleSubmit}
      />
      {/* Delete Confirmation Modal */}
      <Modal opened={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Deletion">
        <p>Are you sure you want to delete <br /> <strong>{deleteRow?.description}</strong>?</p>
        <Group position="right" mt="md">
          <Button color="red" onClick={confirmDelete}>Delete</Button>
          <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
        </Group>
      </Modal>
    </Container>
  )
}

export default Expenses;