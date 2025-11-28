// src/app/customer/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../environments/environment';

interface Booking {
  bookingID: number;
  serviceName: string;
  scheduledDate: string;
  technicianName: string;
  technicianPhoto?: string;
  price: number;
  status: 'Requested' | 'Accepted' | 'In-Progress' | 'Completed';
  progress: number;
  isCurrent?: boolean;
}

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class CustomerDashboardComponent implements OnInit {

  // User Info - localStorage இருந்தா எடுக்கும், இல்லைனா default
  userName: string = 'User';
  userEmail: string = 'customer@example.com';

  currentBooking: Booking | null = null;
  bookingHistory: Booking[] = [];
  loading = true;

  private apiUrl = environment.apiBaseUrl;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Page load ஆனதும் user details எடுக்கும்
    const storedName = localStorage.getItem('userName');
    const storedEmail = localStorage.getItem('email');

    this.userName = storedName || 'User';
    this.userEmail = storedEmail || 'customer@example.com';
  }

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;

    this.http.get<any>(`${this.apiUrl}/customer/dashboard`).subscribe({
      next: (res) => {
        this.currentBooking = res.currentBooking || null;
        this.bookingHistory = res.history || [];
        this.loading = false;
      },
      error: (err) => {
        console.warn('Dashboard API failed, loading mock data...', err);

        // Mock data for development
        this.currentBooking = {
          bookingID: 101,
          serviceName: 'Kitchen Remodeling Project',
          scheduledDate: 'Oct 26, 2024',
          technicianName: 'Bob Vance',
          technicianPhoto: 'https://randomuser.me/api/portraits/men/32.jpg',
          price: 2500,
          status: 'In-Progress',
          progress: 75,
          isCurrent: true
        };

        this.bookingHistory = [
          {
            bookingID: 99,
            serviceName: 'Bathroom Tile Installation',
            scheduledDate: 'Jun 15, 2024',
            technicianName: 'Phyllis Lapin',
            price: 1250,
            status: 'Completed',
            progress: 100
          },
          {
            bookingID: 98,
            serviceName: 'Electrical Wiring Inspection',
            scheduledDate: 'Mar 22, 2024',
            technicianName: 'Dwight Schrute',
            price: 300,
            status: 'Completed',
            progress: 100
          },
          {
            bookingID: 97,
            serviceName: 'Rooftop AC Unit Repair',
            scheduledDate: 'Dec 06, 2023',
            technicianName: 'Michael Scott',
            price: 850.75,
            status: 'Completed',
            progress: 100
          }
        ];

        this.loading = false;
      }
    });
  }

  getStatusClass(status: string): any {
    return {
      'status-requested': status === 'Requested',
      'status-accepted': status === 'Accepted',
      'status-inprogress': status === 'In-Progress',
      'status-completed': status === 'Completed'
    };
  }

  viewDetails(id: number): void {
    this.router.navigate(['/customer/booking-details', id]);
  }

  contactTechnician(): void {
    alert('Opening chat with technician...');
    // இங்க chat open பண்ணலாம் later
  }

  // Logout Function - 100% working
  logout(): void {
    // Clear everything
    localStorage.clear();
    sessionStorage.clear();

    // Optional: Show message
    alert('Logged out successfully!');

    // Redirect to login
    this.router.navigate(['/login']);
  }
}