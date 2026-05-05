import { Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const PrivateRoute = ({ allowedRoles }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem("authToken");
  const user = token ? JSON.parse(atob(token.split(".")[1])) : null;

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
    } else if (allowedRoles && !allowedRoles.includes(user?.role)) {
      navigate("/unauthorized", { replace: true });
    }
  }, [token, user, allowedRoles, navigate]);

  if (!token || (allowedRoles && !allowedRoles.includes(user?.role))) {
    return null; // or a loading spinner while redirect happens
  }

  return <Outlet />;
};

export default PrivateRoute;