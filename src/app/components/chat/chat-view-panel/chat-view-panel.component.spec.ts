import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatViewPanelComponent } from './chat-view-panel.component';

describe('ChatViewPanelComponent', () => {
  let component: ChatViewPanelComponent;
  let fixture: ComponentFixture<ChatViewPanelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ChatViewPanelComponent]
    });
    fixture = TestBed.createComponent(ChatViewPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
