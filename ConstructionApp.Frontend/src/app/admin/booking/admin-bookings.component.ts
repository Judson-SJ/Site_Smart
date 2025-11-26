
// src/app/admin/booking/admin-bookings.component.ts
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Booking {
  bookingID: number;
  serviceName: string;
  customerName: string;
  technicianName?: string;
  totalAmount: number;
  status: string;
  preferredStartDateTime: string;
}

@Component({
  selector: 'app-admin-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-bookings.component.html',
  styleUrls: ['./admin-bookings.component.css']
})
export class AdminBookingsComponent implements OnInit {
  bookings: Booking[] = [];
  searchTerm = '';

  private apiUrl = 'http://localhost:5035/api/bookings/admin/all'; // Admin endpoint

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadBookings();
  }

  loadBookings() {
    this.http.get<any>(this.apiUrl).subscribe(res => {
      this.bookings = res.data || [];
    });
  }

  get filteredBookings() {
    if (!this.searchTerm.trim()) return this.bookings;
    const term = this.searchTerm.toLowerCase();
    return this.bookings.filter(b =>
      b.serviceName.toLowerCase().includes(term) ||
      b.customerName.toLowerCase().includes(term) ||
      b.technicianName?.toLowerCase().includes(term)
    );
  }
}
