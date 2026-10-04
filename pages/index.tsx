import React, { useEffect, useState, useCallback } from "react";
import type { NextPage } from "next";
import Head from "next/head";

import Layout from "@/components/Layout";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

import AICoreVisualizer from "@/components/AICoreVisualizer";
import AgentOrchestration from "@/components/AgentOrchestration";
import TaskManager from "@/components/TaskManager";
import ComputerControl from "@/components/ComputerControl";
import FileManager from "@/components/FileManager";
import AutomationsPanel from "@/components/AutomationsPanel";

import * as api from "@/lib/api";

/**
 * Dashboard data fetched from the backend.
 */
interface DashboardData {
  aiCoreStatus?: Record<string, unknown>;
  agents?: Array<Record<string, unknown>>;
  tasks?: Array<Record<string, unknown>>;
}

/**
 * Home page component – the central dashboard of the JARVIS web interface.
 */
const HomePage: NextPage = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState<boolean>(false);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [aiCoreStatus, agents, tasks] = await Promise.all([
        api.fetchAICoreStatus(),
        api.fetchAgents(),
        api.fetchTasks(),
      ]);
      setDashboardData({ aiCoreStatus, agents, tasks });
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      setError("Unable to load dashboard data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const toggleDemoMode = () => setDemoMode((prev) => !prev);

  return (
    <>
      <Head>
        <title>JARVIS Dashboard</title>
        <meta name="description" content="Personal digital control center powered by AI." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout>
        <div className="flex flex-col gap-6 p-4 md:p-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
              JARVIS Control Center
            </h1>
            <Button onClick={toggleDemoMode} variant={demoMode ? "secondary" : "primary"}>
              {demoMode ? "Disable Demo Mode" : "Enable Demo Mode"}
            </Button>
          </div>

          {error && (
            <Card className="bg-red-100 border border-red-300 text-red-800">
              <p>{error}</p>
            </Card>
          )}

          {loading ? (
            <div className="flex justify-center py-10">
              <svg
                className="animate-spin h-8 w-8 text-gray-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {/* AI Core Visualizer */}
              <Card className="col-span-1 xl:col-span-2">
                <AICoreVisualizer
                  status={dashboardData.aiCoreStatus}
                  demoMode={demoMode}
                />
              </Card>

              {/* Agent Orchestration */}
              <Card className="col-span-1">
                <AgentOrchestration
                  agents={dashboardData.agents}
                  demoMode={demoMode}
                />
              </Card>

              {/* Task Manager */}
              <Card className="col-span-1">
                <TaskManager
                  tasks={dashboardData.tasks}
                  demoMode={demoMode}
                />
              </Card>

              {/* Computer Control */}
              <Card className="col-span-1">
                <ComputerControl demoMode={demoMode} />
              </Card>

              {/* File Manager */}
              <Card className="col-span-1">
                <FileManager demoMode={demoMode} />
              </Card>

              {/* Automations Panel */}
              <Card className="col-span-1">
                <AutomationsPanel demoMode={demoMode} />
              </Card>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
};

export default HomePage;