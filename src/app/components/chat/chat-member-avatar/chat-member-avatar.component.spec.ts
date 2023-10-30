import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatMemberAvatarComponent } from './chat-member-avatar.component';

describe('ChatMemberAvatarComponent', () => {
  let component: ChatMemberAvatarComponent;
  let fixture: ComponentFixture<ChatMemberAvatarComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ChatMemberAvatarComponent]
    });
    fixture = TestBed.createComponent(ChatMemberAvatarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
