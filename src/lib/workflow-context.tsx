"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from "react";
import {
  type DemoScenario,
  type OptimizationTaskStatus,
  type EscrowContract,
  type OptimizationPipelineStep,
  SCENARIO_GLADSTONE_DHAMRA,
  ALL_DEMO_SCENARIOS,
  getScenarioById,
} from "./demo-scenarios";
import {
  deriveOptimizationAndRecommendation,
  type DerivedWorkflowState,
} from "./demo-engine";
import { AI_ENABLED, applyAiOverlay, fetchAiResult, requestKey, type AiResult } from "./ai-client";
import type { Recommendation, VoyageRoute } from "./types";

export interface CustomProcurementRequest {
  commodity: string;
  quantityMt: number;
  originPortName: string;
  candidateDischargePorts: string[];
  selectedDischargePortName: string;
  targetSteelPlant: string;
  laycanStart: string;
  laycanEnd: string;
  numberOfVoyages: number;
  contractDurationMonths: number | null;
  scenarioId: string;
}

interface WorkflowContextValue {
  scenarioId: string;
  activeScenario: DemoScenario;
  customRequest: CustomProcurementRequest;
  derivedState: DerivedWorkflowState;
  taskStatus: OptimizationTaskStatus;
  recommendation: DerivedWorkflowState["recommendation"];
  lockedFixture: DerivedWorkflowState["lockedFixture"];
  escrowContract: EscrowContract;
  trackingRoute: DerivedWorkflowState["trackingRoute"];
  isOptimizing: boolean;
  activeStep: OptimizationPipelineStep | "NOT_STARTED" | "COMPLETE";
  setActiveStep: (step: OptimizationPipelineStep | "NOT_STARTED" | "COMPLETE") => void;
  isFixtureLocked: boolean;
  selectedVesselClass: string | null;
  selectScenario: (id: string) => void;
  updateRequest: (req: Partial<CustomProcurementRequest>) => void;
  runOptimization: (overrides?: Partial<CustomProcurementRequest>) => Promise<string>;
  setSelectedVesselClass: (vesselClass: string) => void;
  lockFixture: (pin?: string) => Promise<string>;
  advanceMilestone: (milestoneId: number) => void;
  resetWorkflow: () => void;
}

const WorkflowContext = createContext<WorkflowContextValue | undefined>(undefined);

const WORKFLOW_STORAGE_KEY = "voyageai-pro-active-workflow-v3";

function getDefaultRequestForScenario(sc: DemoScenario): CustomProcurementRequest {
  return {
    commodity: sc.request.commodity,
    quantityMt: sc.request.quantityMt,
    originPortName: sc.request.originPortName,
    candidateDischargePorts: sc.request.candidateDischargePorts,
    selectedDischargePortName: sc.request.selectedDischargePortName,
    targetSteelPlant: sc.request.targetSteelPlant,
    laycanStart: sc.request.laycanStart,
    laycanEnd: sc.request.laycanEnd,
    numberOfVoyages: sc.request.numberOfVoyages,
    contractDurationMonths: sc.request.contractDurationMonths,
    scenarioId: sc.id,
  };
}

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [scenarioId, setScenarioId] = useState<string>("scenario-gladstone-dhamra");
  const [customRequest, setCustomRequest] = useState<CustomProcurementRequest>(() =>
    getDefaultRequestForScenario(SCENARIO_GLADSTONE_DHAMRA)
  );
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<OptimizationPipelineStep | "NOT_STARTED" | "COMPLETE">("NOT_STARTED");
  const [isFixtureLocked, setIsFixtureLocked] = useState<boolean>(false);
  const [selectedVesselClass, setSelectedVesselClass] = useState<string | null>(null);
  const [customEscrow, setCustomEscrow] = useState<EscrowContract | null>(null);

  const activeScenario = getScenarioById(scenarioId);

  // Live AI decision engine (optional). Falls back to the deterministic demo engine when disabled/unreachable.
  const [aiResult, setAiResult] = useState<{ key: string; result: AiResult } | null>(null);
  useEffect(() => {
    if (!AI_ENABLED) return;
    let alive = true;
    const key = requestKey(customRequest);
    fetchAiResult(customRequest).then((result) => {
      if (alive && result) setAiResult({ key, result });
    });
    return () => {
      alive = false;
    };
  }, [customRequest]);

  // Compute authoritative derived state from customRequest & activeScenario (+ AI overlay when it matches)
  const derivedState = useMemo(() => {
    const base = deriveOptimizationAndRecommendation(customRequest, activeScenario);
    if (aiResult && aiResult.key === requestKey(customRequest)) {
      return applyAiOverlay(base, aiResult.result);
    }
    return base;
  }, [customRequest, activeScenario, aiResult]);

  // Use customEscrow if user advanced milestones, else fallback to derived escrow
  const escrowContract: EscrowContract = useMemo(() => {
    if (customEscrow) {
      return {
        ...customEscrow,
        twoFactorVerified: isFixtureLocked,
      };
    }
    return {
      ...derivedState.escrow,
      twoFactorVerified: isFixtureLocked,
    };
  }, [customEscrow, derivedState.escrow, isFixtureLocked]);

  // Restore saved workflow state on client hydration
  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(WORKFLOW_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.scenarioId) setScenarioId(parsed.scenarioId);
        if (parsed.customRequest) setCustomRequest(parsed.customRequest);
        if (typeof parsed.isFixtureLocked === "boolean") setIsFixtureLocked(parsed.isFixtureLocked);
        if (parsed.selectedVesselClass) setSelectedVesselClass(parsed.selectedVesselClass);
        if (parsed.customEscrow) setCustomEscrow(parsed.customEscrow);
        if (parsed.activeStep) setActiveStep(parsed.activeStep);
      }
    } catch {
      // fallback smoothly
    }
  }, []);

  // Save changes to sessionStorage
  useEffect(() => {
    try {
      window.sessionStorage.setItem(
        WORKFLOW_STORAGE_KEY,
        JSON.stringify({
          scenarioId,
          customRequest,
          isFixtureLocked,
          selectedVesselClass,
          customEscrow,
          activeStep,
        })
      );
    } catch {
      // silent catch for private browsing quotas
    }
  }, [scenarioId, customRequest, isFixtureLocked, selectedVesselClass, customEscrow, activeStep]);

  function selectScenario(id: string) {
    const sc = getScenarioById(id);
    const newReq = getDefaultRequestForScenario(sc);
    setScenarioId(id);
    setCustomRequest(newReq);
    setIsFixtureLocked(false);
    setSelectedVesselClass(null);
    setCustomEscrow(null);
    setActiveStep("NOT_STARTED");
  }

  function updateRequest(req: Partial<CustomProcurementRequest>) {
    setCustomRequest((prev) => ({
      ...prev,
      ...req,
    }));
    // Reset custom escrow if request economics changed
    setCustomEscrow(null);
  }

  async function runOptimization(overrides?: Partial<CustomProcurementRequest>): Promise<string> {
    setIsOptimizing(true);
    setActiveStep("PREDICT");

    if (overrides) {
      updateRequest(overrides);
    }

    return derivedState.task.taskId || "8f7e2c1a";
  }

  async function lockFixture(pin = "123456"): Promise<string> {
    setIsFixtureLocked(true);
    setCustomEscrow((prev) => {
      const base = prev || derivedState.escrow;
      return {
        ...base,
        twoFactorVerified: true,
        verifiedAt: new Date().toISOString(),
        verifiedBy: "Captain Rajesh Nair (Chartering Manager)",
      };
    });
    return derivedState.lockedFixture.contractId;
  }

  function advanceMilestone(milestoneId: number) {
    setCustomEscrow((prev) => {
      const base = prev || derivedState.escrow;
      const updatedMilestones = base.milestones.map((m) => {
        if (m.id === milestoneId) {
          return {
            ...m,
            status: "Completed" as const,
            unlockedAt: new Date().toISOString(),
          };
        }
        if (m.id === milestoneId + 1 && m.status === "Pending") {
          return {
            ...m,
            status: "Active" as const,
          };
        }
        return m;
      });
      return {
        ...base,
        milestones: updatedMilestones,
      };
    });
  }

  function resetWorkflow() {
    selectScenario("scenario-gladstone-dhamra");
    setIsFixtureLocked(false);
    setIsOptimizing(false);
    setCustomEscrow(null);
    setActiveStep("NOT_STARTED");
  }

  return (
    <WorkflowContext.Provider
      value={{
        scenarioId,
        activeScenario,
        customRequest,
        derivedState,
        taskStatus: derivedState.task,
        recommendation: derivedState.recommendation,
        lockedFixture: derivedState.lockedFixture,
        escrowContract,
        trackingRoute: derivedState.trackingRoute,
        isOptimizing,
        activeStep,
        setActiveStep,
        isFixtureLocked,
        selectedVesselClass,
        selectScenario,
        updateRequest,
        runOptimization,
        setSelectedVesselClass,
        lockFixture,
        advanceMilestone,
        resetWorkflow,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error("useWorkflow must be used within a WorkflowProvider");
  }
  return context;
}

