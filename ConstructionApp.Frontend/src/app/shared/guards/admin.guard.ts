// src/app/shared/guards/admin.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  private jwtHelper = new JwtHelperService();

  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const token = localStorage.getItem('adminToken');

    if (!token || this.jwtHelper.isTokenExpired(token)) {
      this.router.navigate(['/admin-login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    try {
      const decoded = this.jwtHelper.decodeToken(token);
      const role = decoded['role'] || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

      // AdminGuard - Role check
    if (role !== 'Admin') {
      this.router.navigate(['/admin-login']);
      return false;
    }
      return true;
    } catch {
      this.router.navigate(['/admin-login']);
      return false;
    }
  }
}
