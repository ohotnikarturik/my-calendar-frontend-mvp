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
  MatDialog,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith, map } from 'rxjs';

import type {
  CalendarEvent,
  EventType,
  EventCategory,
} from '../../types/event.type';
import { DateUtilsService } from '../../services/date-utils.service';
import { ConfirmDialog } from '../confirm-dialog/confirm-dialog';

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
  reminderEnabled: boolean;
  reminderDaysBefore: number[];
  category: EventCategory;
  color: string;
  notes: string;
}

interface EventTypeOption {
  value: EventType;
  label: string;
}

interface EventCategoryOption {
  value: EventCategory;
  label: string;
}

interface ReminderDayOption {
  value: number;
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
    MatCheckboxModule,
  ],
  templateUrl: './event-modal.html',
  styleUrl: './event-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventModalComponent {
  private readonly dialogRef = inject(MatDialogRef<EventModalComponent>);
  private readonly modalData = inject(MAT_DIALOG_DATA) as EventModalData;
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly dateUtils = inject(DateUtilsService);
  private readonly dialog = inject(MatDialog);
  private readonly hasSubmitted = signal(false);

  readonly titleMaxLength = 120;

  private readonly initialDate = this.computeInitialDate();
  private readonly initialRepeatAnnually = this.computeInitialRepeatAnnually();
  private readonly initialEventType = this.computeInitialEventType();
  private readonly initialReminderEnabled =
    this.computeInitialReminderEnabled();
  private readonly initialReminderDaysBefore =
    this.computeInitialReminderDaysBefore();
  private readonly initialCategory = this.computeInitialCategory();
  private readonly initialColor = this.computeInitialColor();

  readonly eventTypeOptions: EventTypeOption[] = [
    { value: 'birthday', label: 'Birthday' },
    { value: 'anniversary', label: 'Anniversary' },
    { value: 'memorial', label: 'Memorial' },
    { value: 'custom', label: 'Custom' },
  ];

  readonly categoryOptions: EventCategoryOption[] = [
    { value: 'birthday', label: 'Birthday' },
    { value: 'anniversary', label: 'Anniversary' },
    { value: 'holiday', label: 'Holiday' },
    { value: 'personal', label: 'Personal' },
    { value: 'work', label: 'Work' },
    { value: 'other', label: 'Other' },
  ];

  readonly reminderDayOptions: ReminderDayOption[] = [
    { value: 30, label: '30 days' },
    { value: 14, label: '14 days' },
    { value: 7, label: '7 days' },
    { value: 3, label: '3 days' },
    { value: 1, label: '1 day' },
  ];

  readonly colorOptions: { value: string; label: string; color: string }[] = [
    { value: '', label: 'Category Default', color: '#1976D2' },
    { value: '#E91E63', label: 'Pink (Birthday)', color: '#E91E63' },
    { value: '#9C27B0', label: 'Purple (Anniversary)', color: '#9C27B0' },
    { value: '#FF9800', label: 'Orange (Holiday)', color: '#FF9800' },
    { value: '#4CAF50', label: 'Green (Personal)', color: '#4CAF50' },
    { value: '#2196F3', label: 'Blue (Work)', color: '#2196F3' },
    { value: '#00BCD4', label: 'Cyan (Other)', color: '#00BCD4' },
    { value: '#F44336', label: 'Red', color: '#F44336' },
    { value: '#757575', label: 'Gray (Memorial)', color: '#757575' },
    { value: '#795548', label: 'Brown', color: '#795548' },
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
    reminderEnabled: [this.initialReminderEnabled],
    reminderDaysBefore: [this.initialReminderDaysBefore],
    category: [this.initialCategory],
    color: [this.initialColor],
    notes: [this.modalData?.event?.notes ?? ''],
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

  // For edit mode: require form to be dirty (changed) before allowing submit
  // For create mode: always allow submit if valid
  readonly canSubmit = computed(() => {
    const status = this.formStatus();
    const isValid = status === 'VALID' && this.trimmedTitle().length > 0;

    if (!this.isEdit()) {
      return isValid; // Create mode: just check validity
    }

    // Edit mode: check if values actually changed from initial
    const current = this.currentFormState();
    const initial = this.initialFormState;

    const hasChanges =
      current.title.trim() !== initial.title.trim() ||
      current.description.trim() !== initial.description.trim() ||
      current.date.getTime() !== initial.date.getTime() ||
      current.repeatAnnually !== initial.repeatAnnually ||
      current.eventType !== initial.eventType ||
      current.reminderEnabled !== initial.reminderEnabled ||
      JSON.stringify([...current.reminderDaysBefore].sort()) !==
        JSON.stringify([...initial.reminderDaysBefore].sort()) ||
      current.category !== initial.category ||
      current.color !== initial.color ||
      current.notes.trim() !== initial.notes.trim();

    return isValid && hasChanges;
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
      id: this.modalData?.event?.id ?? crypto.randomUUID(),
      title: formValue.title.trim(),
      description: formValue.description.trim() || undefined,
      allDay: true,
      // Use DateUtilsService for consistent date formatting (YYYY-MM-DD)
      start: this.dateUtils.toDateString(formValue.date),
      repeatAnnually: formValue.repeatAnnually,
      eventType: formValue.eventType,
      reminderEnabled: formValue.reminderEnabled,
      reminderDaysBefore: formValue.reminderEnabled
        ? formValue.reminderDaysBefore
        : undefined,
      category: formValue.category,
      color: formValue.color || undefined,
      notes: formValue.notes.trim() || undefined,
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

    // Show confirmation dialog
    const confirmRef = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Delete Event?',
        message:
          'This will permanently delete this event. This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        isDangerous: true,
      },
    });

    confirmRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.dialogRef.close({ action: 'delete', eventId: id });
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private getControl(control: 'title' | 'date' | 'eventType'): AbstractControl {
    return this.eventForm.controls[control];
  }

  private computeInitialDate(): Date {
    if (this.modalData?.event?.start) {
      // Use DateUtilsService for consistent date parsing across the app
      return this.dateUtils.parseDateInput(this.modalData.event.start);
    }

    if (this.modalData?.date) {
      return this.dateUtils.parseDateInput(this.modalData.date);
    }

    // Use DateUtilsService for consistent date handling across the app
    return this.dateUtils.startOfDay(new Date());
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

  private computeInitialReminderEnabled(): boolean {
    return this.modalData?.event?.reminderEnabled ?? false;
  }

  private computeInitialReminderDaysBefore(): number[] {
    return this.modalData?.event?.reminderDaysBefore ?? [];
  }

  private computeInitialCategory(): EventCategory {
    return this.modalData?.event?.category ?? 'other';
  }

  private computeInitialColor(): string {
    return this.modalData?.event?.color ?? '';
  }

  toggleReminderDay(day: number): void {
    const current = this.eventForm.get('reminderDaysBefore')?.value ?? [];
    const index = current.indexOf(day);
    if (index >= 0) {
      this.eventForm.patchValue({
        reminderDaysBefore: current.filter((d) => d !== day),
      });
    } else {
      this.eventForm.patchValue({
        reminderDaysBefore: [...current, day].sort((a, b) => b - a),
      });
    }
  }

  isReminderDaySelected(day: number): boolean {
    const current = this.eventForm.get('reminderDaysBefore')?.value ?? [];
    return current.includes(day);
  }
}

export { EventModalComponent as EventModal };
