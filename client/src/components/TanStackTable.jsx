import { useState } from "react";
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
  Paper,
  Tooltip,
  ActionIcon,
  Text,
  Box,
  Stack,
  Card,
  Divider,
} from "@mantine/core";

import { useMediaQuery } from "@mantine/hooks";
import {
  IconSortAscending,
  IconSortDescending,
} from "@tabler/icons-react";

import DefaultToolbar from "./DefaultToolbar";

const TanStackTable = ({
  data,
  columns,
  onRowClick,
  actionsColumn,
  customToolbarOptions,
  onSelectionChange,
}) => {
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [rowSelection, setRowSelection] = useState({});
  const [sorting, setSorting] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [density, setDensity] = useState(isMobile ? "xs" : "xl");
  const [columnVisibility, setColumnVisibility] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState([]);

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: isMobile ? 5 : 10,
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
      <Box onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={row.getIsSelected()}
          onChange={(e) => {
            row.getToggleSelectedHandler()(e);
            onSelectionChange?.(e.currentTarget.checked ? row.original : null);
          }}
        />
      </Box>
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
    globalFilterFn: "includesString",
    autoResetPageIndex: true,
    getRowId: (row) => row._id || row.id,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const checkedRows = table.getSelectedRowModel().rows.map((r) => r.original);

  // ---------- MOBILE: card list instead of a table ----------
  const renderMobileCards = () => (
    <Stack gap="sm">
      {table.getRowModel().rows.map((row) => {
        const dataCells = row
          .getVisibleCells()
          .filter((c) => !["select", "actions"].includes(c.column.id));
        const selectCell = row
          .getVisibleCells()
          .find((c) => c.column.id === "select");
        const actionCell = row
          .getVisibleCells()
          .find((c) => c.column.id === "actions");

        return (
          <Card
            key={row.id}
            withBorder
            shadow="xs"
            padding="sm"
            radius="md"
            onClick={() => onRowClick?.(row.original)}
            style={{ cursor: onRowClick ? "pointer" : "default" }}
          >
            <Group justify="space-between" mb={4} wrap="nowrap">
              {selectCell &&
                flexRender(
                  selectCell.column.columnDef.cell,
                  selectCell.getContext()
                )}
              {actionCell &&
                flexRender(
                  actionCell.column.columnDef.cell,
                  actionCell.getContext()
                )}
            </Group>
            <Divider mb={6} />
            <Stack gap={4}>
              {dataCells.map((cell) => {
                const header = cell.column.columnDef.header;
                const label = typeof header === "string" ? header : cell.column.id;
                return (
                  <Group key={cell.id} justify="space-between" wrap="nowrap" gap="xs">
                    <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                      {label}
                    </Text>
                    <Text size="sm" ta="right" style={{ wordBreak: "break-word" }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </Text>
                  </Group>
                );
              })}
            </Stack>
          </Card>
        );
      })}
    </Stack>
  );

  // ---------- DESKTOP: original table ----------
  const renderDesktopTable = () => (
    <Table
      striped
      highlightOnHover
      horizontalSpacing="lg"
      verticalSpacing={density}
      styles={{
        td: { padding: "14px 12px" },
        th: { padding: "14px 12px" },
      }}
    >
      <thead>
        {table.getHeaderGroups().map((hg) => (
          <tr key={hg.id}>
            {hg.headers.map((header) => {
              const canSort = header.column.getCanSort();
              return (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  style={{
                    cursor: canSort ? "pointer" : "default",
                    color: "blue",
                    fontSize: 16,
                    fontWeight: 700,
                    borderBottom: "1px solid gray",
                    paddingBottom: "0.75rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Group gap={5} wrap="nowrap">
                    {flexRender(header.column.columnDef.header, header.getContext())}
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
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr
            key={row.id}
            onClick={() => onRowClick?.(row.original)}
            style={{ cursor: onRowClick ? "pointer" : "default" }}
          >
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} style={{ paddingTop: 14, paddingBottom: 14 }}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  );

  return (
    <Paper
      shadow="lg"
      px={isMobile ? 8 : 20}
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
      <DefaultToolbar
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        density={density}
        setDensity={setDensity}
        table={table}
        isFullscreen={isFullscreen}
        setIsFullscreen={setIsFullscreen}
        compact={isMobile}
      >
        <Stack gap={6} w={isMobile ? "100%" : "auto"}>
          {Object.entries(customToolbarOptions || {}).map(([key, renderFn]) => (
            <div key={key}>
              {typeof renderFn === "function" ? renderFn(checkedRows) : renderFn}
            </div>
          ))}
        </Stack>
      </DefaultToolbar>

      {/* On mobile, only wrap in horizontal scroll if we still render the table (we don't by default) */}
      {isMobile ? renderMobileCards() : renderDesktopTable()}

      <Group justify="space-between" mt="md" wrap="wrap">
        <Group justify="start" mt="md" gap="xs">
          <Text size={isMobile ? "xs" : "sm"}>Rows</Text>
          <Select
            size={isMobile ? "xs" : "sm"}
            w={80}
            value={String(pagination.pageSize)}
            onChange={(val) =>
              setPagination((prev) => ({ ...prev, pageSize: Number(val) }))
            }
            data={["5", "10", "20", "50", "100"]}
          />
        </Group>

        <Pagination
          size={isMobile ? "sm" : "md"}
          total={table.getPageCount()}
          value={pagination.pageIndex + 1}
          onChange={(page) =>
            setPagination((prev) => ({ ...prev, pageIndex: page - 1 }))
          }
        />
      </Group>
    </Paper>
  );
};

export default TanStackTable;
