import { DefaultUrlSerializer, UrlTree } from '@angular/router';

export class LowercaseUrlSerializer extends DefaultUrlSerializer {
  override parse(url: string): UrlTree {

    return super.parse(url.toLowerCase());
  }
}
