// src/app/technician/dashboard.component.ts
import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { TechnicianService } from '../shared/services/technician.service';
import { AuthService } from '../shared/services/auth.service';

import { TechnicianVerifyDocComponent } from "./verify/technician-verify-doc.component";
import { ContactAboutComponent } from './contact-about/contact-about.component';
import { ProfileComponent } from './profile/profile.component';
import { WalletComponent } from './wallet/wallet.component';
import { JobsComponent } from './jobs/jobs.component';

@Component({
  selector: 'app-technician-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    TechnicianVerifyDocComponent,
    ContactAboutComponent,
    ProfileComponent,
    WalletComponent,
    JobsComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class TechnicianDashboardComponent implements OnInit, OnDestroy {
  profileName = 'Technician';
  profileImage = '/assets/avatar.png';

  stats: any = {};
  newJobs: any[] = [];
  currentJob: any | null = null;
  weekly: any = {};

  verificationStatus: string | null = null;
  loading = false;
  error = '';

  selectedDocument: File | null = null;
  documentUploaded = false;
  showContactModal = false;
  showProfileModal = false;
  showWalletModal = false;
  showJobsModal = false;

  private destroy$ = new Subject<void>();

  constructor(
    public techService: TechnicianService,
    public auth: AuthService
  ) {}

  ngOnInit() {
    // Subscribe to currentUser$ to update name/image reactively
    this.auth.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          this.profileName = user.fullName || 'Technician';

          // If backend returns the same filename each time, append a cache-busting query param
          // so that the browser requests the updated image after profile update.
          const raw = user.profileImage || '/assets/avatar.png';
          // only append timestamp for non-empty non-default URLs
          if (raw && !raw.includes('/assets/avatar.png')) {
            this.profileImage = `${raw}?t=${Date.now()}`;
          } else {
            this.profileImage = raw;
          }
        } else {
          // fallback
          this.profileName = 'Technician';
          this.profileImage = '/assets/avatar.png';
        }
      });

    // initial loads
    this.loadTechnicianDetails();
    this.loadDashboardData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupMockData(): void {
    this.stats = {
      totalRevenue: 4250,
      jobsCompleted: 15,
      currentRating: 4.8,
      wallet: 850.75,
      revenueChange: 5.2,
      jobsChange: 2.0
    };

    this.newJobs = [
      { bookingID: 101, title: 'Plumbing Fixture Installation', rateText: 'Fixed Rate: $250', address: '123 Main St, Anytown' },
      { bookingID: 102, title: 'Electrical Wiring Repair', rateText: 'Fixed Rate: $400', address: '456 Oak Ave, Somecity' },
      { bookingID: 103, title: 'Custom Shelving Unit', rateText: 'Fixed Rate: $320', address: '789 Pine Ln, Villagetown' }
    ];

    this.currentJob = { bookingID: 99, title: 'HVAC System Maintenance', address: '987 Birch Rd, Metropolia', progress: 75, status: 'InProgress' };

    this.weekly = { total: 1150, change: 12, bars: [10, 40, 60, 30, 90, 70, 100] };
  }

  loadJobs(): void {
    this.loading = true;
    this.techService.getAssignedJobs().subscribe({
      next: (res: any) => {
        this.loading = false;
        this.newJobs = res?.data ?? res ?? this.newJobs;
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err?.error?.message ?? 'Failed to load jobs';
      }
    });
  }

  isPending(): boolean {
    return this.verificationStatus !== 'Verified';
  }

  acceptJob(bookingId: number): void {
    if (this.isPending()) {
      alert('Admin verification required to accept jobs.');
      return;
    }

    if (this.techService && typeof this.techService.acceptJob === 'function') {
      this.techService.acceptJob(bookingId).subscribe({
        next: () => this.loadJobs(),
        error: (err: any) => alert(err?.error?.message ?? 'Failed to accept job')
      });
      return;
    }

    this.newJobs = this.newJobs.filter(j => j.bookingID !== bookingId);
    alert('Accepted job ' + bookingId);
  }

  decline(bookingId: number): void {
    this.newJobs = this.newJobs.filter(j => j.bookingID !== bookingId);
  }

  updateStatus(bookingId: number, status: string): void {
    if (this.isPending()) {
      alert('Admin verification required to update job status.');
      return;
    }
    if (this.techService && typeof this.techService.updateStatus === 'function') {
      this.techService.updateStatus(bookingId, status).subscribe({
        next: () => this.loadJobs(),
        error: (err: any) => alert(err?.error?.message ?? 'Failed to update status')
      });
      return;
    }
    if (this.currentJob && this.currentJob.bookingID === bookingId) {
      this.currentJob.status = status;
    }
  }

  onStatusChange(event: Event, bookingId: number): void {
    const el = event.target as HTMLSelectElement | null;
    const value = el ? el.value : '';
    if (value) this.updateStatus(bookingId, value);
  }

  loadTechnicianDetails() {
    const user = this.auth.getCurrentUser();
    const tech = this.auth.getTechnician();

    if (user) {
      this.profileName = user.fullName;
      this.profileImage = user.profileImage || '/assets/avatar.png';
    }

    this.verificationStatus = localStorage.getItem("technicianVerificationStatus") || "Pending";
  }

  uploadDocument(event: any) {
    this.selectedDocument = event.target.files[0] ?? null;
  }

  submitDocument() {
    if (!this.selectedDocument) {
      alert('Please select a document first.');
      return;
    }

    const form = new FormData();
    form.append('file', this.selectedDocument);
    const tech = this.auth.getTechnician();
    if (tech && tech.technicianID) {
      form.append('technicianId', String(tech.technicianID));
    }

    this.techService.uploadDocument(form).subscribe({
      next: () => {
        this.documentUploaded = true;
        alert("Document uploaded. Waiting for admin approval.");
      },
      error: () => alert("Failed to upload document.")
    });
  }

  loadDashboardData() {
    this.techService.getDashboard().subscribe({
      next: (data: any) => {
        // defensively assign only if present
        this.stats = data?.stats ?? this.stats;
        this.newJobs = data?.jobs ?? this.newJobs;
        this.currentJob = data?.currentJob ?? this.currentJob;
        this.weekly = data?.weekly ?? this.weekly;
      },
      error: () => this.error = 'Failed to load dashboard data'
    });
  }

  // verify modal controls
  showVerifyModal = false;

  openVerifyModal() {
    this.showVerifyModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeVerifyModal() {
    this.showVerifyModal = false;
    document.body.style.overflow = '';
  }

  openContactModal() {
    this.showContactModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeContactModal() {
    this.showContactModal = false;
    document.body.style.overflow = '';
  }

  openProfileModal() {
    this.showProfileModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeProfileModal() {
    this.showProfileModal = false;
    document.body.style.overflow = '';
  }

  openWalletModal() { this.showWalletModal = true; document.body.style.overflow='hidden'; }
  closeWalletModal() { this.showWalletModal = false; document.body.style.overflow=''; }

  openJobsModal() { this.showJobsModal = true; document.body.style.overflow = 'hidden'; }
  closeJobsModal() { this.showJobsModal = false; document.body.style.overflow = ''; }

  logout() {
    this.auth.logout();
  }
}
