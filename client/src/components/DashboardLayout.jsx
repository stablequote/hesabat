import { useEffect, useState } from 'react';
import { AppShell, Flex, Button, Group, Stack, Box, Text, Drawer, Burger } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet } from 'react-router-dom';
import AppNavbar from './Navbar';
import DashboardHeader from './DashboardHeader';

function DashboardLayout({ changeLanguage, value }) {
  const [opened, { open, close }] = useDisclosure(false);
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"))
    if (user?.role !== "staff") return; // Skip for managers and owners

    const interval = setInterval(() => {
      const end = new Date(localStorage.getItem("shiftEndTime"));
      const now = new Date();
      const diff = end - now;

      if(diff <= 0) {
        clearInterval(interval);
        alert("Your shift has ended. Logging you out!")
        handleLogout();
      } else {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000)
        setRemaining(`${h}h ${m}m ${s}s`)
      }
      return () => clearInterval(interval);
    }, 1000);
  }, [])

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login"
  }

  return (
    <AppShell
      padding="md"
      header={{ height: 60 }}
      navbar={{ width: 250, breakpoint: 'sm' }}
      footer={{ height: 60 }}
    >
      <AppShell.Header>
        <DashboardHeader
          changeLanguage={changeLanguage}
          value={value}
          shiftRemainingTime={remaining}
        />
      </AppShell.Header>

      <AppShell.Navbar bg="#0e356d">
        <AppNavbar />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>

      {/* <AppShell.Footer bg="#cec8c8">
        <Box h={60} p="xs">
          <Text ta="center">© 2026 codelab SD.</Text>
        </Box>
      </AppShell.Footer> */}
    </AppShell>
  );
}

export default DashboardLayout;