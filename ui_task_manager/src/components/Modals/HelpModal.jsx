import React from "react";
import { X } from "lucide-react";
import "./HelpModal.css";

export default function HelpModal({ items, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="help-modal">
        <div className="modal-header">
          <h2>FAQ Task Manager</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="help-content">
          {items.map((item, index) => (
            <div key={index} className="help-item">
              <h3>{item.title}</h3>
              <p style={{ whiteSpace: "pre-line" }}>{item.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
