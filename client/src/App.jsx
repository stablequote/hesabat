import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useTranslation } from "react-i18next";
import './App.css';

function App() {
  const { t, i18n } = useTranslation();
  
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <AuthProvider>
      <Router>
        <Routes>
            {/* <Route index  element={<Login />} /> */}
            <Route element={<PrivateRoute allowedRoles={['owner', 'manager', 'staff']} />}>
              <Route path="/" element={<DashboardLayout changeLanguage={changeLanguage} value={i18n.language} />}>
                <Route path="home" element={<Home />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="pos" element={<PosPage />} />
                <Route path="verify" element={<VerifiyTransaction />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="orders" element={<Orders />} />
                <Route path="suppliers" element={<SuppliersList />} />
                <Route path="/supplier/orders" element={<Suppliers />} />
                <Route path="sales" element={<ProductSales />} />
                <Route path="expenses" element={<Expenses />} />
                <Route path="cashout" element={<Cashout />} />
                <Route path="ledger" element={<Ledger />} />
              </Route>
            </Route>
          {/* Default Route */}
          <Route path='/login' element={<Login />} />
          <Route path='/unauthorized' element={<UnAuthorized />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App;