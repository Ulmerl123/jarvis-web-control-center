import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { cn, formatPercentage, formatRate, getStatusColor, getActivityLogLevelColor } from '@/lib/utils';
import Card from '@/components/ui/Card';

/**
 * Interface for AI Core status data.
 */
interface AICoreStatus {
  status: 'online' | 'offline' | 'degraded';
  uptime: string;
  cpuUsage: number;
  memoryUsage: number;
  temperature: number; // Celsius
  activeProcesses: number;
}

/**
 * Interface for AI Core activity log entries.
 */
interface AICoreActivity {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

/**
 * Interface for AI Core data flow statistics.
 */
interface AICoreDataFlow {
  ingressRate: number; // KB/s
  egressRate: number; // KB/s
  totalProcessed: string; // e.g., "1.2 TB"
  activeConnections: number;
}

/**
 * Comprehensive interface for all AI Core visualization data.
 */
interface AICoreData {
  status: AICoreStatus;
  activityLog: AICoreActivity[];
  dataFlow: AICoreDataFlow;
}

/**
 * Props for the AICoreVisualizer component.
 */
interface AICoreVisualizerProps {
  /**
   * The interval in milliseconds for polling AI core data.
   * @default 5000
   */
  pollingInterval?: number;
  /**
   * If true, the component will display static demo data instead of fetching from API.
   * This is useful for development or presentation without a live backend.
   * @default false
   */
  demoMode?: boolean;
}

/**
 * Default AI Core data state for initial rendering or when data is not available.
 */
const defaultAICoreData: AICoreData = {
  status: {
    status: 'offline',
    uptime: 'N/A',
    cpuUsage: 0,
    memoryUsage: 0,
    temperature: 0,
    activeProcesses: 0,
  },
  activityLog: [],
  dataFlow: {
    ingressRate: 0,
    egressRate: 0,
    totalProcessed: '0 TB',
    activeConnections: 0,
  },
};

/**
 * AICoreVisualizer component provides a comprehensive dashboard for monitoring
 * the status, activity, and data flow of the AI core. It supports dynamic updates
 * through polling and displays data in a futuristic, informative manner.
 *
 * @param {AICoreVisualizerProps} props - The props for the component.
 * @returns {React.FC} The AICoreVisualizer component.
 */
const AICoreVisualizer: React.FC<AICoreVisualizerProps> = ({
  pollingInterval = 5000,
  demoMode = false,
}) => {
  const [coreData, setCoreData] = useState<AICoreData>(defaultAICoreData);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches the AI core data from the API or generates demo data.
   * Updates the component state with the fetched data, handling loading and error states.
   * Uses useCallback to memoize the function and prevent unnecessary re-creations.
   */
  const fetchCoreData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (demoMode) {
        // Simulate demo data for visualization
        const demoStatus: AICoreStatus = {
          status: Math.random() > 0.15 ? 'online' : (Math.random() > 0.5 ? 'degraded' : 'offline'),
          uptime: `${Math.floor(Math.random() * 7) + 1}d ${Math.floor(Math.random() * 23)}h ${Math.floor(Math.random() * 59)}m`,
          cpuUsage: parseFloat((Math.random() * (90 - 10) + 10).toFixed(1)),
          memoryUsage: parseFloat((Math.random() * (85 - 20) + 20).toFixed(1)),
          temperature: parseFloat((Math.random() * (70 - 40) + 40).toFixed(1)),
          activeProcesses: Math.floor(Math.random() * 50) + 10,
        };

        const demoActivityLog: AICoreActivity[] = [
          { timestamp: new Date().toLocaleTimeString('de-DE'), level: 'info', message: 'System diagnostics complete.' },
          { timestamp: new Date().toLocaleTimeString('de-DE'), level: 'success', message: 'Data pipeline synced successfully.' },
          { timestamp: new Date().toLocaleTimeString('de-DE'), level: 'warn', message: 'Resource allocation nearing threshold.' },
          { timestamp: new Date().toLocaleTimeString('de-DE'), level: 'error', message: 'Agent "Sentinel" reported critical failure.' },
          { timestamp: new Date().toLocaleTimeString('de-DE'), level: 'info', message: 'New directive received: "Optimize neural network".' },
          { timestamp: new Date().toLocaleTimeString('de-DE'), level: 'info', message: 'Thermal regulators functioning optimally.' },
          { timestamp: new Date().toLocaleTimeString('de-DE'), level: 'warn', message: 'External connection latency detected.' },
          { timestamp: new Date().toLocaleTimeString('de-DE'), level: 'info', message: 'Security protocol update initiated.' },
        ].sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 5) + 2); // Random number of recent activities

        const demoDataFlow: AICoreDataFlow = {
          ingressRate: parseFloat((Math.random() * 120).toFixed(2)),
          egressRate: parseFloat((Math.random() * 90).toFixed(2)),
          totalProcessed: `${(Math.random() * 5 + 0.1).toFixed(2)} TB`,
          activeConnections: Math.floor(Math.random() * 20) + 5,
        };

        setCoreData({ status: demoStatus, activityLog: demoActivityLog, dataFlow: demoDataFlow });
      } else {
        // Fetch real data from the API client
        const data = await api.fetchAICoreData();
        setCoreData(data);
      }
    } catch (err) {
      console.error('Failed to fetch AI Core data:', err);
      // More specific error messages could be implemented based on error type
      setError('Failed to load AI Core data. Please check connection or try again.');
    } finally {
      setIsLoading(false);
    }
  }, [demoMode]);

  /**
   * useEffect hook to manage initial data fetching and periodic polling.
   * Cleans up the interval on component unmount to prevent memory leaks.
   */
  useEffect(() => {
    fetchCoreData(); // Initial fetch when component mounts

    const intervalId = setInterval(() => {
      fetchCoreData(); // Poll for updates at the specified interval
    }, pollingInterval);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [fetchCoreData, pollingInterval]); // Dependencies for useEffect

  const { status, activityLog, dataFlow } = coreData;

  /**
   * Helper function to render a progress bar for system metrics.
   * @param {number} value - The current value (0-100) for the progress bar.
   * @param {string} colorClass - Tailwind CSS class for the progress bar color.
   * @param {string} label - The label for the metric (e.g., "CPU Usage").
   * @returns {JSX.Element} A React fragment containing the progress bar.
   */
  const renderProgressBar = (value: number, colorClass: string, label: string) => (
    <div className="mb-3">
      <div className="flex justify-between text-xs text-gray-300 mb-1">
        <span>{label}</span>
        <span>{formatPercentage(value)}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500 ease-out", colorClass)}
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );

  return (
    <Card className="p-6 h-full flex flex-col futuristic-card-bg">
      <h2 className="text-3xl font-bold text-teal-400 mb-8 text-center tracking-wide uppercase neon-text-light">
        AI Core Visualization
      </h2>

      {isLoading && !coreData.status.status ? (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <i className="fas fa-spinner fa-spin text-4xl mr-3 motion-safe:animate-spin"></i>
          <span className="text-lg">Loading AI Core Data...</span>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center text-red-500 text-lg p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
          <i className="fas fa-exclamation-triangle mr-3 text-2xl"></i>
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
          {/* AI Core Status Section */}
          <Card className="p-4 bg-gray-800/60 border border-teal-600/30 rounded-lg shadow-lg flex flex-col justify-between" data-aos="fade-up">
            <h3 className="text-xl font-semibold text-teal-300 mb-4 tracking-wide neon-text-small">Core Status</h3>
            <div className="text-gray-300 space-y-3 text-sm font-mono flex-grow">
              <div className="flex items-center justify-between">
                <span>Status:</span>
                <span className={cn("font-bold text-base", getStatusColor(status.status))}>
                  <i className={cn("mr-2", {
                    'fas fa-circle-check': status.status === 'online',
                    'fas fa-triangle-exclamation': status.status === 'degraded',
                    'fas fa-circle-xmark': status.status === 'offline',
                  })}></i>
                  {status.status.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Uptime:</span>
                <span className="text-white">{status.uptime}</span>
              </div>
              <div className="flex justify-between">
                <span>Temperature:</span>
                <span className={cn("text-white", {
                  'text-red-400 glow-red': status.temperature > 65,
                  'text-yellow-400 glow-yellow': status.temperature > 50 && status.temperature <= 65,
                })}>
                  {status.temperature.toFixed(1)}°C
                </span>
              </div>
              <div className="flex justify-between">
                <span>Active Processes:</span>
                <span className="text-white">{status.activeProcesses}</span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-700">
              {renderProgressBar(status.cpuUsage, 'bg-blue-500 glow-blue-sm', 'CPU Usage')}
              {renderProgressBar(status.memoryUsage, 'bg-purple-500 glow-purple-sm', 'Memory Usage')}
            </div>
          </Card>

          {/* Data Flow Section */}
          <Card className="p-4 bg-gray-800/60 border border-teal-600/30 rounded-lg shadow-lg flex flex-col justify-between" data-aos="fade-up" data-aos-delay="100">
            <h3 className="text-xl font-semibold text-teal-300 mb-4 tracking-wide neon-text-small">Data Flow</h3>
            <div className="text-gray-300 space-y-4 text-sm font-mono flex-grow">
              <div className="flex items-center justify-between">
                <span>Ingress Rate:</span>
                <span className="text-green-400 glow-green-sm text-lg flex items-center">
                  <i className="fas fa-download mr-2 animate-pulse-light"></i> {formatRate(dataFlow.ingressRate)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Egress Rate:</span>
                <span className="text-blue-400 glow-blue-sm text-lg flex items-center">
                  <i className="fas fa-upload mr-2 animate-pulse-light"></i> {formatRate(dataFlow.egressRate)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total Processed:</span>
                <span className="text-white text-lg">{dataFlow.totalProcessed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Active Connections:</span>
                <span className="text-white text-lg">{dataFlow.activeConnections}</span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-700">
              <div className="h-4 bg-gradient-to-r from-teal-800 via-purple-800 to-blue-800 rounded-full relative overflow-hidden">
                {/* Visual indicator for data flow animation */}
                <div className="absolute inset-0 bg-[length:200%_100%] animate-data-flow-pulse" 
                     style={{backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)'}}></div>
              </div>
            </div>
          </Card>

          {/* Activity Log Section */}
          <Card className="p-4 bg-gray-800/60 border border-teal-600/30 rounded-lg shadow-lg flex flex-col col-span-1 md:col-span-2 lg:col-span-1" data-aos="fade-up" data-aos-delay="200">
            <h3 className="text-xl font-semibold text-teal-300 mb-4 tracking-wide neon-text-small">Activity Log</h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar text-sm font-mono pr-2">
              {activityLog.length > 0 ? (
                activityLog.map((activity, index) => (
                  <div key={index} className="flex items-start mb-2 last:mb-0 bg-gray-900/30 p-2 rounded-md hover:bg-gray-700/40 transition-colors duration-200">
                    <span className={cn("text-xs w-16 flex-shrink-0 uppercase", getActivityLogLevelColor(activity.level))}>
                      [{activity.level.substring(0, 4)}]
                    </span>
                    <span className="text-gray-500 mx-2 flex-shrink-0">{activity.timestamp}</span>
                    <span className="text-gray-200 flex-grow break-words">{activity.message}</span>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-center py-4">No recent activity to display.</div>
              )}
            </div>
          </Card>
        </div>
      )}
    </Card>
  );
};

export default AICoreVisualizer;