import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';
import { EventCardComponent } from './event-card.component';
import { Event } from '../../../core/models/event.model';

const mockEvent: Event = {
  id: '1',
  title: { fr: 'Tech Summit Casablanca' },
  startDate: '2026-07-15T09:00:00Z',
  city: 'casablanca',
  category: 'technology',
  organizer: 'TechMa',
  registrationUrl: 'https://example.com/register',
  isFree: false,
  status: 'upcoming',
};

describe('EventCardComponent', () => {
  let fixture: ComponentFixture<EventCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventCardComponent, RouterTestingModule],
      providers: [provideTranslateService({ lang: 'fr' })],
    }).compileComponents();
    fixture = TestBed.createComponent(EventCardComponent);
    fixture.componentRef.setInput('event', mockEvent);
    fixture.detectChanges();
  });

  it('renders the event title', () => {
    expect(fixture.nativeElement.querySelector('.event-title').textContent).toContain('Tech Summit Casablanca');
  });

  it('renders the category badge', () => {
    const badge = fixture.nativeElement.querySelector('.category-badge');
    expect(badge).toBeTruthy();
    expect(badge.getAttribute('data-category')).toBe('technology');
  });

  it('renders the registration link', () => {
    const link = fixture.nativeElement.querySelector('.btn-register');
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toBe('https://example.com/register');
    expect(link.getAttribute('target')).toBe('_blank');
  });

  it('does not show free badge when isFree is false', () => {
    expect(fixture.nativeElement.querySelector('.free-badge')).toBeNull();
  });

  it('shows free badge when isFree is true', () => {
    fixture.componentRef.setInput('event', { ...mockEvent, isFree: true });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.free-badge')).toBeTruthy();
  });

  it('does not render registration link when missing', () => {
    fixture.componentRef.setInput('event', { ...mockEvent, registrationUrl: undefined });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.btn-register')).toBeNull();
  });

  it('shows organizer when provided', () => {
    expect(fixture.nativeElement.querySelector('.event-organizer').textContent).toContain('TechMa');
  });
});
