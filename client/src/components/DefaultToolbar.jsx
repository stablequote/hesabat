import React from "react";
import { ActionIcon, Group, Menu, Switch, TextInput, Tooltip } from "@mantine/core";
import { IconArrowsMaximize, IconArrowsMinimize, IconColumns, IconListNumbers, IconSearch, IconXFilled } from "@tabler/icons-react";

const DefaultToolbar = ({ globalFilter, setGlobalFilter, density, setDensity, table, isFullscreen, setIsFullscreen, children }) => (
  <Group justify="start" mb="sm">
    <TextInput
        placeholder="Search"
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        leftSection={<IconSearch size={16} />}
        rightSection={globalFilter.length > 0 && <IconXFilled size={16} onClick={(e) => setGlobalFilter("")} />}
        styles={{ input: { backgroundColor: "#f1f3f5", borderRadius: 4 } }}
        
    />
    <Group>
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
    {React.Children.map(children, (child) => child)}
  </Group>
);

export default DefaultToolbar;