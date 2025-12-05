// src/app/shared/services/auth.service.ts → 100% FIXED + ALL METHODS PRESENT!
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  role?: string;
  data?: any;
}

export interface CurrentUser {
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  profileImage: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:5035/api';
  private tokenKey = 'token';
  private roleKey = 'role';
  private techKey = 'technicianId';
  private techStatusKey = 'technicianVerificationStatus';

  private currentUserSubject = new BehaviorSubject<CurrentUser | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  userRole$ = new BehaviorSubject<string | null>(localStorage.getItem(this.roleKey));
  technicianId$ = new BehaviorSubject<string | null>(localStorage.getItem(this.techKey));

  constructor(private http: HttpClient, private router: Router) {
    this.loadUserFromToken();
  }

  // ALL MISSING METHODS ADDED BACK!
  register(payload: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/Auth/register`, payload);
  }

  registerTechnician(payload: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/technician/auth/register`, payload);
  }

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/Auth/login`, credentials).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  loginTechnician(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/technician/auth/login`, credentials).pipe(
      tap(res => this.handleAuthSuccess(res, true))
    );
  }

  private handleAuthSuccess(res: AuthResponse, isTechnician: boolean = false): void {
    if (res.success && (res.token || res.data?.token)) {
      const token = res.token || res.data?.token;
      const role = res.role || res.data?.role || (isTechnician ? 'Technician' : 'Customer');
      const technicianId = res.data?.technicianId?.toString();

      localStorage.setItem(this.tokenKey, token);
      localStorage.setItem(this.roleKey, role);
      if (technicianId) {
        localStorage.setItem(this.techKey, technicianId);
        this.technicianId$.next(technicianId);
      }
      if (res.data?.verificationStatus) {
        localStorage.setItem(this.techStatusKey, res.data.verificationStatus);
      }

      this.userRole$.next(role);
      this.loadUserFromToken();
    }
  }

  // src/app/shared/services/auth.service.ts → loadUserFromToken() function
private loadUserFromToken(): void {
  const token = this.getToken();
  if (!token) {
    this.currentUserSubject.next(null);
    return;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));

    // இப்போ எல்லாம் correct case-ல வரும்!
    const user: CurrentUser = {
      userId: Number(payload.UserID || payload.sub || 0),
      fullName: payload.fullName || payload.FullName || payload.name || 'User',  // ← இது work ஆகும்!
      email: payload.email || payload.Email || payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] || '',
      phone: payload.phone || '',
      profileImage: payload.profileImage || payload["profileImage"] || '',
      role: payload.role || payload.Role || 'Customer'
    };

    console.log('JWT DECODED SUCCESS:', user); // இதை console-ல பாரு!

    this.currentUserSubject.next(user);

    // Save to localStorage
    localStorage.setItem('userName', user.fullName);
    localStorage.setItem('userEmail', user.email);
    localStorage.setItem('userPhone', user.phone);
    localStorage.setItem('userPhoto', user.profileImage);

  } catch (e) {
    console.error('Token decode failed:', e);
    this.logout();
  }
}

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getRole(): string | null {
    return localStorage.getItem(this.roleKey);
  }

  getTechnicianId(): string | null {
    return localStorage.getItem(this.techKey);
  }

  getCurrentUser(): CurrentUser | null {
    return this.currentUserSubject.value;
  }

  // FIXED: இது missing ஆ இருந்தது!
  getTechnician(): any {
    const id = this.getTechnicianId();
    return id ? { technicianID: Number(id) } : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.clear();
    this.currentUserSubject.next(null);
    this.userRole$.next(null);
    this.technicianId$.next(null);
    this.router.navigate(['/login']);
  }

  updateCurrentUser(data: Partial<CurrentUser>) {
    const current = this.getCurrentUser();
    if (current) {
      const updated = { ...current, ...data };
      this.currentUserSubject.next(updated);
      localStorage.setItem('userName', updated.fullName);
      localStorage.setItem('userPhone', updated.phone);
      localStorage.setItem('userPhoto', updated.profileImage);
    }
  }
}