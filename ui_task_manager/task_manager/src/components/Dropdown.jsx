import { useRef, useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import "./Dropdown.css";

const DropdownMenu = ({ items, onClose, triggerRef }) => {
  const menuRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [visible, setVisible] = useState(false);

  const calculatePosition = useCallback(() => {
    if (!triggerRef?.current || !menuRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();

    let top = triggerRect.bottom;
    let left = triggerRect.left;

    // Вертикальная корректировка
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    if (spaceBelow < menuRect.height && spaceAbove > menuRect.height) {
      top = triggerRect.top - menuRect.height;
    } else if (spaceBelow < menuRect.height) {
      top = window.innerHeight - menuRect.height - 5;
    }

    // Горизонтальная корректировка
    if (left + menuRect.width > window.innerWidth) {
      left = window.innerWidth - menuRect.width - 10;
    } else if (left < 0) {
      left = 10;
    }

    setPosition({
      top: top,
      left: left,
    });
  }, [triggerRef]);

  useEffect(() => {
    if (triggerRef?.current) {
      setVisible(true);
      setTimeout(calculatePosition, 10);
    }
  }, [triggerRef, calculatePosition]);

  useEffect(() => {
    if (!visible) return;

    const handleScroll = () => {
      calculatePosition();
      onClose();
    };

    const handleResize = () => calculatePosition();

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [visible, calculatePosition, onClose]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose, triggerRef]);

  return createPortal(
    <div
      ref={menuRef}
      className={`dropdown-menu-container ${visible ? "visible" : ""}`}
      style={{ top: position.top, left: position.left }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, index) => (
        <button
          key={index}
          className="dropdown-menu-item"
          onClick={(e) => {
            e.stopPropagation();
            item.onClick();
            onClose();
          }}
        >
          {item.label}
        </button>
      ))}
    </div>,
    document.body
  );
};

export default DropdownMenu;
