// src/app/customer/dashboard/customer-dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { AuthService } from '../shared/services/auth.service';
import { environment } from '../../environments/environment';

export interface Booking {
  bookingID: number;
  serviceName: string;
  scheduledDate: string;
  technicianName: string;
  technicianPhoto?: string | null;
  price: number;
  status: 'Requested' | 'Accepted' | 'In-Progress' | 'Completed' | 'Cancelled';
  progress: number;
  rawDate: string; // For sorting
}

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class CustomerDashboardComponent implements OnInit, OnDestroy {

  userName = 'Loading...';
  userEmail = '';
  userAvatar = 'https://ui-avatars.com/api/?name=User&background=8b5cf6&color=fff&bold=true&size=256';

  currentBooking: Booking | null = null;
  bookingHistory: Booking[] = [];
  allBookings: Booking[] = []; // Store all for selection
  loading = true;

  private apiUrl = environment.apiBaseUrl.replace(/\/$/, '');
  private pollSubscription?: Subscription;

  constructor(
    private http: HttpClient,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadBookings();

    this.pollSubscription = interval(15000).subscribe(() => {
      this.loadBookings();
    });
  }
  // இதை component class-க்குள்ள add பண்ணு (மேலேயே இருக்கணும்!)
getProgressStep(status: string): number {
  const s = status.toLowerCase();
  if (s.includes('request')) return 1;
  if (s.includes('accept')) return 2;
  if (s.includes('progress') || s.includes('ongoing')) return 3;
  return 4;
}

  ngOnDestroy(): void {
    this.pollSubscription?.unsubscribe();
  }

  private getHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    return token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : new HttpHeaders();
  }

  private loadUserProfile(): void {
    const token = this.auth.getToken();
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.userName = payload.fullName || payload.name || 'User';
      this.userEmail = payload.email || '';
      this.userAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.userName)}&background=8b5cf6&color=fff&bold=true&size=256`;
    } catch {
      this.userName = 'User';
    }
  }

  private loadBookings(): void {
    this.loading = true;

    this.http.get<any>(`${this.apiUrl}/customer/my-bookings`, { headers: this.getHeaders() })
      .subscribe({
        next: (res) => {
          console.log('My-Bookings Response:', res);

          const bookings: Booking[] = [];

          if (res?.success && res?.data) {
            const data = res.data;

            // Extract all bookings from current + history
            const current = data.currentBooking || data.activeBooking;
            if (current) bookings.push(this.mapBooking(current));

            const history = data.bookingHistory || data.history || [];
            history.forEach((b: any) => bookings.push(this.mapBooking(b)));
          }

          // Sort by date (latest first)
          this.allBookings = bookings.sort((a, b) => 
            new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime()
          );

          // Latest booking = Current Active
          this.currentBooking = this.allBookings[0] || null;

          // Rest = History
          this.bookingHistory = this.allBookings.slice(1);

          this.loading = false;
        },
        error: (err) => {
          console.error('Load bookings failed:', err);
          this.loading = false;
        }
      });
  }

  private mapBooking(b: any): Booking {
    const dateStr = b.PreferredStartDateTime || b.preferredStartDateTime || b.Date || b.date || new Date().toISOString();
    const status = this.normalizeStatus(b.Status || b.status || 'Requested');

    return {
      bookingID: b.BookingID || b.bookingID || 0,
      serviceName: b.ServiceName || b.serviceName || 'Unknown Service',
      scheduledDate: this.formatDate(dateStr),
      rawDate: dateStr,
      technicianName: b.TechnicianName || b.technicianName || 'Technician',
      technicianPhoto: b.TechnicianPhoto || null,
      price: Number(b.TotalAmount || b.totalAmount || 0),
      status,
      progress: this.getProgressFromStatus(status)
    };
  }

  private formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  private normalizeStatus(status: string): Booking['status'] {
    const s = status.toLowerCase();
    if (s.includes('request')) return 'Requested';
    if (s.includes('accept')) return 'Accepted';
    if (s.includes('progress') || s.includes('ongoing')) return 'In-Progress';
    if (s.includes('complete')) return 'Completed';
    if (s.includes('cancel')) return 'Cancelled';
    return 'Requested';
  }

  private getProgressFromStatus(status: Booking['status']): number {
    switch (status) {
      case 'Requested': return 20;
      case 'Accepted': return 50;
      case 'In-Progress': return 75;
      case 'Completed': return 100;
      case 'Cancelled': return 0;
      default: return 10;
    }
  }

  getStatusClass(status: string): any {
    const s = this.normalizeStatus(status);
    return {
      'bg-purple-600/30 text-purple-300 border border-purple-500/50': s === 'In-Progress',
      'bg-green-500/20 text-green-400 border border-green-500/50': s === 'Completed',
      'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50': s === 'Accepted',
      'bg-gray-500/20 text-gray-400 border border-gray-500/50': s === 'Requested'
    };
  }

  // Click any booking in history → becomes Current Active
  selectAsCurrent(booking: Booking): void {
    this.currentBooking = booking;
    this.bookingHistory = this.allBookings.filter(b => b.bookingID !== booking.bookingID);
  }

  viewDetails(id: number): void {
    if (id > 0) {
      this.router.navigate(['/customer/booking-details', id]);
    }
  }

  contactTechnician(): void {
    if (this.currentBooking?.bookingID) {
      this.router.navigate(['/customer/chat', this.currentBooking.bookingID]);
    }
  }

  logout() {
    this.router.navigate(['home']);      // ✅ Now works
  }
}