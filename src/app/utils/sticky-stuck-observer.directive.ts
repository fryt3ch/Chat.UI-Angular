import {
  Directive,
  OnInit,
  ElementRef,
  Input,
  AfterViewInit,
  Inject,
  PLATFORM_ID, EventEmitter, Output, OnDestroy,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

/** @dynamic */
@Directive({
  standalone: true,
  selector: '[stickyStuckObserver]',
})
export class StickyStuckObserverDirective implements OnInit, AfterViewInit, OnDestroy {
  @Input()
  get scrollContainer(): HTMLElement {
    return this._scrollContainer;
  }
  set scrollContainer(value: string | ElementRef | HTMLElement) {
    this._scrollContainer = this.getHTMLElement( value);
  }
  private _scrollContainer!: HTMLElement;

  private topSentryElement!: HTMLElement;
  private topSentryObserver!: IntersectionObserver;

  @Output()
  stuckCallback: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: object,
    private stickyElement: ElementRef<HTMLElement>
  ) {}

  ngOnInit(): void {

  }

  ngAfterViewInit() {
    this.insertTopSentry();

    if (
      isPlatformBrowser(this.platformId) &&
      this.intersectionObserverExists()
    ) {
      this.setObserver();
    }
  }

  ngOnDestroy() {
    this.topSentryObserver.disconnect();

    this.topSentryElement.remove();
  }

  private intersectionObserverExists() {
    return 'IntersectionObserver' in window;
  }

  private getHTMLElement(
    value: string | ElementRef | HTMLElement
  ): HTMLElement {
    if (typeof value === 'string') {
      return this.document.getElementById(value)!;
    } else if (value instanceof ElementRef) {
      return value.nativeElement;
    } else {
      return value;
    }
  }

  private setStylePropertyToElement(
    nativeEl: HTMLElement,
    property: keyof CSSStyleDeclaration,
    value: string
  ) {
    nativeEl.style.setProperty(property.toString(), value);
  }

  private setObserver() {
    let isParentContainerVisible = false;
    let isTopSentryVisible = false;

    this.topSentryObserver = new IntersectionObserver(
      (records) => {
        records.forEach(record => {
          const targetInfo = record.boundingClientRect;
          const stickyTarget = this.stickyElement.nativeElement;
          const rootBoundsInfo = record.rootBounds!;

          if (record.intersectionRatio > 0) {
            if (record.target == this.stickyElement.nativeElement.parentElement) {
              isParentContainerVisible = true;
            } else {
              isTopSentryVisible = true;
            }
          } else {
            if (record.target == this.stickyElement.nativeElement.parentElement) {
              isParentContainerVisible = false;
            } else {
              isTopSentryVisible = false;
            }
          }
        });

        if (isParentContainerVisible && !isTopSentryVisible) {
          this.stuckCallback.next(true);
        } else {
          this.stuckCallback.next(false);
        }
      },
      {
        threshold: [0],
        root: this.scrollContainer,
      }
    );

    this.topSentryObserver.observe(this.topSentryElement);
    this.topSentryObserver.observe(this.stickyElement.nativeElement.parentElement!);
  }

  private createSentryElement(): HTMLElement {
    const sentinelEl = this.document.createElement('div');

    sentinelEl.setAttribute('stickyStuckTopSentryElement', '1');
    sentinelEl.style.position = 'absolute';
    sentinelEl.style.visibility = 'hidden';
    sentinelEl.style.top = '0';

    return sentinelEl;
  }

  private insertTopSentry() {
    const sentryTop = this.createSentryElement();
    const stickyParent = this.stickyElement.nativeElement.parentElement!;

    this.topSentryElement = stickyParent.insertAdjacentElement('afterbegin', sentryTop) as HTMLElement;
  }
}
