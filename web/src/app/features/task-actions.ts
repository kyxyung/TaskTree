import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FieldTask, NEXT_STATES, STATE_LABEL, TaskState } from '../core/models';
import { TaskStore } from '../core/task.store';
import { SearchSelect, SelectOption } from '../shared/search-select';

/** Role-aware actions for one task: admin reassigns, field worker moves the state. */
@Component({
  selector: 'app-task-actions',
  imports: [FormsModule, SearchSelect],
  template: `
    @if (store.role() === 'admin') {
      @if (task().status !== 'Completed') {
        <app-search-select
          [ariaLabel]="'Reassign ' + task().treeId"
          [options]="workerOptions()"
          [value]="task().assigneeId"
          [disabled]="busy()"
          (valueChange)="store.reassign(task(), $event)"
        />
      }
    } @else if (next().length) {
      <label class="sr-only" [for]="'fb-' + task().id">Field feedback</label>
      <textarea
        [id]="'fb-' + task().id"
        rows="2"
        maxlength="1000"
        placeholder="Field feedback (required to suspend)"
        [(ngModel)]="feedback"
        [disabled]="busy()"
      ></textarea>
      @if (hint()) {
        <p class="hint">{{ hint() }}</p>
      }
      <div class="btn-row">
        @for (s of next(); track s) {
          <button
            type="button"
            [class]="s === 'Suspended' ? 'btn danger' : 'btn primary'"
            [disabled]="busy()"
            (click)="move(s)"
          >
            {{ verb(s) }}
          </button>
        }
      </div>
    }
  `,
})
export class TaskActions {
  protected readonly store = inject(TaskStore);
  readonly task = input.required<FieldTask>();

  protected feedback = '';
  protected readonly hint = signal('');
  protected readonly next = computed(() => NEXT_STATES[this.task().status]);
  protected readonly busy = computed(() => this.store.busyTaskId() === this.task().id);
  protected readonly workerOptions = computed<SelectOption[]>(() =>
    (this.store.workers.value() ?? []).map((worker) => ({
      value: worker.id,
      label: worker.name,
    })),
  );

  protected verb(s: TaskState) {
    if (s === 'InProgress') return this.task().status === 'Suspended' ? 'Resume' : 'Start work';
    return s === 'Completed' ? 'Complete' : 'Suspend';
  }

  protected async move(status: TaskState) {
    if (status === 'Suspended' && !this.feedback.trim()) {
      this.hint.set(
        `Please describe what is blocking you before moving to ${STATE_LABEL[status]}.`,
      );
      return;
    }
    this.hint.set('');
    if (await this.store.updateStatus(this.task(), status, this.feedback)) this.feedback = '';
  }
}
