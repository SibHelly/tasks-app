import { Outlet } from "react-router-dom";
import { Sidebar } from "./SideBar";
import "./Layout.css";

const Layout = () => {
  return (
    <div className="layout-container">
      <div className="sidebar-wrapper">
        <Sidebar />
      </div>
      <div className="content-wrapper">
        <Outlet />
      </div>
    </div>
  );
};

export { Layout };
