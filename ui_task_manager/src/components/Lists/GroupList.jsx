import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { Info, MoreVertical, Users } from "lucide-react";
import DropdownMenu from "../Dropdown";
import "./GroupList.css";
import api from "../../api/api";

const GroupList = ({
  groups,
  isLoading = false,
  error = null,
  onGroupSelect,
  onGroupUpdate,
  displayLimit = 3,
}) => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [groupData, setGroupData] = useState({});
  const moreButtonsRef = useRef({});

  // Show all or limited number of groups
  const displayedGroups = displayLimit ? groups.slice(0, displayLimit) : groups;

  // Fetch users count and tasks count for each group
  useEffect(() => {
    const fetchGroupData = async () => {
      const newGroupData = {};

      for (const group of displayedGroups) {
        try {
          const token = localStorage.getItem("token");
          if (!token) continue;

          // Fetch user count
          const userResponse = await api.get(`/group/${group.group_id}/users`);

          // Fetch task count
          const taskResponse = await api.get(`/tasks/group/${group.group_id}`);

          newGroupData[group.group_id] = {
            memberCount: userResponse.data?.users?.length || 0,
            taskCount: taskResponse.data?.tasks?.filter(
              (t) => t.parent_task_id === 0
            ).length,
          };
        } catch (err) {
          console.error(
            `Error fetching data for group ${group.group_id}:`,
            err
          );
          newGroupData[group.group_id] = { memberCount: 0, taskCount: 0 };
        }
      }

      setGroupData(newGroupData);
    };

    if (displayedGroups.length > 0) {
      fetchGroupData();
    }
  }, [displayedGroups]);

  const handleGroupInfo = (groupId) => {
    if (onGroupSelect) {
      onGroupSelect(groupId);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      // Send request to delete group
      const token = localStorage.getItem("token");
      if (token) {
        await api.delete(`/group/${groupId}`);

        // Set flag in localStorage
        localStorage.setItem("update", "yes");

        // Call the parent component's update function if provided
        if (onGroupUpdate) {
          await onGroupUpdate();
        }
      }
    } catch (err) {
      console.error("Error deleting group:", err);
      alert("Error deleting group");
    } finally {
      // Close dropdown after action
      setActiveDropdown(null);
    }
  };

  const toggleDropdown = (groupId) => {
    setActiveDropdown(activeDropdown === groupId ? null : groupId);
  };

  const getGroupActions = (group) => {
    return [
      {
        label: "View Details",
        onClick: () => handleGroupInfo(group.group_id),
      },
      {
        label: "Delete",
        onClick: () => handleDeleteGroup(group.group_id),
      },
    ];
  };

  if (isLoading) return <div className="loading">Loading groups...</div>;
  if (error)
    return (
      <div className="error">
        Error: {error.message || "Failed to load groups"}
      </div>
    );
  if (groups.length === 0) return <div className="empty">No groups found</div>;

  return (
    <div className="group-list">
      {displayedGroups.map((group) => (
        <React.Fragment key={group.group_id}>
          <div className="group-item">
            <div className="group-content">
              <div className="group-name">
                <Users></Users>
                <span>{group.group_name}</span>
              </div>
              <div className="group-members">
                {groupData[group.group_id]?.memberCount || 0} members
              </div>
              <div className="group-tasks">
                {groupData[group.group_id]?.taskCount || 0} tasks
              </div>
              <div className="group-actions">
                <button
                  className="info-button"
                  onClick={() => handleGroupInfo(group.group_id)}
                >
                  <Info size={18} />
                  <span>INFO</span>
                </button>
                <button
                  className="more-button"
                  ref={(el) => (moreButtonsRef.current[group.group_id] = el)}
                  onClick={() => toggleDropdown(group.group_id)}
                >
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>
          </div>

          {activeDropdown === group.group_id && (
            <DropdownMenu
              items={getGroupActions(group)}
              onClose={() => setActiveDropdown(null)}
              triggerRef={{ current: moreButtonsRef.current[group.group_id] }}
            />
          )}
        </React.Fragment>
      ))}

      {groups.length > displayLimit && (
        <div className="view-all-groups">
          <button
            className="view-all-button"
            onClick={() => onGroupSelect("all")}
          >
            View all groups ({groups.length})
          </button>
        </div>
      )}
    </div>
  );
};

GroupList.propTypes = {
  groups: PropTypes.arrayOf(
    PropTypes.shape({
      group_id: PropTypes.number.isRequired,
      group_name: PropTypes.string.isRequired,
      description: PropTypes.string,
      member_count: PropTypes.number,
      task_count: PropTypes.number,
    })
  ).isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.object,
  onGroupSelect: PropTypes.func,
  onGroupUpdate: PropTypes.func,
  displayLimit: PropTypes.number,
};

export default GroupList;
