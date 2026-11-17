import {
  Component,
  ElementRef,
  HostListener,
  computed,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

export interface SelectOption {
  value: string;
  label: string;
}

let nextId = 0;

/** Searchable, keyboard-operable select used throughout the task UI. */
@Component({
  selector: 'app-search-select',
  template: `
    <button
      #trigger
      type="button"
      class="select-trigger"
      [disabled]="disabled()"
      [attr.aria-label]="ariaLabel()"
      aria-haspopup="listbox"
      [attr.aria-expanded]="open()"
      [attr.aria-controls]="open() ? listId : null"
      (click)="toggle()"
      (keydown)="onTriggerKeydown($event)"
    >
      <span [class.placeholder]="!selectedLabel()">{{ selectedLabel() || placeholder() }}</span>
      <svg class="select-chevron" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="m4 6 4 4 4-4"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
    @if (open()) {
      <div
        class="select-panel"
        [style.top.px]="panelTop()"
        [style.left.px]="panelLeft()"
        [style.width.px]="panelWidth()"
        [style.max-height.px]="panelMaxHeight()"
        [style.transform]="above() ? 'translateY(-100%)' : null"
      >
        <div class="select-search-wrap">
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.4" />
            <path
              d="m10.5 10.5 3 3"
              stroke="currentColor"
              stroke-width="1.4"
              stroke-linecap="round"
            />
          </svg>
          <input
            #search
            class="select-search"
            type="search"
            role="combobox"
            autocomplete="off"
            [attr.aria-label]="'Search ' + ariaLabel()"
            aria-autocomplete="list"
            aria-expanded="true"
            [attr.aria-controls]="listId"
            [attr.aria-activedescendant]="
              filtered().length ? listId + '-option-' + activeIndex() : null
            "
            [value]="query()"
            (input)="onSearch($event)"
            (keydown)="onSearchKeydown($event)"
            placeholder="Search…"
          />
        </div>
        <div class="select-options" [id]="listId" role="listbox" [attr.aria-label]="ariaLabel()">
          @for (option of filtered(); track option.value; let i = $index) {
            <button
              type="button"
              class="select-option"
              role="option"
              [id]="listId + '-option-' + i"
              [class.active]="i === activeIndex()"
              [attr.aria-selected]="option.value === value()"
              (mouseenter)="activeIndex.set(i)"
              (click)="choose(option)"
            >
              <span>{{ option.label }}</span>
              @if (option.value === value()) {
                <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="m3 8 3 3 7-7"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              }
            </button>
          } @empty {
            <p class="select-empty">No results found</p>
          }
        </div>
      </div>
    }
  `,
})
export class SearchSelect {
  readonly options = input.required<readonly SelectOption[]>();
  readonly value = input('');
  readonly placeholder = input('Select an option');
  readonly ariaLabel = input.required<string>();
  readonly disabled = input(false);
  readonly valueChange = output<string>();

  protected readonly listId = `select-list-${++nextId}`;
  protected readonly open = signal(false);
  protected readonly query = signal('');
  protected readonly activeIndex = signal(0);
  protected readonly panelTop = signal(0);
  protected readonly panelLeft = signal(0);
  protected readonly panelWidth = signal(0);
  protected readonly panelMaxHeight = signal(260);
  protected readonly above = signal(false);
  protected readonly search = viewChild<ElementRef<HTMLInputElement>>('search');
  protected readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  protected readonly selectedLabel = computed(
    () => this.options().find((option) => option.value === this.value())?.label ?? '',
  );
  protected readonly filtered = computed(() => {
    const term = this.query().trim().toLocaleLowerCase();
    return this.options().filter(
      (option) =>
        option.label.toLocaleLowerCase().includes(term) ||
        option.value.toLocaleLowerCase().includes(term),
    );
  });

  constructor(private readonly host: ElementRef<HTMLElement>) {}

  protected toggle() {
    if (this.disabled()) return;
    if (this.open()) this.close();
    else this.openMenu();
  }

  protected onTriggerKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!this.open()) this.openMenu();
    }
    if (event.key === 'Escape' && this.open()) {
      event.preventDefault();
      this.close();
    }
  }

  protected onSearch(event: Event) {
    this.query.set((event.target as HTMLInputElement).value);
    this.activeIndex.set(0);
  }

  protected onSearchKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const count = this.filtered().length;
      if (count)
        this.activeIndex.set(
          (this.activeIndex() + (event.key === 'ArrowDown' ? 1 : -1) + count) % count,
        );
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const option = this.filtered()[this.activeIndex()];
      if (option) this.choose(option);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      this.trigger().nativeElement.focus();
    } else if (event.key === 'Tab') {
      this.close();
    }
  }

  protected choose(option: SelectOption) {
    if (option.value !== this.value()) this.valueChange.emit(option.value);
    this.close();
    this.trigger().nativeElement.focus();
  }

  private openMenu() {
    this.positionPanel();
    this.query.set('');
    this.activeIndex.set(
      Math.max(
        0,
        this.options().findIndex((option) => option.value === this.value()),
      ),
    );
    this.open.set(true);
    setTimeout(() => this.search()?.nativeElement.focus({ preventScroll: true }));
  }

  private positionPanel() {
    const rect = this.trigger().nativeElement.getBoundingClientRect();
    const width = Math.min(Math.max(rect.width, 220), window.innerWidth - 24);
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;
    const above = spaceBelow < 260 && spaceAbove > spaceBelow;
    this.panelWidth.set(width);
    this.panelLeft.set(Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)));
    this.panelTop.set(above ? rect.top - 5 : rect.bottom + 5);
    this.panelMaxHeight.set(Math.min(260, Math.max(80, above ? spaceAbove : spaceBelow)));
    this.above.set(above);
  }

  private close() {
    this.open.set(false);
    this.query.set('');
  }

  @HostListener('document:pointerdown', ['$event'])
  protected onOutsidePointer(event: PointerEvent) {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) this.close();
  }

  @HostListener('window:resize')
  protected onViewportResize() {
    if (this.open()) this.positionPanel();
  }

  @HostListener('window:scroll')
  protected onViewportScroll() {
    if (this.open()) this.close();
  }
}
