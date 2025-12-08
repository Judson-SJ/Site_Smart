// src/app/auth/login.component.ts
import { Component } from '@angular/core';
import { FormBuilder, Validators, AbstractControl, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../shared/services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgIcon } from "@ng-icons/core";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, NgIcon],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private fb = new FormBuilder();

  form = this.fb.group({
    email: [' ', [Validators.required, Validators.email]],
    password: [' ', [
      Validators.required,
      Validators.minLength(8),
      this.passwordComplexityValidator.bind(this)
    ]]
  });

  errorMessage: string = '';
  loading = false;
  showPassword = false;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  passwordComplexityValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    return (hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar) ? null : { passwordComplexity: true };
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const loginData = {
      email: this.form.get('email')?.value?.trim() || '',
      password: this.form.get('password')?.value || ''
    };

    this.auth.login(loginData).subscribe({
      next: (res: any) => {
        this.loading = false;

        if (!res || !res.success) {
          this.errorMessage = res?.message || 'Login failed';
          setTimeout(() => this.errorMessage = '', 5000);
          return;
        }

        // determine role from response or token
        const possibleRole =
          (res.role as string) ||
          (res.data && res.data.role) ||
          (res.user && res.user.role) ||
          '';

        let normalizedRole = (possibleRole || '').toString().trim();
        if (!normalizedRole) {
          const token = this.auth.getToken();
          if (token) {
            try {
              const payload = JSON.parse(atob(token.split('.')[1]));
              normalizedRole =
                (payload?.role || payload?.Role || payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role'] || '')
                  .toString()
                  .trim();
            } catch (e) {
              normalizedRole = '';
            }
          }
        }

        normalizedRole = normalizedRole.toLowerCase();

        // IMPORTANT: Customer login page -> ONLY allow customers here.
        // If role is technician OR admin OR unknown, clear auth state and show friendly message.
        if (!normalizedRole || normalizedRole === '' || normalizedRole.includes('technician') || normalizedRole.includes('admin') || !normalizedRole.includes('customer')) {
          try {
            if (typeof this.auth.clearAuthState === 'function') {
              this.auth.clearAuthState();
            } else {
              // last-resort: remove token and role manually without navigation
              try {
                localStorage.removeItem('token');
                localStorage.removeItem('role');
              } catch (_) {}
            }
          } catch (e) {
            // ignore
          }

          this.errorMessage = 'This login page is for customers only. Please use the appropriate login page.';
          // keep the user on the same page; do NOT navigate anywhere.
          setTimeout(() => this.errorMessage = '', 6000);
          return;
        }

        // If we reached here, normalizedRole indicates 'customer' -> proceed normally.
        if (res.user?.name) localStorage.setItem('userName', res.user.name);
        this.router.navigate(['/customer/dashboard']);
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMessage = err.error?.message
          || err.error?.error
          || err.message
          || 'Invalid email or password. Please try again.';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  get emailErrors(): string {
    const control = this.form.get('email');
    if (control?.touched) {
      if (control.hasError('required')) return 'Email is required';
      if (control.hasError('email')) return 'Invalid email format';
    }
    return '';
  }

  get passwordErrors(): string {
    const control = this.form.get('password');
    if (!control?.touched) return '';
    const errors: string[] = [];
    if (control.hasError('required')) errors.push('Password is required');
    if (control.hasError('minlength')) errors.push('At least 8 characters');
    if (control.hasError('passwordComplexity')) {
      errors.push('Must contain uppercase, lowercase, number & special character');
    }
    return errors.join(', ');
  }
}
