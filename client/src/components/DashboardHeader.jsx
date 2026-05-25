import React from "react";
import {
  Box,
  Text,
  Group,
  ActionIcon,
  Burger,
  Menu,
  Select,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import {
  IconBell,
  IconUser,
  IconDotsVertical,
  IconLanguage,
} from "@tabler/icons-react";
import moment from "moment";
import SyncButton from "./SyncButton";

const DashboardHeader = ({
  changeLanguage,
  value,
  shiftRemainingTime,
  navOpened,
  onNavToggle,
}) => {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <Box
      h={60}
      px={isMobile ? "sm" : "md"}
      style={{
        backgroundColor: "#71a0e2",
        color: "white",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Group justify="space-between" w="100%" wrap="nowrap" gap="xs">

        {/* Left: Burger (mobile only) + Logo */}
        <Group gap="xs" wrap="nowrap">
          <Burger
            opened={navOpened}
            onClick={onNavToggle}
            hiddenFrom="sm"
            color="white"
            size="sm"
          />
          <Text
            c="orange"
            fz={isMobile ? 22 : 32}
            fw="bold"
            ff="monospace"
            style={{ lineHeight: 1, whiteSpace: "nowrap" }}
          >
            حسابات
          </Text>
        </Group>

        {/* Right side */}
        {isMobile ? (
          /* ── Mobile: keep only critical items, rest in overflow menu ── */
          <Group gap={6} wrap="nowrap">
            {/* Shift timer — compact */}
            {shiftRemainingTime ? (
              <Text size="xs" c="white" style={{ whiteSpace: "nowrap" }}>
                {shiftRemainingTime}
              </Text>
            ) : null}

            <SyncButton />

            {/* Overflow menu for secondary actions */}
            <Menu shadow="md" width={220} position="bottom-end">
              <Menu.Target>
                <ActionIcon variant="subtle" color="white">
                  <IconDotsVertical size={20} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                {/* Date/time */}
                <Menu.Label>
                  {moment(Date.now()).format("DD MMM YYYY, h:mm A")}
                </Menu.Label>

                {/* Language selector inside the menu */}
                <Box px="sm" py={6}>
                  <Select
                    data={[
                      { value: "en", label: "English" },
                      { value: "ar", label: "Arabic" },
                    ]}
                    placeholder="Language"
                    value={value}
                    onChange={changeLanguage}
                    size="xs"
                    leftSection={<IconLanguage size={14} />}
                  />
                </Box>

                <Menu.Divider />

                <Menu.Item
                  leftSection={<IconBell size={16} />}
                  onClick={() =>
                    alert("Notifications feature is coming soon...")
                  }
                >
                  Notifications
                </Menu.Item>

                <Menu.Item
                  leftSection={<IconUser size={16} />}
                  onClick={() =>
                    alert("Profile management is coming soon...")
                  }
                >
                  Profile
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        ) : (
          /* ── Desktop: full inline controls ── */
          <Group gap="sm" wrap="nowrap">
            <SyncButton />
            <Select
              data={[
                { value: "en", label: "English" },
                { value: "ar", label: "Arabic" },
              ]}
              placeholder="Language"
              value={value}
              onChange={changeLanguage}
              size="sm"
              style={{ width: 120 }}
            />
            <Text size="sm" style={{ whiteSpace: "nowrap" }}>
              {moment(Date.now()).format("DD-MMMM-YYYY h:mm A")}
            </Text>
            <ActionIcon
              variant="subtle"
              color="white"
              onClick={() => alert("Notifications feature is coming soon...")}
            >
              <IconBell size={20} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              color="white"
              onClick={() => alert("Profile management is coming soon...")}
            >
              <IconUser size={20} />
            </ActionIcon>
            {shiftRemainingTime && (
              <Text size="sm" c="white" style={{ whiteSpace: "nowrap" }}>
                {shiftRemainingTime}
              </Text>
            )}
          </Group>
        )}
      </Group>
    </Box>
  );
};

export default DashboardHeader;
