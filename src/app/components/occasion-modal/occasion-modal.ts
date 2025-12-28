/**
 * Occasion Modal Component
 *
 * A Material Dialog for creating and editing occasions (birthdays, anniversaries, etc.).
 * Links occasions to contacts and supports year-less dates.
 *
 * Learning note: This modal demonstrates working with related entities
 * (occasion → contact) and handling optional fields (year for year-less birthdays).
 */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
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
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith, map } from 'rxjs';

import type { Occasion, OccasionType } from '../../types/occasion.type';
import { OCCASION_TYPE_OPTIONS } from '../../types/occasion.type';
import type { Contact } from '../../types/contact.type';
import { ContactsService } from '../../services/contacts.service';
import { ConfirmDialog } from '../confirm-dialog/confirm-dialog';

/**
 * Data passed to the occasion modal
 */
export interface OccasionModalData {
  occasion?: Occasion;
  contactId?: string; // Pre-select contact when creating from contact page
  isEdit?: boolean;
}

/**
 * Result returned from the occasion modal
 */
export interface OccasionModalResult {
  action: 'save' | 'delete';
  occasion?: Occasion;
  occasionId?: string;
}

/**
 * Form value interface
 */
interface OccasionFormValue {
  contactId: string;
  title: string;
  type: OccasionType;
  date: Date;
  hasYear: boolean;
  year: number | null;
  repeatAnnually: boolean;
  reminderEnabled: boolean;
  reminderDaysBefore: number; // Single value
}

/**
 * Reminder day options
 */
interface ReminderDayOption {
  value: number;
  label: string;
}

@Component({
  selector: 'occasion-modal',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
    MatCheckboxModule,
  ],
  templateUrl: './occasion-modal.html',
  styleUrl: './occasion-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OccasionModalComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<OccasionModalComponent>);
  private readonly modalData = inject(
    MAT_DIALOG_DATA
  ) as OccasionModalData | null;
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly contactsService = inject(ContactsService);
  private readonly dialog = inject(MatDialog);

  private readonly hasSubmitted = signal(false);

  // Options for dropdowns
  readonly occasionTypeOptions = OCCASION_TYPE_OPTIONS;
  readonly contacts = this.contactsService.sortedContacts;

  readonly reminderDayOptions: ReminderDayOption[] = [
    { value: 30, label: '30 days before' },
    { value: 14, label: '14 days before' },
    { value: 7, label: '7 days before' },
    { value: 3, label: '3 days before' },
    { value: 1, label: '1 day before' },
    { value: 0, label: 'On the day' },
  ];

  // Compute initial values
  private readonly initialDate = this.computeInitialDate();
  private readonly initialYear = this.modalData?.occasion?.year ?? null;
  private readonly initialHasYear = this.initialYear !== null;

  // Reactive form
  readonly occasionForm = this.fb.group({
    contactId: [
      this.modalData?.occasion?.contactId ?? this.modalData?.contactId ?? '',
      [Validators.required],
    ],
    title: [
      this.modalData?.occasion?.title ?? '',
      [Validators.required, Validators.maxLength(120)],
    ],
    type: [
      this.modalData?.occasion?.type ?? ('birthday' as OccasionType),
      [Validators.required],
    ],
    date: [this.initialDate, [Validators.required]],
    hasYear: [this.initialHasYear],
    year: [this.initialYear as number | null],
    repeatAnnually: [this.modalData?.occasion?.repeatAnnually ?? true],
    reminderEnabled: [this.modalData?.occasion?.reminderEnabled ?? true],
    reminderDaysBefore: [
      this.modalData?.occasion?.reminderDaysBefore ?? 7,
    ],
  });

  private readonly initialFormState =
    this.occasionForm.getRawValue() as OccasionFormValue;

  private readonly formState = toSignal(
    this.occasionForm.valueChanges.pipe(
      startWith(this.occasionForm.getRawValue()),
      map(
        (value) =>
          ({
            ...this.occasionForm.getRawValue(),
            ...(value as Partial<OccasionFormValue>),
          } as OccasionFormValue)
      )
    ),
    { initialValue: this.initialFormState }
  );

  private readonly formStatus = toSignal(
    this.occasionForm.statusChanges.pipe(startWith(this.occasionForm.status)),
    { initialValue: this.occasionForm.status }
  );

  private readonly currentFormState = computed(
    () => this.formState() ?? this.initialFormState
  );

  // UI state signals
  readonly isEdit = signal(
    Boolean(this.modalData?.isEdit ?? this.modalData?.occasion)
  );

  readonly dialogTitle = computed(() =>
    this.isEdit() ? 'Edit Occasion' : 'Add New Occasion'
  );

  readonly primaryActionLabel = computed(() =>
    this.isEdit() ? 'Update' : 'Create'
  );

  readonly canDelete = computed(
    () => this.isEdit() && Boolean(this.modalData?.occasion?.id)
  );

  readonly showYearField = computed(() => this.currentFormState().hasYear);

  // For edit mode: require form to be dirty (changed) before allowing submit
  // For create mode: always allow submit if valid
  readonly canSubmit = computed(() => {
    const status = this.formStatus();
    const state = this.currentFormState();
    const isValid =
      status === 'VALID' &&
      state.contactId.length > 0 &&
      state.title.trim().length > 0;

    if (!this.isEdit()) {
      return isValid; // Create mode: just check validity
    }

    // Edit mode: check if values actually changed from initial
    const current = this.currentFormState();
    const initial = this.initialFormState;

    const hasChanges =
      current.contactId !== initial.contactId ||
      current.title.trim() !== initial.title.trim() ||
      current.type !== initial.type ||
      current.date.getTime() !== initial.date.getTime() ||
      current.hasYear !== initial.hasYear ||
      current.year !== initial.year ||
      current.repeatAnnually !== initial.repeatAnnually ||
      current.reminderEnabled !== initial.reminderEnabled ||
      current.reminderDaysBefore !== initial.reminderDaysBefore;

    return isValid && hasChanges;
  });

  // Selected contact name for display
  readonly selectedContactName = computed(() => {
    const contactId = this.currentFormState().contactId;
    if (!contactId) return '';
    const contact = this.contacts().find((c) => c.id === contactId);
    return contact ? `${contact.firstName} ${contact.lastName}` : '';
  });

  ngOnInit(): void {
    // Auto-generate title based on type and contact
    this.setupAutoTitle();
  }

  /**
   * Setup auto-generation of title based on occasion type
   */
  private setupAutoTitle(): void {
    // Only for new occasions without a custom title
    if (this.isEdit() || this.modalData?.occasion?.title) return;

    // Watch type changes and update title suggestion
    this.occasionForm.get('type')?.valueChanges.subscribe((type) => {
      const currentTitle = this.occasionForm.get('title')?.value ?? '';
      // Only update if title is empty or matches a default pattern
      if (!currentTitle || this.isDefaultTitle(currentTitle)) {
        this.occasionForm.patchValue({
          title: this.getDefaultTitle(type),
        });
      }
    });
  }

  private isDefaultTitle(title: string): boolean {
    const defaults = ['Birthday', 'Anniversary', 'Memorial', 'Custom Occasion'];
    return defaults.includes(title);
  }

  private getDefaultTitle(type: OccasionType): string {
    const titles: Record<OccasionType, string> = {
      birthday: 'Birthday',
      anniversary: 'Anniversary',
      memorial: 'Memorial',
      custom: 'Custom Occasion',
    };
    return titles[type];
  }

  /**
   * Compute initial date from occasion or default to today
   */
  private computeInitialDate(): Date {
    if (this.modalData?.occasion?.date) {
      const [year, month, day] = this.modalData.occasion.date
        .split('-')
        .map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date();
  }

  shouldShowError(control: string): boolean {
    const ctrl = this.occasionForm.get(control);
    return ctrl
      ? ctrl.invalid && (ctrl.dirty || ctrl.touched || this.hasSubmitted())
      : false;
  }

  hasError(control: string, errorCode: string): boolean {
    const ctrl = this.occasionForm.get(control);
    return ctrl ? ctrl.hasError(errorCode) : false;
  }

  /**
   * Handle form submission
   */
  onSave(): void {
    this.hasSubmitted.set(true);

    if (!this.canSubmit()) {
      this.occasionForm.markAllAsTouched();
      return;
    }

    const formValue = this.occasionForm.getRawValue() as OccasionFormValue;

    // Build occasion object
    const occasion: Occasion = {
      id: this.modalData?.occasion?.id ?? crypto.randomUUID(),
      contactId: formValue.contactId,
      title: formValue.title.trim(),
      type: formValue.type,
      date: this.toDateOnlyIso(formValue.date),
      year: formValue.hasYear ? formValue.year ?? undefined : undefined,
      repeatAnnually: formValue.repeatAnnually,
      reminderEnabled: formValue.reminderEnabled,
      reminderDaysBefore: formValue.reminderEnabled
        ? formValue.reminderDaysBefore
        : undefined,
    };

    this.dialogRef.close({ action: 'save', occasion } as OccasionModalResult);
  }

  onDelete(): void {
    const id = this.modalData?.occasion?.id;
    if (!id) return;

    // Show confirmation dialog
    const confirmRef = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Delete Occasion?',
        message:
          'This will permanently delete this occasion. This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        isDangerous: true,
      },
    });

    confirmRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.dialogRef.close({
          action: 'delete',
          occasionId: id,
        } as OccasionModalResult);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Get contact full name for dropdown display
   */
  getContactName(contact: Contact): string {
    return `${contact.firstName} ${contact.lastName}`;
  }

  private toDateOnlyIso(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

export { OccasionModalComponent as OccasionModal };
