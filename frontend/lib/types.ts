export type RunStatus = "running" | "paused" | "completed" | "terminated";

export interface Supervisor {
  id: string;
  name: string;
  base_instruction: string;
  available_tools: string[];
  default_wake_up_behavior?: Record<string, unknown> | null;
  model_config?: Record<string, unknown> | null;
  wake_up_guidance?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupervisorCreateInput {
  name: string;
  base_instruction: string;
  available_tools: string[];
  default_wake_up_behavior?: Record<string, unknown> | null;
  model_config?: Record<string, unknown> | null;
  wake_up_guidance?: string | null;
}

export interface WorkflowRun {
  id: string;
  supervisor_id: string;
  order_id: string;
  temporal_workflow_id: string;
  status: RunStatus;
  current_state: Record<string, unknown>;
  memory_summary?: string | null;
  next_wake_up_at?: string | null;
  created_at: string;
  completed_at?: string | null;
  final_output?: Record<string, unknown> | null;
}

export interface TimelineEvent {
  id: string;
  run_id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  action_taken?: Record<string, unknown> | null;
  created_at: string;
}

export interface RunInstruction {
  id: string;
  run_id: string;
  instruction: string;
  created_at: string;
}

export interface AgentAction {
  id: string;
  run_id: string;
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_output?: Record<string, unknown> | null;
  reasoning?: string | null;
  created_at: string;
}

export interface MemoryResponse {
  run_id: string;
  compact_summary: string | null;
  recent_events: TimelineEvent[];
  sleep_state: string;
  next_wake_up: string | null;
}

export interface EventCreateInput {
  event_type: string;
  event_data?: Record<string, unknown>;
}

export interface RunCreateInput {
  supervisor_id: string;
  order_id: string;
}

export const EVENT_TYPES = [
  "order_created",
  "payment_confirmed",
  "payment_failed",
  "shipment_created",
  "shipment_delayed",
  "delivered",
  "refund_requested",
  "customer_message_received",
  "no_update_for_n_hours",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const AVAILABLE_TOOLS = [
  "send_customer_message",
  "create_internal_note",
  "escalate_issue",
  "mark_for_review",
  "schedule_wake_up",
  "close_workflow",
] as const;

export type AvailableTool = (typeof AVAILABLE_TOOLS)[number];