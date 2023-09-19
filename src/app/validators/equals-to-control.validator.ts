import {
  AbstractControl, FormGroup,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

export function equalsToControlValidator(controlName: string, targetControlName: string) : ValidatorFn {
  return (form: AbstractControl) : ValidationErrors | null => {
    const control = form.get(controlName)!
    const targetControl = form.get(targetControlName);

    if (!control || !targetControl)
      return null;

    if (targetControl.errors && !targetControl.errors['equalsToControl'])
      return null;

    if (control.value != targetControl.value)
      targetControl.setErrors({ ...(targetControl.errors|| {}) , 'equalsToControl': true, });
    else {
      if (targetControl.errors)
      {
        delete targetControl.errors['equalsToControl'];

        targetControl.updateValueAndValidity();
      }
    }

    return null;
  };
}
