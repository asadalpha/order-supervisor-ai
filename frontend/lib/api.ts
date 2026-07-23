import type {
  AgentAction,
  EventCreateInput,
  MemoryResponse,
  RunCreateInput,
  RunInstruction,
  RunStatus,
  Supervisor,
  SupervisorCreateInput,
  TimelineEvent,
  WorkflowRun,
} from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => response.statusText);
    throw new ApiError(detail || response.statusText, response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  supervisors: {
    list: () => request<Supervisor[]>("/api/supervisors"),
    create: (data: SupervisorCreateInput) =>
      request<Supervisor>("/api/supervisors", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    get: (id: string) => request<Supervisor>(`/api/supervisors/${id}`),
  },

  runs: {
    list: (status?: RunStatus) =>
      request<WorkflowRun[]>(
        `/api/runs${status ? `?status_filter=${status}` : ""}`,
      ),
    create: (data: RunCreateInput) =>
      request<WorkflowRun>("/api/runs", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    get: (id: string) => request<WorkflowRun>(`/api/runs/${id}`),
    timeline: (id: string) =>
      request<TimelineEvent[]>(`/api/runs/${id}/timeline`),
    memory: (id: string) =>
      request<MemoryResponse>(`/api/runs/${id}/memory`),
    instructions: (id: string) =>
      request<RunInstruction[]>(`/api/runs/${id}/instructions`).catch(
        () => [] as RunInstruction[],
      ),
    actions: (id: string) =>
      request<AgentAction[]>(`/api/runs/${id}/actions`).catch(
        () => [] as AgentAction[],
      ),
    injectEvent: (id: string, event: EventCreateInput) =>
      request<{ status: string }>(`/api/runs/${id}/events`, {
        method: "POST",
        body: JSON.stringify(event),
      }),
    addInstruction: (id: string, instruction: string) =>
      request<RunInstruction>(`/api/runs/${id}/instructions`, {
        method: "POST",
        body: JSON.stringify({ instruction }),
      }),
    interrupt: (id: string) =>
      request<{ status: string }>(`/api/runs/${id}/interrupt`, {
        method: "POST",
      }),
    resume: (id: string) =>
      request<{ status: string }>(`/api/runs/${id}/resume`, {
        method: "POST",
      }),
    terminate: (id: string, reason = "manual") =>
      request<{ status: string }>(`/api/runs/${id}/terminate`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
  },

  events: {
    templates: () =>
      request<Record<string, Record<string, unknown>>>("/api/events/templates"),
  },
};