import { TestBed } from '@angular/core/testing';
import { SearchSelect } from './search-select';

describe('SearchSelect', () => {
  it('filters options and selects the highlighted result with Enter', () => {
    const fixture = TestBed.createComponent(SearchSelect);
    fixture.componentRef.setInput('ariaLabel', 'Tree');
    fixture.componentRef.setInput('options', [
      { value: 'TREE-01', label: 'TREE-01 · Oak' },
      { value: 'TREE-02', label: 'TREE-02 · Pine' },
    ]);
    fixture.detectChanges();
    const selected = vi.fn();
    fixture.componentInstance.valueChange.subscribe(selected);

    (fixture.nativeElement.querySelector('.select-trigger') as HTMLButtonElement).click();
    fixture.detectChanges();
    const search = fixture.nativeElement.querySelector('.select-search') as HTMLInputElement;
    search.value = 'pine';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    const options = fixture.nativeElement.querySelectorAll('.select-option');
    expect(options.length).toBe(1);
    expect(options[0].textContent).toContain('Pine');
    search.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
    expect(selected).toHaveBeenCalledWith('TREE-02');
    expect(fixture.nativeElement.querySelector('.select-panel')).toBeNull();
  });
});
