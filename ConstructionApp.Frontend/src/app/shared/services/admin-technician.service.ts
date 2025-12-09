import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface AdminVerifyUpdatePayload {
  status: 'Approved' | 'Rejected' | 'Pending';
  reason?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminTechnicianService {
  private apiUrl = 'http://localhost:5035/api/admin/technicians';

  constructor(private http: HttpClient, private auth: AuthService) {}

  private authHeaders(): { headers: HttpHeaders } {
    const token = this.auth.getToken();
    let headers = new HttpHeaders();
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    headers = headers.set('Content-Type', 'application/json');
    return { headers };
  }

  getPendingTechnicians(): Observable<any> {
    return this.http.get(`${this.apiUrl}/pending`, this.authHeaders());
  }

  getTechnician(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`, this.authHeaders());
  }

  updateVerification(id: number, payload: AdminVerifyUpdatePayload): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/verify`, payload, this.authHeaders());
  }
}