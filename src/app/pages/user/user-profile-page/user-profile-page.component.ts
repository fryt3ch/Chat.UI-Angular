import { Component } from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {UserProfileService} from "../../../services/user-profile/user-profile.service";
import {IUser} from "../../../models/auth/user";
import {IUserProfileDto} from "../../../models/userProfileDto";

@Component({
  selector: 'app-user-profile-page',
  templateUrl: './user-profile-page.component.html',
  styleUrls: ['./user-profile-page.component.scss']
})
export class UserProfilePageComponent {

  protected userProfile: IUserProfileDto | null = null;

  constructor(private activatedRoute: ActivatedRoute, protected userProfileService: UserProfileService) {

  }

  ngOnInit() {
    const username = this.activatedRoute.snapshot.params['username'];

    this.userProfileService.get(username).subscribe(x => {
      this.userProfile = x;
    });
  }
}
