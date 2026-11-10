import { forwardRef } from "react";
import { Menu, Checkbox } from "@mantine/core";
import {
  IconSearch,
  IconMaximize,
  IconMinimize,
  IconMenu2,
  IconColumns3,
  IconCheck,
} from "@tabler/icons-react";

const DENSITIES = [
  { value: "compact", label: "Compact" },
  { value: "default", label: "Default" },
  { value: "spacious", label: "Spacious" },
];

const IconButton = forwardRef(function IconButton({ label, children, ...rest }, ref) {
  return (
    <button ref={ref} type="button" className="tst-iconbtn" aria-label={label} title={label} {...rest}>
      {children}
    </button>
  );
});

const columnLabel = (col) => {
  const header = col.columnDef.header;
  return typeof header === "string" ? header : col.id;
};

// Same props as DefaultToolbar, so TanStackTable can swap between them.
// Search, fullscreen, row density and column visibility; `children` are the page's custom actions.
function TableToolbar({
  globalFilter,
  setGlobalFilter,
  density,
  setDensity,
  table,
  isFullscreen,
  setIsFullscreen,
  compact,
  searchPlaceholder = "Search",
  children,
}) {
  const hideable = table
    .getAllLeafColumns()
    .filter((c) => !["select", "actions"].includes(c.id) && c.getCanHide());

  return (
    <div className="tst-toolbar">
      <label className="tst-search">
        <IconSearch className="tst-search__ico" size={18} stroke={1.75} aria-hidden="true" />
        <input
          type="search"
          className="tst-search__input"
          aria-label={searchPlaceholder}
          placeholder={searchPlaceholder}
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.currentTarget.value)}
        />
      </label>

      <div className="tst-toolbar__end">
        {children && <div className="tst-custom">{children}</div>}

        <div className="tst-iconbtns">
          <IconButton
            label={isFullscreen ? "Exit full screen" : "Full screen"}
            aria-pressed={isFullscreen}
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? (
              <IconMinimize size={18} stroke={1.75} aria-hidden="true" />
            ) : (
              <IconMaximize size={18} stroke={1.75} aria-hidden="true" />
            )}
          </IconButton>

          {!compact && (
            <Menu shadow="md" position="bottom-end" width={170} zIndex={10000}>
              <Menu.Target>
                <IconButton label="Row density" className="tst-iconbtn">
                  <IconMenu2 size={18} stroke={1.75} aria-hidden="true" />
                </IconButton>
              </Menu.Target>
              <Menu.Dropdown>
                {DENSITIES.map((d) => (
                  <Menu.Item
                    key={d.value}
                    onClick={() => setDensity(d.value)}
                    rightSection={density === d.value ? <IconCheck size={14} /> : null}
                  >
                    {d.label}
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
          )}

          <Menu shadow="md" position="bottom-end" width={200} closeOnItemClick={false} zIndex={10000}>
            <Menu.Target>
              <IconButton label="Columns" className="tst-iconbtn">
                <IconColumns3 size={18} stroke={1.75} aria-hidden="true" />
              </IconButton>
            </Menu.Target>
            <Menu.Dropdown>
              {hideable.map((col) => (
                <Menu.Item
                  key={col.id}
                  onClick={() => col.toggleVisibility()}
                  leftSection={
                    <Checkbox
                      size="xs"
                      checked={col.getIsVisible()}
                      onChange={() => {}}
                      tabIndex={-1}
                      style={{ pointerEvents: "none" }}
                      aria-hidden="true"
                    />
                  }
                >
                  {columnLabel(col)}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
        </div>
      </div>
    </div>
  );
}

export default TableToolbar;