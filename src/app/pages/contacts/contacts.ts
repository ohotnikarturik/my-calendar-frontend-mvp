/**
 * Contacts Page Component
 *
 * Displays a list of contacts with search, filter, and CRUD operations.
 * Uses Angular Material card grid for responsive layout.
 *
 * Learning note: This component demonstrates how to:
 * - Use signals for local state (search, filters)
 * - Use computed signals for derived/filtered data
 * - Open Material dialogs and handle results
 * - Handle empty states gracefully
 */

import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ContactsService } from '../../services/contacts.service';
import {
  ContactModalComponent,
  type ContactModalData,
  type ContactModalResult,
} from '../../components/contact-modal/contact-modal';
import type { Contact } from '../../types/contact.type';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'contacts',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslatePipe,
  ],
  templateUrl: './contacts.html',
  styleUrl: './contacts.scss',
})
export class ContactsComponent {
  // Inject services
  // Learning note: Using inject() is the modern way to inject dependencies
  // in Angular. It's cleaner than constructor injection.
  readonly contactsService = inject(ContactsService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  // Local state for search
  readonly searchQuery = signal('');

  // Computed signal for filtered contacts
  // Learning note: computed() automatically tracks signal dependencies
  // and re-runs when any dependency changes
  readonly filteredContacts = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const contacts = this.contactsService.sortedContacts();

    if (!query) return contacts;

    return contacts.filter((contact) => {
      const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
      const email = (contact.email ?? '').toLowerCase();
      return fullName.includes(query) || email.includes(query);
    });
  });

  /**
   * Handle search input changes
   * Using a method allows for potential debouncing in the future
   */
  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  /**
   * Get initials from contact name for avatar display
   */
  getInitials(contact: Contact): string {
    const first = contact.firstName.charAt(0).toUpperCase();
    const last = contact.lastName.charAt(0).toUpperCase();
    return `${first}${last}`;
  }

  /**
   * Open contact modal for create or edit
   *
   * @param contact - Existing contact for edit, undefined for create
   */
  openContactModal(contact?: Contact): void {
    const dialogData: ContactModalData = {
      contact,
      isEdit: Boolean(contact),
    };

    // Learning note: MatDialog.open() returns a reference to the dialog
    // that we can use to subscribe to the result
    const dialogRef = this.dialog.open(ContactModalComponent, {
      width: '500px',
      maxWidth: '95vw',
      data: dialogData,
      autoFocus: 'first-tabbable',
    });

    // Handle dialog result
    dialogRef
      .afterClosed()
      .subscribe((result: ContactModalResult | undefined) => {
        if (!result) return;

        if (result.action === 'save' && result.contact) {
          this.handleSaveContact(result.contact, Boolean(contact));
        } else if (result.action === 'delete' && result.contactId) {
          this.handleDeleteContact(result.contactId);
        }
      });
  }

  /**
   * Handle saving a contact (create or update)
   */
  private async handleSaveContact(
    contact: Contact,
    isEdit: boolean
  ): Promise<void> {
    try {
      if (isEdit) {
        await this.contactsService.update(contact.id, contact);
        // Success notification shown by service
      } else {
        await this.contactsService.add({
          firstName: contact.firstName,
          lastName: contact.lastName,
        });
        // Success notification shown by service
      }
    } catch (error) {
      console.error('Failed to save contact:', error);
      // Error notification shown by service
    }
  }

  /**
   * Handle deleting a contact
   */
  private async handleDeleteContact(contactId: string): Promise<void> {
    try {
      await this.contactsService.remove(contactId);
      // Success notification shown by service
    } catch (error) {
      console.error('Failed to delete contact:', error);
      // Error notification shown by service
    }
  }

  /**
   * Show a snackbar message to the user
   */
  private showMessage(message: string, isError = false): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: isError ? 5000 : 3000,
      panelClass: isError ? ['error-snackbar'] : [],
    });
  }
}

// Named export for consistency
export { ContactsComponent as Contacts };
