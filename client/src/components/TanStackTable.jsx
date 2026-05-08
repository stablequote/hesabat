import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";

import {
  Table,
  Checkbox,
  Group,
  Button,
  Pagination,
  Select,
  Menu,
  Switch,
  TextInput,
  Paper,
  Tooltip,
  ActionIcon,
  Text,
  Box
} from "@mantine/core";

import {
  IconColumns,
  IconSortAscending,
  IconSortDescending,
  IconSearch,
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconListNumbers,
  IconArrowUp,
  IconArrowDown,
  IconArrowsSort,
  IconFilter,
  IconEdit,
  IconTrash
} from "@tabler/icons-react";

import { useState } from "react";

const TanStackTable = ({ data, columns, renderRowActions }) => {
  const [rowSelection, setRowSelection] = useState({});
  const [sorting, setSorting] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [density, setDensity] = useState("xl");
  const [columnVisibility, setColumnVisibility] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState([]);

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const selectionColumn = {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllRowsSelected()}
        indeterminate={table.getIsSomeRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
      />
    ),
  };

//   const actionsColumn = {
//     id: "actions",
//     header: "Actions",
//     cell: ({ row }) => renderRowActions?.(row.original),
//   };

const actionsColumn = {
  id: "actions",
  header: () => <Box ta="center">Actions</Box>,

  cell: ({ row }) => (
    <Group gap="lg" justify="start" wrap="nowrap">
      
      {/* EDIT */}
      <Tooltip label="Edit" >
        <ActionIcon
          variant="light"
          color="blue"
          onClick={() => renderRowActions?.onEdit?.(row.original)}
        >
          <IconEdit size={26} />
        </ActionIcon>
      </Tooltip>

      {/* DELETE */}
      <Tooltip label="Delete">
        <ActionIcon
          variant="light"
          color="red"
          onClick={() => renderRowActions?.onDelete?.(row.original)}
        >
          <IconTrash size={26} />
        </ActionIcon>
      </Tooltip>

    </Group>
  ),
};

  const table = useReactTable({
    data,
    columns: [selectionColumn, ...columns, actionsColumn],

    state: {
      rowSelection,
      sorting,
      columnVisibility,
      globalFilter,
      pagination,
      columnFilters, 
    },
    onColumnFiltersChange: setColumnFilters,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,

    getRowId: (row) => row._id || row.id,

    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <Paper 
        shadow="lg" 
        px={20}
        py={10} 
        withBorder 
        style={{
        position: isFullscreen ? "fixed" : "relative",
        inset: isFullscreen ? 0 : "auto",
        width: "100%",
        height: isFullscreen ? "100vh" : "auto",
        zIndex: isFullscreen ? 9999 : "auto",
        overflow: "auto",
        background: "white",
        }}
    >

      {/* TOOLBAR */}
      <Group justify="start" mb="sm">

        <TextInput
          placeholder="Search"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          leftSection={<IconSearch size={16} />}
          styles={{ input: { backgroundColor: "#f1f3f5", borderRadius: 4 } }}
        />

        <Group>

          {/* Density (UI only for now) */}
          {/* <Select
            data={[
              { value: "xs", label: "Compact" },
              { value: "sm", label: "Comfortable" },
              { value: "md", label: "Spacious" },
            ]}
            defaultValue="md"
          /> */}

          <Group gap="xs">
                <Tooltip label="Compact">
                    <ActionIcon
                    variant={density === "xs" ? "filled" : "light"}
                    onClick={() => setDensity("xs")}
                    >
                    <IconListNumbers size={16} />
                    </ActionIcon>
                </Tooltip>
          </Group>

          {/* Column visibility */}
          <Menu>
            <Menu.Target>
               <Tooltip label="Show/Hide columns">
                    <ActionIcon variant="light">
                        <IconColumns size={18} />
                    </ActionIcon>
                </Tooltip>
            </Menu.Target>

            <Menu.Dropdown>
              {table.getAllLeafColumns().map((col) => (
                <Menu.Item key={col.id}>
                  <Switch
                    label={col.id}
                    checked={col.getIsVisible()}
                    onChange={col.getToggleVisibilityHandler()}
                  />
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>

          {/* FULLSCREEN */}
        <Tooltip label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
            <ActionIcon
                variant="light"
                onClick={() => setIsFullscreen((v) => !v)}
            >
                {isFullscreen ? (
                <IconArrowsMinimize size={18} />
                ) : (
                <IconArrowsMaximize size={18} />
                )}
            </ActionIcon>
        </Tooltip>

        </Group>
      </Group>

      {/* TABLE */}
      <Table striped highlightOnHover horizontalSpacing="xl" verticalSpacing="xl">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => {
                const canSort = header.column.getCanSort();

                return (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ cursor: canSort ? "pointer" : "default", color: "blue", fontSize: 16, fontWeight: 700, borderBottom: "1px solid gray", paddingBottom: "0.75rem" }}
                  >
                    <Group gap={5}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}

                      {canSort &&
                        (header.column.getIsSorted() === "asc" ? (
                          <IconSortAscending size={14} />
                        ) : header.column.getIsSorted() === "desc" ? (
                          <IconSortDescending size={14} />
                        ) : null)}
                    </Group>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>

        <tbody style={{ paddingTop: "3rem" }}>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(
                    cell.column.columnDef.cell,
                    cell.getContext()
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>

      {/* FOOTER */}
      <Group justify="space-between" mt="md">
        <Group justify="start" mt="md">
            <Text>Rows per page</Text>
            <Select
                value={String(pagination.pageSize)}
                onChange={(val) =>
                    setPagination((prev) => ({
                    ...prev,
                    pageSize: Number(val),
                    }))
                }
                data={["5", "10", "20", "50", "100"]}
            />
        </Group>

        <Pagination
          total={table.getPageCount()}
          value={pagination.pageIndex + 1}
          onChange={(page) =>
            setPagination((prev) => ({
              ...prev,
              pageIndex: page - 1,
            }))
          }
        />

      </Group>
    </Paper>
  );
};

export default TanStackTable;