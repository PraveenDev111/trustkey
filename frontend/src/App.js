import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import RegisterUserNoMetaMask from './pages/RegisterUserNoMetaMask';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterUserNoMetaMask />} />
      </Routes>
    </Router>
  );
}

export default App;
