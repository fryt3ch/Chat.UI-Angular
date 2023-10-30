import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatPreviewElementComponent } from './chat-preview-element.component';

describe('ChatPreviewElementComponent', () => {
  let component: ChatPreviewElementComponent;
  let fixture: ComponentFixture<ChatPreviewElementComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ChatPreviewElementComponent]
    });
    fixture = TestBed.createComponent(ChatPreviewElementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
