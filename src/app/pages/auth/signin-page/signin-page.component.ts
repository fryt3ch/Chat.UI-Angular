import { Component } from '@angular/core';
import {AuthService} from "../../../services/auth/auth.service";
import {SignInRequestDto} from "../../../models/auth/sign-in-request-dto";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {Router} from "@angular/router";
import {ToastrService} from "ngx-toastr";
import {catchError, EMPTY, finalize, of, tap} from "rxjs";
import {TranslateService} from "@ngx-translate/core";
import {ApiError} from "../../../models/common/api-result";

@Component({
  selector: 'app-signin-page',
  templateUrl: './signin-page.component.html',
  styleUrls: ['./signin-page.component.scss']
})
export class SignInPageComponent {
  constructor(protected authService: AuthService, protected router: Router, private toastr: ToastrService, private translateService: TranslateService) {

  }

  signInForm = new FormGroup({
    username: new FormControl<string>('', [
      Validators.required,
    ]),
    password: new FormControl<string>('', [
      Validators.required,
    ]),
    rememberMe: new FormControl<boolean>(false),
  });

  signInBtnDisabled: boolean = false;

  signIn() {
    let signInDto: SignInRequestDto = {
      username: <string>this.signInForm.controls.username.value,
      password: <string>this.signInForm.controls.password.value,
      rememberMe: <boolean>this.signInForm.controls.rememberMe.value,
    };

    this.signInBtnDisabled = true;

    setTimeout(() => {
      this.authService.signIn(signInDto)
        .pipe(
          catchError((err) => {
            return of();
          }),
          finalize(() => {
            this.signInBtnDisabled = false;
          })
        )
        .subscribe(next => {

        });
    }, 1_000);
  }
}
