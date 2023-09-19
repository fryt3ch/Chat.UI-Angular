import {inject, Injectable, Injector} from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor, HttpErrorResponse, HttpResponse
} from '@angular/common/http';
import {catchError, finalize, Observable, of, retry, tap, throwError} from 'rxjs';
import {ApiError, ApiResult, isApiResult} from "../models/common/api-result";
import {TranslateService} from "@ngx-translate/core";
import {ToastrService} from "ngx-toastr";

@Injectable({
  providedIn: 'root'
})
export class ApiResultInterceptor implements HttpInterceptor {

  constructor(private toastrService: ToastrService, private injector: Injector) {

  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request)
      .pipe(
        tap(event => {
          if (event instanceof HttpResponse && event.status === 200 && event.body)
          {
            if (!isApiResult(event.body) || event.body.succeeded)
              return;

            throw new ApiError(event.body);
          }
        }),
        catchError(error => {
          if (error instanceof  ApiError) {
            if (error.apiResult.errors.length > 0) {
              const translateService = this.injector.get(TranslateService);

              translateService.get(`apiErrors.${error.apiResult.errors[0].code}`)
                .subscribe(x => {
                  this.toastrService.error(x);
                });
            }
          }

          throw error;
        }),
      );
  }
}
