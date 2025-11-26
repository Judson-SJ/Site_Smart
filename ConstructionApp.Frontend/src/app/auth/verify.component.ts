// src/app/auth/verify.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div class="text-center p-5">
        <div class="spinner-border text-primary mb-4" role="status" *ngIf="loading">
          <span class="visually-hidden">Loading...</span>
        </div>

        <h3 class="mb-3" *ngIf="loading">Verifying your email...</h3>

        <div *ngIf="!loading && message">
          <h3 class="text-success mb-3">Email Verified Successfully!</h3>
          <p class="text-muted">Redirecting to dashboard...</p>
          <div class="mt-4">
            <button class="btn btn-primary" (click)="goToDashboard()">
              Go to Dashboard Now
            </button>
          </div>
        </div>

        <h4 class="text-danger" *ngIf="!loading && error">{{ error }}</h4>
      </div>
    </div>
  `,
  styles: [`
    .spinner-border { width: 3rem; height: 3rem; }
    .btn-primary { padding: 12px 30px; font-size: 1.1rem; }
  `]
})
export class VerifyComponent implements OnInit {
  loading = true;
  message = '';
  error = '';

  private apiUrl = 'http://localhost:5035/api/Auth';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.error = 'Invalid verification link';
      this.loading = false;
      return;
    }

    // CORRECT: Use POST + send token in body
    this.http.post(`${this.apiUrl}/verify-email`, { token }).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.message = res.message || 'Email verified!';

        // Save token & role
        if (res.token) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('role', res.role || 'Customer');
        }

        // Auto redirect after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/customer/dashboard']);
        }, 2000);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Verification failed. Please try again.';
      }
    });
  }

  goToDashboard() {
    this.router.navigate(['/customer/dashboard']);
  }
}
