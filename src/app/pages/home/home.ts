import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'home',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, RouterLink],
  template: `
    <div class="home-container">
      <div class="hero-section">
        <h1>Welcome to My Calendar</h1>
        <p class="hero-subtitle">Organize your life with our modern, intuitive calendar application</p>
        <button mat-raised-button color="primary" routerLink="/" class="cta-button">
          <mat-icon>calendar_today</mat-icon>
          Go to Calendar
        </button>
      </div>

      <div class="features-grid">
        <mat-card class="feature-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>event</mat-icon>
            <mat-card-title>Create Events</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>Easily create and manage your events with our intuitive event creation modal. Set titles, descriptions, dates, and times.</p>
          </mat-card-content>
        </mat-card>

        <mat-card class="feature-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>edit</mat-icon>
            <mat-card-title>Edit & Delete</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>Click on any event to edit its details or delete it. Drag and drop events to reschedule them quickly.</p>
          </mat-card-content>
        </mat-card>

        <mat-card class="feature-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>view_module</mat-icon>
            <mat-card-title>Multiple Views</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>Switch between month, week, day, and list views to see your schedule in the way that works best for you.</p>
          </mat-card-content>
        </mat-card>

        <mat-card class="feature-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>phone_android</mat-icon>
            <mat-card-title>Responsive Design</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>Access your calendar from any device. Our responsive design ensures a great experience on desktop, tablet, and mobile.</p>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .home-container {
      padding: 2rem 0;
      max-width: 1200px;
      margin: 0 auto;
    }

    .hero-section {
      text-align: center;
      padding: 3rem 0;
      margin-bottom: 3rem;
    }

    .hero-section h1 {
      font-size: 3rem;
      font-weight: 500;
      margin-bottom: 1rem;
      color: var(--mat-sys-on-surface);
    }

    .hero-subtitle {
      font-size: 1.25rem;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 2rem;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }

    .cta-button {
      font-size: 1.1rem;
      padding: 0.75rem 2rem;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-top: 2rem;
    }

    .feature-card {
      height: 100%;
    }

    .feature-card mat-card-header {
      margin-bottom: 1rem;
    }

    .feature-card mat-icon[mat-card-avatar] {
      background-color: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
      font-size: 24px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    @media (max-width: 768px) {
      .home-container {
        padding: 1rem;
      }

      .hero-section h1 {
        font-size: 2rem;
      }

      .hero-subtitle {
        font-size: 1rem;
      }

      .features-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
    }
  `],
})
export class Home {}
