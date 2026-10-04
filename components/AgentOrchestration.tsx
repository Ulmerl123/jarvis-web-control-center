import React, { useState, useEffect, useCallback } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import * as api from '../lib/api';
import { cn } from '../lib/utils';

/**
 * Interface for a Task.
 * Represents a unit of work that can be assigned to an agent.
 */
interface Task {
    id: string;
    name: string;
    description: string;
    status: 'Pending' | 'InProgress' | 'Completed' | 'Failed';
    agentId?: string; // ID of the agent currently assigned to this task, if any
}

/**
 * Interface for an Agent.
 * Represents an autonomous AI entity in the JARVIS system.
 */
interface Agent {
    id: string;
    name: string;
    status: 'Active' | 'Idle' | 'Busy' | 'Error';
    assignedTasks: Task[];
    capabilities: string[]; // List of functions or domains the agent can handle
}

/**
 * Props for the AgentOrchestration component.
 */
interface AgentOrchestrationProps {
    /**
     * If true, the component will use mock data instead of making actual API calls.
     * Useful for development and demonstration purposes without a live backend.
     */
    isDemoMode?: boolean;
}

/**
 * AgentOrchestration component.
 * Provides a user interface for managing, monitoring, and orchestrating multiple AI agents,
 * including task assignment and status tracking.
 *
 * @param {AgentOrchestrationProps} { isDemoMode = false } - Props for the component.
 * @returns {React.FC} The AgentOrchestration component.
 */
const AgentOrchestration: React.FC<AgentOrchestrationProps> = ({ isDemoMode = false }) => {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [selectedTaskForAssignment, setSelectedTaskForAssignment] = useState<string>(''); // Stores the ID of the task to be assigned
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // --- Mock Data for Demo Mode ---
    // These mock data sets simulate what a backend API would return.
    const mockAgents: Agent[] = [
        {
            id: 'agent-1',
            name: 'J.A.R.V.I.S. Core AI',
            status: 'Active',
            assignedTasks: [],
            capabilities: ['NLP', 'Data Analysis', 'System Control', 'Voice Command Processing'],
        },
        {
            id: 'agent-2',
            name: 'Security Protocol Agent',
            status: 'Idle',
            assignedTasks: [],
            capabilities: ['Surveillance', 'Threat Detection', 'Access Control'],
        },
        {
            id: 'agent-3',
            name: 'Automation Bot',
            status: 'Busy',
            assignedTasks: [
                { id: 'task-3', name: 'Run daily backup', description: 'Initiate full system backup routine.', status: 'InProgress', agentId: 'agent-3' },
            ],
            capabilities: ['Script Execution', 'System Automation', 'Scheduling'],
        },
        {
            id: 'agent-4',
            name: 'Data Weaver',
            status: 'Error',
            assignedTasks: [
                { id: 'task-4', name: 'Process Q3 reports', description: 'Analyze financial data for Q3.', status: 'Failed', agentId: 'agent-4' },
            ],
            capabilities: ['Data Mining', 'Report Generation', 'Database Query'],
        },
        {
            id: 'agent-5',
            name: 'Communication Hub',
            status: 'Active',
            assignedTasks: [],
            capabilities: ['Email Management', 'Calendar Sync', 'Notification System'],
        },
    ];

    const mockTasks: Task[] = [
        { id: 'task-1', name: 'Analyze market trends', description: 'Perform analysis on latest stock market data.', status: 'Pending' },
        { id: 'task-2', name: 'Schedule system update', description: 'Prepare for OS patch deployment.', status: 'Pending' },
        { id: 'task-3', name: 'Run daily backup', description: 'Initiate full system backup routine.', status: 'InProgress', agentId: 'agent-3' },
        { id: 'task-4', name: 'Process Q3 reports', description: 'Analyze financial data for Q3.', status: 'Failed', agentId: 'agent-4' },
        { id: 'task-5', name: 'Research new AI models', description: 'Look into recent advancements in LLM technology.', status: 'Pending' },
        { id: 'task-6', name: 'Clean up temporary files', description: 'Remove old temporary files from system drive.', status: 'Pending' },
        { id: 'task-7', name: 'Monitor network traffic', description: 'Observe unusual network activity for security.', status: 'Pending' },
    ];

    /**
     * Fetches the list of agents and available tasks from the API or uses mock data.
     * Handles loading states and error reporting.
     */
    const fetchAgentsAndTasks = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            if (isDemoMode) {
                // Simulate network delay for demo mode
                await new Promise(resolve => setTimeout(resolve, 800));
                setAgents(mockAgents);
                setAvailableTasks(mockTasks);
            } else {
                const fetchedAgents = await api.getAgents();
                const fetchedTasks = await api.getTasks();
                setAgents(fetchedAgents);
                setAvailableTasks(fetchedTasks);
            }
        } catch (err: any) {
            console.error('Failed to fetch agents or tasks:', err);
            setError(`Failed to load data: ${err.message || 'An unknown error occurred while fetching agents and tasks.'}`);
        } finally {
            setIsLoading(false);
        }
    }, [isDemoMode, mockAgents, mockTasks]); // Dependencies for useCallback

    // Effect to fetch data on component mount and set up polling
    useEffect(() => {
        fetchAgentsAndTasks();
        // Set up an interval to refresh data periodically (e.g., every 30 seconds)
        const interval = setInterval(fetchAgentsAndTasks, 30000); // Polling interval
        // Clean up the interval when the component unmounts
        return () => clearInterval(interval);
    }, [fetchAgentsAndTasks]);

    /**
     * Handles the assignment of a selected task to the currently selected agent.
     * Updates agent and task states after a successful assignment.
     */
    const handleAssignTask = async () => {
        if (!selectedAgent || !selectedTaskForAssignment) {
            setError('Please select both an agent and a task for assignment.');
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            if (isDemoMode) {
                // Simulate API call for demo mode
                await new Promise(resolve => setTimeout(resolve, 1200));

                const assignedTask = availableTasks.find(task => task.id === selectedTaskForAssignment);
                if (!assignedTask) {
                    throw new Error('Selected task not found.');
                }

                // Update agents state: add task to selected agent, set agent status to 'Busy'
                const updatedAgents = agents.map(agent =>
                    agent.id === selectedAgent.id
                        ? {
                              ...agent,
                              assignedTasks: [...agent.assignedTasks, { ...assignedTask, agentId: agent.id, status: 'InProgress' }],
                              status: 'Busy',
                          }
                        : agent
                );

                // Update availableTasks state: mark task as InProgress and assign agentId
                const updatedTasks = availableTasks.map(task =>
                    task.id === selectedTaskForAssignment
                        ? { ...task, status: 'InProgress', agentId: selectedAgent.id }
                        : task
                );

                setAgents(updatedAgents);
                setAvailableTasks(updatedTasks);
                // Update selectedAgent to reflect its new state
                setSelectedAgent(updatedAgents.find(a => a.id === selectedAgent.id) || null);
            } else {
                await api.assignTask(selectedAgent.id, selectedTaskForAssignment);
                // After successful assignment, re-fetch data to ensure consistency with backend
                await fetchAgentsAndTasks();
            }
            setSelectedTaskForAssignment(''); // Reset selection after assignment
        } catch (err: any) {
            console.error('Failed to assign task:', err);
            setError(`Failed to assign task: ${err.message || 'An unknown error occurred during task assignment.'}`);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Determines the Tailwind CSS color class based on the given status.
     * @param {Agent['status'] | Task['status']} status - The status of an agent or task.
     * @returns {string} The Tailwind CSS color class.
     */
    const getStatusColor = (status: Agent['status'] | Task['status']): string => {
        switch (status) {
            case 'Active':
            case 'Completed':
                return 'text-green-400';
            case 'Idle':
            case 'Pending':
                return 'text-blue-400';
            case 'Busy':
            case 'InProgress':
                return 'text-yellow-400';
            case 'Error':
            case 'Failed':
                return 'text-red-400';
            default:
                return 'text-gray-400';
        }
    };

    /**
     * Returns a Font Awesome icon component based on the given status.
     * @param {Agent['status'] | Task['status']} status - The status of an agent or task.
     * @returns {JSX.Element} The Font Awesome icon component.
     */
    const getStatusIcon = (status: Agent['status'] | Task['status']): JSX.Element => {
        switch (status) {
            case 'Active':
            case 'Completed':
                return <i className="fa-solid fa-circle-check text-green-500"></i>;
            case 'Idle':
            case 'Pending':
                return <i className="fa-solid fa-circle-pause text-blue-500"></i>;
            case 'Busy':
            case 'InProgress':
                return <i className="fa-solid fa-circle-notch fa-spin text-yellow-500"></i>;
            case 'Error':
            case 'Failed':
                return <i className="fa-solid fa-circle-exclamation text-red-500"></i>;
            default:
                return <i className="fa-solid fa-circle-info text-gray-500"></i>;
        }
    };

    return (
        <div className="p-4 space-y-6 md:p-8" data-aos="fade-up">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-6 flex items-center">
                <i className="fa-solid fa-robot mr-3"></i>Agent Orchestration
            </h2>

            {isDemoMode && (
                <div className="bg-gradient-to-r from-yellow-800 to-orange-900 border border-yellow-500 text-white p-3 rounded-md mb-4 flex items-center shadow-lg">
                    <i className="fa-solid fa-triangle-exclamation text-xl mr-3"></i>
                    <span className="font-semibold">Demo Mode Active:</span> Displaying mock data. Real API calls are disabled.
                </div>
            )}

            {isLoading && (
                <div className="flex flex-col justify-center items-center h-48 bg-gray-900 rounded-lg shadow-inner">
                    <i className="fa-solid fa-spinner fa-spin fa-2xl text-purple-500"></i>
                    <p className="ml-4 mt-4 text-xl text-gray-400">Loading agents and tasks...</p>
                </div>
            )}

            {error && (
                <Card className="border border-red-500 bg-red-900/30 text-red-300 p-4 shadow-xl">
                    <p className="font-bold text-lg flex items-center mb-2">
                        <i className="fa-solid fa-exclamation-triangle mr-2 text-red-400"></i>Error:
                    </p>
                    <p>{error}</p>
                    <Button onClick={fetchAgentsAndTasks} variant="secondary" className="mt-4">
                        <i className="fa-solid fa-arrows-rotate mr-2"></i>Try Again
                    </Button>
                </Card>
            )}

            {!isLoading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Agent List Panel */}
                    <Card className="col-span-1 lg:col-span-2 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 shadow-xl p-6">
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
                            <h3 className="text-2xl font-semibold text-gray-100 flex items-center">
                                <i className="fa-solid fa-users-gear mr-2 text-purple-400"></i>Active Agents
                            </h3>
                            <Button onClick={fetchAgentsAndTasks} disabled={isLoading} variant="secondary" className="group">
                                <i className="fa-solid fa-arrows-rotate mr-2 group-hover:animate-spin-slow"></i>Refresh
                            </Button>
                        </div>
                        <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar pr-2">
                            {agents.length === 0 ? (
                                <p className="text-gray-400 text-center py-8">No agents found. System is quiet.</p>
                            ) : (
                                agents.map((agent) => (
                                    <div
                                        key={agent.id}
                                        className={cn(
                                            "flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all duration-200 ease-in-out",
                                            "bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-purple-500",
                                            selectedAgent?.id === agent.id && "ring-2 ring-purple-500 border-purple-500 bg-gray-700"
                                        )}
                                        onClick={() => setSelectedAgent(agent)}
                                    >
                                        <div className="flex-1">
                                            <h4 className="text-xl font-bold text-gray-50 flex items-center">
                                                <i className="fa-solid fa-circle mr-2 text-sm" />
                                                {agent.name}
                                            </h4>
                                            <p className="text-gray-400 text-sm ml-4 mt-1">
                                                Capabilities: {agent.capabilities.join(', ')}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end min-w-[120px]">
                                            <span className={cn("font-medium text-lg flex items-center", getStatusColor(agent.status))}>
                                                {getStatusIcon(agent.status)}
                                                <span className="ml-2">{agent.status}</span>
                                            </span>
                                            <span className="text-sm text-gray-500 mt-1">
                                                Tasks: {agent.assignedTasks.length}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>

                    {/* Agent Details & Task Assignment Panel */}
                    <Card className="col-span-1 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 shadow-xl p-6">
                        <h3 className="text-2xl font-semibold text-gray-100 flex items-center mb-4 pb-4 border-b border-gray-700">
                            <i className="fa-solid fa-circle-info mr-2 text-pink-400"></i>Agent Details & Assignment
                        </h3>
                        {selectedAgent ? (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-gray-400 text-sm">Selected Agent:</p>
                                    <h4 className="text-xl font-bold text-gray-50">{selectedAgent.name}</h4>
                                    <span className={cn("text-lg font-medium flex items-center", getStatusColor(selectedAgent.status))}>
                                        {getStatusIcon(selectedAgent.status)}
                                        <span className="ml-2">{selectedAgent.status}</span>
                                    </span>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm mb-1">Capabilities:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedAgent.capabilities.map(cap => (
                                            <span key={cap} className="px-3 py-1 bg-blue-700/50 text-blue-200 text-xs rounded-full">
                                                {cap}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t border-gray-700 pt-4">
                                    <p className="text-gray-400 text-sm mb-2">Assigned Tasks:</p>
                                    {selectedAgent.assignedTasks.length > 0 ? (
                                        <ul className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                                            {selectedAgent.assignedTasks.map(task => (
                                                <li key={task.id} className="flex items-center text-gray-200 text-sm">
                                                    {getStatusIcon(task.status)}
                                                    <span className="ml-2">
                                                        {task.name}
                                                        <span className={cn("ml-2 text-xs", getStatusColor(task.status))}>({task.status})</span>
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-gray-500 text-sm italic">No tasks currently assigned to this agent.</p>
                                    )}
                                </div>

                                <div className="border-t border-gray-700 pt-4 mt-4">
                                    <label htmlFor="task-select" className="block text-gray-200 text-sm font-medium mb-2">
                                        Assign New Task:
                                    </label>
                                    <select
                                        id="task-select"
                                        value={selectedTaskForAssignment}
                                        onChange={(e) => setSelectedTaskForAssignment(e.target.value)}
                                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-purple-500 focus:border-purple-500 mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={isLoading}
                                    >
                                        <option value="">Select an unassigned task...</option>
                                        {availableTasks
                                            .filter(task => !task.agentId || task.agentId === selectedAgent.id) // Only show unassigned or currently assigned to this agent
                                            .map(task => (
                                                <option key={task.id} value={task.id}>
                                                    {task.name} ({task.status === 'InProgress' && task.agentId === selectedAgent.id ? 'Assigned to this agent' : task.status})
                                                </option>
                                            ))}
                                    </select>
                                    <Button
                                        onClick={handleAssignTask}
                                        disabled={isLoading || !selectedTaskForAssignment || selectedAgent.status === 'Error'}
                                        className="w-full"
                                    >
                                        {isLoading ? (
                                            <>
                                                <i className="fa-solid fa-spinner fa-spin mr-2"></i>Assigning...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fa-solid fa-share-square mr-2"></i>Assign Task
                                            </>
                                        )}
                                    </Button>
                                    {selectedAgent.status === 'Error' && (
                                        <p className="text-red-400 text-sm mt-2 text-center">Cannot assign tasks to an agent in 'Error' state.</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-400 text-center py-8 text-lg">Select an agent from the list to view details and assign tasks.</p>
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
};

export default AgentOrchestration;