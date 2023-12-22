import {Component, EventEmitter, Input, Optional, Output} from '@angular/core';
import {DialogService, DynamicDialogConfig, DynamicDialogRef} from "primeng/dynamicdialog";

@Component({
  selector: 'app-date-picker-modal',
  templateUrl: './date-picker-modal.component.html',
  styleUrls: ['./date-picker-modal.component.scss'],
  providers: [DialogService],
})
export class DatePickerModalComponent {
  @Input() maxDate: Date = new Date();

  @Output() datePicked: EventEmitter<Date> = new EventEmitter<Date>();

  constructor(
    @Optional() private ref: DynamicDialogRef,
    @Optional() private config: DynamicDialogConfig,
  ) {
    if (config?.data) {
      this.datePicked = config.data.datePicked;
    }
  }
}
