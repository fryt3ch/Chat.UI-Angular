import { Component } from '@angular/core';
import {AuthService} from "../../../services/auth/auth.service";
import {SignInDto} from "../../../models/auth/signInDto";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {Router} from "@angular/router";
import {ToastrService} from "ngx-toastr";
import {catchError, finalize, tap} from "rxjs";

@Component({
  selector: 'app-signin-page',
  templateUrl: './signin-page.component.html',
  styleUrls: ['./signin-page.component.scss']
})
export class SignInPageComponent {
  constructor(protected authService: AuthService, protected router: Router, private toastr: ToastrService) {

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
    var signInDto = new SignInDto();

    signInDto.username = <string>this.signInForm.controls.username.value;
    signInDto.password = <string>this.signInForm.controls.password.value;
    signInDto.rememberMe = <boolean>this.signInForm.controls.rememberMe.value;

    this.signInBtnDisabled = true;

    this.authService.signIn(signInDto)
      .pipe(
        tap(apiResult => {
          if (!apiResult.succeeded) {
            if (apiResult.errors.find(error => error.code == "wrongDataProvided")) {
              this.toastr.error("Wrong credentials were provided!");
            }
          }
        }),
        catchError((err, apiResult) => {
          this.toastr.error("Something went wrong!");

          return apiResult;
        }),
        finalize(() => {
          this.signInBtnDisabled = false;
        })
      )
      .subscribe();
  }
}
