import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div class="card shadow p-4" style="width: 24rem;">
        <h4 class="text-center mb-4">Reset Password</h4>

        <form (ngSubmit)="onSubmit()" [formGroup]="form" *ngIf="!success">
          <div class="mb-3">
            <input
              type="password"
              class="form-control"
              formControlName="password"
              placeholder="New password"
              [class.is-invalid]="form.get('password')?.invalid && form.get('password')?.touched">
            <div class="invalid-feedback" *ngIf="form.get('password')?.touched">
              Password must be 8+ chars with upper, lower, number, special.
            </div>
          </div>

          <div class="mb-3">
            <input
              type="password"
              class="form-control"
              formControlName="confirm"
              placeholder="Confirm password"
              [class.is-invalid]="form.get('confirm')?.invalid && form.get('confirm')?.touched">
            <div class="invalid-feedback" *ngIf="form.get('confirm')?.touched">
              {{ form.errors?.['mismatch'] ? 'Passwords do not match' : 'Required' }}
            </div>
          </div>

          <button type="submit" class="btn btn-success w-100" [disabled]="form.invalid || loading">
            <span *ngIf="loading" class="spinner-border spinner-border-sm"></span>
            Reset Password
          </button>
        </form>

        <div class="mt-3 text-center">
          <div class="alert alert-success" *ngIf="success">{{ success }}</div>
          <div class="text-danger" *ngIf="error">{{ error }}</div>
        </div>
      </div>
    </div>
  `
})
export class ResetPasswordComponent implements OnInit {
  form: any;
  token = '';
  loading = false;
  success = '';
  error = '';

  private apiUrl = 'http://localhost:5035/api/Auth';

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.form = this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirm: ['', Validators.required]
      },
      { validators: this.passwordMatch }
    );
  }

  ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    if (!this.token) this.error = 'Invalid link';
  }

  passwordMatch = (g: any) => {
    return g.get('password')?.value === g.get('confirm')?.value ? null : { mismatch: true };
  };

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;

    const payload = {
      token: this.token,
      password: this.form.get('password').value
    };

    this.http.post(`${this.apiUrl}/reset`, payload).subscribe({
      next: (res: any) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('role', res.role);
        this.success = res.message + ' Redirecting...';
        setTimeout(() => this.router.navigate(['/customer/dashboard']), 2000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Reset failed';
        this.loading = false;
      }
    });
  }
}