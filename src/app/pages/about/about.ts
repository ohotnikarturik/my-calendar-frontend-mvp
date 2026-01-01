import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'about',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    TranslatePipe,
  ],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class About {
  currentDate = new Date().toLocaleDateString();
}
