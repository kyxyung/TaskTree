import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { STATE_LABEL, TYPE_LABEL } from '../core/models';
import { TaskStore } from '../core/task.store';
import { TaskActions } from './task-actions';

@Component({
  selector: 'app-task-table',
  imports: [DatePipe, TaskActions],
  template: `
    <div class="table-wrap card">
      <table>
        <thead>
          <tr><th>Tree</th><th>Type</th><th>Assignee</th><th>Status</th><th>Feedback</th><th>Updated</th><th>Actions</th></tr>
        </thead>
        <tbody>
          @for (t of store.taskList(); track t.id) {
            <tr>
              <td><strong>{{ t.treeId }}</strong><br /><span class="muted small">{{ t.treeSpecies }}</span></td>
              <td>{{ typeLabel[t.type] }}</td>
              <td>{{ t.assigneeName }}</td>
              <td><span class="badge" [class]="'s-' + t.status">{{ stateLabel[t.status] }}</span></td>
              <td>{{ t.feedback || '—' }}</td>
              <td>{{ t.updatedAtUtc | date: 'short' }}</td>
              <td class="actions"><app-task-actions [task]="t" /></td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class TaskTable {
  protected readonly store = inject(TaskStore);
  protected readonly typeLabel = TYPE_LABEL;
  protected readonly stateLabel = STATE_LABEL;
}
