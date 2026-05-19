import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useTranslation } from "react-i18next";
import './App.css';

import PrivateRoute from './pages/ProtectedRoute';
import Login from './pages/Login';
import UnAuthorized from "./pages/Unauthorized";
import Clients from './pages/Clients';
import Vendors from './pages/Vendors';
import SaleInvoices from './pages/SaleInvoices';
import PurchaseInvoices from './pages/PurchaseInvoices';
import Ledger from './pages/Ledger';
import Expenses from './pages/Expenses';
import Products from './pages/Products';
import Cashout from './pages/Cashout';
import Overview from './pages/Overview';
// import Clients from './pages/Clients';

import DashboardLayout from './components/DashboardLayout';

function App() {
  const { t, i18n } = useTranslation();
  
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* <Route index  element={<Login />} /> */}
          <Route element={<PrivateRoute allowedRoles={['owner', 'manager']} />}>
            <Route path="/" element={<DashboardLayout changeLanguage={changeLanguage} value={i18n.language} />}>
              <Route path="clients" element={<Clients />} />
              <Route path="vendors" element={<Vendors />} />
              <Route path="sale-invoices" element={<SaleInvoices />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="products" element={<Products />} />
              <Route path="cashout" element={<Cashout />} />
            </Route>
          </Route>
          <Route element={<PrivateRoute allowedRoles={['owner']} />}>
            <Route path="/" element={<DashboardLayout changeLanguage={changeLanguage} value={i18n.language} />}>
              <Route path="overview" element={<Overview />} />
              <Route path="purchase-invoices" element={<PurchaseInvoices />} />
              <Route path="ledger" element={<Ledger />} />  
            </Route>
          </Route>
          {/* Default Route */}
          <Route path='/login' element={<Login />} />
          <Route path='/unauthorized' element={<UnAuthorized />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App;