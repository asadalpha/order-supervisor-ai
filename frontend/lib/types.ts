export type RunStatus = "running" | "paused" | "completed" | "terminated";

export const AVAILABLE_TOOLS = [
  "message_fulfillment_team",
  "message_payments_team",
  "message_logistics_team",
  "message_customer",
  "create_internal_note",
  "schedule_wake_up",
  "escalate_issue",
  "close_workflow",
] as const;

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
  supervisor?: Supervisor;
}

export type Run = WorkflowRun;

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
  compact_summary?: string | null;
  recent_events: TimelineEvent[];
  sleep_state: string;
  next_wake_up?: string | null;
}

export interface RunCreateInput {
  supervisor_id: string;
  order_id: string;
}

export interface EventCreateInput {
  event_type: string;
  event_data: Record<string, unknown>;
}

export interface InstructionCreateInput {
  instruction: string;
}