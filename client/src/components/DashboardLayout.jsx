import { useEffect, useState } from 'react';
import { AppShell, Box, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet } from 'react-router-dom';
import AppNavbar from './Navbar';
import DashboardHeader from './DashboardHeader';

function DashboardLayout({ changeLanguage, value }) {
  const [opened, { toggle, close }] = useDisclosure(false);
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.role !== "staff") return;

    const interval = setInterval(() => {
      const end = new Date(localStorage.getItem("shiftEndTime"));
      const now = new Date();
      const diff = end - now;

      if (diff <= 0) {
        clearInterval(interval);
        alert("Your shift has ended. Logging you out!");
        handleLogout();
      } else {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setRemaining(`${h}h ${m}m ${s}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <AppShell
      padding="md"
      header={{ height: 60 }}
      navbar={{
        width: 250,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
    >
      <AppShell.Header>
        <DashboardHeader
          changeLanguage={changeLanguage}
          value={value}
          shiftRemainingTime={remaining}
          navOpened={opened}
          onNavToggle={toggle}
        />
      </AppShell.Header>

      <AppShell.Navbar bg="#0e356d">
        {/* Close drawer when a nav link is clicked on mobile */}
        <AppNavbar onNavigate={close} />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

export default DashboardLayout;
