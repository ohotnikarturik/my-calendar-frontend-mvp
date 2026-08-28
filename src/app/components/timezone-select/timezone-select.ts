import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import {
  buildTimezoneRegions,
  formatTimezoneLabelWithId,
  type TimezoneOption,
} from '../../types/timezone.type';

@Component({
  selector: 'timezone-select',
  standalone: true,
  imports: [MatFormFieldModule, MatSelectModule],
  templateUrl: './timezone-select.html',
  styleUrl: './timezone-select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimezoneSelectComponent {
  readonly value = input<string>('UTC');
  readonly label = input<string>('Select timezone');
  readonly ariaLabel = input<string>('Select timezone');

  readonly valueChange = output<string>();

  readonly timezoneRegions = computed(() => buildTimezoneRegions(this.value()));

  formatLabel(option: TimezoneOption): string {
    return formatTimezoneLabelWithId(option);
  }

  onSelectionChange(timezone: string): void {
    this.valueChange.emit(timezone);
  }
}
