import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import "./AuthPages.css";

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [info, setInfo] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setGeneralError("");

    const result = await register({ name, info, phone, password });

    if (result.success) {
      navigate("/");
    } else {
      if (result.fieldErrors) {
        setErrors(result.fieldErrors);
      }
      if (result.message) {
        setGeneralError(result.message);
      }
    }

    setIsLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Register</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              className={errors.name ? "error-input" : ""}
            />
            {errors.name && <div className="field-error">{errors.name}</div>}
          </div>
          <div className="form-group">
            <label>Info</label>
            <input
              type="text"
              value={info}
              onChange={(e) => setInfo(e.target.value)}
              placeholder="Additional info"
              className={errors.info ? "error-input" : ""}
            />
            {errors.info && <div className="field-error">{errors.info}</div>}
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="89001234567"
              required
              className={errors.phone ? "error-input" : ""}
            />
            {errors.phone && <div className="field-error">{errors.phone}</div>}
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className={errors.password ? "error-input" : ""}
            />
            {errors.password && (
              <div className="field-error">{errors.password}</div>
            )}
          </div>

          {/* Общая ошибка отображается перед кнопкой */}
          {generalError && <div className="auth-error">{generalError}</div>}

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Loading..." : "Register"}
          </button>
        </form>
        <p className="auth-footer">
          Already have an account?{" "}
          <span onClick={() => navigate("/login")}>Login</span>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
