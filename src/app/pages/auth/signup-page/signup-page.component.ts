import { Component } from '@angular/core';
import {AuthService} from "../../../services/auth/auth.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {SignUpDto} from "../../../models/auth/sign-up-dto";
import {Router} from "@angular/router";
import {equalsToControlValidator} from "../../../validators/equals-to-control.validator";
import 'node_modules/string-format-ts';
import {catchError, finalize, of, tap} from "rxjs";
import {TranslateService} from "@ngx-translate/core";
import {ToastrService} from "ngx-toastr";
import {SignInDto} from "../../../models/auth/sign-in-dto";
import {ApiError} from "../../../models/common/api-result";

@Component({
  selector: 'app-signup-page',
  templateUrl: './signup-page.component.html',
  styleUrls: ['./signup-page.component.scss']
})
export class SignUpPageComponent {
  constructor(protected authService: AuthService, protected router: Router, private toastr: ToastrService, private translateService: TranslateService) {

  }

  protected signUpBtnDisabled: boolean = false;

  signUpForm = new FormGroup({
    username: new FormControl<string>('', [
      Validators.required,
      Validators.minLength(5),
      Validators.maxLength(15),
    ]),
    email: new FormControl<string>('', [
      Validators.required,
      Validators.pattern('^[a-zA-Z0-9!#$%&\'*+/=?^_`{|}~-]+(?:\\.[a-zA-Z0-9!#$%&\'*+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\\.)+[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$')
    ]),
    password: new FormControl<string>('', [
      Validators.required,
      Validators.minLength(5),
      Validators.maxLength(15),
    ]),
    passwordConfirm: new FormControl<string>('', [
      Validators.required,
    ]),
  }, [
    equalsToControlValidator('password', 'passwordConfirm'),
  ]);

  signUp() {
    let signUpDto: SignUpDto = {
      username: <string>this.signUpForm.controls.username.value,
      email: <string>this.signUpForm.controls.email.value,
      password: <string>this.signUpForm.controls.password.value,
    };

    this.authService.signUp(signUpDto)
      .pipe(
        tap(apiResult => {
          this.translateService.get('signUp.success')
            .subscribe(x => {
              this.toastr.success(x);
            });

          let signInDto: SignInDto = {
            username: signUpDto.username,
            password: signUpDto.password,

            rememberMe: false,
          };

          this.authService.signIn(signInDto)
            .pipe(
              tap(() => {

              }),
              catchError(err => {
                this.router.navigate(['/auth/sign-in']);

                return of();
              })
            )
            .subscribe();
        }),
        catchError((err) => {
          return of();
        }),
        finalize(() => {
          this.signUpBtnDisabled = false;
        })
      )
      .subscribe();
  }

  protected readonly JSON = JSON;
}
