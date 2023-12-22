import { Injectable } from '@angular/core';
import {AuthService} from "./auth/auth.service";
import {catchError, EMPTY, lastValueFrom, of} from "rxjs";
import {PrimeNGConfig} from "primeng/api";

@Injectable({
  providedIn: 'root'
})
export class InitializerService {

  constructor(private authService: AuthService, private primeConfig: PrimeNGConfig) {

  }

  initialize(): Promise<any> {
    this.primeConfig.ripple = true;

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
