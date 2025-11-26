// File: guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    // 1. Check if user is logged in
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/admin-login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    }

    // 2. Check role if required
    const requiredRole = route.data['role'] as string;
    if (requiredRole) {
      const userRole = this.auth.getRole();

      if (userRole !== requiredRole) {
        this.router.navigate(['/unauthorized']);
        return false;
      }
    }

    return true;
  }
}
