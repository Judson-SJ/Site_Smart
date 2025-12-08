import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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

  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
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

  // --- AUTH METHODS ---
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

      // technician id can be in multiple shapes — be defensive
      const technicianId =
        (res.data?.technicianId !== undefined && res.data?.technicianId !== null)
          ? String(res.data.technicianId)
          : (res.data?.technician?.technicianID !== undefined && res.data?.technician?.technicianID !== null)
            ? String(res.data.technician.technicianID)
            : null;

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
      // load & normalize user from token
      this.loadUserFromToken();
    }
  }

  // --- TOKEN & USER ---
  private loadUserFromToken(): void {
    const token = this.getToken();
    if (!token) {
      this.currentUserSubject.next(null);
      return;
    }

    // quick sanity check for JWT structure
    if (typeof token !== 'string' || token.split('.').length < 3) {
      console.warn('AuthService: malformed token, clearing user state (but NOT force-logout).');
      this.currentUserSubject.next(null);
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      // Normalize email claim: it can be string or array in some backends
      let normalizedEmail = '';
      if (payload?.email) {
        normalizedEmail = Array.isArray(payload.email) ? String(payload.email[0] ?? '') : String(payload.email ?? '');
      } else if (payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress']) {
        const alt = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];
        normalizedEmail = Array.isArray(alt) ? String(alt[0] ?? '') : String(alt ?? '');
      } else {
        normalizedEmail = '';
      }

      const user: CurrentUser = {
        userId: Number(payload.UserID || payload.sub || payload.userId || 0),
        fullName: payload.fullName || payload.FullName || payload.name || (localStorage.getItem('userName') ?? 'User'),
        email: normalizedEmail,
        phone: payload.phone || payload.Phone || (localStorage.getItem('userPhone') ?? ''),
        profileImage: payload.profileImage || payload.ProfileImage || (localStorage.getItem('userPhoto') ?? ''),
        role: payload.role || payload.Role || localStorage.getItem(this.roleKey) || 'Customer'
      };

      this.currentUserSubject.next(user);

      // persist a few non-sensitive values for UI convenience (store normalized email)
      if (user.fullName) localStorage.setItem('userName', user.fullName);
      if (user.email) localStorage.setItem('userEmail', user.email);
      if (user.phone) localStorage.setItem('userPhone', user.phone || '');
      if (user.profileImage) localStorage.setItem('userPhoto', user.profileImage || '');
    } catch (e) {
      console.error('Token decode failed:', e);
      // don't aggressively clear localStorage or force a logout; set user to null so UI can fallback
      this.currentUserSubject.next(null);
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

  getTechnician(): any {
    const id = this.getTechnicianId();
    return id ? { technicianID: Number(id) } : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(redirectTo?: string): void {
    // read role BEFORE clearing storage
    const role = this.getRole(); // may be 'Technician', 'Customer', 'Admin', etc.

    // clear auth state
    localStorage.clear();
    this.currentUserSubject.next(null);
    this.userRole$.next(null);
    this.technicianId$.next(null);

    // if caller supplied an explicit redirect path, use it
    if (redirectTo) {
      this.router.navigate([redirectTo]);
      return;
    }

    // otherwise route by role we saved earlier
    const r = (role || '').toLowerCase();

    if (r.includes('technician')) {
      this.router.navigate(['/technician/login']);
      return;
    }
    if (r.includes('admin')) {
      this.router.navigate(['/admin/login']);
      return;
    }

    // default customer/general login
    this.router.navigate(['/login']);
  }

  updateCurrentUser(data: Partial<CurrentUser>) {
    const current = this.getCurrentUser();
    if (!current) return;

    // Merge without overwriting fields with undefined
    const updated: CurrentUser = { ...current };
    Object.keys(data).forEach((k: string) => {
      const v = (data as any)[k];
      if (v !== undefined) {
        (updated as any)[k] = v;
      }
    });

    this.currentUserSubject.next(updated);
    console.log('AuthService.updateCurrentUser -> emitted', updated);

    // Persist only existing values
    if (updated.fullName) localStorage.setItem('userName', updated.fullName);
    if (updated.phone) localStorage.setItem('userPhone', updated.phone || '');
    if (updated.profileImage) localStorage.setItem('userPhoto', updated.profileImage || '');
    if (updated.email) localStorage.setItem('userEmail', updated.email);
  }

  // --- PROFILE & UPLOAD METHODS (100% WORKING!) ---
  getMyAddress(): Observable<any> {
    return this.http.get(`${this.apiUrl}/addresses/my`, {
      headers: this.getAuthHeaders()
    });
  }

  uploadTechnicianAvatar(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/technician/upload-avatar`, formData, {
      headers: this.getAuthHeaders(false) // No Content-Type — let browser set it!
    });
  }

  updateTechnicianProfile(payload: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/technician/update-profile`, payload, {
      headers: this.getAuthHeaders()
    });
  }

  updateProfile(payload: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/customer/profile`, payload, {
      headers: this.getAuthHeaders()
    });
  }

  // Helper: Get Authorization Header
  private getAuthHeaders(includeContentType: boolean = true): HttpHeaders {
    let headers = new HttpHeaders();
    const token = this.getToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    if (includeContentType) {
      headers = headers.set('Content-Type', 'application/json');
    }
    return headers;
  }

  // Clear auth state WITHOUT navigation (caller controls routing)
  clearAuthState(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.roleKey);
    localStorage.removeItem(this.techKey);
    localStorage.removeItem(this.techStatusKey);

    // Remove convenience items we set
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userPhone');
    localStorage.removeItem('userPhoto');

    this.currentUserSubject.next(null);
    this.userRole$.next(null);
    this.technicianId$.next(null);
  }
}
