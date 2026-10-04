import { AxiosError, AxiosInstance, AxiosResponse } from 'axios';

/**
 * Configuration for the API client.
 * The backend URL should be set via environment variables in a production environment.
 */
const API_BASE_URL: string = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Custom error class for API-related errors.
 */
export class APIError extends Error {
  statusCode?: number;
  data?: any;

  constructor(message: string, statusCode?: number, data?: any) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.data = data;
    Object.setPrototypeOf(this, APIError.prototype);
  }
}

/**
 * Generic API fetcher function.
 * Handles making HTTP requests and parsing responses, including error handling.
 *
 * @template T The expected type of the response data.
 * @param {string} endpoint The API endpoint path (e.g., '/ai/status').
 * @param {RequestInit} options Standard RequestInit options (method, headers, body, etc.).
 * @returns {Promise<T>} A promise that resolves with the response data of type T.
 * @throws {APIError} Throws an APIError if the request fails or the response status is not OK.
 */
async function fetcher<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
    // Example: Add an Authorization header if needed (e.g., for JWT tokens)
    // 'Authorization': `Bearer ${localStorage.getItem('jarvis_token')}`,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch (jsonError) {
        // If response is not JSON, use text or default error message
        errorData.message = await response.text();
      }
      throw new APIError(
        errorData.message || `API request failed with status ${response.status}`,
        response.status,
        errorData
      );
    }

    // Check if the response actually has content to parse
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return (await response.json()) as T;
    } else {
      // If no JSON, return a default or specific value if T is void or string
      return (response.status === 204 ? undefined : await response.text()) as T;
    }
  } catch (error) {
    if (error instanceof APIError) {
      throw error; // Re-throw our custom APIError
    } else if (error instanceof TypeError) {
      // Network error (e.g., DNS resolution failed, no internet)
      throw new APIError(`Network error: ${error.message}`, 0, error);
    } else {
      // Catch any other unexpected errors
      throw new APIError(`An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`, 500, error);
    }
  }
}

// --- Type Definitions for API Responses ---

/** Represents the status of the AI Core. */
export interface AICoreStatus {
  status: 'online' | 'offline' | 'degraded';
  uptime: string;
  load: { cpu: number; memory: number };
  activeProcesses: number;
  lastRestart: string;
  alerts: string[];
}

/** Represents a log entry from the AI Core. */
export interface AICoreLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source: string;
}

/** Represents an AI Agent. */
export interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'idle' | 'busy' | 'offline' | 'error';
  skills: string[];
  assignedTasks: string[]; // Array of task IDs
  lastActivity: string;
  config: Record<string, any>;
}

/** Data structure for creating or updating an Agent. */
export type AgentConfig = Omit<Agent, 'id' | 'status' | 'assignedTasks' | 'lastActivity'>;

/** Represents a Task. */
export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  assignedTo?: string[]; // Agent IDs or user IDs
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

/** Data structure for creating or updating a Task. */
export type TaskData = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;

/** Represents a Project. */
export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'on-hold';
  startDate: string;
  endDate?: string;
  tasks: Task[]; // Full task objects or just IDs
  members: string[]; // User IDs or Agent IDs
  createdAt: string;
  updatedAt: string;
}

/** Represents information about the controlled computer system. */
export interface SystemInfo {
  os: string;
  hostname: string;
  cpu: { model: string; cores: number; usage: number };
  memory: { total: number; free: number; usage: number };
  disk: Array<{ name: string; total: number; free: number; usage: number }>;
  network: Array<{ interface: string; ip: string; speed: number }>;
}

/** Represents a file or directory item in the file system. */
export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number; // For files only
  lastModified: string;
  permissions?: string;
}

/** Represents an automated workflow or script. */
export interface Automation {
  id: string;
  name: string;
  description: string;
  trigger: 'manual' | 'schedule' | 'event';
  schedule?: string; // e.g., cron expression
  event?: { type: string; payload: Record<string, any> };
  actions: Array<{ type: string; config: Record<string, any> }>;
  status: 'active' | 'inactive' | 'error';
  lastRun?: string;
  lastRunStatus?: 'success' | 'failed';
}

/** Data structure for creating or updating an Automation. */
export type AutomationData = Omit<Automation, 'id' | 'lastRun' | 'lastRunStatus'>;

// --- API Client Functions ---

/**
 * Provides an object with methods to interact with various JARVIS backend services.
 */
export const api = {
  /**
   * AI Core related API calls.
   */
  aiCore: {
    /**
     * Fetches the current status of the AI Core.
     * @returns {Promise<AICoreStatus>} The AI Core status object.
     */
    getAICoreStatus: (): Promise<AICoreStatus> => fetcher<AICoreStatus>('/ai/status'),

    /**
     * Fetches recent log entries from the AI Core.
     * @param {number} [limit=100] The maximum number of log entries to retrieve.
     * @returns {Promise<AICoreLog[]>} An array of AI Core log entries.
     */
    getAICoreLogs: (limit: number = 100): Promise<AICoreLog[]> =>
      fetcher<AICoreLog[]>(`/ai/logs?limit=${limit}`),

    /**
     * Sends a command to the AI Core.
     * @param {string} command The command string to execute (e.g., 'restart', 'diagnose').
     * @param {Record<string, any>} [params={}] Optional parameters for the command.
     * @returns {Promise<{ message: string; result?: any }>} A confirmation message and optional result.
     */
    sendAICoreCommand: (command: string, params: Record<string, any> = {}): Promise<{ message: string; result?: any }> =>
      fetcher<{ message: string; result?: any }>('/ai/command', {
        method: 'POST',
        body: JSON.stringify({ command, ...params }),
      }),
  },

  /**
   * Agent orchestration related API calls.
   */
  agents: {
    /**
     * Fetches a list of all registered AI agents.
     * @returns {Promise<Agent[]>} An array of Agent objects.
     */
    getAllAgents: (): Promise<Agent[]> => fetcher<Agent[]>('/agents'),

    /**
     * Fetches details for a specific AI agent by its ID.
     * @param {string} agentId The unique identifier of the agent.
     * @returns {Promise<Agent>} The Agent object.
     */
    getAgentDetails: (agentId: string): Promise<Agent> => fetcher<Agent>(`/agents/${agentId}`),

    /**
     * Creates a new AI agent.
     * @param {AgentConfig} agentConfig The configuration data for the new agent.
     * @returns {Promise<Agent>} The newly created Agent object.
     */
    createAgent: (agentConfig: AgentConfig): Promise<Agent> =>
      fetcher<Agent>('/agents', {
        method: 'POST',
        body: JSON.stringify(agentConfig),
      }),

    /**
     * Updates an existing AI agent.
     * @param {string} agentId The unique identifier of the agent to update.
     * @param {Partial<AgentConfig>} agentConfig The partial configuration data to update.
     * @returns {Promise<Agent>} The updated Agent object.
     */
    updateAgent: (agentId: string, agentConfig: Partial<AgentConfig>): Promise<Agent> =>
      fetcher<Agent>(`/agents/${agentId}`, {
        method: 'PUT',
        body: JSON.stringify(agentConfig),
      }),

    /**
     * Deletes an AI agent.
     * @param {string} agentId The unique identifier of the agent to delete.
     * @returns {Promise<{ message: string }>} A confirmation message.
     */
    deleteAgent: (agentId: string): Promise<{ message: string }> =>
      fetcher<{ message: string }>(`/agents/${agentId}`, {
        method: 'DELETE',
      }),

    /**
     * Assigns a task to an AI agent.
     * @param {string} agentId The unique identifier of the agent.
     * @param {string} taskId The unique identifier of the task to assign.
     * @returns {Promise<{ message: string }>} A confirmation message.
     */
    assignTaskToAgent: (agentId: string, taskId: string): Promise<{ message: string }> =>
      fetcher<{ message: string }>(`/agents/${agentId}/assign-task`, {
        method: 'POST',
        body: JSON.stringify({ taskId }),
      }),
  },

  /**
   * Task and Project management related API calls.
   */
  tasks: {
    /**
     * Fetches a list of all tasks.
     * @param {string} [projectId] Optional project ID to filter tasks by.
     * @returns {Promise<Task[]>} An array of Task objects.
     */
    getAllTasks: (projectId?: string): Promise<Task[]> =>
      fetcher<Task[]>(`/tasks${projectId ? `?projectId=${projectId}` : ''}`),

    /**
     * Fetches details for a specific task by its ID.
     * @param {string} taskId The unique identifier of the task.
     * @returns {Promise<Task>} The Task object.
     */
    getTaskDetails: (taskId: string): Promise<Task> => fetcher<Task>(`/tasks/${taskId}`),

    /**
     * Creates a new task.
     * @param {TaskData} taskData The data for the new task.
     * @returns {Promise<Task>} The newly created Task object.
     */
    createTask: (taskData: TaskData): Promise<Task> =>
      fetcher<Task>('/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData),
      }),

    /**
     * Updates an existing task.
     * @param {string} taskId The unique identifier of the task to update.
     * @param {Partial<TaskData>} taskData The partial data to update the task with.
     * @returns {Promise<Task>} The updated Task object.
     */
    updateTask: (taskId: string, taskData: Partial<TaskData>): Promise<Task> =>
      fetcher<Task>(`/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(taskData),
      }),

    /**
     * Deletes a task.
     * @param {string} taskId The unique identifier of the task to delete.
     * @returns {Promise<{ message: string }>} A confirmation message.
     */
    deleteTask: (taskId: string): Promise<{ message: string }> =>
      fetcher<{ message: string }>(`/tasks/${taskId}`, {
        method: 'DELETE',
      }),
  },

  /**
   * Project management related API calls.
   */
  projects: {
    /**
     * Fetches a list of all projects.
     * @returns {Promise<Project[]>} An array of Project objects.
     */
    getAllProjects: (): Promise<Project[]> => fetcher<Project[]>('/projects'),

    /**
     * Fetches details for a specific project by its ID.
     * @param {string} projectId The unique identifier of the project.
     * @returns {Promise<Project>} The Project object.
     */
    getProjectDetails: (projectId: string): Promise<Project> => fetcher<Project>(`/projects/${projectId}`),

    /**
     * Creates a new project.
     * @param {Omit<Project, 'id' | 'tasks' | 'createdAt' | 'updatedAt'>} projectData The data for the new project.
     * @returns {Promise<Project>} The newly created Project object.
     */
    createProject: (projectData: Omit<Project, 'id' | 'tasks' | 'createdAt' | 'updatedAt'>): Promise<Project> =>
      fetcher<Project>('/projects', {
        method: 'POST',
        body: JSON.stringify(projectData),
      }),

    /**
     * Updates an existing project.
     * @param {string} projectId The unique identifier of the project to update.
     * @param {Partial<Omit<Project, 'id' | 'tasks' | 'createdAt' | 'updatedAt'>>} projectData The partial data to update the project with.
     * @returns {Promise<Project>} The updated Project object.
     */
    updateProject: (
      projectId: string,
      projectData: Partial<Omit<Project, 'id' | 'tasks' | 'createdAt' | 'updatedAt'>>
    ): Promise<Project> =>
      fetcher<Project>(`/projects/${projectId}`, {
        method: 'PUT',
        body: JSON.stringify(projectData),
      }),

    /**
     * Deletes a project.
     * @param {string} projectId The unique identifier of the project to delete.
     * @returns {Promise<{ message: string }>} A confirmation message.
     */
    deleteProject: (projectId: string): Promise<{ message: string }> =>
      fetcher<{ message: string }>(`/projects/${projectId}`, {
        method: 'DELETE',
      }),
  },

  /**
   * Computer control related API calls.
   */
  computerControl: {
    /**
     * Fetches current system information (CPU, memory, disk, network).
     * @returns {Promise<SystemInfo>} The system information object.
     */
    getSystemInfo: (): Promise<SystemInfo> => fetcher<SystemInfo>('/computer/info'),

    /**
     * Executes a system command.
     * **Warning:** Use with extreme caution as this can be a security risk.
     * @param {string} command The command string to execute (e.g., 'ls -la', 'ps aux').
     * @returns {Promise<{ stdout: string; stderr: string; code: number }>} The command output.
     */
    executeSystemCommand: (command: string): Promise<{ stdout: string; stderr: string; code: number }> =>
      fetcher<{ stdout: string; stderr: string; code: number }>('/computer/command', {
        method: 'POST',
        body: JSON.stringify({ command }),
      }),

    /**
     * Initiates a system shutdown.
     * @returns {Promise<{ message: string }>} A confirmation message.
     */
    powerOff: (): Promise<{ message: string }> =>
      fetcher<{ message: string }>('/computer/poweroff', { method: 'POST' }),

    /**
     * Initiates a system restart.
     * @returns {Promise<{ message: string }>} A confirmation message.
     */
    restart: (): Promise<{ message: string }> =>
      fetcher<{ message: string }>('/computer/restart', { method: 'POST' }),
  },

  /**
   * File manager related API calls.
   */
  fileManager: {
    /**
     * Lists files and directories in a given path.
     * @param {string} [path='/'] The directory path to list.
     * @returns {Promise<FileItem[]>} An array of FileItem objects.
     */
    listFiles: (path: string = '/'): Promise<FileItem[]> =>
      fetcher<FileItem[]>(`/files?path=${encodeURIComponent(path)}`),

    /**
     * Initiates a file download.
     * @param {string} path The full path to the file to download.
     * @returns {Promise<Blob>} The file content as a Blob.
     */
    downloadFile: async (path: string): Promise<Blob> => {
      const url = `${API_BASE_URL}/files/download?path=${encodeURIComponent(path)}`;
      const response = await fetch(url, {
        headers: {
          // 'Authorization': `Bearer ${localStorage.getItem('jarvis_token')}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new APIError(errorData.message, response.status, errorData);
      }
      return response.blob();
    },

    /**
     * Uploads a file to a specified path.
     * @param {string} path The target directory path.
     * @param {File} file The File object to upload.
     * @returns {Promise<{ message: string; filename: string }>} A confirmation message and uploaded filename.
     */
    uploadFile: (path: string, file: File): Promise<{ message: string; filename: string }> => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', path);

      return fetcher<{ message: string; filename: string }>('/files/upload', {
        method: 'POST',
        body: formData,
        // When using FormData, Content-Type header is usually handled automatically by the browser
        // do NOT manually set 'Content-Type': 'multipart/form-data' as it will break boundary handling
        headers: {
          // 'Authorization': `Bearer ${localStorage.getItem('jarvis_token')}`,
        },
      });
    },

    /**
     * Deletes a file or empty directory.
     * @param {string} path The full path to the file or directory to delete.
     * @returns {Promise<{ message: string }>} A confirmation message.
     */
    deleteFile: (path: string): Promise<{ message: string }> =>
      fetcher<{ message: string }>('/files', {
        method: 'DELETE',
        body: JSON.stringify({ path }),
      }),

    /**
     * Creates a new directory.
     * @param {string} path The full path for the new directory.
     * @returns {Promise<{ message: string; path: string }>} A confirmation message.
     */
    createDirectory: (path: string): Promise<{ message: string; path: string }> =>
      fetcher<{ message: string; path: string }>('/files/directory', {
        method: 'POST',
        body: JSON.stringify({ path }),
      }),
  },

  /**
   * Automations panel related API calls.
   */
  automations: {
    /**
     * Fetches a list of all configured automations.
     * @returns {Promise<Automation[]>} An array of Automation objects.
     */
    getAllAutomations: (): Promise<Automation[]> => fetcher<Automation[]>('/automations'),

    /**
     * Fetches details for a specific automation by its ID.
     * @param {string} automationId The unique identifier of the automation.
     * @returns {Promise<Automation>} The Automation object.
     */
    getAutomationDetails: (automationId: string): Promise<Automation> =>
      fetcher<Automation>(`/automations/${automationId}`),

    /**
     * Creates a new automation.
     * @param {AutomationData} automationData The data for the new automation.
     * @returns {Promise<Automation>} The newly created Automation object.
     */
    createAutomation: (automationData: AutomationData): Promise<Automation> =>
      fetcher<Automation>('/automations', {
        method: 'POST',
        body: JSON.stringify(automationData),
      }),

    /**
     * Updates an existing automation.
     * @param {string} automationId The unique identifier of the automation to update.
     * @param {Partial<AutomationData>} automationData The partial data to update the automation with.
     * @returns {Promise<Automation>} The updated Automation object.
     */
    updateAutomation: (
      automationId: string,
      automationData: Partial<AutomationData>
    ): Promise<Automation> =>
      fetcher<Automation>(`/automations/${automationId}`, {
        method: 'PUT',
        body: JSON.stringify(automationData),
      }),

    /**
     * Deletes an automation.
     * @param {string} automationId The unique identifier of the automation to delete.
     * @returns {Promise<{ message: string }>} A confirmation message.
     */
    deleteAutomation: (automationId: string): Promise<{ message: string }> =>
      fetcher<{ message: string }>(`/automations/${automationId}`, {
        method: 'DELETE',
      }),

    /**
     * Triggers an automation manually.
     * @param {string} automationId The unique identifier of the automation to trigger.
     * @returns {Promise<{ message: string; runId: string }>} A confirmation message and run ID.
     */
    triggerAutomation: (automationId: string): Promise<{ message: string; runId: string }> =>
      fetcher<{ message: string; runId: string }>(`/automations/${automationId}/trigger`, {
        method: 'POST',
      }),
  },
};