import React, { useState, useRef } from "react";
import PropTypes from "prop-types";
import api from "../../api/api";
import { X, Plus, UserPlus, Trash2 } from "lucide-react";
import "./CreateGroupModal.css";

const CreateGroupModal = ({ onClose, onGroupCreate, onGroupUpdate }) => {
  const [groupName, setGroupName] = useState("");
  const [info, setInfo] = useState("");
  const [members, setMembers] = useState([]);
  const [membersID, setMembersID] = useState([]);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("member");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [userCheckError, setUserCheckError] = useState(null);
  const [isCheckingUser, setIsCheckingUser] = useState(false);

  // Ref for the modal content
  const modalRef = useRef(null);

  // Handle click outside of modal
  const handleClickOutside = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      onClose();
    }
  };

  // Handle Escape key press
  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      onClose();
    }
  };

  // Add and remove event listeners
  React.useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup function
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  const checkUserExists = async (username) => {
    try {
      setIsCheckingUser(true);
      setUserCheckError(null);

      const response = await api.post("/check/user", {
        user_name: username,
      });

      return response.data.user;
    } catch (err) {
      console.error("Error checking user:", err);
      return false;
    } finally {
      setIsCheckingUser(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();

    if (!newMemberName.trim()) {
      return;
    }

    // Check if member already exists in the list
    const memberExists = members.some(
      (member) => member.username.toLowerCase() === newMemberName.toLowerCase()
    );

    if (memberExists) {
      setUserCheckError("This member has already been added");
      return;
    }

    // Check if user exists in the system
    const userExists = await checkUserExists(newMemberName.trim());
    console.log(userExists);
    if (!userExists) {
      setUserCheckError("User does not exist");
      return;
    }

    // Add new member
    setMembers([
      ...members,
      {
        username: newMemberName.trim(),
        role: newMemberRole,
      },
    ]);

    setMembersID([
      ...membersID,
      {
        member_id: userExists,
        role: newMemberRole,
      },
    ]);

    // Reset form
    setNewMemberName("");
    setNewMemberRole("member");
    setUserCheckError(null);
  };

  const handleRemoveMember = (index) => {
    const updatedMembers = [...members];
    updatedMembers.splice(index, 1);
    setMembers(updatedMembers);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!groupName.trim()) {
      setError("Group name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      console.log(membersID);
      const token = localStorage.getItem("token");
      if (token) {
        // Send request to create group
        await api.post("/group", {
          group_name: groupName,
          info: info || "",
          members: membersID,
        });

        // Set flag in localStorage
        localStorage.setItem("update", "yes");

        // Call parent component's update function if provided
        if (onGroupUpdate) {
          await onGroupUpdate();
        }

        // Close modal and call the onGroupCreate callback
        if (onGroupCreate) {
          onGroupCreate();
        }
      }
    } catch (err) {
      console.error("Error creating group:", err);
      setError(err.response?.data?.message || "Failed to create group");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay modal-overlay-blur">
      <div className="create-group-modal" ref={modalRef}>
        <div className="modal-header">
          <h2>Create New Group</h2>
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-group-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="group-name">Group Name *</label>
            <input
              type="text"
              id="group-name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              className={`task-name-input ${
                error === "Group name is required" ? "error-input" : ""
              }`}
            />
          </div>

          <div className="form-group">
            <label htmlFor="info">Group Information</label>
            <textarea
              id="info"
              value={info}
              onChange={(e) => setInfo(e.target.value)}
              placeholder="Enter group information"
              rows={4}
              className="edit-textarea-mod"
            />
          </div>

          <div className="form-section">
            <h3>Add Members</h3>

            <div className="add-member-form">
              {userCheckError && (
                <div className="error-message" style={{ marginBottom: "10px" }}>
                  {userCheckError}
                </div>
              )}

              <div className="form-row">
                <div className="form-group member-name-input">
                  <input
                    type="text"
                    value={newMemberName}
                    onChange={(e) => {
                      setNewMemberName(e.target.value);
                      setUserCheckError(null);
                    }}
                    placeholder="Enter member username"
                    className="task-name-input"
                  />
                </div>

                <div className="form-group member-role-select">
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                  >
                    <option value="member">Member</option>
                    <option value="editor">Editor</option>
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddMember}
                className="add-member-button"
                disabled={!newMemberName.trim() || isCheckingUser}
              >
                <UserPlus size={16} />
                {isCheckingUser ? "Checking..." : "Add"}
              </button>
            </div>

            {members.length > 0 && (
              <>
                <h4>Members ({members.length})</h4>{" "}
                <div className="members-list">
                  {members.map((member, index) => (
                    <div key={index} className="member-item">
                      <div className="member-info">
                        <span className="member-username">
                          {member.username}
                        </span>
                        <span className={`member-role ${member.role}`}>
                          {member.role}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="remove-member-button"
                        onClick={() => handleRemoveMember(index)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-button"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                "Creating..."
              ) : (
                <>
                  <Plus size={16} />
                  Create Group
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

CreateGroupModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onGroupCreate: PropTypes.func,
  onGroupUpdate: PropTypes.func,
};

export default CreateGroupModal;
