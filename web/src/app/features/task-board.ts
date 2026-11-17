import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  FieldTask,
  NEXT_STATES,
  STATE_LABEL,
  TASK_STATES,
  TaskState,
  TYPE_LABEL,
} from '../core/models';
import { TaskStore } from '../core/task.store';
import { TaskActions } from './task-actions';

/**
 * Kanban board. A field worker drags a card one step forward only
 * (Pending → In Progress → Completed/Suspended, Suspended → In Progress).
 * Admin cannot drag: admin dispatches, the worker moves state.
 */
@Component({
  selector: 'app-task-board',
  imports: [DatePipe, FormsModule, TaskActions],
  template: `
    <div class="board">
      @for (col of columns(); track col.state) {
        <section
          class="column"
          [attr.aria-label]="col.label"
          [class.drop-ok]="dragging() && canDrop(col.state)"
          [class.drop-no]="dragging() && !canDrop(col.state)"
          (dragover)="allow($event, col.state)"
          (drop)="drop($event, col.state)"
        >
          <h3>
            <span class="dot" [class]="'s-' + col.state"></span>{{ col.label }}
            <span class="count">{{ col.tasks.length }}</span>
          </h3>
          @for (t of col.tasks; track t.id) {
            <article
              class="card task"
              [class.draggable]="isDraggable(t)"
              [draggable]="isDraggable(t)"
              (dragstart)="dragStart($event, t)"
              (dragend)="dragging.set(null)"
            >
              <header>
                <strong>{{ t.treeId }}</strong><span class="muted">{{ t.treeSpecies }}</span>
              </header>
              <span class="chip">{{ typeLabel[t.type] }}</span>
              @if (t.description) {
                <p class="description">{{ t.description }}</p>
              }
              <div class="task-meta">
                <p>{{ t.treeLocation }}</p>
                <p>{{ t.assigneeName }} · Updated {{ t.updatedAtUtc | date: 'short' }}</p>
              </div>
              @if (t.feedback) {
                <p class="feedback">{{ t.feedback }}</p>
              }
              <app-task-actions [task]="t" />
            </article>
          } @empty {
            <p class="muted small empty-col">No tasks</p>
          }
        </section>
      }
    </div>

    @if (suspending(); as task) {
      <div class="backdrop" (click)="suspending.set(null)">
        <form class="card modal" (click)="$event.stopPropagation()" (ngSubmit)="confirmSuspend()">
          <h2>Suspend {{ task.treeId }}</h2>
          <label
            >What is blocking you?
            <textarea
              name="reason"
              rows="3"
              maxlength="1000"
              [(ngModel)]="reason"
              required
              autofocus
            ></textarea>
          </label>
          <div class="btn-row">
            <button type="button" class="btn" (click)="suspending.set(null)">Cancel</button>
            <button type="submit" class="btn danger" [disabled]="!reason.trim()">Suspend</button>
          </div>
        </form>
      </div>
    }
  `,
})
export class TaskBoard {
  private readonly store = inject(TaskStore);
  protected readonly typeLabel = TYPE_LABEL;
  protected readonly dragging = signal<FieldTask | null>(null);
  protected readonly suspending = signal<FieldTask | null>(null);
  protected reason = '';

  protected readonly columns = computed(() =>
    TASK_STATES.map((state) => ({
      state,
      label: STATE_LABEL[state],
      tasks: this.store.taskList().filter((t) => t.status === state),
    })),
  );

  protected isDraggable(t: FieldTask) {
    return this.store.role() === 'worker' && NEXT_STATES[t.status].length > 0;
  }

  protected canDrop(target: TaskState) {
    const t = this.dragging();
    return !!t && NEXT_STATES[t.status].includes(target);
  }

  protected dragStart(e: DragEvent, t: FieldTask) {
    e.dataTransfer?.setData('text/plain', t.id);
    this.dragging.set(t);
  }

  protected allow(e: DragEvent, target: TaskState) {
    if (this.canDrop(target)) e.preventDefault(); // only valid next steps accept a drop
  }

  protected drop(e: DragEvent, target: TaskState) {
    e.preventDefault();
    const task = this.dragging();
    this.dragging.set(null);
    if (!task || !NEXT_STATES[task.status].includes(target)) return;
    if (target === 'Suspended') {
      this.reason = '';
      this.suspending.set(task); // a blocker reason is mandatory
    } else {
      this.store.updateStatus(task, target, '');
    }
  }

  protected async confirmSuspend() {
    const task = this.suspending();
    if (!task || !this.reason.trim()) return;
    this.suspending.set(null);
    await this.store.updateStatus(task, 'Suspended', this.reason);
  }
}
