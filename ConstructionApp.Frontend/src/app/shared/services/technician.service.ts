// src/app/shared/services/technician.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, of, throwError } from 'rxjs';
import {
  concatMap,
  catchError,
  filter,
  take,
  switchMap,
  defaultIfEmpty
} from 'rxjs/operators';

import { AuthService } from './auth.service';

export type UpdateStatusPayload = { status: string };

@Injectable({
  providedIn: 'root'
})
export class TechnicianService {
  private apiUrl = 'http://localhost:5035/api';

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  // ---------------- AUTH HEADERS ----------------
  private authHeaders(): { headers?: HttpHeaders } {
    const token = this.auth.getToken();
    return token
      ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) }
      : {};
  }

  // ------------------- JOBS ---------------------
  getAssignedJobs(technicianId?: number): Observable<any> {
    const url =
      typeof technicianId === 'number'
        ? `${this.apiUrl}/technicians/${technicianId}/jobs`
        : `${this.apiUrl}/technicians/me/jobs`;

    return this.http.get(url, this.authHeaders());
  }

  getDashboard(technicianId?: number): Observable<any> {
    const url =
      typeof technicianId === 'number'
        ? `${this.apiUrl}/technicians/${technicianId}/dashboard`
        : `${this.apiUrl}/technicians/me/dashboard`;

    return this.http.get(url, this.authHeaders());
  }

  // ---------------- FILE UPLOAD -----------------
  uploadDocument(formData: FormData): Observable<any> {
    const token = this.auth.getToken();
    const headers: any = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    return this.http.post(
      `${this.apiUrl}/technician/upload-document`,
      formData,
      { headers }
    );
  }

  // ---------------- JOB STATUS ------------------
  acceptJob(bookingId: number): Observable<any> {
    const url = `${this.apiUrl}/bookings/${bookingId}/accept`;
    return this.http.post(url, {}, this.authHeaders());
  }

  updateStatus(
    bookingId: number,
    statusOrPayload: string | UpdateStatusPayload
  ): Observable<any> {
    const payload: UpdateStatusPayload =
      typeof statusOrPayload === 'string'
        ? { status: statusOrPayload }
        : statusOrPayload;

    return this.http.put(
      `${this.apiUrl}/bookings/${bookingId}/status`,
      payload,
      this.authHeaders()
    );
  }

  // ---------------- CATEGORIES ------------------
  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(
      `${this.apiUrl}/admin/categories`,
      this.authHeaders()
    );
  }

  // ---------- VERIFY DETAILS (FALLBACK API SCAN) ----------
  getVerifyDetails(): Observable<any> {
    const token = this.auth.getToken();
    const headers: any = token ? { Authorization: `Bearer ${token}` } : {};

    const endpoints = [
      `${this.apiUrl}/technician/verify-details`,
      `${this.apiUrl}/technician/verify`,
      `${this.apiUrl}/technician/me/verify-details`,
      `${this.apiUrl}/technician/me/verify`,
      `${this.apiUrl}/technicians/me/verify-details`,
      `${this.apiUrl}/technicians/me/verify`,
      `${this.apiUrl}/technician/get-verify-details`
    ];

    return from(endpoints).pipe(
      concatMap(url =>
        this.http.get(url, { headers }).pipe(
          catchError(() => of(null)) // allow fallback
        )
      ),
      filter(res => res !== null),
      take(1),
      defaultIfEmpty(null),
      switchMap(res => {
        if (res === null) {
          return throwError(() =>
            new Error(
              'Verify-details endpoint not found. Checked multiple API routes.'
            )
          );
        }
        return of(res);
      })
    );
  }

  // ---------------- UPLOAD VERIFICATION ----------------
  uploadVerification(
    payload:
      | FormData
      | {
          nicFile?: File | null;
          certificateFile?: File | null;
          street?: string;
          city?: string;
          state?: string;
          postalCode?: string;
          country?: string;
          experienceYears?: number | null;
          categories?: string[];
        }
  ): Observable<any> {

    // Direct FormData input
    if (payload instanceof FormData) {
      const token = this.auth.getToken();
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      return this.http.post(
        `${this.apiUrl}/technician/upload-document`,
        payload,
        { headers }
      );
    }

    // Convert object → FormData
    const p = payload || {};
    const fd = new FormData();

    if (p.nicFile) fd.append('nic', p.nicFile, p.nicFile.name);
    if (p.certificateFile) fd.append('certificate', p.certificateFile, p.certificateFile.name);

    if (p.street) fd.append('street', p.street);
    if (p.city) fd.append('city', p.city);
    if (p.state) fd.append('state', p.state);
    if (p.postalCode) fd.append('postalCode', p.postalCode);
    if (p.country) fd.append('country', p.country);

    if (p.experienceYears !== undefined && p.experienceYears !== null) {
      fd.append('experienceYears', String(p.experienceYears));
    }

    if (p.categories && p.categories.length > 0) {
      fd.append('categories', JSON.stringify(p.categories));
    }

    const token = this.auth.getToken();
    const headers: any = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    return this.http.post(
      `${this.apiUrl}/technician/upload-document`,
      fd,
      { headers }
    );
  }
}
