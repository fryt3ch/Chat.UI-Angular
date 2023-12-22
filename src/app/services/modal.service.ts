import {ComponentRef, Injectable, Type} from '@angular/core';
import {DialogService, DynamicDialogComponent, DynamicDialogConfig, DynamicDialogRef} from "primeng/dynamicdialog";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  constructor(private dialogService: DialogService) { }

  open(componentType: Type<any>, config: DynamicDialogConfig): ModalRef {
    const ref = this.dialogService.open(componentType, config);

    const dialogComponentRef = this.dialogService.dialogComponentRefMap.get(ref)!;

    dialogComponentRef.changeDetectorRef.detectChanges();

    const componentRef = dialogComponentRef.instance.componentRef!;

    return new ModalRef(ref, dialogComponentRef, componentRef);
  }

  closeAll() {
    this.dialogService.dialogComponentRefMap.forEach((value, key) => {
      key.close();
    });
  }
}

export class ModalRef {
  dialogRef: DynamicDialogRef;
  dialogComponentRef: ComponentRef<DynamicDialogComponent>;
  componentRef: ComponentRef<any>;

  constructor(dialogRef: DynamicDialogRef, dialogComponentRef: ComponentRef<DynamicDialogComponent>, componentRef: ComponentRef<any>) {
    this.dialogRef = dialogRef;
    this.dialogComponentRef = dialogComponentRef;
    this.componentRef = componentRef;
  }

  get onClose(): Observable<any> {
    return this.dialogRef.onClose;
  }

  close(result?: any) {
    this.dialogRef.close(result);
  }

  setInput(name: string, value: unknown) {
    this.componentRef.setInput(name, value);
  }
}
