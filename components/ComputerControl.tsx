import React, { useState, useEffect, useCallback } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import { fetchComputerStatus, executeSystemCommand, shutdownComputer, restartComputer, sleepComputer } from '../lib/api';
import { classNames } from '../lib/utils'; // Assuming classNames utility exists

/**
 * Interface for computer status data.
 */
interface ComputerStatus {
  cpuUsage: number;
  memoryUsage: number; // in percentage
  diskUsage: number; // in percentage
  networkActivity: {
    upload: number; // KB/s
    download: number; // KB/s
  };
  temperature: number; // Celsius
  uptime: number; // seconds
  os: string;
  architecture: string;
  hostname: string;
}

/**
 * Interface for a system command.
 */
interface SystemCommand {
  name: string;
  command: string;
  description: string;
}

/**
 * ComputerControl component provides an interface for direct control over computer functions,
 * such as system commands, power options, and hardware monitoring.
 */
const ComputerControl: React.FC = () => {
  const [status, setStatus] = useState<ComputerStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [commandOutput, setCommandOutput] = useState<string>('');
  const [commandLoading, setCommandLoading] = useState<boolean>(false);
  const [commandError, setCommandError] = useState<string | null>(null);
  const [powerActionLoading, setPowerActionLoading] = useState<string | null>(null); // 'shutdown', 'restart', 'sleep'

  // Predefined common system commands
  const commonSystemCommands: SystemCommand[] = [
    { name: 'List Directory (Current)', command: 'ls -la', description: 'Lists files and directories in the current working directory.' },
    { name: 'Show Running Processes', command: 'ps aux', description: 'Displays all running processes on the system.' },
    { name: 'Ping Google', command: 'ping -c 4 google.com', description: 'Pings google.com 4 times to check network connectivity.' },
    { name: 'Free Disk Space', command: 'df -h', description: 'Shows information about disk space usage.' },
    { name: 'System Info (Linux)', command: 'uname -a', description: 'Displays detailed system information (Linux/Unix).' },
    { name: 'Environment Variables', command: 'printenv', description: 'Lists all environment variables.' },
  ];

  /**
   * Fetches the computer's status from the API.
   */
  const getComputerStatus = useCallback(async () => {
    setLoadingStatus(true);
    setErrorStatus(null);
    try {
      const data = await fetchComputerStatus();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch computer status:', error);
      setErrorStatus(`Failed to fetch computer status: ${(error as Error).message}`);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    getComputerStatus();
    const interval = setInterval(getComputerStatus, 5000); // Refresh status every 5 seconds
    return () => clearInterval(interval);
  }, [getComputerStatus]);

  /**
   * Executes a system command via the API.
   * @param {string} command - The command string to execute.
   */
  const handleExecuteCommand = async (command: string) => {
    setCommandLoading(true);
    setCommandError(null);
    setCommandOutput('');
    try {
      const output = await executeSystemCommand(command);
      setCommandOutput(output);
    } catch (error) {
      console.error(`Failed to execute command "${command}":`, error);
      setCommandError(`Failed to execute command: ${(error as Error).message}`);
      setCommandOutput(`Error: ${(error as Error).message}`);
    } finally {
      setCommandLoading(false);
    }
  };

  /**
   * Handles a power action (shutdown, restart, sleep).
   * @param {'shutdown' | 'restart' | 'sleep'} action - The power action to perform.
   */
  const handlePowerAction = async (action: 'shutdown' | 'restart' | 'sleep') => {
    if (!confirm(`Are you sure you want to ${action} the computer? This action is irreversible.`)) {
      return;
    }

    setPowerActionLoading(action);
    try {
      let result;
      if (action === 'shutdown') {
        result = await shutdownComputer();
      } else if (action === 'restart') {
        result = await restartComputer();
      } else { // 'sleep'
        result = await sleepComputer();
      }
      setCommandOutput(`Command sent: ${action} - ${result.message}`);
    } catch (error) {
      console.error(`Failed to ${action} computer:`, error);
      setCommandError(`Failed to ${action} computer: ${(error as Error).message}`);
    } finally {
      setPowerActionLoading(null);
    }
  };

  /**
   * Formats uptime from seconds to a human-readable string.
   * @param {number} seconds - The uptime in seconds.
   * @returns {string} Human-readable uptime string.
   */
  const formatUptime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return 'N/A';
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 || parts.length === 0) parts.push(`${s}s`); // Ensure at least seconds are shown if no other unit
    return parts.join(' ');
  };

  /**
   * Determines the color class for a usage percentage.
   * @param {number} percentage - The usage percentage.
   * @returns {string} Tailwind CSS class for text color.
   */
  const getUsageColor = (percentage: number): string => {
    if (percentage > 85) return 'text-red-400';
    if (percentage > 70) return 'text-orange-400';
    return 'text-green-400';
  };

  return (
    <div className="space-y-6">
      <Card title="Computer Status & Monitoring">
        {loadingStatus ? (
          <p className="text-gray-400">Loading computer status...</p>
        ) : errorStatus ? (
          <p className="text-red-400">{errorStatus}</p>
        ) : status ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="flex flex-col">
              <span className="text-gray-300">OS:</span>
              <span className="font-semibold text-white">{status.os} ({status.architecture})</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-300">Hostname:</span>
              <span className="font-semibold text-white">{status.hostname}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-300">Uptime:</span>
              <span className="font-semibold text-white">{formatUptime(status.uptime)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-300">CPU Usage:</span>
              <span className={classNames("font-semibold", getUsageColor(status.cpuUsage))}>
                {status.cpuUsage.toFixed(1)}%
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-300">Memory Usage:</span>
              <span className={classNames("font-semibold", getUsageColor(status.memoryUsage))}>
                {status.memoryUsage.toFixed(1)}%
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-300">Disk Usage:</span>
              <span className={classNames("font-semibold", getUsageColor(status.diskUsage))}>
                {status.diskUsage.toFixed(1)}%
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-300">Network (Up/Down):</span>
              <span className="font-semibold text-white">
                {status.networkActivity.upload.toFixed(2)} KB/s / {status.networkActivity.download.toFixed(2)} KB/s
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-300">Temperature:</span>
              <span className={classNames("font-semibold", getUsageColor(status.temperature > 70 ? 90 : status.temperature > 60 ? 75 : 50))}>
                {status.temperature.toFixed(1)}°C
              </span>
            </div>
          </div>
        ) : (
          <p className="text-gray-400">No status data available.</p>
        )}
      </Card>

      <Card title="System Commands">
        <p className="text-gray-400 mb-4 text-sm">Execute pre-defined or custom system commands on the connected machine.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {commonSystemCommands.map((cmd) => (
            <Button
              key={cmd.name}
              onClick={() => handleExecuteCommand(cmd.command)}
              disabled={commandLoading}
              variant="secondary"
              className="group relative flex flex-col items-start justify-center p-3 text-left h-full"
            >
              <span className="text-indigo-300 text-base font-medium">{cmd.name}</span>
              <span className="text-gray-400 text-xs mt-1 leading-tight group-hover:text-gray-300 transition-colors">{cmd.description}</span>
              {commandLoading && (
                <span className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 rounded-md">
                  <i className="fas fa-spinner fa-spin text-indigo-400 text-lg"></i>
                </span>
              )}
            </Button>
          ))}
        </div>

        <div className="mt-6">
          <label htmlFor="customCommand" className="block text-gray-300 text-sm font-medium mb-2">Custom Command:</label>
          <div className="flex space-x-2">
            <input
              id="customCommand"
              type="text"
              placeholder="Enter custom command (e.g., 'echo Hello JARVIS')"
              className="flex-grow p-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleExecuteCommand((e.target as HTMLInputElement).value);
                }
              }}
            />
            <Button
              onClick={() => handleExecuteCommand((document.getElementById('customCommand') as HTMLInputElement).value)}
              disabled={commandLoading}
              variant="primary"
            >
              {commandLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-terminal"></i>} Execute
            </Button>
          </div>
        </div>

        {commandError && (
          <p className="text-red-400 mt-4 text-sm">Error: {commandError}</p>
        )}
        {commandOutput && (
          <div className="bg-gray-800 p-4 rounded-md mt-4 font-mono text-sm text-green-300 whitespace-pre-wrap max-h-60 overflow-y-auto border border-gray-700">
            {commandOutput}
          </div>
        )}
      </Card>

      <Card title="Power Options">
        <p className="text-gray-400 mb-4 text-sm">Control the power state of the connected computer.</p>
        <div className="flex flex-wrap gap-4">
          <Button
            onClick={() => handlePowerAction('shutdown')}
            disabled={!!powerActionLoading}
            variant="danger"
            className="flex items-center space-x-2"
          >
            {powerActionLoading === 'shutdown' ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-power-off"></i>}
            <span>Shutdown</span>
          </Button>
          <Button
            onClick={() => handlePowerAction('restart')}
            disabled={!!powerActionLoading}
            variant="warning"
            className="flex items-center space-x-2"
          >
            {powerActionLoading === 'restart' ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-redo"></i>}
            <span>Restart</span>
          </Button>
          <Button
            onClick={() => handlePowerAction('sleep')}
            disabled={!!powerActionLoading}
            variant="secondary"
            className="flex items-center space-x-2"
          >
            {powerActionLoading === 'sleep' ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-moon"></i>}
            <span>Sleep</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ComputerControl;