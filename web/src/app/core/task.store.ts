import { HttpClient, HttpErrorResponse, httpResource } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CreateTaskRequest, FieldTask, Role, TaskState, Tree, Worker } from './models';

export type View = 'board' | 'table';
export interface Toast { kind: 'success' | 'error'; text: string; }

/** Turns an API problem-details / validation response into one readable message. */
export function errorMessage(e: unknown): string {
  if (e instanceof HttpErrorResponse) {
    if (e.status === 0) return 'Cannot reach the server. Check your connection and try again.';
    const body = e.error;
    if (body?.errors) return Object.values<string[]>(body.errors).flat().join(' ');
    if (body?.detail) return body.detail;
  }
  return 'Something went wrong. Please try again.';
}

/** Single source of UI state: role, filters, API data and mutations. */
@Injectable({ providedIn: 'root' })
export class TaskStore {
  private readonly http = inject(HttpClient);

  readonly role = signal<Role>('admin');
  readonly view = signal<View>('board');
  readonly statusFilter = signal<TaskState | ''>('');
  private readonly selectedWorkerId = signal('');
  readonly busyTaskId = signal<string | null>(null);
  readonly toast = signal<Toast | null>(null);

  readonly trees = httpResource<Tree[]>(() => '/api/trees');
  readonly workers = httpResource<Worker[]>(() => '/api/workers');

  /** The worker the "Field Worker" role acts as; defaults to the first one. */
  readonly workerId = computed(() => this.selectedWorkerId() || this.workers.value()?.[0]?.id || '');

  readonly tasks = httpResource<FieldTask[]>(() => {
    const worker = this.role() === 'worker' ? this.workerId() : '';
    if (this.role() === 'worker' && !worker) return undefined; // wait for workers to load
    const params: Record<string, string> = {};
    if (this.statusFilter()) params['status'] = this.statusFilter();
    if (worker) params['assigneeId'] = worker;
    return { url: '/api/tasks', params };
  });

  readonly taskList = computed(() => this.tasks.value() ?? []);
  readonly loadError = computed(() => (this.tasks.error() ? errorMessage(this.tasks.error()) : null));

  selectWorker(id: string) { this.selectedWorkerId.set(id); }

  async create(request: CreateTaskRequest): Promise<boolean> {
    return this.mutate(this.http.post<FieldTask>('/api/tasks', request), 'Task created and dispatched.');
  }

  reassign(task: FieldTask, assigneeId: string) {
    return this.mutate(this.http.put<FieldTask>(`/api/tasks/${task.id}/assignee`, { assigneeId }),
      'Task reassigned.', task.id);
  }

  updateStatus(task: FieldTask, status: TaskState, feedback: string) {
    return this.mutate(this.http.patch<FieldTask>(`/api/tasks/${task.id}/status`, { status, feedback }),
      'Task updated.', task.id);
  }

  private async mutate(call: ReturnType<HttpClient['post']>, success: string, taskId: string | null = null) {
    this.busyTaskId.set(taskId);
    try {
      await firstValueFrom(call);
      this.notify({ kind: 'success', text: success });
      this.tasks.reload();
      return true;
    } catch (e) {
      this.notify({ kind: 'error', text: errorMessage(e) });
      this.tasks.reload(); // the task may have changed under us
      return false;
    } finally {
      this.busyTaskId.set(null);
    }
  }

  private toastTimer?: ReturnType<typeof setTimeout>;
  private notify(toast: Toast) {
    clearTimeout(this.toastTimer);
    this.toast.set(toast);
    this.toastTimer = setTimeout(() => this.toast.set(null), 4000);
  }
}
