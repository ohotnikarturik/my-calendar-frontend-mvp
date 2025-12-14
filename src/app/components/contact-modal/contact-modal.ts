/**
 * Contact Modal Component
 *
 * A Material Dialog component for creating and editing contacts.
 * Follows the same pattern as EventModalComponent.
 *
 * Learning note: This modal uses reactive forms with validation
 * and signals for reactive state management. The dialog receives
 * data through MAT_DIALOG_DATA injection token and returns
 * results through dialogRef.close().
 */

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
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith, map } from 'rxjs';

import type { Contact } from '../../types/contact.type';

/**
 * Data passed to the contact modal
 * @property contact - Existing contact for editing (undefined for new contact)
 * @property isEdit - Whether this is an edit operation
 */
export interface ContactModalData {
  contact?: Contact;
  isEdit?: boolean;
}

/**
 * Result returned from the contact modal
 * @property action - 'save' for create/update, 'delete' for deletion
 * @property contact - The contact data (for save action)
 * @property contactId - The contact ID (for delete action)
 */
export interface ContactModalResult {
  action: 'save' | 'delete';
  contact?: Contact;
  contactId?: string;
}

/**
 * Form value interface for type safety
 */
interface ContactFormValue {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes: string;
}

@Component({
  selector: 'contact-modal',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './contact-modal.html',
  styleUrl: './contact-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactModalComponent {
  // Dependency injection using inject() function (modern Angular approach)
  private readonly dialogRef = inject(MatDialogRef<ContactModalComponent>);
  private readonly modalData = inject(
    MAT_DIALOG_DATA
  ) as ContactModalData | null;
  private readonly fb = inject(NonNullableFormBuilder);

  // Track if form has been submitted (for validation display)
  private readonly hasSubmitted = signal(false);

  // Maximum lengths for form fields
  readonly nameMaxLength = 50;
  readonly emailMaxLength = 100;
  readonly phoneMaxLength = 20;
  readonly notesMaxLength = 500;

  // Reactive form definition with validation
  // Learning note: NonNullableFormBuilder ensures form controls
  // never have null values, improving type safety
  readonly contactForm = this.fb.group({
    firstName: [
      this.modalData?.contact?.firstName ?? '',
      [Validators.required, Validators.maxLength(this.nameMaxLength)],
    ],
    lastName: [
      this.modalData?.contact?.lastName ?? '',
      [Validators.required, Validators.maxLength(this.nameMaxLength)],
    ],
    email: [
      this.modalData?.contact?.email ?? '',
      [Validators.email, Validators.maxLength(this.emailMaxLength)],
    ],
    phone: [
      this.modalData?.contact?.phone ?? '',
      [Validators.maxLength(this.phoneMaxLength)],
    ],
    notes: [
      this.modalData?.contact?.notes ?? '',
      [Validators.maxLength(this.notesMaxLength)],
    ],
  });

  // Store initial form state for change detection
  private readonly initialFormState =
    this.contactForm.getRawValue() as ContactFormValue;

  // Convert form value changes to signal for reactive UI updates
  // Learning note: toSignal() bridges RxJS observables with Angular signals
  private readonly formState = toSignal(
    this.contactForm.valueChanges.pipe(
      startWith(this.contactForm.getRawValue()),
      map(
        (value) =>
          ({
            ...this.contactForm.getRawValue(),
            ...(value as Partial<ContactFormValue>),
          } as ContactFormValue)
      )
    ),
    { initialValue: this.initialFormState }
  );

  // Track form validity status as signal
  private readonly formStatus = toSignal(
    this.contactForm.statusChanges.pipe(startWith(this.contactForm.status)),
    { initialValue: this.contactForm.status }
  );

  // Computed signals for UI state
  // Learning note: computed() creates derived state that automatically
  // updates when dependencies change

  private readonly currentFormState = computed(
    () => this.formState() ?? this.initialFormState
  );

  readonly isEdit = signal(
    Boolean(this.modalData?.isEdit ?? this.modalData?.contact)
  );

  readonly dialogTitle = computed(() =>
    this.isEdit() ? 'Edit Contact' : 'Add New Contact'
  );

  readonly primaryActionLabel = computed(() =>
    this.isEdit() ? 'Update' : 'Create'
  );

  readonly canDelete = computed(
    () => this.isEdit() && Boolean(this.modalData?.contact?.id)
  );

  // Computed signal for trimmed full name preview
  readonly fullNamePreview = computed(() => {
    const state = this.currentFormState();
    const firstName = state.firstName.trim();
    const lastName = state.lastName.trim();
    return `${firstName} ${lastName}`.trim() || 'New Contact';
  });

  // Form can be submitted when valid and has required fields
  readonly canSubmit = computed(() => {
    const status = this.formStatus();
    const state = this.currentFormState();
    return (
      status === 'VALID' &&
      state.firstName.trim().length > 0 &&
      state.lastName.trim().length > 0
    );
  });

  /**
   * Check if a form control should show its error
   * Shows error when control is invalid and either dirty, touched, or form submitted
   */
  shouldShowError(
    control: 'firstName' | 'lastName' | 'email' | 'phone' | 'notes'
  ): boolean {
    const ctrl = this.getControl(control);
    return ctrl.invalid && (ctrl.dirty || ctrl.touched || this.hasSubmitted());
  }

  /**
   * Check if a form control has a specific error
   */
  hasError(
    control: 'firstName' | 'lastName' | 'email' | 'phone' | 'notes',
    errorCode: string
  ): boolean {
    return this.getControl(control).hasError(errorCode);
  }

  /**
   * Handle form submission
   * Creates a contact object and closes dialog with save action
   */
  onSave(): void {
    this.hasSubmitted.set(true);

    if (!this.canSubmit()) {
      this.contactForm.markAllAsTouched();
      return;
    }

    const formValue = this.contactForm.getRawValue() as ContactFormValue;
    const now = new Date().toISOString();

    // Build contact object, preserving existing data for edits
    const contact: Contact = {
      id: this.modalData?.contact?.id ?? crypto.randomUUID(),
      firstName: formValue.firstName.trim(),
      lastName: formValue.lastName.trim(),
      email: formValue.email.trim() || undefined,
      phone: formValue.phone.trim() || undefined,
      notes: formValue.notes.trim() || undefined,
      createdAt: this.modalData?.contact?.createdAt ?? now,
      updatedAt: now,
    };

    this.dialogRef.close({ action: 'save', contact } as ContactModalResult);
  }

  /**
   * Handle delete button click
   * Closes dialog with delete action
   */
  onDelete(): void {
    const id = this.modalData?.contact?.id;
    if (!id) return;

    this.dialogRef.close({
      action: 'delete',
      contactId: id,
    } as ContactModalResult);
  }

  /**
   * Handle cancel button click
   * Closes dialog without result
   */
  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Get a form control by name for validation checks
   */
  private getControl(
    control: 'firstName' | 'lastName' | 'email' | 'phone' | 'notes'
  ): AbstractControl {
    return this.contactForm.controls[control];
  }
}

// Named export for consistency with other components
export { ContactModalComponent as ContactModal };
