import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatPreviewPanelComponent } from './chat-preview-panel.component';

describe('ChatPreviewPanelComponent', () => {
  let component: ChatPreviewPanelComponent;
  let fixture: ComponentFixture<ChatPreviewPanelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ChatPreviewPanelComponent]
    });
    fixture = TestBed.createComponent(ChatPreviewPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
