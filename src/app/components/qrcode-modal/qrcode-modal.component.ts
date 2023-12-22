import {Component, Input, Optional} from '@angular/core';
import {DialogService, DynamicDialogConfig, DynamicDialogRef} from "primeng/dynamicdialog";

@Component({
  selector: 'app-qrcode-modal',
  templateUrl: './qrcode-modal.component.html',
  styleUrls: ['./qrcode-modal.component.scss'],
  providers: [DialogService],
})
export class QrcodeModalComponent {

  defaultColorDark: string = '#000000';

  colorDark: string = this.defaultColorDark;
  colorLight: string = '#ffffff';

  @Input() public qrData: string = 'test';

  constructor(
    @Optional() private ref: DynamicDialogRef,
  ) {

  }

  ngOnInit() {
    const style = getComputedStyle(document.body);

    this.defaultColorDark = style.getPropertyValue('--primary-color');
    this.colorDark = this.defaultColorDark;
  }
}
