import { useEffect, useState } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { Outlet } from 'react-router-dom';
import { AppShell, Flex, Button, Group, Stack, Box, Text, Drawer, Burger } from '@mantine/core';
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
      styles={(theme) => ({
        main: { backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0] },
      })}
    >
        <AppShell.Header>
            <DashboardHeader changeLanguage={changeLanguage} value={value} shiftRemainingTime={remaining} />
        </AppShell.Header>

        <AppShell.Navbar>
            <AppNavbar />
        </AppShell.Navbar>

        <AppShell.Footer>
            <Box height={60} p="xs">
               <Text align="center">© 2026 codelab SD.</Text>
          </Box>
        </AppShell.Footer>
        
        <Outlet />

    </AppShell>
  );
}

export default DashboardLayout;