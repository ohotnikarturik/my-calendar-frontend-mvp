import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import type { CalendarEvent } from '../types/event.type';

export interface EventModalData {
  event?: CalendarEvent;
  date?: string;
  isEdit?: boolean;
}

@Component({
  selector: 'event-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
  ],
  template: `
    <div class="event-modal">
      <h2 mat-dialog-title>{{ isEdit() ? 'Edit Event' : 'Create New Event' }}</h2>
      
      <form [formGroup]="eventForm" (ngSubmit)="onSave()">
        <div mat-dialog-content class="modal-content">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Event Title</mat-label>
            <input matInput formControlName="title" placeholder="Enter event title" required>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Description</mat-label>
            <textarea matInput formControlName="description" placeholder="Enter event description" rows="3"></textarea>
          </mat-form-field>

          <div class="date-time-row">
            <mat-form-field appearance="outline" class="date-field">
              <mat-label>Start Date</mat-label>
              <input matInput [matDatepicker]="startPicker" formControlName="startDate" required>
              <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
              <mat-datepicker #startPicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline" class="time-field" *ngIf="!isAllDay()">
              <mat-label>Start Time</mat-label>
              <input matInput type="time" formControlName="startTime">
            </mat-form-field>
          </div>

          <div class="date-time-row" *ngIf="!isAllDay()">
            <mat-form-field appearance="outline" class="date-field">
              <mat-label>End Date</mat-label>
              <input matInput [matDatepicker]="endPicker" formControlName="endDate">
              <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
              <mat-datepicker #endPicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline" class="time-field">
              <mat-label>End Time</mat-label>
              <input matInput type="time" formControlName="endTime">
            </mat-form-field>
          </div>

          <mat-checkbox formControlName="allDay" (change)="onAllDayChange()">
            All Day Event
          </mat-checkbox>
        </div>

        <div mat-dialog-actions class="modal-actions">
          <button mat-button type="button" (click)="onCancel()">Cancel</button>
          <button mat-button color="warn" type="button" *ngIf="isEdit()" (click)="onDelete()">Delete</button>
          <button mat-raised-button color="primary" type="submit" [disabled]="!isFormValid()">
            {{ isEdit() ? 'Update' : 'Create' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .event-modal {
      min-width: 400px;
      max-width: 600px;
    }

    .modal-content {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem 0;
    }

    .full-width {
      width: 100%;
    }

    .date-time-row {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    .date-field {
      flex: 2;
    }

    .time-field {
      flex: 1;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      padding-top: 1rem;
    }

    @media (max-width: 600px) {
      .event-modal {
        min-width: 300px;
      }

      .date-time-row {
        flex-direction: column;
        gap: 0.5rem;
      }

      .date-field,
      .time-field {
        flex: 1;
        width: 100%;
      }
    }
  `],
})
export class EventModal {
  private dialogRef = inject(MatDialogRef<EventModal>);
  private data = inject(MAT_DIALOG_DATA) as EventModalData;
  private fb = inject(FormBuilder);

  isEdit = signal(this.data?.isEdit || false);
  isAllDay = signal(this.data?.event?.allDay || false);
  
  eventForm = this.fb.group({
    title: [this.data?.event?.title || '', Validators.required],
    description: [this.data?.event?.description || ''],
    startDate: [this.getInitialStartDate(), Validators.required],
    startTime: [this.getInitialStartTime()],
    endDate: [this.getInitialEndDate()],
    endTime: [this.getInitialEndTime()],
    allDay: [this.data?.event?.allDay || false]
  });

  isFormValid = computed(() => {
    return this.eventForm.valid && !!this.eventForm.get('title')?.value?.trim();
  });

  constructor() {
    // Watch for allDay changes and update form accordingly
    this.eventForm.get('allDay')?.valueChanges.subscribe(allDay => {
      this.isAllDay.set(!!allDay);
      if (allDay) {
        this.eventForm.get('startTime')?.clearValidators();
        this.eventForm.get('endTime')?.clearValidators();
        this.eventForm.get('endDate')?.clearValidators();
      } else {
        this.eventForm.get('startTime')?.setValidators(Validators.required);
        this.eventForm.get('endTime')?.setValidators(Validators.required);
        this.eventForm.get('endDate')?.setValidators(Validators.required);
      }
      this.eventForm.get('startTime')?.updateValueAndValidity();
      this.eventForm.get('endTime')?.updateValueAndValidity();
      this.eventForm.get('endDate')?.updateValueAndValidity();
    });
  }

  private getInitialStartDate(): Date {
    if (this.data?.event?.start) {
      return new Date(this.data.event.start.toString());
    }
    if (this.data?.date) {
      return new Date(this.data.date);
    }
    return new Date();
  }

  private getInitialEndDate(): Date {
    if (this.data?.event?.end) {
      return new Date(this.data.event.end.toString());
    }
    return new Date();
  }

  private getInitialStartTime(): string {
    const date = this.getInitialStartDate();
    return this.formatTime(date);
  }

  private getInitialEndTime(): string {
    const date = this.getInitialEndDate();
    return this.formatTime(date);
  }

  private formatTime(date: Date): string {
    return date.toTimeString().slice(0, 5);
  }

  onAllDayChange(): void {
    // This is handled by the form valueChanges subscription
  }

  onSave(): void {
    if (!this.isFormValid()) return;

    const formValue = this.eventForm.value;
    const startDate = formValue.startDate as Date;
    const endDate = formValue.endDate as Date;
    
    const event: CalendarEvent = {
      id: this.data?.event?.id || Date.now().toString(),
      title: formValue.title!.trim(),
      description: formValue.description?.trim(),
      allDay: this.isAllDay(),
      start: this.isAllDay() ? 
        startDate.toISOString().split('T')[0] :
        new Date(`${startDate.toISOString().split('T')[0]}T${formValue.startTime}`).toISOString(),
      end: this.isAllDay() ? 
        undefined :
        new Date(`${endDate.toISOString().split('T')[0]}T${formValue.endTime}`).toISOString(),
      createdAt: this.data?.event?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.dialogRef.close({ action: 'save', event });
  }

  onDelete(): void {
    this.dialogRef.close({ action: 'delete', eventId: this.data?.event?.id });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
