import React from "react";
import { useState, useEffect } from "react";
import api from "../api/api";
import "./Home.css";
import { Plus } from "lucide-react";
import GroupList from "../components/Lists/GroupList";
import GroupModal from "../components/Modals/GroupModal";
import CreateGroupModal from "../components/Modals/CreateGroupModal";
// import CreateGroupModal from "../components/Modals/CreateGroupModal";

export default function GroupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // State for handling modal display

  const [updateFlag, setUpdateFlag] = useState(
    localStorage.getItem("update") || null
  );

  // Groups related state
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [addGroup, setAddGroup] = useState(false);

  // Fetch groups from API
  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (token) {
        const response = await api.get("/group");
        setGroups(response.data.groups || []);
        // Clear the update flag after fetching
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

  // Watch for changes to the update flag
  useEffect(() => {
    if (localStorage.getItem("update") === "yes") {
      setUpdateFlag("yes");
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [updateFlag]);

  // Group related handlers
  const handleGroupSelect = (groupId) => {
    setSelectedGroupId(groupId);
  };

  const handleCloseGroupModal = () => {
    setSelectedGroupId(null);
  };

  const handleGroupUpdate = async () => {
    await fetchGroups();
  };

  useEffect(() => {
    if (localStorage.getItem("update") === "yes") {
      setUpdateFlag("yes");
    }
  }, []);

  return (
    <>
      <div className="tasks-container">
        <h1 className="header">Your groups</h1>

        <div className="header-list">
          <h3>Groups</h3>
          <button
            className="action-btn add-subtask-btn"
            onClick={() => setAddGroup(true)}
          >
            <Plus size={16} />
            Create Group
          </button>
        </div>
        <GroupList
          groups={groups}
          isLoading={isLoading}
          error={error}
          onGroupSelect={handleGroupSelect}
          onGroupUpdate={handleGroupUpdate}
          displayLimit={10}
        />

        {/* Group Modals */}
        {selectedGroupId && (
          <GroupModal
            groupId={selectedGroupId}
            onClose={handleCloseGroupModal}
            onGroupUpdate={handleGroupUpdate}
          />
        )}

        {addGroup && (
          <CreateGroupModal
            onClose={() => {
              setAddGroup(false);
            }}
            onGroupCreate={() => {
              setAddGroup(false);
            }}
            onGroupUpdate={handleGroupUpdate}
          />
        )}
      </div>
    </>
  );
}
