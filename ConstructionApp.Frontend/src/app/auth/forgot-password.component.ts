import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div class="card shadow p-4" style="width: 24rem;">
        <h4 class="text-center mb-4">Forgot Password</h4>

        <form (ngSubmit)="onSubmit()" #f="ngForm">
          <div class="mb-3">
            <input
              type="email"
              class="form-control"
              [(ngModel)]="email"
              name="email"
              placeholder="Enter your email"
              required
              email>
          </div>

          <button 
            type="submit" 
            class="btn btn-primary w-100"
            [disabled]="f.invalid || loading">
            <span *ngIf="loading" class="spinner-border spinner-border-sm"></span>
            Send Reset Link
          </button>
        </form>

        <div class="mt-3 text-center">
          <div class="alert alert-success" *ngIf="success">{{ success }}</div>
          <div class="text-danger" *ngIf="error">{{ error }}</div>
          <a routerLink="/login" class="text-muted">Back to Login</a>
        </div>
      </div>
    </div>
  `
})
export class ForgotPasswordComponent {
  email = '';
  loading = false;
  success = '';
  error = '';

  private apiUrl = 'http://localhost:5035/api/Auth';

  constructor(private http: HttpClient, private router: Router) {}

  onSubmit() {
    this.loading = true;
    this.success = '';
    this.error = '';

    this.http.post(`${this.apiUrl}/forgot`, { email: this.email }).subscribe({
      next: (res: any) => {
        this.success = res.message;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to send';
        this.loading = false;
      }
    });
  }
}