// src/app/technician/jobs/jobs.component.ts → FINAL + updateJobStatus ADDED!
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../shared/services/auth.service';
import { environment } from '../../../environments/environment';

type JobStatus = 'new' | 'accepted' | 'inprogress' | 'completed' | 'declined';

type Job = {
  bookingID: number;
  title: string;
  address: string;
  rate: number;
  description?: string;
  status: JobStatus;
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
    setInterval(() => this.loadJobs(), 10000);
  }

  loadJobs(): void {
    const token = this.auth.getToken();
    if (!token) return;

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
            status: j.status as JobStatus,
            customerName: j.customerName,
            customerPhone: j.customerPhone,
            createdAt: j.createdAt,
            preferredDate: j.preferredDate
          }));
          this.applyFilters();
        }
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  applyFilters(): void {
    const status = this.filterForm.get('status')!.value;
    const q = this.searchText.toLowerCase();

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

  // ACCEPT JOB — 100% WORKING + UI UPDATE + REFRESH!
acceptJob(job: Job): void {
  if (job.status !== 'new') return;

  const token = this.auth.getToken();
  if (!token) {
    alert('Session expired. Please login again.');
    return;
  }

  this.http.post<any>(`${this.apiUrl}/technician/jobs/${job.bookingID}/accept`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  }).subscribe({
    next: (res) => {
      if (res?.success) {
        // இப்போ UI-ல உடனே update ஆகும்!
        job.status = 'accepted';
        this.applyFilters(); // Filter re-apply
        alert(`Job #${job.bookingID} accepted successfully!`);

        // மறுபடி full list refresh பண்ணு (latest data + other technicians accept பண்ணா தெரியும்)
        this.loadJobs();
      }
    },
    error: (err) => {
      const msg = err.error?.message || 'Failed to accept job';
      alert(msg);
    }
  });
}
 declineJob(job: Job): void {
  if (job.status !== 'new') return;

  // Just remove from UI
  this.jobs = this.jobs.filter(j => j.bookingID !== job.bookingID);
  this.filteredJobs = this.filteredJobs.filter(j => j.bookingID !== job.bookingID);
  alert(`Job #${job.bookingID} declined`);
  
  // Optional: Refresh full list
  // this.loadJobs();
}

  updateJobStatus(job: Job | null, newStatus: string): void {
  if (!job || job.status === newStatus) return;

  const valid = ['inprogress', 'completed'];
  if (!valid.includes(newStatus)) return;

  const token = this.auth.getToken();
  if (!token) return;

  this.http.patch<any>(`${this.apiUrl}/technician/jobs/${job.bookingID}/status`, 
    { status: newStatus }, 
    { headers: { Authorization: `Bearer ${token}` } }
  ).subscribe({
    next: (res) => {
      if (res?.success) {
        job.status = newStatus as JobStatus;
        this.applyFilters();
        alert(`Status updated to ${newStatus}`);
        this.loadJobs(); // Refresh full list
      }
    },
    error: () => alert('Failed to update status')
  });
}

  isNew(job: Job): boolean {
    return job.status === 'new';
  }

  refresh(): void {
    this.loadJobs();
  }
}