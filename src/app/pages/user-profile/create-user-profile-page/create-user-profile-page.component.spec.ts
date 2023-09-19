import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateUserProfilePageComponent } from './create-user-profile-page.component';

describe('CreateUserProfilePageComponent', () => {
  let component: CreateUserProfilePageComponent;
  let fixture: ComponentFixture<CreateUserProfilePageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CreateUserProfilePageComponent]
    });
    fixture = TestBed.createComponent(CreateUserProfilePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
