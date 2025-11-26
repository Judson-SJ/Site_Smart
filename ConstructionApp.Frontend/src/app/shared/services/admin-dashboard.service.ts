import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardStats {
  totalRevenue: number;
  activeTechnicians: number;
  jobsInProgress: number;
  newRegistrations: number;
  revenueChange: number;
  technicianChange: number;
  jobsChange: number;
}

export interface RecentActivity {
  message: string;
  timeAgo: string;
  color: string;
}

export interface BookingTrends {
  labels: string[];
  datasets: any[];
  growth: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminDashboardService {
  private apiUrl = 'http://localhost:5035/api/admin/admin.dashboard'; // your backend URL

  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats`);
  }

  getRecentActivity(): Observable<RecentActivity[]> {
    return this.http.get<RecentActivity[]>(`${this.apiUrl}/recent-activity`);
  }

  getBookingTrends(): Observable<BookingTrends> {
    return this.http.get<BookingTrends>(`${this.apiUrl}/booking-trends`);
  }
}
