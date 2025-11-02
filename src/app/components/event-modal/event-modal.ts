import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith, map } from 'rxjs';

import type { DateInput } from '@fullcalendar/core';
import type { CalendarEvent, EventType } from '../../types/event.type';

export interface EventModalData {
  event?: CalendarEvent;
  date?: string;
  isEdit?: boolean;
}

interface EventFormValue {
  title: string;
  description: string;
  date: Date;
  repeatAnnually: boolean;
  eventType: EventType;
}

interface EventTypeOption {
  value: EventType;
  label: string;
}
@Component({
  selector: 'event-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
    MatSelectModule,
  ],
  templateUrl: './event-modal.html',
  styleUrl: './event-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventModalComponent {
  private readonly dialogRef = inject(MatDialogRef<EventModalComponent>);
  private readonly modalData = inject(MAT_DIALOG_DATA) as EventModalData;
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly hasSubmitted = signal(false);

  readonly titleMaxLength = 120;

  private readonly initialDate = this.computeInitialDate();
  private readonly initialRepeatAnnually = this.computeInitialRepeatAnnually();
  private readonly initialEventType = this.computeInitialEventType();

  readonly eventTypeOptions: EventTypeOption[] = [
    { value: 'birthday', label: 'Birthday' },
    { value: 'anniversary', label: 'Anniversary' },
    { value: 'memorial', label: 'Memorial' },
    { value: 'custom', label: 'Custom' },
  ];

  readonly eventForm = this.fb.group({
    title: [
      this.modalData?.event?.title ?? '',
      [Validators.required, Validators.maxLength(this.titleMaxLength)],
    ],
    description: [this.modalData?.event?.description ?? ''],
    date: [this.initialDate, [Validators.required]],
    repeatAnnually: [this.initialRepeatAnnually],
    eventType: [this.initialEventType, [Validators.required]],
  });

  private readonly initialFormState =
    this.eventForm.getRawValue() as EventFormValue;

  private readonly formState = toSignal(
    this.eventForm.valueChanges.pipe(
      startWith(this.eventForm.getRawValue()),
      map(
        (value) =>
          ({
            ...this.eventForm.getRawValue(),
            ...(value as Partial<EventFormValue>),
          } as EventFormValue)
      )
    ),
    { initialValue: this.initialFormState }
  );

  private readonly formStatus = toSignal(
    this.eventForm.statusChanges.pipe(startWith(this.eventForm.status)),
    { initialValue: this.eventForm.status }
  );

  private readonly currentFormState = computed(
    () => this.formState() ?? this.initialFormState
  );

  readonly isEdit = signal(
    Boolean(this.modalData?.isEdit ?? this.modalData?.event)
  );
  readonly dialogTitle = computed(() =>
    this.isEdit() ? 'Edit Event' : 'Create New Event'
  );
  readonly primaryActionLabel = computed(() =>
    this.isEdit() ? 'Update' : 'Create'
  );
  readonly canDelete = computed(
    () => this.isEdit() && Boolean(this.modalData?.event?.id)
  );
  readonly trimmedTitle = computed(() => this.currentFormState().title.trim());
  readonly titleUsage = computed(
    () =>
      `${Math.min(this.currentFormState().title.length, this.titleMaxLength)}/${
        this.titleMaxLength
      }`
  );

  readonly canSubmit = computed(() => {
    const status = this.formStatus();
    return status === 'VALID' && this.trimmedTitle().length > 0;
  });

  shouldShowError(control: 'title' | 'date' | 'eventType'): boolean {
    const ctrl = this.getControl(control);
    return ctrl.invalid && (ctrl.dirty || ctrl.touched || this.hasSubmitted());
  }

  hasError(
    control: 'title' | 'date' | 'eventType',
    errorCode: string
  ): boolean {
    return this.getControl(control).hasError(errorCode);
  }

  onSave(): void {
    this.hasSubmitted.set(true);

    if (!this.canSubmit()) {
      this.eventForm.markAllAsTouched();
      return;
    }

    const formValue = this.eventForm.getRawValue() as EventFormValue;

    const event: CalendarEvent = {
      ...this.modalData?.event,
      id: this.modalData?.event?.id ?? Date.now().toString(),
      title: formValue.title.trim(),
      description: formValue.description.trim() || undefined,
      allDay: true,
      start: this.toDateOnlyIso(formValue.date),
      repeatAnnually: formValue.repeatAnnually,
      eventType: formValue.eventType,
      createdAt: this.modalData?.event?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.dialogRef.close({ action: 'save', event });
  }

  onDelete(): void {
    const id = this.modalData?.event?.id;
    if (!id) {
      return;
    }

    this.dialogRef.close({ action: 'delete', eventId: id });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private getControl(control: 'title' | 'date' | 'eventType'): AbstractControl {
    return this.eventForm.controls[control];
  }

  private computeInitialDate(): Date {
    if (this.modalData?.event?.start) {
      return this.asDate(this.modalData.event.start);
    }

    if (this.modalData?.date) {
      return this.asDate(this.modalData.date);
    }

    return this.startOfDay(new Date());
  }

  private computeInitialRepeatAnnually(): boolean {
    if (typeof this.modalData?.event?.repeatAnnually === 'boolean') {
      return this.modalData.event.repeatAnnually;
    }

    return true;
  }

  private computeInitialEventType(): EventType {
    return this.modalData?.event?.eventType ?? 'custom';
  }

  private toDateOnlyIso(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private asDate(value: DateInput): Date {
    if (value instanceof Date) {
      return new Date(value.getTime());
    }

    if (Array.isArray(value)) {
      const [year, month = 0, day = 1] = value;
      return new Date(year, month, day);
    }

    const isoValue = typeof value === 'string' ? value : String(value);
    if (isoValue.length === 10) {
      const [year, month, day] = isoValue.split('-').map(Number);
      return new Date(year, (month ?? 1) - 1, day ?? 1);
    }

    return new Date(isoValue);
  }

  private startOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }
}

export { EventModalComponent as EventModal };
