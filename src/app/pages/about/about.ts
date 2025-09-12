import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'about',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatChipsModule],
  template: `
    <div class="about-container">
      <div class="about-header">
        <h1>About My Calendar</h1>
        <p class="about-subtitle">A modern, signal-based Angular calendar application</p>
      </div>

      <div class="about-content">
        <mat-card class="info-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>info</mat-icon>
            <mat-card-title>Project Overview</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>
              My Calendar is a modern web application built with Angular 20 and Angular Material. 
              It demonstrates the latest Angular features including signals, reactive forms, and standalone components.
            </p>
            <p>
              The application provides a full-featured calendar interface powered by FullCalendar, 
              with the ability to create, edit, delete, and manage events through an intuitive user interface.
            </p>
          </mat-card-content>
        </mat-card>

        <mat-card class="tech-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>code</mat-icon>
            <mat-card-title>Technologies Used</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="tech-chips">
              <mat-chip-set>
                <mat-chip>Angular 20</mat-chip>
                <mat-chip>Angular Material</mat-chip>
                <mat-chip>TypeScript</mat-chip>
                <mat-chip>FullCalendar</mat-chip>
                <mat-chip>Angular Signals</mat-chip>
                <mat-chip>Reactive Forms</mat-chip>
                <mat-chip>Standalone Components</mat-chip>
                <mat-chip>SCSS</mat-chip>
              </mat-chip-set>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="features-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>star</mat-icon>
            <mat-card-title>Key Features</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <ul class="features-list">
              <li><mat-icon>check_circle</mat-icon> Signal-based reactive state management</li>
              <li><mat-icon>check_circle</mat-icon> Modern Angular standalone components</li>
              <li><mat-icon>check_circle</mat-icon> Reactive forms with validation</li>
              <li><mat-icon>check_circle</mat-icon> Material Design 3 theming</li>
              <li><mat-icon>check_circle</mat-icon> Responsive design for all devices</li>
              <li><mat-icon>check_circle</mat-icon> Drag and drop event management</li>
              <li><mat-icon>check_circle</mat-icon> Multiple calendar views</li>
              <li><mat-icon>check_circle</mat-icon> Event creation and editing modals</li>
            </ul>
          </mat-card-content>
        </mat-card>

        <mat-card class="version-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>update</mat-icon>
            <mat-card-title>Version Information</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="version-info">
              <div class="version-item">
                <strong>Version:</strong> 1.0.0 MVP
              </div>
              <div class="version-item">
                <strong>Build:</strong> Angular CLI 20.1.3
              </div>
              <div class="version-item">
                <strong>Last Updated:</strong> {{ currentDate }}
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .about-container {
      padding: 2rem 0;
      max-width: 1000px;
      margin: 0 auto;
    }

    .about-header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .about-header h1 {
      font-size: 2.5rem;
      font-weight: 500;
      margin-bottom: 1rem;
      color: var(--mat-sys-on-surface);
    }

    .about-subtitle {
      font-size: 1.25rem;
      color: var(--mat-sys-on-surface-variant);
      margin: 0;
    }

    .about-content {
      display: grid;
      gap: 2rem;
    }

    .info-card,
    .tech-card,
    .features-card,
    .version-card {
      width: 100%;
    }

    .info-card mat-icon[mat-card-avatar],
    .tech-card mat-icon[mat-card-avatar],
    .features-card mat-icon[mat-card-avatar],
    .version-card mat-icon[mat-card-avatar] {
      background-color: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
      font-size: 24px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .tech-chips {
      margin-top: 1rem;
    }

    .tech-chips mat-chip-set {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .features-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .features-list li {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }

    .features-list li:last-child {
      border-bottom: none;
    }

    .features-list mat-icon {
      color: var(--mat-sys-primary);
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .version-info {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .version-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }

    .version-item:last-child {
      border-bottom: none;
    }

    @media (max-width: 768px) {
      .about-container {
        padding: 1rem;
      }

      .about-header h1 {
        font-size: 2rem;
      }

      .about-subtitle {
        font-size: 1rem;
      }

      .version-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
      }
    }
  `],
})
export class About {
  currentDate = new Date().toLocaleDateString();
}
