// src/app/auth/verify.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [CommonModule],  // *ngIf warning fixed
  templateUrl: './verify.component.html'
  // styleUrls: ['./verify.component.css']  ← DELETE THIS LINE (file இல்லை)
})
export class VerifyComponent implements OnInit {
  loading = true;
  message = '';
  error = false;

  constructor(
    private route: ActivatedRoute,
    public router: Router,  // public ஆக்கினோம் → router.navigate working
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.message = 'Invalid link';
      this.error = true;
      this.loading = false;
      return;
    }

    this.http.get<any>(`https://localhost:5035/api/Auth/verify/${token}`).subscribe({
      next: (res) => {
        if (res.success) {
          this.message = 'Email verified! Redirecting...';
          if (res.token) {
            localStorage.setItem('token', res.token);
            localStorage.setItem('role', res.role || 'Customer');
          }
          setTimeout(() => this.router.navigate(['/customer/dashboard']), 2000);
        } else {
          this.message = res.message || 'Verification failed';
          this.error = true;
        }
        this.loading = false;
      },
      error: () => {
        this.message = 'Link expired or invalid';
        this.error = true;
        this.loading = false;
      }
    });
  }
}