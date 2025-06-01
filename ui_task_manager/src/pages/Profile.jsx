import { useState, useEffect } from "react";
import api from "../api/api";
import "./Home.css"; // Импорт стилей из Home.css
import { useAuth } from "../context/AuthProvider";

export const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  //   const [showModal, setShowModal] = useState(false);
  const token = localStorage.getItem("token");

  const { logout } = useAuth();

  const handleLogout = () => {
    logout(); // Call the logout function
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (token) {
          const { data } = await api.get("/auth/check");
          setUser(data.user);
        }
      } catch (error) {
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (isLoading) {
    return (
      <div className="board">
        <div className="header">
          <h3>Загрузка профиля...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="board">
      <div className="header-container">
        <div className="header">
          <h3>Your profile</h3>
        </div>
      </div>

      <div className="header-list">
        <div style={{ width: "100%" }}>
          <div className="profile-header">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="profile-avatar"
              />
            ) : (
              <div className="profile-avatar-placeholder">
                {user.name.charAt(0)}
              </div>
            )}
            <div className="profile-info">
              <h2 className="profile-name">{user.name}</h2>
              <p className="profile-email">{user.phone}</p>
            </div>
          </div>
          <div>
            <h2>Description</h2>
          </div>
          <div>{user.info}</div>

          <div className="profile-actions">
            <button onClick={handleLogout} className="action-btn logout-btn">
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
