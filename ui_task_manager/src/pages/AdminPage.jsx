import StatusList from "../components/Dop/Status";
import PriorityList from "../components/Dop/Priority";
import "./Admin.css";

export default function Admin() {
  return (
    <div className="admin-container">
      <h1 className="header-admin">Admin Panel</h1>
      <StatusList />
      <PriorityList />
    </div>
  );
}
