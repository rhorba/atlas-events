import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { SubmitFormComponent } from './submit-form.component';
import { SubmissionService } from '../../core/services/submission.service';

const validPayload = {
  titleFr: 'Atlas DevConf 2026',
  startDate: '2026-09-01',
  city: 'casablanca',
  category: 'technology',
  organizer: 'AtlasTech',
  registrationUrl: 'https://atlastech.ma/devconf',
  contactEmail: '',
  description: '',
};

describe('SubmitFormComponent', () => {
  let fixture: ComponentFixture<SubmitFormComponent>;
  let component: SubmitFormComponent;
  let submissionService: jest.Mocked<SubmissionService>;

  beforeEach(async () => {
    const serviceMock = {
      submit: jest.fn().mockReturnValue(of(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [SubmitFormComponent, ReactiveFormsModule],
      providers: [
        provideTranslateService({ lang: 'fr' }),
        { provide: SubmissionService, useValue: serviceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SubmitFormComponent);
    component = fixture.componentInstance;
    submissionService = TestBed.inject(SubmissionService) as jest.Mocked<SubmissionService>;
    fixture.detectChanges();
  });

  it('form is invalid when empty', () => {
    expect(component.form.invalid).toBe(true);
  });

  it('form is valid with required fields filled', () => {
    component.form.patchValue(validPayload);
    expect(component.form.valid).toBe(true);
  });

  it('registrationUrl is invalid for javascript: scheme', () => {
    component.form.patchValue({ ...validPayload, registrationUrl: 'javascript:alert(1)' });
    expect(component.form.get('registrationUrl')?.invalid).toBe(true);
  });

  it('registrationUrl is valid for https:// URL', () => {
    component.form.patchValue({ ...validPayload, registrationUrl: 'https://example.com' });
    expect(component.form.get('registrationUrl')?.valid).toBe(true);
  });

  it('isInvalid returns false for untouched field', () => {
    expect(component.isInvalid('titleFr')).toBe(false);
  });

  it('isInvalid returns true for touched invalid field', () => {
    component.form.get('titleFr')?.markAsTouched();
    expect(component.isInvalid('titleFr')).toBe(true);
  });

  it('onSubmit marks all touched when form invalid', () => {
    const spy = jest.spyOn(component.form, 'markAllAsTouched');
    component.onSubmit();
    expect(spy).toHaveBeenCalled();
    expect(submissionService.submit).not.toHaveBeenCalled();
  });

  it('onSubmit calls service and sets submitted=true on success', () => {
    component.form.patchValue(validPayload);
    component.onSubmit();
    expect(submissionService.submit).toHaveBeenCalled();
    expect(component.submitted).toBe(true);
    expect(component.submitting).toBe(false);
  });

  it('onSubmit sets error=rate_limit on 429', () => {
    submissionService.submit.mockReturnValue(throwError(() => ({ status: 429 })));
    component.form.patchValue(validPayload);
    component.onSubmit();
    expect(component.error).toBe('rate_limit');
    expect(component.submitted).toBe(false);
  });

  it('onSubmit sets error=generic on other errors', () => {
    submissionService.submit.mockReturnValue(throwError(() => ({ status: 500 })));
    component.form.patchValue(validPayload);
    component.onSubmit();
    expect(component.error).toBe('generic');
  });

  it('reset clears form and resets state', () => {
    component.submitted = true;
    component.error = 'generic';
    component.reset();
    expect(component.submitted).toBe(false);
    expect(component.error).toBeNull();
  });

  it('contactEmail is optional — valid when empty', () => {
    component.form.patchValue({ ...validPayload, contactEmail: '' });
    expect(component.form.get('contactEmail')?.valid).toBe(true);
  });

  it('contactEmail is invalid when malformed', () => {
    component.form.patchValue({ ...validPayload, contactEmail: 'not-an-email' });
    expect(component.form.get('contactEmail')?.invalid).toBe(true);
  });
});
