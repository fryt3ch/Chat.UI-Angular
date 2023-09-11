import { Component } from '@angular/core';
import {AuthService} from "./services/auth/auth.service";
import {finalize} from "rxjs";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(private authService: AuthService) {
  }

  ngOnInit() {

  }
}
