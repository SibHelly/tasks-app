import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import api from "../../api/api";
import { Info, Trash2, ChevronDown } from "lucide-react";
import "./TaskList.css";

const CategoryList = ({
  categories,
  isLoading = false,
  error = null,
  onCategorySelect,
  onCategoryUpdate,
  displayLimit = null,
  groupId = 0,
  canEdit = false,
}) => {
  const [showAll, setShowAll] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState("member");

  useEffect(() => {
    if (groupId !== 0) {
      fetchCurrentUserRole();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const fetchCurrentUserRole = async () => {
    try {
      const response = await api.get(`/group/${groupId}/role`);
      setCurrentUserRole(response.data.role);
    } catch (err) {
      console.error("Error fetching current user role:", err);
      setCurrentUserRole("member");
    }
  };

  const handleCategoryInfo = (categoryId) => {
    if (onCategorySelect) {
      onCategorySelect(categoryId);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (currentUserRole === "member") {
      alert("You don't have permission to delete categories");
      return;
    }

    try {
      await api.delete(`/category/${categoryId}`);
      localStorage.setItem("update", "yes");
      if (onCategoryUpdate) {
        await onCategoryUpdate();
      }
    } catch (err) {
      console.error("Error deleting category:", err);
      alert("Error deleting category");
    }
  };

  const toggleShowAll = () => {
    setShowAll(!showAll);
  };

  const displayedCategories =
    displayLimit && !showAll ? categories.slice(0, displayLimit) : categories;

  if (isLoading) return <div className="loading">Loading categories...</div>;
  if (error)
    return (
      <div className="error">
        Error: {error.message || "Failed to load categories"}
      </div>
    );
  if (categories.length === 0)
    return <div className="empty">No categories found</div>;

  return (
    <div className="cat-list">
      {displayedCategories.map((category) => (
        <React.Fragment key={category.category_id}>
          <div className="task-item">
            <div className="task-content-1">
              <div className="task-name-1">
                <div className="hash">#</div>
                <span>{category.category_name}</span>
                <div
                  className="colorBox"
                  style={{ backgroundColor: category.color }}
                ></div>
              </div>
              <div className="task-actions">
                <button
                  className="info-button"
                  onClick={() => handleCategoryInfo(category.category_id)}
                >
                  <Info size={18} />
                  <span>INFO</span>
                </button>
                {(currentUserRole === "owner" ||
                  currentUserRole === "editor" ||
                  groupId === 0) && (
                  <button
                    className="delete-button-cat"
                    onClick={() => handleDeleteCategory(category.category_id)}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </React.Fragment>
      ))}

      {displayLimit && categories.length > displayLimit && (
        <div className="show-all-container">
          <button className="show-all-button" onClick={toggleShowAll}>
            <ChevronDown size={16} />
            {showAll ? "Show less" : `Show all (${categories.length})`}
          </button>
        </div>
      )}
    </div>
  );
};

CategoryList.propTypes = {
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      category_id: PropTypes.number.isRequired,
      category_name: PropTypes.string.isRequired,
      description: PropTypes.string,
      color: PropTypes.string,
    })
  ).isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.object,
  onCategorySelect: PropTypes.func,
  onCategoryUpdate: PropTypes.func,
  displayLimit: PropTypes.number,
  groupId: PropTypes.number,
  canEdit: PropTypes.bool,
};

export default CategoryList;
