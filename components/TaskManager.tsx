import React, { useState, useEffect, useCallback } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input'; // Assuming an Input component similar to Button/Card
import { Select } from './ui/Select'; // Assuming a Select component
import { api } from '../lib/api';
import { formatRelativeTime } from '../lib/utils'; // Assuming this utility function exists

// Define interfaces for Task and Project
interface Task {
  id: string;
  projectId?: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'on-hold';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string; // e.g., 'Agent X', 'User Y'
  dueDate?: string; // ISO date string
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'archived' | 'completed';
  createdAt: string;
  updatedAt: string;
}

/**
 * TaskManager Component
 * A comprehensive task and project management component, enabling users to create, assign, track, and complete tasks.
 */
const TaskManager: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskDescription, setNewTaskDescription] = useState<string>('');
  const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('medium');
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState<string>('');
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>('');
  const [newTaskProject, setNewTaskProject] = useState<string>('');

  const [newProjectName, setNewProjectName] = useState<string>('');
  const [newProjectDescription, setNewProjectDescription] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'tasks' | 'projects'>('tasks');
  const [filterStatus, setFilterStatus] = useState<Task['status'] | 'all'>('all');
  const [filterProject, setFilterProject] = useState<string | 'all'>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'dueDate' | 'priority'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  /**
   * Fetches tasks and projects from the API.
   */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const tasksResponse = await api.get('/tasks');
      setTasks(tasksResponse.data);
      const projectsResponse = await api.get('/projects');
      setProjects(projectsResponse.data);
    } catch (err) {
      console.error('Failed to fetch tasks or projects:', err);
      setError('Failed to load tasks or projects. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Handles the creation of a new task.
   * @param e - Form event.
   */
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      setError('Task title cannot be empty.');
      return;
    }

    try {
      const payload: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'status'> = {
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim(),
        priority: newTaskPriority,
        assignedTo: newTaskAssignedTo.trim() || undefined,
        dueDate: newTaskDueDate || undefined,
        projectId: newTaskProject || undefined,
      };

      const response = await api.post('/tasks', payload);
      setTasks((prev) => [...prev, response.data]);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskPriority('medium');
      setNewTaskAssignedTo('');
      setNewTaskDueDate('');
      setNewTaskProject('');
      setError(null);
    } catch (err) {
      console.error('Failed to create task:', err);
      setError('Failed to create task. Please try again.');
    }
  };

  /**
   * Handles the creation of a new project.
   * @param e - Form event.
   */
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      setError('Project name cannot be empty.');
      return;
    }

    try {
      const payload: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'status'> = {
        name: newProjectName.trim(),
        description: newProjectDescription.trim(),
      };

      const response = await api.post('/projects', payload);
      setProjects((prev) => [...prev, response.data]);
      setNewProjectName('');
      setNewProjectDescription('');
      setError(null);
    } catch (err) {
      console.error('Failed to create project:', err);
      setError('Failed to create project. Please try again.');
    }
  };

  /**
   * Updates the status of a task.
   * @param taskId - The ID of the task to update.
   * @param newStatus - The new status of the task.
   */
  const handleUpdateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      const response = await api.patch(`/tasks/${taskId}`, { status: newStatus });
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, status: newStatus, updatedAt: response.data.updatedAt } : task))
      );
      setError(null);
    } catch (err) {
      console.error('Failed to update task status:', err);
      setError('Failed to update task status. Please try again.');
    }
  };

  /**
   * Deletes a task.
   * @param taskId - The ID of the task to delete.
   */
  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      setError(null);
    } catch (err) {
      console.error('Failed to delete task:', err);
      setError('Failed to delete task. Please try again.');
    }
  };

  /**
   * Deletes a project.
   * @param projectId - The ID of the project to delete.
   */
  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm('Deleting a project will also delete all associated tasks. Are you sure?')) {
      return;
    }
    try {
      await api.delete(`/projects/${projectId}`);
      setProjects((prev) => prev.filter((project) => project.id !== projectId));
      setTasks((prev) => prev.filter((task) => task.projectId !== projectId)); // Remove associated tasks
      setError(null);
    } catch (err) {
      console.error('Failed to delete project:', err);
      setError('Failed to delete project. Please try again.');
    }
  };

  /**
   * Helper function to get project name by ID.
   * @param projectId - The ID of the project.
   * @returns The name of the project or 'N/A' if not found.
   */
  const getProjectName = (projectId?: string) => {
    if (!projectId) return 'No Project';
    const project = projects.find((p) => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  const filteredAndSortedTasks = tasks
    .filter((task) => (filterStatus === 'all' || task.status === filterStatus))
    .filter((task) => (filterProject === 'all' || task.projectId === filterProject))
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'dueDate') {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        comparison = dateA - dateB;
      } else if (sortBy === 'priority') {
        const priorityOrder: Record<Task['priority'], number> = { urgent: 4, high: 3, medium: 2, low: 1 };
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const getPriorityColorClass = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return 'text-red-400 font-bold';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusColorClass = (status: Task['status']) => {
    switch (status) {
      case 'pending': return 'bg-blue-600';
      case 'in-progress': return 'bg-yellow-600';
      case 'completed': return 'bg-green-600';
      case 'on-hold': return 'bg-gray-600';
      default: return 'bg-purple-600';
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-gray-900 to-black border border-gray-700 shadow-lg" data-aos="fade-up">
      <h2 className="text-3xl font-extrabold text-white mb-6 border-b border-gray-700 pb-4 flex items-center">
        <i className="fa-solid fa-list-check mr-3 text-purple-400"></i> Task & Project Management
      </h2>

      {error && (
        <div className="bg-red-800 bg-opacity-30 text-red-300 p-3 rounded-md mb-4 flex items-center" role="alert">
          <i className="fa-solid fa-triangle-exclamation mr-2"></i> {error}
        </div>
      )}

      <div className="mb-6 border-b border-gray-800 pb-4 flex space-x-4">
        <Button
          onClick={() => setActiveTab('tasks')}
          variant={activeTab === 'tasks' ? 'primary' : 'secondary'}
          className="px-6 py-2"
        >
          <i className="fa-solid fa-tasks mr-2"></i> Tasks
        </Button>
        <Button
          onClick={() => setActiveTab('projects')}
          variant={activeTab === 'projects' ? 'primary' : 'secondary'}
          className="px-6 py-2"
        >
          <i className="fa-solid fa-folder-open mr-2"></i> Projects
        </Button>
      </div>

      {activeTab === 'tasks' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Create Task Form */}
          <div className="md:col-span-1">
            <Card className="p-5 bg-gray-950 border border-gray-800" data-aos="fade-right">
              <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-3">Create New Task</h3>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label htmlFor="taskTitle" className="block text-sm font-medium text-gray-300 mb-1">
                    Title
                  </label>
                  <Input
                    id="taskTitle"
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="e.g., Implement dark mode feature"
                    required
                    className="w-full bg-gray-800 text-white border-gray-700 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    id="taskDescription"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    placeholder="Detailed description of the task..."
                    rows={3}
                    className="w-full p-3 rounded-md bg-gray-800 text-white border border-gray-700 focus:border-purple-500 focus:ring-purple-500 transition-all duration-200"
                  ></textarea>
                </div>
                <div>
                  <label htmlFor="taskPriority" className="block text-sm font-medium text-gray-300 mb-1">
                    Priority
                  </label>
                  <Select
                    id="taskPriority"
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as Task['priority'])}
                    className="w-full bg-gray-800 text-white border-gray-700 focus:border-purple-500 focus:ring-purple-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </Select>
                </div>
                <div>
                  <label htmlFor="taskAssignedTo" className="block text-sm font-medium text-gray-300 mb-1">
                    Assigned To (Agent/User)
                  </label>
                  <Input
                    id="taskAssignedTo"
                    type="text"
                    value={newTaskAssignedTo}
                    onChange={(e) => setNewTaskAssignedTo(e.target.value)}
                    placeholder="e.g., Jarvis AI, Alice"
                    className="w-full bg-gray-800 text-white border-gray-700 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label htmlFor="taskDueDate" className="block text-sm font-medium text-gray-300 mb-1">
                    Due Date
                  </label>
                  <Input
                    id="taskDueDate"
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full bg-gray-800 text-white border-gray-700 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label htmlFor="taskProject" className="block text-sm font-medium text-gray-300 mb-1">
                    Project
                  </label>
                  <Select
                    id="taskProject"
                    value={newTaskProject}
                    onChange={(e) => setNewTaskProject(e.target.value)}
                    className="w-full bg-gray-800 text-white border-gray-700 focus:border-purple-500 focus:ring-purple-500"
                  >
                    <option value="">No Project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <Button type="submit" variant="primary" className="w-full py-2.5">
                  <i className="fa-solid fa-plus mr-2"></i> Add Task
                </Button>
              </form>
            </Card>
          </div>

          {/* Task List */}
          <div className="md:col-span-2">
            <Card className="p-5 bg-gray-950 border border-gray-800" data-aos="fade-left">
              <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-3">All Tasks</h3>

              <div className="flex flex-wrap items-center gap-4 mb-5">
                <div>
                  <label htmlFor="filterStatus" className="block text-xs font-medium text-gray-400 mb-1">
                    Filter by Status
                  </label>
                  <Select
                    id="filterStatus"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as Task['status'] | 'all')}
                    className="bg-gray-800 text-white border-gray-700 focus:border-purple-500 focus:ring-purple-500 text-sm"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on-hold">On Hold</option>
                  </Select>
                </div>
                <div>
                  <label htmlFor="filterProject" className="block text-xs font-medium text-gray-400 mb-1">
                    Filter by Project
                  </label>
                  <Select
                    id="filterProject"
                    value={filterProject}
                    onChange={(e) => setFilterProject(e.target.value)}
                    className="bg-gray-800 text-white border-gray-700 focus:border-purple-500 focus:ring-purple-500 text-sm"
                  >
                    <option value="all">All Projects</option>
                    <option value="">No Project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label htmlFor="sortBy" className="block text-xs font-medium text-gray-400 mb-1">
                    Sort by
                  </label>
                  <Select
                    id="sortBy"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="bg-gray-800 text-white border-gray-700 focus:border-purple-500 focus:ring-purple-500 text-sm"
                  >
                    <option value="createdAt">Created Date</option>
                    <option value="dueDate">Due Date</option>
                    <option value="priority">Priority</option>
                  </Select>
                </div>
                <div>
                  <label htmlFor="sortOrder" className="block text-xs font-medium text-gray-400 mb-1">
                    Order
                  </label>
                  <Select
                    id="sortOrder"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
                    className="bg-gray-800 text-white border-gray-700 focus:border-purple-500 focus:ring-purple-500 text-sm"
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </Select>
                </div>
              </div>


              {loading ? (
                <div className="text-center text-gray-400 py-8">
                  <i className="fa-solid fa-spinner fa-spin-pulse text-2xl mb-2"></i>
                  <p>Loading tasks...</p>
                </div>
              ) : filteredAndSortedTasks.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>No tasks found. Create one to get started!</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {filteredAndSortedTasks.map((task) => (
                    <Card key={task.id} className="p-4 bg-gray-900 border border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                      <div className="flex-1 mb-3 sm:mb-0">
                        <h4 className="text-lg font-semibold text-white flex items-center">
                          <span className={`w-2 h-2 rounded-full mr-2 inline-block ${getStatusColorClass(task.status)}`}></span>
                          {task.title}
                        </h4>
                        <p className="text-gray-400 text-sm mt-1 ml-4">{task.description || 'No description'}</p>
                        <div className="flex flex-wrap items-center text-xs text-gray-500 mt-2 ml-4 space-x-4">
                          <span className={`font-medium ${getPriorityColorClass(task.priority)}`}>
                            <i className="fa-solid fa-fire-flame-curved mr-1"></i> {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                          </span>
                          {task.assignedTo && (
                            <span>
                              <i className="fa-solid fa-user-tag mr-1"></i> {task.assignedTo}
                            </span>
                          )}
                          {task.dueDate && (
                            <span>
                              <i className="fa-solid fa-calendar-alt mr-1"></i> Due: {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                          <span>
                            <i className="fa-solid fa-project-diagram mr-1"></i> {getProjectName(task.projectId)}
                          </span>
                          <span className="text-gray-600">
                            Updated {formatRelativeTime(new Date(task.updatedAt))}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <Select
                          value={task.status}
                          onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value as Task['status'])}
                          className={`bg-gray-800 text-white border-gray-700 focus:border-purple-500 focus:ring-purple-500 text-sm py-1 px-2 ${getStatusColorClass(task.status)}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="on-hold">On Hold</option>
                        </Select>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteTask(task.id)}
                          className="px-3 py-1.5"
                        >
                          <i className="fa-solid fa-trash-alt"></i>
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Create Project Form */}
          <div className="md:col-span-1">
            <Card className="p-5 bg-gray-950 border border-gray-800" data-aos="fade-right">
              <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-3">Create New Project</h3>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label htmlFor="projectName" className="block text-sm font-medium text-gray-300 mb-1">
                    Project Name
                  </label>
                  <Input
                    id="projectName"
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="e.g., JARVIS Phase 2 Development"
                    required
                    className="w-full bg-gray-800 text-white border-gray-700 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    id="projectDescription"
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    placeholder="Brief description of the project goals..."
                    rows={3}
                    className="w-full p-3 rounded-md bg-gray-800 text-white border border-gray-700 focus:border-purple-500 focus:ring-purple-500 transition-all duration-200"
                  ></textarea>
                </div>
                <Button type="submit" variant="primary" className="w-full py-2.5">
                  <i className="fa-solid fa-folder-plus mr-2"></i> Add Project
                </Button>
              </form>
            </Card>
          </div>

          {/* Project List */}
          <div className="md:col-span-2">
            <Card className="p-5 bg-gray-950 border border-gray-800" data-aos="fade-left">
              <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-3">All Projects</h3>
              {loading ? (
                <div className="text-center text-gray-400 py-8">
                  <i className="fa-solid fa-spinner fa-spin-pulse text-2xl mb-2"></i>
                  <p>Loading projects...</p>
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>No projects found. Create one to organize your tasks!</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {projects.map((project) => (
                    <Card key={project.id} className="p-4 bg-gray-900 border border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                      <div className="flex-1 mb-3 sm:mb-0">
                        <h4 className="text-lg font-semibold text-white flex items-center">
                          <span className={`w-2 h-2 rounded-full mr-2 inline-block ${project.status === 'active' ? 'bg-green-600' : 'bg-gray-600'}`}></span>
                          {project.name}
                        </h4>
                        <p className="text-gray-400 text-sm mt-1 ml-4">{project.description || 'No description'}</p>
                        <div className="flex flex-wrap items-center text-xs text-gray-500 mt-2 ml-4 space-x-4">
                          <span className="font-medium text-purple-400">
                            <i className="fa-solid fa-star mr-1"></i> {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                          </span>
                          <span className="text-gray-600">
                            Created {formatRelativeTime(new Date(project.createdAt))}
                          </span>
                          <span className="text-gray-600">
                            Updated {formatRelativeTime(new Date(project.updatedAt))}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteProject(project.id)}
                          className="px-3 py-1.5"
                        >
                          <i className="fa-solid fa-trash-alt"></i>
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </Card>
  );
};

export default TaskManager;


// Placeholder for Input and Select components for completeness.
// In a real project, these would be in components/ui/Input.tsx and components/ui/Select.tsx
// or a similar structure.

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input: React.FC<InputProps> = ({ className, ...props }) => {
  return (
    <input
      className={`flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select: React.FC<SelectProps> = ({ className, children, ...props }) => {
  return (
    <select
      className={`flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
};