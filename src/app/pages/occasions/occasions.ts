/**
 * Occasions Page Component
 *
 * Displays and manages occasions (birthdays, anniversaries, etc.).
 * Shows occasions grouped by type or by upcoming dates.
 *
 * Learning note: This page demonstrates working with related data
 * (occasions linked to contacts) and filtering/grouping data for display.
 */

import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { OccasionsService } from '../../services/occasions.service';
import { ContactsService } from '../../services/contacts.service';
import { DateUtilsService } from '../../services/date-utils.service';
import {
  OccasionModalComponent,
  type OccasionModalData,
  type OccasionModalResult,
} from '../../components/occasion-modal/occasion-modal';
import type { Occasion, OccasionType } from '../../types/occasion.type';

@Component({
  selector: 'occasions',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './occasions.html',
  styleUrl: './occasions.scss',
})
export class OccasionsComponent {
  readonly occasionsService = inject(OccasionsService);
  readonly contactsService = inject(ContactsService);
  private readonly dateUtils = inject(DateUtilsService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  // Filter state
  readonly searchQuery = signal('');
  readonly filterType = signal<OccasionType | ''>('');

  // Filtered occasions
  readonly filteredOccasions = computed(() => {
    let occasions = this.occasionsService.occasionsWithContacts();
    const query = this.searchQuery().toLowerCase().trim();
    const type = this.filterType();

    // Filter by type
    if (type) {
      occasions = occasions.filter((o) => o.type === type);
    }

    // Filter by search query
    if (query) {
      occasions = occasions.filter((o) => {
        const title = o.title.toLowerCase();
        const contactName = o.contact
          ? `${o.contact.firstName} ${o.contact.lastName}`.toLowerCase()
          : '';
        return title.includes(query) || contactName.includes(query);
      });
    }

    // Sort by next occurrence
    return occasions.sort((a, b) => {
      const dateA = this.occasionsService.getNextOccurrence(a.date);
      const dateB = this.occasionsService.getNextOccurrence(b.date);
      return dateA.getTime() - dateB.getTime();
    });
  });

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.filterType.set('');
  }

  getTypeLabel(type: OccasionType | ''): string {
    if (!type) return '';
    const labels: Record<OccasionType, string> = {
      birthday: 'Birthdays',
      anniversary: 'Anniversaries',
      memorial: 'Memorials',
      custom: 'Custom',
    };
    return labels[type];
  }

  getTypeIcon(type: OccasionType): string {
    const icons: Record<OccasionType, string> = {
      birthday: 'cake',
      anniversary: 'favorite',
      memorial: 'local_florist',
      custom: 'event',
    };
    return icons[type];
  }

  formatDate(dateStr: string): string {
    return this.dateUtils.formatOccasionDate(dateStr);
  }

  calculateYears(occasion: Occasion): number | null {
    return this.occasionsService.calculateYears(occasion);
  }

  getDaysUntilText(occasion: Occasion): string {
    const nextDate = this.occasionsService.getNextOccurrence(occasion.date);
    return this.dateUtils.daysUntilText(nextDate);
  }

  openOccasionModal(occasion?: Occasion): void {
    const dialogData: OccasionModalData = {
      occasion,
      isEdit: Boolean(occasion),
    };

    const dialogRef = this.dialog.open(OccasionModalComponent, {
      width: '540px',
      maxWidth: '95vw',
      data: dialogData,
      autoFocus: 'first-tabbable',
    });

    dialogRef
      .afterClosed()
      .subscribe((result: OccasionModalResult | undefined) => {
        if (!result) return;

        if (result.action === 'save' && result.occasion) {
          this.handleSaveOccasion(result.occasion, Boolean(occasion));
        } else if (result.action === 'delete' && result.occasionId) {
          this.handleDeleteOccasion(result.occasionId);
        }
      });
  }

  private async handleSaveOccasion(
    occasion: Occasion,
    isEdit: boolean
  ): Promise<void> {
    try {
      if (isEdit) {
        await this.occasionsService.update(occasion.id, occasion);
        this.showMessage('Occasion updated successfully');
      } else {
        await this.occasionsService.add({
          contactId: occasion.contactId,
          title: occasion.title,
          type: occasion.type,
          date: occasion.date,
          year: occasion.year,
          repeatAnnually: occasion.repeatAnnually,
          reminderEnabled: occasion.reminderEnabled,
          reminderDaysBefore: occasion.reminderDaysBefore,
          notes: occasion.notes,
        });
        this.showMessage('Occasion added successfully');
      }
    } catch (error) {
      console.error('Failed to save occasion:', error);
      this.showMessage('Failed to save occasion. Please try again.', true);
    }
  }

  private async handleDeleteOccasion(occasionId: string): Promise<void> {
    try {
      await this.occasionsService.remove(occasionId);
      this.showMessage('Occasion deleted');
    } catch (error) {
      console.error('Failed to delete occasion:', error);
      this.showMessage('Failed to delete occasion. Please try again.', true);
    }
  }

  private showMessage(message: string, isError = false): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: isError ? 5000 : 3000,
      panelClass: isError ? ['error-snackbar'] : [],
    });
  }
}

export { OccasionsComponent as Occasions };
