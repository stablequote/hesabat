import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {Box, Button, Container, Flex, Group, Modal, Text, Tooltip} from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import axios, { Axios } from 'axios';
import moment from 'moment';
import { IconDoorExit, IconDownload, IconEdit, IconHistory, IconTrash } from '@tabler/icons-react';
import { download, generateCsv, mkConfig } from 'export-to-csv';
import CustomTable from '../components/CustomTable';
import AddExpenseModal from '../components/AddExpenseModal';

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [open, setOpen] = useState(false)
  const [expenseForm, setExpenseForm] = useState({
    amount: 0,
    description: '',
    paymentMethod: '',
  })

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
      { accessorKey: "createdBy.firstName", header: t("Created-By"), size: 30 },
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
        Cell: ({ cell }) => (
          <Box
            sx={{
              borderRadius: "4px",
              maxWidth: "9ch",
              padding: "4px",
            }}
          >
            {moment(cell.getValue()).format("DD-MM-YYYY hh:mm a")}
          </Box>
        ),
      },
    ],
    [t]
  );
  const BASE_URL = import.meta.env.VITE_URL;
  const user = JSON.parse(localStorage.getItem("user"));
  
  const fetchInventoryData = async (url) => {
      try {
        const res = await axios.get(url);
        console.log(res);
        setExpenses(res.data);
        console.log(res.data)
      } catch (error) {
        console.error('Error fetching inventory data:', error);
        setSalesData([]); // Set to empty array in case of error
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
      const res = await axios.post(url, {
        amount: expenseForm.amount,
        description: expenseForm.description,
        paymentMethod: expenseForm.paymentMethod,
        createdBy: user?.id,
      })
      if(res.status === 201) {
        showNotification({
          title: "Success",
          message: "Expense created successfully!",
          color: "green"
        })
      } else {
        showNotification({
          title: "error",
          message: "Error occured while creating expense!",
          color: "red"
        })
      }
    } catch (error) {
      showNotification({
          title: "Error",
          message: error,
          color: "red"
        })
    }
    setOpen(!open)
    setExpenseForm({amount: 0, description: ''})
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

  return (
    <Container size="100%">
      <Flex justify="space-between" pr="xl">
        <Button color='yellow' mb="xs" onClick={() => setOpen(!open)}>Add expense</Button>
        <Text>Total expenses today: <strong>SDG {expensesSum.toLocaleString()}</strong></Text>
      </Flex>
      {/* <DataGrid 
        columns={expensesColumns} 
        data={expenses}
      /> */}
      <CustomTable
        columns={expensesColumns}
        data={expenses}
        renderTopToolbarCustomActions={customTableOptions.renderTopToolbarCustomActions}
        renderRowActions={customTableOptions.renderRowActions}
        onEditingRowSave={customTableOptions.onEditingRowSave}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        checkedRow={checkedRow}
        setCheckedRow={setCheckedRow}
      />
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