import { Component, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateTaskRequest, TASK_TYPES, TYPE_LABEL } from '../core/models';
import { TaskStore } from '../core/task.store';
import { SearchSelect, SelectOption } from '../shared/search-select';

@Component({
  selector: 'app-create-task-form',
  imports: [ReactiveFormsModule, SearchSelect],
  template: `
    <form class="card form" [formGroup]="form" (ngSubmit)="submit()">
      <div class="form-intro">
        <h2>New assignment</h2>
        <p>Choose the tree, work type, and person responsible.</p>
      </div>
      <div class="fields">
        <div class="field">
          <span class="field-label">Tree</span>
          <app-search-select
            ariaLabel="Tree"
            placeholder="Select tree…"
            [options]="treeOptions()"
            [value]="form.controls.treeId.value"
            (valueChange)="form.controls.treeId.setValue($event)"
          />
        </div>
        <div class="field">
          <span class="field-label">Task type</span>
          <app-search-select
            ariaLabel="Task type"
            placeholder="Select type…"
            [options]="typeOptions"
            [value]="form.controls.type.value"
            (valueChange)="form.controls.type.setValue($event)"
          />
        </div>
        <div class="field">
          <span class="field-label">Assign to</span>
          <app-search-select
            ariaLabel="Assign to"
            placeholder="Select field worker…"
            [options]="workerOptions()"
            [value]="form.controls.assigneeId.value"
            (valueChange)="form.controls.assigneeId.setValue($event)"
          />
        </div>
        <label class="wide"
          >Instructions (optional)
          <input
            formControlName="description"
            maxlength="500"
            placeholder="e.g. Remove dead branches over the footpath"
          />
        </label>
      </div>
      @if (store.trees.error() || store.workers.error()) {
        <p class="field-error" role="alert">
          Could not load trees or workers.
          <button type="button" class="link" (click)="retry()">Retry</button>
        </p>
      }
      <div class="form-footer">
        <button class="btn primary" type="submit" [disabled]="form.invalid || submitting">
          {{ submitting ? 'Dispatching…' : 'Create task' }}
        </button>
      </div>
    </form>
  `,
})
export class CreateTaskForm {
  protected readonly store = inject(TaskStore);
  protected readonly typeOptions: SelectOption[] = TASK_TYPES.map((type) => ({
    value: type,
    label: TYPE_LABEL[type],
  }));
  protected readonly treeOptions = computed<SelectOption[]>(() =>
    (this.store.trees.value() ?? []).map((tree) => ({
      value: tree.id,
      label: `${tree.id} · ${tree.species}`,
    })),
  );
  protected readonly workerOptions = computed<SelectOption[]>(() =>
    (this.store.workers.value() ?? []).map((worker) => ({
      value: worker.id,
      label: worker.name,
    })),
  );
  protected submitting = false;

  protected readonly form = inject(FormBuilder).nonNullable.group({
    treeId: ['', Validators.required],
    type: ['', Validators.required],
    assigneeId: ['', Validators.required],
    description: [''],
  });

  protected retry() {
    this.store.trees.reload();
    this.store.workers.reload();
  }

  protected async submit() {
    if (this.form.invalid) return;
    this.submitting = true;
    const ok = await this.store.create(this.form.getRawValue() as CreateTaskRequest);
    this.submitting = false;
    if (ok) this.form.reset();
  }
}
