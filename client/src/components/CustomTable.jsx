import { ActionIcon, Box, Button, Tooltip } from '@mantine/core';
import { IconDownload, IconEdit, IconTrash } from '@tabler/icons-react';
import {
  MantineReactTable,
  useMantineReactTable,
} from 'mantine-react-table';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const CustomTable = ({
  columns,
  data,
  onRowClick,
  rowActions,
  enablePagination = true,
  enableSorting = true,
  renderTopToolbarCustomActions,
  renderRowActions,
  handlePrintReceipt,
  // rowSelection,
  // setRowSelection,
  checkedRow,
  setCheckedRow,
  onEditingRowSave,
  handleSaveCell,
  ...props
}) => {

  const { t } = useTranslation();
  const [rowSelection, setRowSelection] = useState({});

  const table = useMantineReactTable({
    columns: [
      ...columns,
      ...(rowActions
        ? [{
            id: 'actions',
            header: 'Actions',
            Cell: ({ row }) => rowActions(row.original),
          }]
        : []),
    ],
    data,
    enableEditing: true,
    handleSaveCell,
    onEditingRowSave,
    editDisplayMode:"modal",
    initialState: {
      pagination: { pageSize: 10 },
      density: 'xs',
      // sorting: [
      //   {
      //     id: 'createdAt' || 'measuredAt' || 'registeredAt', // Sort by the 'orderDate' column
      //     desc: true, // Sort in descending order (newest first)
      //   },
      // ],
      showGlobalFilter: true,
    },
    enablePagination,
    enableSorting,
    enableRowActions: true,
    enableRowSelection: true,
    columnFilterDisplayMode: 'popover',
    paginationDisplayMode: 'pages',
    positionToolbarAlertBanner: 'bottom',
    renderTopToolbarCustomActions,
    getRowId: (row) => row._id || row.id,
    onRowSelectionChange: (updater) => {
      const newRowSelection =
        typeof updater === 'function' ? updater(rowSelection) : updater;

      setRowSelection(newRowSelection);
      // If using MRT table instance (like with useMantineReactTable)
      const selectedData = Object.keys(newRowSelection).map((rowId) =>
        table.getRow(rowId).original
      );
      setCheckedRow(Object.keys(newRowSelection).map((rowId) =>
        table.getRow(rowId).original
      ))
      console.log('✅ Selected row data:', selectedData);
      console.log(checkedRow)
    },
    state: {
    rowSelection,
  },
  renderRowActions,    
  mantineTableBodyRowProps: ({ row }) => ({
    onClick: onRowClick ? () => onRowClick(row.original) : undefined,
    style: {
      cursor: onRowClick ? 'pointer' : 'default',
    },
  }),
  ...props,
  });

  return (
    <MantineReactTable
      table={table}
      mantineEditTextInputProps={({ cell }) => ({
        //onBlur is more efficient, but could use onChange instead
        onBlur: (event) => {
          handleSaveCell(cell, event.target.value);
          console.log(cell)
        },
      })}
      positionGlobalFilter="right"
      mantineSearchTextInputProps={{
        // placeholder: `Search ${data.length} rows`,
        sx: { minWidth: '300px' },
        variant: 'filled',
      }}
    />
  )
};

export default CustomTable;