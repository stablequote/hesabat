import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  IconLayoutGrid,
  IconUsers,
  IconBuildingStore,
  IconFileExport,
  IconShoppingBag,
  IconBook2,
  IconWallet,
  IconCash,
  IconBox,
  IconPower,
} from "@tabler/icons-react";
import { useAuth } from "../context/AuthContext";
import "../assets/css/Navbar.css";



const readRole = () => {
  try {
    return JSON.parse(localStorage.getItem("user"))?.role;
  } catch {
    return undefined;
  }
};

const AppNavbar = ({ onNavigate }) => {
  const { logout } = useAuth();
  const { t } = useTranslation();
  const role = readRole();

  // Same routes, translation keys and role rules as before, now in one list.
  // `label` is [translation key, English fallback]; groups without a label have no heading.
  const NAV = [
    {
      items: [
        { to: "/overview", key: "OVERVIEW", icon: IconLayoutGrid, ownerOnly: true },
        { to: "/clients", key: "CLIENTS", icon: IconUsers },
        { to: "/vendors", key: "VENDORS", icon: IconBuildingStore },
      ],
    },
    {
      label: ["NAV-INVOICES", t("Invoices")],
      items: [
        { to: "/sale-invoices", key: "SALE-INVOICES", icon: IconFileExport },
        { to: "/purchase-invoices", key: "PURCHASE-INVOICES", icon: IconShoppingBag, ownerOnly: true },
      ],
    },
    {
      label: ["NAV-FINANCE", t("Finance")],
      items: [
        { to: "/ledger", key: "LEDGER", icon: IconBook2, ownerOnly: true },
        { to: "/expenses", key: "EXPENSES", icon: IconWallet },
        { to: "/cashout", key: "CASHOUT", icon: IconCash },
      ],
    },
    {
      label: ["NAV-INVENTORY", t("Inventory")],
      items: [{ to: "/products", key: "PRODUCTS", icon: IconBox }],
    },
  ];

  const groups = NAV.map((g) => ({
    ...g,
    items: g.items.filter((i) => !i.ownerOnly || role === "owner"),
  })).filter((g) => g.items.length > 0);

  return (
    <nav className="hs-nav" aria-label="Main">
      <div className="hs-nav__logo">حسابات</div>

      <div className="hs-nav__list">
        {groups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <div className="hs-nav__label">
                {t(group.label[0], { defaultValue: group.label[1] })}
              </div>
            )}
            {group.items.map(({ to, key, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onNavigate}
                className={({ isActive }) => `hs-nav__item${isActive ? " is-active" : ""}`}
              >
                <Icon className="hs-nav__icon" size={19} stroke={1.75} aria-hidden="true" />
                <span>{t(key)}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      <button
        type="button"
        className="hs-nav__item hs-nav__signout"
        onClick={() => {
          onNavigate?.();
          logout();
        }}
      >
        <IconPower className="hs-nav__icon" size={19} stroke={1.75} aria-hidden="true" />
        <span>{t("LOGOUT", { defaultValue: "Sign out" })}</span>
      </button>
    </nav>
  );
};

export default AppNavbar;