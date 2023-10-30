import {Component} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {UserProfileService} from "../../../services/user-profile/user-profile.service";
import {UserProfileDto} from "../../../models/user-profile/user-profile-dto";
import {catchError, finalize, of, tap} from "rxjs";
import {AuthService} from "../../../services/auth/auth.service";
import {GetPhotoRequestDto} from "../../../models/user-profile/get-photo-dto";
import {DomSanitizer, SafeUrl} from "@angular/platform-browser";
import {environment} from "../../../../environments/environment";
import {Gender} from "../../../models/common/gender.enum";

@Component({
  selector: 'app-user-profile-page',
  templateUrl: './user-profile-page.component.html',
  styleUrls: ['./user-profile-page.component.scss']
})
export class UserProfilePageComponent {

  protected userProfile: UserProfileDto | null = null;

  protected avatarPhotoUrl: SafeUrl | null = null;

  protected isLoaded: boolean = false;

  protected previousUrl : string | undefined;

  protected isMyProfile: boolean = false;

  constructor(private domSanitizer: DomSanitizer, private authService: AuthService, protected router: Router, private activatedRoute: ActivatedRoute, protected userProfileService: UserProfileService) {
    this.previousUrl = this.router.getCurrentNavigation()?.previousNavigation?.finalUrl?.toString();
  }

  ngOnInit() {
    const username = this.activatedRoute.snapshot.params['username'];

    if (this.authService.user && this.authService.user.username === username)
      this.isMyProfile = true;

    this.userProfileService.get(username, { full: true, })
      .pipe(
        tap(value => {
          this.userProfile = value;

          if (this.userProfile.avatarPhotoId) {
            let getPhotoDto: GetPhotoRequestDto = {
              userId: this.userProfile.id,
              photoId: this.userProfile.avatarPhotoId,
            };

            this.userProfileService.getPhoto(getPhotoDto)
              .pipe(
                catchError(err => {
                  this.avatarPhotoUrl = this.getDefaultAvatarUrl(this.userProfile!.gender);

                  return of();
                }),
              )
              .subscribe(next => {
                  this.avatarPhotoUrl = next;
              });
          }
          else {
            this.avatarPhotoUrl = this.getDefaultAvatarUrl(this.userProfile.gender);
          }
        }),
        catchError(err => {
          if (err.status == 404) {

          }

          return of(err);
        }),
        finalize(() => {
          setTimeout(() => {
            this.isLoaded = true;
          }, 1000);
        })
      )
      .subscribe();
  }

  private getDefaultAvatarUrl(gender: Gender) {
    return this.domSanitizer.bypassSecurityTrustUrl(gender == Gender.male ? environment.assetPaths.defaultAvatar.male : environment.assetPaths.defaultAvatar.female);
  }
}
