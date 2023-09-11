import { Injectable } from '@angular/core';
import {AuthService} from "./auth/auth.service";
import {catchError, EMPTY, lastValueFrom, of} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class InitializerService {

  constructor(private authService: AuthService) {

  }

  initialize(): Promise<any> {
    return lastValueFrom(
      this.authService.loadUser()
        .pipe(
          catchError((err, x) => {
            return of(null);
          })
        )
    );
  }
}
