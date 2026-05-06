import { Button, Container, Divider, Stack } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconHome } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext'

const AppNavbar = () => {

  const activeStyle = {
    backgroundColor: '#009099', // Light background for the active link
    fontWeight: 'bold',        // Highlight the text
    borderRadius: '4px',       // Rounded edges for better UI
  };

  const isMobile = useMediaQuery('(max-width: 375px)');

  const { logout } = useAuth()
  const { t } = useTranslation()

  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;

  return (
    <Stack width={!isMobile ? { base: 250 } : 100} p="xs" sx={{ background: '#1D242E' }}>
      <NavLink to="/overview" style={({ isActive }) => (isActive ? activeStyle : undefined)}>
        {t("OVERVIEW")}
      </NavLink>

      <NavLink to="/clients" style={({ isActive }) => (isActive ? activeStyle : undefined)}>
        {t("CLIENTS")}
      </NavLink>

      <NavLink to="/vendors" style={({ isActive }) => (isActive ? activeStyle : undefined)}>
        {t("VENDORS")}
      </NavLink>

      <NavLink to="/sale-invoices" style={({ isActive }) => (isActive ? activeStyle : undefined)}>
        {t("SALE-INVOICES")}
      </NavLink>
      
      <NavLink to="/purchase-invoices" style={({ isActive }) => (isActive ? activeStyle : undefined)}>
        {t("PURCHASE-INVOICES")}
      </NavLink>

      <NavLink to="/ledger" style={({ isActive }) => (isActive ? activeStyle : undefined)}>
        {t("LEDGER")}
      </NavLink>

      <NavLink to="/expenses" style={({ isActive }) => (isActive ? activeStyle : undefined)}>
        {t("EXPENSES")}
      </NavLink>

      <NavLink to="/products" style={({ isActive }) => (isActive ? activeStyle : undefined)}>
        {t("PRODUCTS")}
      </NavLink>

      <NavLink to="/cashout" style={({ isActive }) => (isActive ? activeStyle : undefined)}>
        {t("CASHOUT")}
      </NavLink>

      <Divider size={1} my={10} />

      {(role === "owner" || role === "manager") && (
        <NavLink to="/orders" style={({ isActive }) => (isActive ? activeStyle : undefined)}>
          {t("ORDERS")}
        </NavLink>
      )}

      <NavLink to="/sales" style={({ isActive }) => (isActive ? activeStyle : undefined)}>
        {t("SALES")}
      </NavLink>

      <Divider size={1} my={10} />

      <Button
        color="red"
        mt="lg"
        onClick={logout}
        sx={{ position: "absolute", bottom: 22, left: 10, width: "90%" }}
      >
        {t("LOGOUT")}
      </Button>
    </Stack>
  );
};

export default AppNavbar;