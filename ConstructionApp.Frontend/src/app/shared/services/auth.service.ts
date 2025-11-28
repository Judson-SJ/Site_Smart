// src/app/shared/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  role?: string;
  user?: {
    name?: string;
    email?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:5035/api';
  private tokenKey = 'token';
  private roleKey = 'role';
  private userNameKey = 'userName';

  // Observable for role changes (useful for navbar, guards, etc.)
  userRole$ = new BehaviorSubject<string | null>(localStorage.getItem(this.roleKey));

  constructor(private http: HttpClient, private router: Router) {}

  register(payload: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/Auth/register`, payload);
  }

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/Auth/login`, credentials).pipe(
      tap(res => {
        if (res.success && res.token) {
          // Save to localStorage
          localStorage.setItem(this.tokenKey, res.token);
          localStorage.setItem(this.roleKey, res.role || 'Customer');
          localStorage.setItem(this.userNameKey, res.user?.name || 'User');

          // Update observable
          this.userRole$.next(res.role || 'Customer');

          // ROLE-BASED REDIRECT — இதுதான் முக்கியம்!
          const role = res.role || 'Customer';
          if (role === 'Admin') {
            this.router.navigate(['/admin/dashboard']);
          } else if (role === 'Technician') {
            this.router.navigate(['/technician/dashboard']);
          } else {
            this.router.navigate(['/customer/dashboard']); // Customer default
          }
        }
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getRole(): string | null {
    return localStorage.getItem(this.roleKey);
  }

  getUserName(): string {
    return localStorage.getItem(this.userNameKey) || 'User';
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.roleKey);
    localStorage.removeItem(this.userNameKey);
    this.userRole$.next(null);
    this.router.navigate(['/login']);
  }
}