import { Component, computed, inject, signal } from '@angular/core';
import { STATE_LABEL, TASK_STATES, TaskState } from './core/models';
import { TaskStore } from './core/task.store';
import { CreateTaskForm } from './features/create-task-form';
import { TaskBoard } from './features/task-board';
import { TaskTable } from './features/task-table';
import { SearchSelect, SelectOption } from './shared/search-select';

@Component({
  selector: 'app-root',
  imports: [CreateTaskForm, TaskBoard, TaskTable, SearchSelect],
  templateUrl: './app.html',
})
export class App {
  protected readonly store = inject(TaskStore);
  protected readonly statusOptions: SelectOption[] = [
    { value: '', label: 'All statuses' },
    ...TASK_STATES.map((status) => ({ value: status, label: STATE_LABEL[status] })),
  ];
  protected readonly workerOptions = computed<SelectOption[]>(() =>
    (this.store.workers.value() ?? []).map((worker) => ({
      value: worker.id,
      label: worker.name,
    })),
  );
  private readonly refreshHold = signal(false);
  protected readonly refreshing = computed(
    () => this.refreshHold() || this.store.tasks.isLoading(),
  );

  protected refreshTasks() {
    this.refreshHold.set(true);
    this.store.tasks.reload();
    setTimeout(() => this.refreshHold.set(false), 600);
  }

  protected setStatusFilter(value: string) {
    this.store.statusFilter.set(value as TaskState | '');
  }
}
