
// src/app/shared/guards/role.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, ActivatedRouteSnapshot } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate, CanActivateChild {
  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const expectedRole = route.data['expectedRole'];
    const userRole = localStorage.getItem('role');

    if (!userRole || userRole !== expectedRole) {
      this.router.navigate(['/home']);
      return false;
    }
    return true;
  }

  canActivateChild = this.canActivate;
}