import { NavLink } from "react-router-dom";
import "./SideBar.css";
import {
  FaHome,
  FaTasks,
  FaCalendarAlt,
  FaClipboard,
  FaTags,
  FaUsers,
  // FaChartBar,
  // FaUser,
  // FaBell,
  FaSignOutAlt,
} from "react-icons/fa";
import { useAuth } from "../context/AuthProvider"; // Adjust the import path as needed

const Sidebar = () => {
  const { logout } = useAuth(); // Get the logout function from auth context

  const handleLogout = () => {
    logout(); // Call the logout function
  };

  return (
    <aside className="sidebar-container">
      <h1 className="sidebar-logo">TaskManager</h1>

      <nav className="sidebar-nav">
        <ul className="sidebar-menu-list">
          <li className="sidebar-menu-item">
            <NavLink to="/home" end className="sidebar-menu-link">
              <FaHome className="sidebar-icon" />
              <span>Home</span>
            </NavLink>
          </li>
          <li className="sidebar-menu-item">
            <NavLink to="/tasks" className="sidebar-menu-link">
              <FaTasks className="sidebar-icon" />
              <span>List of tasks</span>
            </NavLink>
          </li>
          <li className="sidebar-menu-item">
            <NavLink to="/calendar" className="sidebar-menu-link">
              <FaCalendarAlt className="sidebar-icon" />
              <span>Calendar</span>
            </NavLink>
          </li>
          <li className="sidebar-menu-item">
            <NavLink to="/board" className="sidebar-menu-link">
              <FaClipboard className="sidebar-icon" />
              <span>Board</span>
            </NavLink>
          </li>
          <li className="sidebar-menu-item">
            <NavLink to="/categories" className="sidebar-menu-link">
              <FaTags className="sidebar-icon" />
              <span>Categories</span>
            </NavLink>
          </li>
          <li className="sidebar-menu-item">
            <NavLink to="/groups" className="sidebar-menu-link">
              <FaUsers className="sidebar-icon" />
              <span>Groups</span>
            </NavLink>
          </li>
          {/* <li className="sidebar-menu-item">
            <NavLink to="/analytics" className="sidebar-menu-link">
              <FaChartBar className="sidebar-icon" />
              <span>Analytics</span>
            </NavLink>
          </li> */}
        </ul>
      </nav>

      <div className="sidebar-bottom-menu">
        <ul className="sidebar-menu-list">
          {/* <li className="sidebar-menu-item">
            <NavLink to="/profile" className="sidebar-menu-link">
              <FaUser className="sidebar-icon" />
              <span>Profile</span>
            </NavLink>
          </li>
          <li className="sidebar-menu-item">
            <NavLink to="/notifications" className="sidebar-menu-link">
              <FaBell className="sidebar-icon" />
              <span>Notifications</span>
            </NavLink>
          </li> */}
          <li className="sidebar-menu-item">
            <button
              onClick={handleLogout}
              className="sidebar-menu-link"
              style={{ background: "none", border: "none", width: "100%" }}
            >
              <FaSignOutAlt className="sidebar-icon" />
              <span>Logout</span>
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
};

export { Sidebar };
