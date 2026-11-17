export type Role = 'admin' | 'worker';
export type TaskType = 'Pruning' | 'PestControl' | 'HazardRemoval';
export type TaskState = 'Pending' | 'InProgress' | 'Completed' | 'Suspended';

export interface Tree { id: string; species: string; location: string; }
export interface Worker { id: string; name: string; }

export interface FieldTask {
  id: string;
  treeId: string;
  treeSpecies: string;
  treeLocation: string;
  type: TaskType;
  description: string | null;
  assigneeId: string;
  assigneeName: string;
  status: TaskState;
  feedback: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface CreateTaskRequest {
  treeId: string;
  type: TaskType;
  assigneeId: string;
  description?: string;
}

export const TASK_TYPES: TaskType[] = ['Pruning', 'PestControl', 'HazardRemoval'];
export const TASK_STATES: TaskState[] = ['Pending', 'InProgress', 'Completed', 'Suspended'];

export const TYPE_LABEL: Record<TaskType, string> = {
  Pruning: 'Pruning',
  PestControl: 'Pest Control',
  HazardRemoval: 'Hazard Removal',
};

export const STATE_LABEL: Record<TaskState, string> = {
  Pending: 'Pending',
  InProgress: 'In Progress',
  Completed: 'Completed',
  Suspended: 'Suspended',
};

/** UI hint only. The API is the source of truth and enforces these rules. */
export const NEXT_STATES: Record<TaskState, TaskState[]> = {
  Pending: ['InProgress'],
  InProgress: ['Completed', 'Suspended'],
  Suspended: ['InProgress'],
  Completed: [],
};
