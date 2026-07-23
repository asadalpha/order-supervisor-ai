"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  EventCreateInput,
  RunCreateInput,
  RunStatus,
} from "@/lib/types";

export const RUNS_KEY = ["runs"] as const;

export function useRuns(status?: RunStatus) {
  return useQuery({
    queryKey: status ? ["runs", status] : RUNS_KEY,
    queryFn: () => api.runs.list(status),
  });
}

export function useRun(id: string | undefined) {
  return useQuery({
    queryKey: ["run", id],
    queryFn: () => api.runs.get(id as string),
    enabled: !!id,
    refetchInterval: (q) =>
      q.state.data?.status === "running" || q.state.data?.status === "paused"
        ? 5_000
        : false,
  });
}

export function useTimeline(id: string | undefined) {
  return useQuery({
    queryKey: ["timeline", id],
    queryFn: () => api.runs.timeline(id as string),
    enabled: !!id,
    refetchInterval: 5_000,
  });
}

export function useMemory(id: string | undefined) {
  return useQuery({
    queryKey: ["memory", id],
    queryFn: () => api.runs.memory(id as string),
    enabled: !!id,
    refetchInterval: 5_000,
  });
}

export function useInstructions(id: string | undefined) {
  return useQuery({
    queryKey: ["instructions", id],
    queryFn: () => api.runs.instructions(id as string),
    enabled: !!id,
  });
}

export function useActions(id: string | undefined) {
  return useQuery({
    queryKey: ["actions", id],
    queryFn: () => api.runs.actions(id as string),
    enabled: !!id,
    refetchInterval: 5_000,
  });
}

export function useCreateRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RunCreateInput) => api.runs.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: RUNS_KEY }),
  });
}

export function useInjectEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      runId,
      event,
    }: {
      runId: string;
      event: EventCreateInput;
    }) => api.runs.injectEvent(runId, event),
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ["timeline", vars.runId] }),
  });
}

export function useAddInstruction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      runId,
      instruction,
    }: {
      runId: string;
      instruction: string;
    }) => api.runs.addInstruction(runId, instruction),
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ["instructions", vars.runId] }),
  });
}

export function useTerminateRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      runId,
      reason,
    }: {
      runId: string;
      reason?: string;
    }) => api.runs.terminate(runId, reason),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["run", vars.runId] });
      qc.invalidateQueries({ queryKey: RUNS_KEY });
    },
  });
}

export function useInterruptRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (runId: string) => api.runs.interrupt(runId),
    onSuccess: (_, runId) => {
      qc.invalidateQueries({ queryKey: ["run", runId] });
      qc.invalidateQueries({ queryKey: RUNS_KEY });
    },
  });
}

export function useResumeRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (runId: string) => api.runs.resume(runId),
    onSuccess: (_, runId) => {
      qc.invalidateQueries({ queryKey: ["run", runId] });
      qc.invalidateQueries({ queryKey: RUNS_KEY });
    },
  });
}