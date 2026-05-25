import { Box, Button, Divider, Stack } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
 
const AppNavbar = ({ onNavigate }) => {
 
  const activeStyle = {
    backgroundColor: '#009099',
    fontWeight: 'bold',
    borderRadius: '4px',
  };
 
  const isMobile = useMediaQuery('(max-width: 375px)');
  const { logout } = useAuth();
  const { t } = useTranslation();
 
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;
 
  const linkProps = (isActive) => ({
    style: isActive ? activeStyle : undefined,
    onClick: onNavigate,
  });
 
  return (
    <Stack width={!isMobile ? { base: 250 } : 100} p="xs" style={{ background: '#0e356d' }}>
 
      {role === "owner" && (
        <NavLink to="/overview" {...({ style: ({ isActive }) => isActive ? activeStyle : undefined, onClick: onNavigate })}>
          {t("OVERVIEW")}
        </NavLink>
      )}
 
      <NavLink to="/clients" style={({ isActive }) => isActive ? activeStyle : undefined} onClick={onNavigate}>
        {t("CLIENTS")}
      </NavLink>
 
      <NavLink to="/vendors" style={({ isActive }) => isActive ? activeStyle : undefined} onClick={onNavigate}>
        {t("VENDORS")}
      </NavLink>
 
      <Divider size={1} my={10} />
 
      <NavLink to="/sale-invoices" style={({ isActive }) => isActive ? activeStyle : undefined} onClick={onNavigate}>
        {t("SALE-INVOICES")}
      </NavLink>
 
      {role === "owner" && (
        <NavLink to="/purchase-invoices" style={({ isActive }) => isActive ? activeStyle : undefined} onClick={onNavigate}>
          {t("PURCHASE-INVOICES")}
        </NavLink>
      )}
 
      <Divider size={1} my={10} />
 
      {role === "owner" && (
        <NavLink to="/ledger" style={({ isActive }) => isActive ? activeStyle : undefined} onClick={onNavigate}>
          {t("LEDGER")}
        </NavLink>
      )}
 
      <NavLink to="/expenses" style={({ isActive }) => isActive ? activeStyle : undefined} onClick={onNavigate}>
        {t("EXPENSES")}
      </NavLink>
 
      <NavLink to="/cashout" style={({ isActive }) => isActive ? activeStyle : undefined} onClick={onNavigate}>
        {t("CASHOUT")}
      </NavLink>
 
      <Divider size={1} my={10} />
 
      <NavLink to="/products" style={({ isActive }) => isActive ? activeStyle : undefined} onClick={onNavigate}>
        {t("PRODUCTS")}
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