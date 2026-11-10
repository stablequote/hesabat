import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import { Checkbox, Pagination, Select, Text, Stack, Card, Group, Divider } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { IconSelector, IconArrowUp, IconArrowDown } from "@tabler/icons-react";
import TableToolbar from "./TableToolbar";
import "../assets/css/TanStackTable.css";

const EMPTY = [];
const SORT_ARIA = { asc: "ascending", desc: "descending" };

const TanStackTable = ({
  data,
  columns,
  onRowClick,
  actionsColumn,
  customToolbarOptions,
  onSelectionChange,
  searchPlaceholder = "Search",
}) => {
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [rowSelection, setRowSelection] = useState({});
  const [sorting, setSorting] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [density, setDensity] = useState(isMobile ? "compact" : "default");
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
        size={17}
        aria-label="Select all rows"
        checked={table.getIsAllRowsSelected()}
        indeterminate={table.getIsSomeRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
      />
    ),
    cell: ({ row }) => (
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          size={17}
          aria-label="Select row"
          checked={row.getIsSelected()}
          onChange={(e) => {
            row.getToggleSelectedHandler()(e);
            onSelectionChange?.(e.currentTarget.checked ? row.original : null);
          }}
        />
      </div>
    ),
  };

  const table = useReactTable({
    data: data ?? EMPTY,
    // `actionsColumn` is optional: pages without one used to crash the table
    columns: [selectionColumn, ...columns, actionsColumn].filter(Boolean),
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
    <Stack gap="sm" className="tst-cards">
      {table.getRowModel().rows.map((row) => {
        const dataCells = row
          .getVisibleCells()
          .filter((c) => !["select", "actions"].includes(c.column.id));
        const selectCell = row.getVisibleCells().find((c) => c.column.id === "select");
        const actionCell = row.getVisibleCells().find((c) => c.column.id === "actions");

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
              {selectCell && flexRender(selectCell.column.columnDef.cell, selectCell.getContext())}
              {actionCell && flexRender(actionCell.column.columnDef.cell, actionCell.getContext())}
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
                    <Text size="sm" ta="end" style={{ wordBreak: "break-word" }}>
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

  // ---------- DESKTOP: table ----------
  const renderDesktopTable = () => {
    const rows = table.getRowModel().rows;
    return (
      <div className="tst-scroll">
        <table className="tst-table">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  const label = flexRender(header.column.columnDef.header, header.getContext());
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      className={header.column.id === "select" ? "tst-th--select" : undefined}
                      aria-sort={canSort ? SORT_ARIA[sorted] || "none" : undefined}
                    >
                      {canSort ? (
                        <button
                          type="button"
                          className="tst-sort"
                          data-sorted={sorted || undefined}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {label}
                          {sorted === "asc" ? (
                            <IconArrowUp className="tst-sort__ico" size={14} aria-hidden="true" />
                          ) : sorted === "desc" ? (
                            <IconArrowDown className="tst-sort__ico" size={14} aria-hidden="true" />
                          ) : (
                            <IconSelector className="tst-sort__ico" size={14} aria-hidden="true" />
                          )}
                        </button>
                      ) : (
                        label
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="tst-empty" colSpan={table.getVisibleLeafColumns().length}>
                  No results
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  data-selected={row.getIsSelected() || undefined}
                  data-clickable={onRowClick ? "true" : undefined}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className={cell.column.id === "select" ? "tst-td--select" : undefined}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // ---------- footer numbers ----------
  const total = table.getFilteredRowModel().rows.length;
  const { pageIndex, pageSize } = pagination;
  const from = total === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min(total, (pageIndex + 1) * pageSize);

  return (
    <div
      className={`tst-card${isFullscreen ? " tst-card--full" : ""}`}
      data-density={density}
    >
      <TableToolbar
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        density={density}
        setDensity={setDensity}
        table={table}
        isFullscreen={isFullscreen}
        setIsFullscreen={setIsFullscreen}
        compact={isMobile}
        searchPlaceholder={searchPlaceholder}
      >
        {Object.entries(customToolbarOptions || {}).map(([key, renderFn]) => (
          <div key={key}>{typeof renderFn === "function" ? renderFn(checkedRows) : renderFn}</div>
        ))}
      </TableToolbar>

      {isMobile ? renderMobileCards() : renderDesktopTable()}

      <div className="tst-foot">
        <div className="tst-count">
          {total === 0 ? "No results" : `Showing ${from}–${to} of ${total}`}
        </div>

        <div className="tst-pager">
          <span className="tst-rowslabel">Rows</span>
          <Select
            className="tst-rows"
            aria-label="Rows per page"
            value={String(pageSize)}
            onChange={(val) =>
              val && setPagination({ pageIndex: 0, pageSize: Number(val) })
            }
            data={["5", "10", "20", "50", "100"]}
            allowDeselect={false}
            comboboxProps={{ zIndex: 10000 }}
          />
          <Pagination
            size={34}
            radius={8}
            color="blue.8"
            total={table.getPageCount()}
            value={pageIndex + 1}
            onChange={(page) => setPagination((prev) => ({ ...prev, pageIndex: page - 1 }))}
          />
        </div>
      </div>
    </div>
  );
};

export default TanStackTable;