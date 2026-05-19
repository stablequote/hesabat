import { createContext, useContext, useState, useEffect } from "react";
import { showNotification } from '@mantine/notifications';
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const BASE_URL = import.meta.env.VITE_URL;
    const navigate = useNavigate();

    // useEffect(() => {
    //     axios.post(`${BASE_URL}/auth/login`)
    //         .then((res) => setUser(res.data))
    //         .catch(() => setUser(null))
    //         .finally(() => setLoading(false));
    // }, []);


    const login = async (credentials) => {
        const url = `${BASE_URL}/auth/login`
        // const credentials = user;
        setLoading(!loading)

        try {
            const res = await axios.post(url, credentials);

            if(res.status === 200) {
                localStorage.setItem("authToken", res.data.token);
                localStorage.setItem("shiftEndTime", res.data.shiftEndTime);
                localStorage.setItem("user", JSON.stringify(res.data.user));
                setLoading(!loading)
                navigate("/sale-invoices"); // Redirect to dashboard after login
            }
        } catch (error) {
            showNotification({
            title: "Login error!",
            message: "Login error, check again",
            color: "red"
            })
        } finally {
            setLoading(false)
        }
    }

    const logout = async () => {
        try {
            // Call the logout endpoint (optional)
            await axios.post(`${BASE_URL}/auth/logout`);
            setUser(null);

            // Clear tokens and user data from localStorage
            localStorage.removeItem("authToken");
            localStorage.removeItem("shiftEndTime")
            localStorage.removeItem("user")
        
            // Redirect the user to the login page
            window.location.href = "/login";
          } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);