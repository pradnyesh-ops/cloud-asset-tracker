import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartLine,
  faClipboardList,
  faMoon,
  faSun,
  faRightFromBracket,
  faUser,
  faLock,
  faUserPlus,
  faCloud,
} from "@fortawesome/free-solid-svg-icons";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="container navbar-content">
        <Link to="/dashboard" className="brand">
          <FontAwesomeIcon icon={faCloud} /> Cloud Asset Tracker V1
        </Link>
        <nav className="nav-links">
          {user ? (
            <>
              <Link to="/dashboard">
                <FontAwesomeIcon icon={faChartLine} /> Dashboard
              </Link>
              <Link to="/reports">
                <FontAwesomeIcon icon={faClipboardList} /> Reports
              </Link>
              <Link to="/profile">
                <FontAwesomeIcon icon={faUser} /> Profile
              </Link>
              <button className="link-button" onClick={toggleTheme}>
                <FontAwesomeIcon icon={theme === "dark" ? faSun : faMoon} />
                {theme === "dark" ? " Light" : " Dark"} mode
              </button>
              <button className="link-button" onClick={handleLogout}>
                <FontAwesomeIcon icon={faRightFromBracket} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">
                <FontAwesomeIcon icon={faLock} /> Login
              </Link>
              <Link to="/register">
                <FontAwesomeIcon icon={faUserPlus} /> Register
              </Link>
              <button className="link-button" onClick={toggleTheme}>
                <FontAwesomeIcon icon={theme === "dark" ? faSun : faMoon} />
                {theme === "dark" ? " Light" : " Dark"} mode
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
