import {CanActivateFn, Router} from '@angular/router';
import {AuthService} from "../../services/auth/auth.service";
import {inject} from "@angular/core";

export const signedInGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);

  if (!authService.isSignedIn())
  {
    const router = inject(Router);

    return router.parseUrl('auth/sign-in');
  }

  return true;
};

export const notSignedInGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);

  if (authService.isSignedIn())
  {
    const router = inject(Router);

    return router.navigate([`/profile`, authService.user!.username]);
  }

  return true;
};
