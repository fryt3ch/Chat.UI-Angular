import {Component, EventEmitter, Input, Optional, Output} from '@angular/core';
import {DialogService, DynamicDialogConfig, DynamicDialogRef} from "primeng/dynamicdialog";

@Component({
  selector: 'app-confirmation-modal',
  templateUrl: './confirmation-modal.component.html',
  styleUrls: ['./confirmation-modal.component.scss'],
  providers: [DialogService],
})
export class ConfirmationModalComponent {
  @Input() text: string = '';
  @Input() closeOnClick: boolean = true;

  @Output() accept: EventEmitter<void> = new EventEmitter<void>();
  @Output() reject: EventEmitter<{ onClose: boolean, }> = new EventEmitter<{ onClose: boolean, }>();

  constructor(
    @Optional() private ref: DynamicDialogRef,
    @Optional() private config: DynamicDialogConfig,
  ) {
    if (config?.data) {
      if (config.data.accept)
        this.accept = config.data.accept;

      if (config.data.reject)
        this.reject = config.data.reject;
    }
  }

  protected acceptBtnClicked() {
    if (this.closeOnClick)
      this.ref.close();

    this.accept.emit();
  }

  protected rejectBtnClicked() {
    if (this.closeOnClick)
      this.ref.close();

    this.reject.emit({ onClose: false, });
  }
}
