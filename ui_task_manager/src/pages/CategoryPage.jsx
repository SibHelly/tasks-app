import React, { useState, useEffect } from "react";
import api from "../api/api";
import "./Home.css";
import { Plus } from "lucide-react";
import CategoryList from "../components/Lists/CategoryList";
import CategoryModal from "../components/Modals/CategoryModal";
import CreateCategoryModal from "../components/Modals/CreateCategoryModal";

export default function CategoryPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updateFlag, setUpdateFlag] = useState(
    localStorage.getItem("update") || null
  );
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [addCategory, setAddCategory] = useState(false);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (token) {
        const response = await api.get("/category");
        setCategories(response.data);
        if (localStorage.getItem("update") === "yes") {
          localStorage.removeItem("update");
          setUpdateFlag(null);
        }
      }
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem("update") === "yes") {
      setUpdateFlag("yes");
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [updateFlag]);

  const handleCategorySelect = (categoryId) => {
    setSelectedCategoryId(categoryId);
  };

  const handleCloseCategoryModal = () => {
    setSelectedCategoryId(null);
  };

  const handleCategoryUpdate = async () => {
    await fetchCategories();
  };

  return (
    <>
      <div className="tasks-container">
        <h1 className="header">Welcome to Category Manager</h1>

        <div className="header-list">
          <h3>Categories</h3>
          <button
            className="action-btn add-subtask-btn"
            onClick={() => setAddCategory(true)}
          >
            <Plus size={16} />
            Create Category
          </button>
        </div>
        <CategoryList
          categories={categories}
          isLoading={isLoading}
          error={error}
          onCategorySelect={handleCategorySelect}
          onCategoryUpdate={handleCategoryUpdate}
        />

        {selectedCategoryId && (
          <CategoryModal
            categoryId={selectedCategoryId}
            onClose={handleCloseCategoryModal}
            onCategoryUpdate={handleCategoryUpdate}
          />
        )}

        {addCategory && (
          <CreateCategoryModal
            onClose={() => {
              setAddCategory(false);
            }}
            onCategoryCreate={() => {
              setAddCategory(false);
            }}
            onCategoryUpdate={handleCategoryUpdate}
          />
        )}
      </div>
    </>
  );
}
