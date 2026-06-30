import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { EventFiltersComponent } from './event-filters.component';

describe('EventFiltersComponent', () => {
  let fixture: ComponentFixture<EventFiltersComponent>;
  let component: EventFiltersComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventFiltersComponent, FormsModule],
      providers: [provideTranslateService({ lang: 'fr' })],
    }).compileComponents();
    fixture = TestBed.createComponent(EventFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders 3 filter selects', () => {
    const selects = fixture.nativeElement.querySelectorAll('.filter-select');
    expect(selects.length).toBe(3);
  });

  it('does not show reset button when no filter active', () => {
    expect(fixture.nativeElement.querySelector('.btn-reset')).toBeNull();
  });

  it('shows reset button when city is set', () => {
    component.city = 'casablanca';
    component.emit();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.btn-reset')).toBeTruthy();
  });

  it('emits filtersChange with city when city changes', () => {
    const emitted: any[] = [];
    component.filtersChange.subscribe(f => emitted.push(f));
    component.city = 'rabat';
    component.emit();
    expect(emitted[0].city).toBe('rabat');
  });

  it('emits empty object on reset', () => {
    component.city = 'casablanca';
    const emitted: any[] = [];
    component.filtersChange.subscribe(f => emitted.push(f));
    component.reset();
    expect(emitted[0]).toEqual({});
  });

  it('reset clears all filter fields', () => {
    component.city = 'rabat';
    component.category = 'science';
    component.range = 'week';
    component.reset();
    expect(component.city).toBe('');
    expect(component.category).toBe('');
    expect(component.range).toBe('');
  });

  it('initialises from initialFilters input', () => {
    component.initialFilters = { city: 'fes', category: 'science' };
    component.ngOnInit();
    expect(component.city).toBe('fes');
    expect(component.category).toBe('science');
  });

  it('hasActiveFilter is true when range is set', () => {
    component.range = 'month';
    expect(component.hasActiveFilter).toBe(true);
  });
});
