import {Component, EventEmitter, Output} from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {Country, getCountryFlagEmoji, getCountryNameLocale} from "../../../models/common/country.enum";
import {CreateUserProfileRequestDto} from "../../../models/user-profile/create-user-profile-dto";
import {UserProfileService} from "../../../services/user-profile/user-profile.service";
import {catchError, finalize, of, pipe, tap} from "rxjs";
import {Router} from "@angular/router";
import {AuthService} from "../../../services/auth/auth.service";
import {ToastrService} from "ngx-toastr";
import {UpdateUserProfileAvatarRequestDto} from "../../../models/user-profile/update-user-profile-avatar-dto";
import {UserDto} from "../../../models/auth/user-dto";
import {PostPhotoRequestDto} from "../../../models/user-profile/post-photo-dto";
import {Gender, getGenderNameLocale} from "../../../models/common/gender.enum";
import {FileRemoveEvent, FileSelectEvent} from "primeng/fileupload";

@Component({
  selector: 'app-create-user-profile-page',
  templateUrl: './create-user-profile-page.component.html',
  styleUrls: ['./create-user-profile-page.component.scss']
})
export class CreateUserProfilePageComponent {
  constructor(private toastr: ToastrService, private authService: AuthService, private userProfileService: UserProfileService, private router: Router) {

  }

  createForm = new FormGroup({
    name: new FormControl<string>('', [
      Validators.required,
    ]),
    surname: new FormControl<string>('', [
      Validators.required,
    ]),
    birthDate: new FormControl<Date>(new Date(Date.parse("2022-04-17")), [
      Validators.required,
    ]),
    country: new FormControl<Country>(Country.russia, [
      Validators.required,
    ]),
    gender: new FormControl<Gender>(Gender.male, [
      Validators.required,
    ]),
  });

  protected avatarFile: File | null = null;
  protected avatarFileUrl: string | null = null;

  protected countryTypes: Country[] = Object.values(Country).filter(value => typeof value === 'number').map(value => <Country>value);
  protected genderTypes: Gender[] = Object.values(Gender).filter(value => typeof value === 'number').map(value => <Gender>value);

  progress: number = 0;
  message: string = '';
  @Output() public onUploadFinished = new EventEmitter();

  create() {
    const user = this.authService.user;

    if (!user)
      return;

    let createDto: CreateUserProfileRequestDto = {
      name: this.createForm.controls.name.value!,
      surname: this.createForm.controls.surname.value!,
      gender: this.createForm.controls.gender.value!,
      birthDate: this.createForm.controls.birthDate.value!,
      country: this.createForm.controls.country.value!
    };

    this.userProfileService.create(user, createDto)
      .pipe(
        tap(apiResult => {
          if (this.avatarFile != null)
          {
            let postPhotoDto: PostPhotoRequestDto = {

            };

            this.userProfileService.postPhoto(this.avatarFile, postPhotoDto)
              .pipe(
                tap(apiResult => {
                  let updateAvatarDto: UpdateUserProfileAvatarRequestDto = {
                    photoId: apiResult.data,
                  };

                  this.userProfileService.updateAvatar(updateAvatarDto)
                    .pipe(
                      tap((apiResult) => {
                        this.toastr.success("You've successfully created your profile! Here it is");

                        this.router.navigate(['/profile', user.username], { onSameUrlNavigation: "reload", });
                      }),
                      catchError(err => {
                        this.toastr.warning("Something went wrong while applying your avatar!");

                        return of(err);
                      }),
                    )
                    .subscribe();
                }),
                catchError((err) => {
                  return of();
                }),
              )
              .subscribe();
          }
          else {
            this.toastr.success("You've successfully created your profile! Here it is");

            this.router.navigate(['/profile', user.username], { onSameUrlNavigation: "reload", });
          }
        }),
        catchError((err) => {
          return of();
        })
      )
      .subscribe();

    //console.log(JSON.stringify(createDto));
  }

  onSelectAvatarFile(event: FileSelectEvent) {
    if (event.files.length === 0)
      return;

    const file = event.files[0];

    var reader = new FileReader();

    reader.onload = event => {
      this.avatarFile = file;
      this.avatarFileUrl = event.target!.result!.toString();
    };

    reader.onerror = event => {

    };

    reader.readAsDataURL(file);
  }

  onRemoveAvatarFile(event: FileRemoveEvent) {
    if (!this.avatarFile)
      return;

    this.avatarFile = null;
    this.avatarFileUrl = null;
  }

  protected readonly getCountryNameLocale = getCountryNameLocale;
  protected readonly getCountryFlagEmoji = getCountryFlagEmoji;
  protected readonly getGenderNameLocale = getGenderNameLocale;
  protected readonly Gender = Gender;
}
