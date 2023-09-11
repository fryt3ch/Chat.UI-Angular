import { Component } from '@angular/core';
import {AuthService} from "../../../services/auth/auth.service";
import {FormControl, FormGroup} from "@angular/forms";
import {SignUpDto} from "../../../models/auth/signUpDto";
import {Router} from "@angular/router";

@Component({
  selector: 'app-signup-page',
  templateUrl: './signup-page.component.html',
  styleUrls: ['./signup-page.component.scss']
})
export class SignUpPageComponent {
  constructor(protected authService: AuthService, protected router: Router) {
  }

  signUpForm = new FormGroup({
    username: new FormControl<string>(''),
    email: new FormControl<string>(''),
    password: new FormControl<string>(''),
  });

  signUp() {
    var signUpDto = new SignUpDto();

    signUpDto.username = <string>this.signUpForm.controls.username.value;
    signUpDto.email = <string>this.signUpForm.controls.email.value;
    signUpDto.password = <string>this.signUpForm.controls.password.value;

    this.authService.signUp(signUpDto)
      .subscribe({
        next: nxt => {
          console.log(nxt);
        },
        error: err => {
          console.log(err);
        }
      });
  }
}
