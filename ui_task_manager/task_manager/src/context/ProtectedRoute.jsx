import { useAuth } from "./AuthProvider";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const { token, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !token) {
      navigate("/login");
    }
  }, [token, isLoading, navigate]);

  if (isLoading) return <div>Loading...</div>;
  if (!token) return null;

  return children;
};

export default ProtectedRoute;
