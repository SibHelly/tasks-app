import React from "react";
import { useState, useEffect } from "react";
import api from "../api/api";
import "./Analytics.css";
import { Filter, Download, FileText, FileSpreadsheet } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import TaskFilter from "../components/Dop/TaskFilter";
// import TaskList from "../components/TaskList";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

export default function AnalyticsPage() {
  const [tasks, setTasks] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilterCriteria, setActiveFilterCriteria] = useState(null);

  // Analytics data
  const [statusData, setStatusData] = useState([]);
  const [priorityData, setPriorityData] = useState([]);
  const [statistics, setStatistics] = useState({
    total: 0,
    completed: 0,
    overdue: 0,
    inProgress: 0,
  });
  const [overdueTasksData, setOverdueTasksData] = useState([]);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (token) {
        const response = await api.get("/tasks");
        const allTasks = response.data.tasks;
        setTasks(allTasks);

        if (activeFilterCriteria) {
          applyFilterCriteria(allTasks, activeFilterCriteria);
        } else {
          setFilteredTasks(allTasks);
        }
      }
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPriorities = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const response = await api.get("/priority");
        setPriorities(response.data);
      }
    } catch (err) {
      console.error("Error fetching priorities:", err);
    }
  };

  const fetchStatuses = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const response = await api.get("/statuses");
        setStatuses(response.data);
      }
    } catch (err) {
      console.error("Error fetching statuses:", err);
    }
  };

  const applyFilterCriteria = (tasksToFilter, criteria) => {
    let filtered = [...tasksToFilter];

    if (criteria.selectedParentTask) {
      filtered = filtered.filter(
        (task) => task.parent_task_id === criteria.selectedParentTask.task_id
      );
    }

    if (criteria.showOnlyPersonal) {
      filtered = filtered.filter((task) => task.group_id === 0);
    }

    if (criteria.showOnlyTimeless) {
      filtered = filtered.filter(
        (task) =>
          task.start_time === "0001-01-01T00:00:00Z" &&
          task.end_time === "0001-01-01T00:00:00Z"
      );
    }

    if (criteria.selectedCategories.length > 0) {
      filtered = filtered.filter((task) =>
        criteria.selectedCategories.includes(task.category_id)
      );
    }

    if (criteria.selectedGroups.length > 0) {
      filtered = filtered.filter((task) =>
        criteria.selectedGroups.includes(task.group_id)
      );
    }

    if (criteria.selectedPriorities.length > 0) {
      filtered = filtered.filter((task) =>
        criteria.selectedPriorities.includes(task.priority_id)
      );
    }

    if (criteria.dateRange.start && criteria.dateRange.end) {
      const startDate = new Date(criteria.dateRange.start);
      const endDate = new Date(criteria.dateRange.end);

      filtered = filtered.filter((task) => {
        if (
          task.start_time !== "0001-01-01T00:00:00Z" &&
          task.end_time !== "0001-01-01T00:00:00Z"
        ) {
          const taskStartDate = new Date(task.start_time);
          const taskEndDate = new Date(task.end_time);

          return (
            (taskStartDate >= startDate && taskStartDate <= endDate) ||
            (taskEndDate >= startDate && taskEndDate <= endDate) ||
            (taskStartDate <= startDate && taskEndDate >= endDate)
          );
        }
        return true;
      });
    }

    setFilteredTasks(filtered);
  };

  // Calculate analytics data
  const calculateAnalytics = (tasks) => {
    // Status data for pie chart
    const statusCounts = {};
    const priorityCounts = {};
    let completed = 0;
    let overdue = 0;
    let inProgress = 0;
    const currentDate = new Date();
    const overdueTasksList = [];

    tasks.forEach((task) => {
      // Count by status
      const status = getTaskStatus(task);
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      // Count by priority
      const priority = getPriorityName(task.priority_id);
      priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;

      // Count statistics
      const taskStatus = getTaskStatusFromServer(task.status_id);
      if (taskStatus === "Done") {
        completed++;
      } else if (
        task.end_time !== "0001-01-01T00:00:00Z" &&
        new Date(task.end_time) < currentDate
      ) {
        overdue++;
        overdueTasksList.push({
          title: task.task_name,
          description: task.description,
          priority: priority,
          dueDate: task.end_time,
          daysOverdue: Math.ceil(
            (currentDate - new Date(task.end_time)) / (1000 * 60 * 60 * 24)
          ),
        });
      } else {
        inProgress++;
      }
    });

    // Convert to chart data format
    const statusChartData = Object.entries(statusCounts).map(
      ([status, count]) => ({
        name: status,
        value: count,
      })
    );

    const priorityChartData = Object.entries(priorityCounts).map(
      ([priority, count]) => ({
        name: priority,
        value: count,
      })
    );

    setStatusData(statusChartData);
    setPriorityData(priorityChartData);
    setOverdueTasksData(overdueTasksList);
    setStatistics({
      total: tasks.length,
      completed,
      overdue,
      inProgress,
    });
  };

  const getTaskStatus = (task) => {
    const taskStatus = getTaskStatusFromServer(task.status_id);
    if (taskStatus === "Done") return "Completed";
    if (
      task.end_time !== "0001-01-01T00:00:00Z" &&
      new Date(task.end_time) < new Date()
    ) {
      return "Overdue";
    }
    return "In Progress";
  };

  const getTaskStatusFromServer = (statusId) => {
    const status = statuses.find((s) => s.id === statusId);
    return status ? status.name : "Unknown";
  };

  const getPriorityName = (priorityId) => {
    const priority = priorities.find((p) => p.priority_id === priorityId);
    return priority ? priority.priority_name : "Not Set";
  };

  // Export functions
  const exportToPDF = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text("Task Analytics Report", 20, 20);

    // Statistics
    doc.setFontSize(14);
    doc.text("Statistics:", 20, 40);
    doc.setFontSize(12);
    doc.text(`Total tasks: ${statistics.total}`, 20, 55);
    doc.text(`Completed: ${statistics.completed}`, 20, 65);
    doc.text(`In Progress: ${statistics.inProgress}`, 20, 75);
    doc.text(`Overdue: ${statistics.overdue}`, 20, 85);

    // Completion rate
    const completionRate =
      statistics.total > 0
        ? ((statistics.completed / statistics.total) * 100).toFixed(1)
        : 0;
    doc.text(`Completion Rate: ${completionRate}%`, 20, 95);

    // Status distribution
    doc.setFontSize(14);
    doc.text("Status Distribution:", 20, 115);
    doc.setFontSize(12);
    let yPos = 130;
    statusData.forEach((item) => {
      const percentage =
        statistics.total > 0
          ? ((item.value / statistics.total) * 100).toFixed(1)
          : 0;
      doc.text(`${item.name}: ${item.value} (${percentage}%)`, 20, yPos);
      yPos += 10;
    });

    // Priority distribution
    doc.setFontSize(14);
    doc.text("Priority Distribution:", 20, yPos + 10);
    doc.setFontSize(12);
    yPos += 25;
    priorityData.forEach((item) => {
      const percentage =
        statistics.total > 0
          ? ((item.value / statistics.total) * 100).toFixed(1)
          : 0;
      doc.text(`${item.name}: ${item.value} (${percentage}%)`, 20, yPos);
      yPos += 10;
    });

    // Overdue tasks details
    if (overdueTasksData.length > 0) {
      doc.addPage();
      doc.setFontSize(16);
      doc.text("Overdue Tasks Details", 20, 20);
      doc.setFontSize(12);
      yPos = 35;

      overdueTasksData.forEach((task, index) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.text(`${index + 1}. ${task.title}`, 20, yPos);
        yPos += 10;
        doc.text(`   Priority: ${task.priority}`, 20, yPos);
        yPos += 10;
        doc.text(
          `   Due Date: ${new Date(task.dueDate).toLocaleDateString()}`,
          20,
          yPos
        );
        yPos += 10;
        doc.text(`   Days Overdue: ${task.daysOverdue}`, 20, yPos);
        yPos += 15;
      });
    }

    doc.save("task-analytics.pdf");
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Statistics sheet
    const completionRate =
      statistics.total > 0
        ? ((statistics.completed / statistics.total) * 100).toFixed(1)
        : 0;
    const statsData = [
      ["Metric", "Value"],
      ["Total Tasks", statistics.total],
      ["Completed", statistics.completed],
      ["In Progress", statistics.inProgress],
      ["Overdue", statistics.overdue],
      ["Completion Rate (%)", completionRate],
    ];
    const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
    XLSX.utils.book_append_sheet(workbook, statsSheet, "Statistics");

    // Status distribution sheet with percentages
    const statusDataWithPercentages = statusData.map((item) => ({
      Status: item.name,
      Count: item.value,
      Percentage:
        statistics.total > 0
          ? ((item.value / statistics.total) * 100).toFixed(1) + "%"
          : "0%",
    }));
    const statusSheet = XLSX.utils.json_to_sheet(statusDataWithPercentages);
    XLSX.utils.book_append_sheet(workbook, statusSheet, "Status Distribution");

    // Priority distribution sheet with percentages
    const priorityDataWithPercentages = priorityData.map((item) => ({
      Priority: item.name,
      Count: item.value,
      Percentage:
        statistics.total > 0
          ? ((item.value / statistics.total) * 100).toFixed(1) + "%"
          : "0%",
    }));
    const prioritySheet = XLSX.utils.json_to_sheet(priorityDataWithPercentages);
    XLSX.utils.book_append_sheet(
      workbook,
      prioritySheet,
      "Priority Distribution"
    );

    // Overdue tasks sheet
    if (overdueTasksData.length > 0) {
      const overdueData = overdueTasksData.map((task) => ({
        Title: task.title,
        Description: task.description,
        Priority: task.priority,
        "Due Date": new Date(task.dueDate).toLocaleDateString(),
        "Days Overdue": task.daysOverdue,
      }));
      const overdueSheet = XLSX.utils.json_to_sheet(overdueData);
      XLSX.utils.book_append_sheet(workbook, overdueSheet, "Overdue Tasks");
    }

    XLSX.writeFile(workbook, "task-analytics.xlsx");
  };

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchTasks(), fetchPriorities(), fetchStatuses()]);
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (priorities.length > 0 && statuses.length > 0) {
      calculateAnalytics(filteredTasks);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredTasks, priorities, statuses]);

  // Chart colors
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  if (error) {
    return (
      <div className="error-message">Error loading data: {error.message}</div>
    );
  }

  return (
    <div className="analytics-container">
      <h1 className="header">Task Analytics</h1>

      <div className="analytics-controls">
        <button
          className="action-btn filter-btn"
          onClick={() => setShowFilterModal(true)}
        >
          <Filter size={16} />
          Filters
        </button>
        <div className="export-buttons">
          <button className="action-btn export-btn" onClick={exportToPDF}>
            <FileText size={16} />
            Export to PDF
          </button>
          <button className="action-btn export-btn" onClick={exportToExcel}>
            <FileSpreadsheet size={16} />
            Export to Excel
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="analytics-content">
          {/* Statistics Cards */}
          <div className="statistics-cards">
            <div className="stat-card">
              <h3>Total Tasks</h3>
              <div className="stat-value">{statistics.total}</div>
            </div>
            <div className="stat-card completed">
              <h3>Completed</h3>
              <div className="stat-value">{statistics.completed}</div>
            </div>
            <div className="stat-card in-progress">
              <h3>In Progress</h3>
              <div className="stat-value">{statistics.inProgress}</div>
            </div>
            <div className="stat-card overdue">
              <h3>Overdue</h3>
              <div className="stat-value">{statistics.overdue}</div>
            </div>
          </div>

          {/* Charts */}
          <div className="charts-container">
            <div className="chart-section">
              <h3>Status Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-section">
              <h3>Priority Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={priorityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Overdue Tasks Summary */}
          {overdueTasksData.length > 0 && (
            <div className="overdue-summary">
              <h3>Overdue Tasks Summary</h3>
              <div className="overdue-list">
                {overdueTasksData.slice(0, 5).map((task, index) => (
                  <div key={index} className="overdue-item">
                    <div className="overdue-title">{task.title}</div>
                    <div className="overdue-details">
                      Priority: {task.priority} | Due:{" "}
                      {new Date(task.dueDate).toLocaleDateString()} |
                      {task.daysOverdue} days overdue
                    </div>
                  </div>
                ))}
                {overdueTasksData.length > 5 && (
                  <div className="overdue-more">
                    +{overdueTasksData.length - 5} more overdue tasks
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Render TaskFilter modal */}
      {showFilterModal && (
        <TaskFilter
          tasks={tasks}
          onFilterChange={(filtered) => {
            setFilteredTasks(filtered);
          }}
          onClose={() => setShowFilterModal(false)}
          flag={true}
        />
      )}
    </div>
  );
}
