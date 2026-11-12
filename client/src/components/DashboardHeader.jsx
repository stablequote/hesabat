import { useEffect, useState } from "react";
import { ActionIcon, Box, Burger, Menu, Select } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import {
  IconWorld,
  IconClock,
  IconDotsVertical,
  IconLanguage,
  IconPower,
} from "@tabler/icons-react";
import moment from "moment";
import SyncButton from "./SyncButton";
import { useAuth } from "../context/AuthContext";
import "../assets/css/DashboardHeader.css";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic" },
];

const DashboardHeader = ({
  changeLanguage,
  value,
  shiftRemainingTime,
  navOpened,
  onNavToggle,
}) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { logout } = useAuth();

  // keeps the clock current (it used to freeze at the last render)
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  /* ── Mobile: burger + logo, critical items, the rest in an overflow menu ── */
  if (isMobile) {
    return (
      <div className="hs-header hs-header--mobile">
        <div className="hs-header__brand">
          <Burger opened={navOpened} onClick={onNavToggle} hiddenFrom="sm" size="sm" aria-label="Menu" />
          <span className="hs-logo">حسابات</span>
        </div>

        <div className="hs-header__tools" style={{ gap: 6 }}>
          {shiftRemainingTime ? (
            <span className="hs-timer">
              <bdi dir="ltr">{shiftRemainingTime}</bdi>
            </span>
          ) : null}

          <SyncButton />

          <Menu shadow="md" width={220} position="bottom-end">
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray" aria-label="More">
                <IconDotsVertical size={20} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>{moment(now).format("DD MMM YYYY, h:mm A")}</Menu.Label>

              <Box px="sm" py={6}>
                <Select
                  data={LANGUAGES}
                  placeholder="Language"
                  value={value}
                  onChange={changeLanguage}
                  size="xs"
                  allowDeselect={false}
                  leftSection={<IconLanguage size={14} />}
                />
              </Box>

              <Menu.Divider />

              {/* was labelled "Notifications" and only showed an alert; now it signs out */}
              <Menu.Item
                color="red"
                leftSection={<IconPower size={16} />}
                onClick={logout}
              >
                Sign out
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </div>
      </div>
    );
  }

  /* ── Desktop ── */
  return (
    <div className="hs-header">
      <div className="hs-header__meta">
        <IconWorld size={18} stroke={1.75} aria-hidden="true" />
        <time dir="ltr" dateTime={new Date(now).toISOString()}>
          {moment(now).format("ddd D MMM · h:mm A")}
        </time>
        {shiftRemainingTime && (
          <span className="hs-chip">
            <IconClock size={14} stroke={2} aria-hidden="true" />
            <bdi dir="ltr">{shiftRemainingTime}</bdi>
          </span>
        )}
      </div>

      <div className="hs-header__tools">
        <SyncButton />
        <Select
          className="hs-lang"
          aria-label="Language"
          data={LANGUAGES}
          placeholder="Language"
          value={value}
          onChange={changeLanguage}
          allowDeselect={false}
          leftSection={<IconWorld size={18} stroke={1.75} />}
        />
      </div>
    </div>
  );
};

export default DashboardHeader;