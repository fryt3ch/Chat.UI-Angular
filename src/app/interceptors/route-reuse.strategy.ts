import {ActivatedRouteSnapshot, BaseRouteReuseStrategy, DetachedRouteHandle} from "@angular/router";

export class RouteReuseStrategy implements BaseRouteReuseStrategy {
  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return false;
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    return null;
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    return false;
  }

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return false;
  }

  store(route: ActivatedRouteSnapshot, detachedTree: DetachedRouteHandle): void;
  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void;
  store(route: ActivatedRouteSnapshot, detachedTree: DetachedRouteHandle | null): void {
  }

}
