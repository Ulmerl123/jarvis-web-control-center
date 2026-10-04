import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import * as api from '../lib/api'; // Assume api.ts handles actual backend calls
import { formatRelativeTime } from '../lib/utils'; // Utility for time formatting

/**
 * @interface AutomationTrigger
 * Represents the configuration for when an automation should run.
 */
interface AutomationTrigger {
  type: 'schedule' | 'event' | 'manual';
  config: {
    cron?: string; // For 'schedule' type, e.g., "0 0 * * *" for daily at midnight
    eventName?: string; // For 'event' type, e.g., "new_file_uploaded"
  };
}

/**
 * @interface AutomationAction
 * Represents a single action to be performed by an automation.
 */
interface AutomationAction {
  id: string; // Unique ID for actions within an automation
  type: 'agent_task' | 'system_command' | 'notification' | 'run_script';
  config: {
    agentId?: string; // For 'agent_task'
    taskPrompt?: string; // For 'agent_task'
    command?: string; // For 'system_command'
    scriptPath?: string; // For 'run_script'
    notificationMessage?: string; // For 'notification'
  };
}

/**
 * @interface Automation
 * Represents a complete automation workflow.
 */
interface Automation {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  status: 'idle' | 'running' | 'failed' | 'success';
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  createdAt: string;
  updatedAt: string;
}

/**
 * @interface AvailableAgent
 * Represents a simplified agent object for selection in forms.
 */
interface AvailableAgent {
  id: string;
  name: string;
}

/**
 * @interface AvailableSystemCommand
 * Represents a simplified system command for selection in forms.
 */
interface AvailableSystemCommand {
  id: string;
  name: string;
  command: string; // Example command string
}

/**
 * Mock API calls for development purposes.
 * In a real application, these would be implemented in `lib/api.ts`
 * and interact with a backend service.
 */
const mockAutomations: Automation[] = [
  {
    id: 'auto-1',
    name: 'Daily System Check',
    description: 'Runs a system health check every morning.',
    enabled: true,
    status: 'idle',
    trigger: { type: 'schedule', config: { cron: '0 8 * * *' } },
    actions: [
      { id: 'action-1-1', type: 'agent_task', config: { agentId: 'agent-alpha', taskPrompt: 'Perform a comprehensive system health check and report any anomalies.' } },
      { id: 'action-1-2', type: 'notification', config: { notificationMessage: 'Daily system check initiated.' } },
    ],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'auto-2',
    name: 'New File Alert',
    description: 'Notifies when a new critical file is uploaded.',
    enabled: false,
    status: 'idle',
    trigger: { type: 'event', config: { eventName: 'new_critical_file' } },
    actions: [
      { id: 'action-2-1', type: 'notification', config: { notificationMessage: 'ALERT: A new critical file has been uploaded!' } },
    ],
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'auto-3',
    name: 'Run Cleanup Script',
    description: 'Manually triggered script to clean temporary files.',
    enabled: true,
    status: 'idle',
    trigger: { type: 'manual', config: {} },
    actions: [
      { id: 'action-3-1', type: 'run_script', config: { scriptPath: '/opt/jarvis/scripts/cleanup.sh' } },
      { id: 'action-3-2', type: 'notification', config: { notificationMessage: 'Cleanup script executed.' } },
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockAgents: AvailableAgent[] = [
  { id: 'agent-alpha', name: 'Alpha Agent' },
  { id: 'agent-beta', name: 'Beta Agent' },
  { id: 'agent-gamma', name: 'Gamma Agent' },
];

const mockSystemCommands: AvailableSystemCommand[] = [
  { id: 'cmd-reboot', name: 'Reboot System', command: 'sudo reboot' },
  { id: 'cmd-shutdown', name: 'Shutdown System', command: 'sudo shutdown now' },
  { id: 'cmd-disk-usage', name: 'Check Disk Usage', command: 'df -h' },
];

const mockEvents: string[] = [
  'system_startup',
  'system_shutdown',
  'new_critical_file',
  'high_cpu_usage',
  'low_disk_space',
  'agent_offline',
];

/**
 * Mocks for lib/api.ts methods related to automations.
 * In a real application, these would make actual API calls.
 */
class ApiClientMock {
  private automations: Automation[] = [...mockAutomations];
  private nextAutomationId = this.automations.length > 0 ? Math.max(...this.automations.map(a => parseInt(a.id.split('-')[1]))) + 1 : 1;

  async getAutomations(): Promise<Automation[]> {
    return new Promise(resolve => setTimeout(() => resolve(this.automations), 500));
  }

  async getAvailableAgents(): Promise<AvailableAgent[]> {
    return new Promise(resolve => setTimeout(() => resolve(mockAgents), 300));
  }

  async getAvailableSystemCommands(): Promise<AvailableSystemCommand[]> {
    return new Promise(resolve => setTimeout(() => resolve(mockSystemCommands), 300));
  }

  async getAvailableEvents(): Promise<string[]> {
    return new Promise(resolve => setTimeout(() => resolve(mockEvents), 300));
  }

  async createAutomation(newAutomation: Omit<Automation, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Automation> {
    return new Promise(resolve => {
      setTimeout(() => {
        const created: Automation = {
          ...newAutomation,
          id: `auto-${this.nextAutomationId++}`,
          status: 'idle',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          actions: newAutomation.actions.map(action => ({ ...action, id: action.id || `action-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` }))
        };
        this.automations.push(created);
        resolve(created);
      }, 500);
    });
  }

  async updateAutomation(id: string, updatedFields: Partial<Omit<Automation, 'id' | 'createdAt' | 'status'>>): Promise<Automation> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = this.automations.findIndex(a => a.id === id);
        if (index > -1) {
          const updated = {
            ...this.automations[index],
            ...updatedFields,
            updatedAt: new Date().toISOString(),
            actions: updatedFields.actions?.map(action => ({ ...action, id: action.id || `action-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` })) || this.automations[index].actions
          };
          this.automations[index] = updated;
          resolve(updated);
        } else {
          reject(new Error('Automation not found'));
        }
      }, 500);
    });
  }

  async deleteAutomation(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const initialLength = this.automations.length;
        this.automations = this.automations.filter(a => a.id !== id);
        if (this.automations.length < initialLength) {
          resolve();
        } else {
          reject(new Error('Automation not found'));
        }
      }, 500);
    });
  }

  async toggleAutomation(id: string, enable: boolean): Promise<Automation> {
    return this.updateAutomation(id, { enabled: enable });
  }

  async executeAutomation(id: string): Promise<Automation> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = this.automations.findIndex(a => a.id === id);
        if (index > -1) {
          const automation = this.automations[index];
          if (!automation.enabled) {
            reject(new Error('Automation is disabled and cannot be executed.'));
            return;
          }
          const updated: Automation = {
            ...automation,
            status: 'running', // Simulate running
            updatedAt: new Date().toISOString(),
          };
          this.automations[index] = updated;
          resolve(updated);
          // Simulate completion after a short delay
          setTimeout(() => {
            this.updateAutomation(id, { status: 'success' });
          }, 2000);
        } else {
          reject(new Error('Automation not found'));
        }
      }, 500);
    });
  }
}

// Replace api with mockApiClient in development/testing context
const apiInstance = (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_MOCK_API === 'true')
  ? new ApiClientMock() as unknown as typeof api
  : api;


/**
 * @interface TriggerConfigFormProps
 * Props for the TriggerConfigForm component.
 */
interface TriggerConfigFormProps {
  trigger: AutomationTrigger;
  onTriggerChange: (newTrigger: AutomationTrigger) => void;
  availableEvents: string[];
}

/**
 * `TriggerConfigForm`
 * A sub-component for configuring different types of automation triggers.
 * @param {TriggerConfigFormProps} props - The component props.
 * @returns {JSX.Element} The rendered trigger configuration form.
 */
const TriggerConfigForm: React.FC<TriggerConfigFormProps> = ({ trigger, onTriggerChange, availableEvents }) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-300">Trigger Type:</label>
      <select
        value={trigger.type}
        onChange={(e) => onTriggerChange({ ...trigger, type: e.target.value as AutomationTrigger['type'] })}
        className="p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-100"
      >
        <option value="manual">Manual</option>
        <option value="schedule">Schedule (Cron)</option>
        <option value="event">Event</option>
      </select>

      {trigger.type === 'schedule' && (
        <>
          <label htmlFor="cron" className="text-sm font-medium text-gray-300 mt-2">Cron Schedule:</label>
          <input
            id="cron"
            type="text"
            value={trigger.config.cron || ''}
            onChange={(e) => onTriggerChange({ ...trigger, config: { ...trigger.config, cron: e.target.value } })}
            placeholder="e.g., 0 8 * * * (daily at 8 AM)"
            className="p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-100"
          />
          <p className="text-xs text-gray-400">Learn more about <a href="https://crontab.guru/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">cron syntax</a></p>
        </>
      )}

      {trigger.type === 'event' && (
        <>
          <label htmlFor="eventName" className="text-sm font-medium text-gray-300 mt-2">Event Name:</label>
          <select
            id="eventName"
            value={trigger.config.eventName || ''}
            onChange={(e) => onTriggerChange({ ...trigger, config: { ...trigger.config, eventName: e.target.value } })}
            className="p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-100"
          >
            <option value="">Select an event</option>
            {availableEvents.map((event) => (
              <option key={event} value={event}>{event}</option>
            ))}
          </select>
        </>
      )}
    </div>
  );
};

/**
 * @interface ActionConfigFormProps
 * Props for the ActionConfigForm component.
 */
interface ActionConfigFormProps {
  action: AutomationAction;
  onActionChange: (newAction: AutomationAction) => void;
  availableAgents: AvailableAgent[];
  availableSystemCommands: AvailableSystemCommand[];
}

/**
 * `ActionConfigForm`
 * A sub-component for configuring different types of automation actions.
 * @param {ActionConfigFormProps} props - The component props.
 * @returns {JSX.Element} The rendered action configuration form.
 */
const ActionConfigForm: React.FC<ActionConfigFormProps> = ({ action, onActionChange, availableAgents, availableSystemCommands }) => {
  return (
    <div className="flex flex-col gap-2 p-3 bg-gray-800 rounded-md border border-gray-700 shadow-inner">
      <label className="text-sm font-medium text-gray-300">Action Type:</label>
      <select
        value={action.type}
        onChange={(e) => onActionChange({ ...action, type: e.target.value as AutomationAction['type'] })}
        className="p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-100"
      >
        <option value="agent_task">Agent Task</option>
        <option value="system_command">System Command</option>
        <option value="run_script">Run Script</option>
        <option value="notification">Notification</option>
      </select>

      {action.type === 'agent_task' && (
        <>
          <label htmlFor={`agent-${action.id}`} className="text-sm font-medium text-gray-300 mt-2">Select Agent:</label>
          <select
            id={`agent-${action.id}`}
            value={action.config.agentId || ''}
            onChange={(e) => onActionChange({ ...action, config: { ...action.config, agentId: e.target.value } })}
            className="p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-100"
          >
            <option value="">Select an agent</option>
            {availableAgents.map((agent) => (
              <option key={agent.id} value={agent.id}>{agent.name}</option>
            ))}
          </select>
          <label htmlFor={`task-${action.id}`} className="text-sm font-medium text-gray-300 mt-2">Task Prompt:</label>
          <textarea
            id={`task-${action.id}`}
            value={action.config.taskPrompt || ''}
            onChange={(e) => onActionChange({ ...action, config: { ...action.config, taskPrompt: e.target.value } })}
            placeholder="e.g., 'Analyze logs for unusual activity.'"
            rows={3}
            className="p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-100"
          />
        </>
      )}

      {action.type === 'system_command' && (
        <>
          <label htmlFor={`command-select-${action.id}`} className="text-sm font-medium text-gray-300 mt-2">Select Command:</label>
          <select
            id={`command-select-${action.id}`}
            value={action.config.command || ''}
            onChange={(e) => onActionChange({ ...action, config: { ...action.config, command: e.target.value } })}
            className="p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-100"
          >
            <option value="">Select a system command</option>
            {availableSystemCommands.map((cmd) => (
              <option key={cmd.id} value={cmd.command}>{cmd.name} ({cmd.command})</option>
            ))}
          </select>
          <label htmlFor={`command-manual-${action.id}`} className="text-sm font-medium text-gray-300 mt-2">Or Enter Custom Command:</label>
          <input
            id={`command-manual-${action.id}`}
            type="text"
            value={action.config.command || ''}
            onChange={(e) => onActionChange({ ...action, config: { ...action.config, command: e.target.value } })}
            placeholder="e.g., 'sudo apt update'"
            className="p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-100"
          />
        </>
      )}

      {action.type === 'run_script' && (
        <>
          <label htmlFor={`script-path-${action.id}`} className="text-sm font-medium text-gray-300 mt-2">Script Path:</label>
          <input
            id={`script-path-${action.id}`}
            type="text"
            value={action.config.scriptPath || ''}
            onChange={(e) => onActionChange({ ...action, config: { ...action.config, scriptPath: e.target.value } })}
            placeholder="e.g., '/home/jarvis/scripts/backup.sh'"
            className="p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-100"
          />
        </>
      )}

      {action.type === 'notification' && (
        <>
          <label htmlFor={`message-${action.id}`} className="text-sm font-medium text-gray-300 mt-2">Notification Message:</label>
          <textarea
            id={`message-${action.id}`}
            value={action.config.notificationMessage || ''}
            onChange={(e) => onActionChange({ ...action, config: { ...action.config, notificationMessage: e.target.value } })}
            placeholder="e.g., 'Automation X has completed successfully.'"
            rows={3}
            className="p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-100"
          />
        </>
      )}
    </div>
  );
};


/**
 * @interface AutomationFormModalProps
 * Props for the AutomationFormModal component.
 */
interface AutomationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (automation: Omit<Automation, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  automation?: Automation; // Optional, for editing existing automations
  availableAgents: AvailableAgent[];
  availableSystemCommands: AvailableSystemCommand[];
  availableEvents: string[];
}

/**
 * `AutomationFormModal`
 * A modal component for creating or editing automation workflows.
 * @param {AutomationFormModalProps} props - The component props.
 * @returns {JSX.Element | null} The rendered modal or null if not open.
 */
const AutomationFormModal: React.FC<AutomationFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  automation,
  availableAgents,
  availableSystemCommands,
  availableEvents,
}) => {
  const [name, setName] = useState(automation?.name || '');
  const [description, setDescription] = useState(automation?.description || '');
  const [enabled, setEnabled] = useState(automation?.enabled ?? true);
  const [trigger, setTrigger] = useState<AutomationTrigger>(automation?.trigger || { type: 'manual', config: {} });
  const [actions, setActions] = useState<AutomationAction[]>(automation?.actions || [{ id: `action-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, type: 'agent_task', config: {} }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (automation) {
      setName(automation.name);
      setDescription(automation.description);
      setEnabled(automation.enabled);
      setTrigger(automation.trigger);
      setActions(automation.actions);
    } else {
      setName('');
      setDescription('');
      setEnabled(true);
      setTrigger({ type: 'manual', config: {} });
      setActions([{ id: `action-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, type: 'agent_task', config: {} }]);
    }
  }, [automation, isOpen]); // Reset form when automation changes or modal opens/closes

  if (!isOpen) return null;

  const handleActionChange = (index: number, newAction: AutomationAction) => {
    setActions((prevActions) => {
      const updatedActions = [...prevActions];
      updatedActions[index] = newAction;
      return updatedActions;
    });
  };

  const addAction = () => {
    setActions((prevActions) => [
      ...prevActions,
      { id: `action-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, type: 'agent_task', config: {} },
    ]);
  };

  const removeAction = (index: number) => {
    setActions((prevActions) => prevActions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        name,
        description,
        enabled,
        trigger,
        actions,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save automation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 overflow-y-auto">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto transform scale-95 md:scale-100 transition-transform duration-200">
        <h3 className="text-xl font-bold mb-4 text-blue-400">{automation ? 'Edit Automation' : 'Create New Automation'}</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300">Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-100"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-100"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enabled"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="enabled" className="text-sm font-medium text-gray-300">Enabled</label>
          </div>

          <fieldset className="p-4 border border-blue-600 rounded-md bg-gray-900 bg-opacity-50">
            <legend className="text-lg font-semibold text-blue-400 px-2 -ml-2">Trigger Configuration</legend>
            <TriggerConfigForm
              trigger={trigger}
              onTriggerChange={setTrigger}
              availableEvents={availableEvents}
            />
          </fieldset>

          <fieldset className="p-4 border border-purple-600 rounded-md bg-gray-900 bg-opacity-50">
            <legend className="text-lg font-semibold text-purple-400 px-2 -ml-2">Actions</legend>
            <div className="flex flex-col gap-4">
              {actions.map((action, index) => (
                <div key={action.id || index} className="relative group">
                  <ActionConfigForm
                    action={action}
                    onActionChange={(newAction) => handleActionChange(index, newAction)}
                    availableAgents={availableAgents}
                    availableSystemCommands={availableSystemCommands}
                  />
                  {actions.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => removeAction(index)}
                      className="absolute -top-3 -right-3 p-1 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      aria-label="Remove action"
                    >
                      <i className="fas fa-times text-xs"></i>
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addAction} className="mt-2 w-full">
                <i className="fas fa-plus mr-2"></i> Add Action
              </Button>
            </div>
          </fieldset>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-end gap-3 mt-4">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i> Saving...
                </>
              ) : automation ? (
                <>
                  <i className="fas fa-save mr-2"></i> Update Automation
                </>
              ) : (
                <>
                  <i className="fas fa-plus mr-2"></i> Create Automation
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

/**
 * @interface AutomationItemProps
 * Props for the AutomationItem component.
 */
interface AutomationItemProps {
  automation: Automation;
  onEdit: (automation: Automation) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
  onExecute: (id: string) => void;
  isLoading: boolean; // Indicates if this specific automation is being acted upon
}

/**
 * `AutomationItem`
 * Displays a single automation with actions like edit, delete, toggle, and execute.
 * @param {AutomationItemProps} props - The component props.
 * @returns {JSX.Element} The rendered automation item.
 */
const AutomationItem: React.FC<AutomationItemProps> = ({ automation, onEdit, onDelete, onToggle, onExecute, isLoading }) => {
  const statusColorClass = {
    idle: 'text-gray-400',
    running: 'text-blue-400 animate-pulse',
    success: 'text-green-400',
    failed: 'text-red-400',
  }[automation.status];

  const triggerIcon = {
    manual: 'fas fa-hand-point-up',
    schedule: 'fas fa-calendar-alt',
    event: 'fas fa-bell',
  }[automation.trigger.type];

  return (
    <Card className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 bg-gray-850 hover:bg-gray-800 transition-colors duration-200">
      <div className="flex-grow w-full lg:w-auto mb-4 lg:mb-0">
        <div className="flex items-center mb-2">
          <i className={`${triggerIcon} text-blue-400 text-lg mr-3`} title={`Trigger: ${automation.trigger.type}`}></i>
          <h4 className="text-lg font-semibold text-gray-100">{automation.name}</h4>
          <span className={`ml-4 text-xs font-medium ${statusColorClass} capitalize`}>
            {automation.status === 'running' && <i className="fas fa-spinner fa-spin mr-1"></i>}
            {automation.status}
          </span>
        </div>
        <p className="text-sm text-gray-300 mb-2">{automation.description}</p>
        <p className="text-xs text-gray-400">
          Last updated: {formatRelativeTime(new Date(automation.updatedAt))}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 justify-end w-full lg:w-auto">
        <Button
          variant={automation.enabled ? 'secondary' : 'primary'}
          onClick={() => onToggle(automation.id, !automation.enabled)}
          disabled={isLoading}
          size="sm"
          className="min-w-[80px]"
        >
          {isLoading ? <i className="fas fa-spinner fa-spin"></i> : automation.enabled ? 'Disable' : 'Enable'}
        </Button>
        {automation.trigger.type === 'manual' && (
          <Button
            variant="success"
            onClick={() => onExecute(automation.id)}
            disabled={isLoading || !automation.enabled}
            size="sm"
            className="min-w-[80px]"
          >
            {isLoading ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-play mr-2"></i> Execute</>}
          </Button>
        )}
        <Button variant="outline" onClick={() => onEdit(automation)} disabled={isLoading} size="sm">
          <i className="fas fa-edit"></i> <span className="sr-only lg:not-sr-only lg:ml-2">Edit</span>
        </Button>
        <Button variant="destructive" onClick={() => onDelete(automation.id)} disabled={isLoading} size="sm">
          <i className="fas fa-trash"></i> <span className="sr-only lg:not-sr-only lg:ml-2">Delete</span>
        </Button>
      </div>
    </Card>
  );
};


/**
 * `AutomationsPanel`
 * Component for configuring and managing automated workflows and scripts.
 * @returns {JSX.Element} The rendered automations panel.
 */
const AutomationsPanel: React.FC = () => {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAutomation, setCurrentAutomation] = useState<Automation | undefined>(undefined);
  const [availableAgents, setAvailableAgents] = useState<AvailableAgent[]>([]);
  const [availableSystemCommands, setAvailableSystemCommands] = useState<AvailableSystemCommand[]>([]);
  const [availableEvents, setAvailableEvents] = useState<string[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null); // For individual automation loading state

  const fetchAutomations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiInstance.getAutomations();
      setAutomations(data);
    } catch (err: any) {
      console.error('Failed to fetch automations:', err);
      setError(err.message || 'Failed to load automations.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDependencies = useCallback(async () => {
    try {
      const [agents, commands, events] = await Promise.all([
        apiInstance.getAvailableAgents(),
        apiInstance.getAvailableSystemCommands(),
        apiInstance.getAvailableEvents(),
      ]);
      setAvailableAgents(agents);
      setAvailableSystemCommands(commands);
      setAvailableEvents(events);
    } catch (err: any) {
      console.error('Failed to fetch automation dependencies:', err);
      setError(err.message || 'Failed to load automation dependencies.');
    }
  }, []);

  useEffect(() => {
    fetchAutomations();
    fetchDependencies();
  }, [fetchAutomations, fetchDependencies]);

  const handleOpenCreateModal = () => {
    setCurrentAutomation(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (automation: Automation) => {
    setCurrentAutomation(automation);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentAutomation(undefined);
    setError(null); // Clear modal-specific errors
  };

  const handleCreateOrUpdateAutomation = async (newOrUpdatedAutomation: Omit<Automation, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
    setError(null);
    try {
      if (currentAutomation) {
        // Update existing automation
        const updated = await apiInstance.updateAutomation(currentAutomation.id, newOrUpdatedAutomation);
        setAutomations((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      } else {
        // Create new automation
        const created = await apiInstance.createAutomation(newOrUpdatedAutomation);
        setAutomations((prev) => [...prev, created]);
      }
    } catch (err: any) {
      console.error('Failed to save automation:', err);
      throw new Error(err.message || 'Error saving automation.');
    }
  };

  const handleDeleteAutomation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this automation?')) return;
    setActionLoadingId(id);
    setError(null);
    try {
      await apiInstance.deleteAutomation(id);
      setAutomations((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      console.error('Failed to delete automation:', err);
      setError(err.message || 'Failed to delete automation.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleAutomation = async (id: string, enabled: boolean) => {
    setActionLoadingId(id);
    setError(null);
    try {
      const updated = await apiInstance.toggleAutomation(id, enabled);
      setAutomations((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    } catch (err: any) {
      console.error('Failed to toggle automation status:', err);
      setError(err.message || 'Failed to toggle automation status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleExecuteAutomation = async (id: string) => {
    setActionLoadingId(id);
    setError(null);
    try {
      const updated = await apiInstance.executeAutomation(id);
      setAutomations((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    } catch (err: any) {
      console.error('Failed to execute automation:', err);
      setError(err.message || 'Failed to execute automation.');
    } finally {
      // The mock API internally updates status to 'success' after a delay,
      // so we don't immediately clear actionLoadingId here to allow that update to show.
      // In a real app, a WebSocket or polling might update the status, and then
      // we'd clear the loading state based on that external update.
      setTimeout(() => setActionLoadingId(null), 3000); // Give some time for status update
    }
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
        <h2 className="text-2xl font-bold text-blue-300">
          <i className="fas fa-robot mr-3"></i>Automations
        </h2>
        <Button variant="primary" onClick={handleOpenCreateModal}>
          <i className="fas fa-plus mr-2"></i> New Automation
        </Button>
      </div>

      {loading && (
        <div className="text-center p-8 text-blue-400">
          <i className="fas fa-spinner fa-spin text-3xl"></i>
          <p className="mt-4 text-lg">Loading automations...</p>
        </div>
      )}

      {error && (
        <div className="text-center p-8 text-red-500">
          <i className="fas fa-exclamation-triangle text-3xl"></i>
          <p className="mt-4 text-lg">{error}</p>
          <Button variant="secondary" onClick={fetchAutomations} className="mt-4">
            Retry
          </Button>
        </div>
      )}

      {!loading && !error && automations.length === 0 && (
        <div className="text-center p-8 text-gray-400">
          <i className="fas fa-robot text-5xl opacity-50"></i>
          <p className="mt-4 text-lg">No automations configured yet.</p>
          <p className="text-md">Click "New Automation" to get started!</p>
        </div>
      )}

      <div className="grid gap-4">
        {!loading && !error && automations.map((automation) => (
          <AutomationItem
            key={automation.id}
            automation={automation}
            onEdit={handleOpenEditModal}
            onDelete={handleDeleteAutomation}
            onToggle={handleToggleAutomation}
            onExecute={handleExecuteAutomation}
            isLoading={actionLoadingId === automation.id}
          />
        ))}
      </div>

      <AutomationFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleCreateOrUpdateAutomation}
        automation={currentAutomation}
        availableAgents={availableAgents}
        availableSystemCommands={availableSystemCommands}
        availableEvents={availableEvents}
      />
    </Card>
  );
};

export default AutomationsPanel;