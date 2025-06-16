import './App.css';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from 'react';
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import RegisterUserMetaMask from './pages/RegisterUserMetaMask';
import UserList from './pages/userlist';

// A wrapper component that will check for authentication
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const location = useLocation();

  useEffect(() => {
    // Check if user is authenticated (has a valid token)
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, [location]);

  // Show loading state while checking auth status
  if (isAuthenticated === null) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem'
      }}>
        Loading...
      </div>
    );
  }

  // Redirect to home if not authenticated, otherwise render the protected component
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route path="/register" element={<RegisterUserMetaMask />} />
        <Route path="/users" element={<UserList />} />
      </Routes>
    </Router>
  );
}

export default App;
