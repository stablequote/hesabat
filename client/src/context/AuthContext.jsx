import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const BASE_URL = import.meta.env.VITE_URL;

    // useEffect(() => {
    //     axios.post(`${BASE_URL}/auth/login`)
    //         .then((res) => setUser(res.data))
    //         .catch(() => setUser(null))
    //         .finally(() => setLoading(false));
    // }, []);

    const login = async (credentials) => {
        const res = await axios.post(`${BASE_URL}/auth/login`, credentials);
        setUser(res.data.user);
        return res.data.authToken;
    };

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