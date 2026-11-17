import { HttpErrorResponse } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NEXT_STATES } from './core/models';
import { TaskStore, errorMessage } from './core/task.store';

describe('errorMessage', () => {
  it('prefers API problem detail', () => {
    expect(errorMessage(new HttpErrorResponse({ status: 409, error: { detail: 'Cannot move.' } }))).toBe('Cannot move.');
  });
  it('joins validation errors', () => {
    const e = new HttpErrorResponse({ status: 400, error: { errors: { TreeId: ['Tree is required.'] } } });
    expect(errorMessage(e)).toBe('Tree is required.');
  });
  it('explains network failure', () => {
    expect(errorMessage(new HttpErrorResponse({ status: 0 }))).toContain('Cannot reach the server');
  });
});

describe('NEXT_STATES', () => {
  it('completed is terminal and suspended can resume', () => {
    expect(NEXT_STATES.Completed).toEqual([]);
    expect(NEXT_STATES.Suspended).toEqual(['InProgress']);
  });
});

describe('TaskStore', () => {
  it('worker role queries only that worker\'s tasks', async () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const http = TestBed.inject(HttpTestingController);
    const store = TestBed.inject(TaskStore);
    store.role.set('worker');
    store.selectWorker('W-02');
    TestBed.tick();
    const req = http.expectOne((r) => r.url === '/api/tasks');
    expect(req.request.params.get('assigneeId')).toBe('W-02');
  });
});
