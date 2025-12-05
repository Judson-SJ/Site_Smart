// src/app/technician/jobs/jobs.component.ts → FINAL LIVE + REAL BACKEND!
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../shared/services/auth.service';
import { environment } from '../../../environments/environment';

type Job = {
  bookingID: number;
  title: string;
  address: string;
  rate: number;
  description?: string;
  status: 'new' | 'accepted' | 'declined' | 'inprogress' | 'completed';
  customerName?: string;
  customerPhone?: string;
  createdAt?: string;
  preferredDate?: string;
};

@Component({
  selector: 'app-jobs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './jobs.component.html',
  styleUrls: ['./jobs.component.css']
})
export class JobsComponent implements OnInit {
  filterForm!: FormGroup;
  searchText = '';
  jobs: Job[] = [];
  filteredJobs: Job[] = [];

  showDetail = false;
  activeJob: Job | null = null;
  loading = true;

  private apiUrl = environment.apiBaseUrl.replace(/\/$/, '');

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({ status: ['all'] });
    this.loadJobs();

    this.filterForm.get('status')!.valueChanges.subscribe(() => this.applyFilters());
  }

  loadJobs(): void {
    const token = this.auth.getToken();
    if (!token) {
      alert('Please login again');
      return;
    }

    this.loading = true;

    this.http.get<any>(`${this.apiUrl}/technician/jobs`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        if (res?.success && res?.data) {
          this.jobs = res.data.map((j: any) => ({
            bookingID: j.bookingID,
            title: j.title,
            address: j.address,
            rate: j.rate,
            description: j.description,
            status: j.status as Job['status'],
            customerName: j.customerName,
            customerPhone: j.customerPhone,
            createdAt: j.createdAt,
            preferredDate: j.preferredDate
          }));
          this.applyFilters();
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load jobs:', err);
        alert('Failed to load jobs');
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    const status = this.filterForm.get('status')!.value;
    const q = this.searchText.trim().toLowerCase();

    this.filteredJobs = this.jobs.filter(j => {
      if (status !== 'all' && j.status !== status) return false;
      if (!q) return true;
      return (
        j.title.toLowerCase().includes(q) ||
        j.address.toLowerCase().includes(q) ||
        String(j.bookingID).includes(q) ||
        (j.customerName || '').toLowerCase().includes(q)
      );
    });
  }

  onSearchChange(value: string): void {
    this.searchText = value;
    this.applyFilters();
  }

  openDetail(job: Job): void {
    this.activeJob = job;
    this.showDetail = true;
    document.body.style.overflow = 'hidden';
  }

  closeDetail(): void {
    this.showDetail = false;
    this.activeJob = null;
    document.body.style.overflow = '';
  }

  acceptJob(job: Job): void {
    if (job.status !== 'new') return;

    this.http.post(`${this.apiUrl}/technician/jobs/${job.bookingID}/accept`, {}, {
      headers: { Authorization: `Bearer ${this.auth.getToken()}` }
    }).subscribe({
      next: () => {
        job.status = 'accepted';
        this.applyFilters();
        alert(`Job #${job.bookingID} accepted!`);
      },
      error: () => alert('Failed to accept job')
    });
  }

  declineJob(job: Job): void {
    if (job.status !== 'new') return;
    // You can add decline endpoint or just filter out
    this.jobs = this.jobs.filter(j => j.bookingID !== job.bookingID);
    this.applyFilters();
    alert(`Job #${job.bookingID} declined`);
  }

  updateJobStatus(job: Job, status: Job['status']): void {
    if (!['inprogress', 'completed'].includes(status)) return;

    this.http.patch(`${this.apiUrl}/technician/jobs/${job.bookingID}/status`, 
      { status }, 
      { headers: { Authorization: `Bearer ${this.auth.getToken()}` } }
    ).subscribe({
      next: () => {
        job.status = status;
        this.applyFilters();
        if (this.activeJob?.bookingID === job.bookingID) {
          this.activeJob = { ...job };
        }
        alert(`Status updated to ${status}`);
      },
      error: () => alert('Failed to update status')
    });
  }

  isNew(job: Job): boolean {
    return job.status === 'new';
  }

  // Refresh button
  refresh(): void {
    this.loadJobs();
  }
}