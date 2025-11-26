// src/app/app.routes.ts
import { Routes } from '@angular/router';

// Public Auth components
import { LoginComponent } from './auth/login.component';
import { RegisterComponent } from './auth/register.component';
import { VerifyComponent } from './auth/verify.component';
import { ResendVerificationComponent } from './auth/resend-verification.component';
import { ForgotPasswordComponent } from './auth/forgot-password.component';
import { ResetPasswordComponent } from './auth/reset-password.component';

// Main / app components
import { HomeComponent } from './home/home';
import { ProfileComponent } from './customer/profile/profile.component';
import { AdminDashboardComponent } from './admin/dashboard';
import { ServicesManagementComponent } from './admin/service/services-management.component';
import { AdminLoginComponent } from './auth/admin-login/admin.login';

// Admin area components
import { AdminLayoutComponent } from './admin/admin-layout/admin.layout';
import { UsersComponent } from './admin/manage/users.component';
import { AdminBookingsComponent } from './admin/booking/admin-bookings.component';

// Guards
import { AuthGuard } from './shared/guards/auth.guard';
import { AdminGuard } from './shared/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },

  // Public Auth
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'verify/:token', component: VerifyComponent },
  { path: 'resend-verification', component: ResendVerificationComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset/:token', component: ResetPasswordComponent },

  // Admin Login (Public)
  { path: 'admin-login', component: AdminLoginComponent },

  // Admin Protected Area - Admin Guard
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AdminGuard],
    children: [
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'service', component: ServicesManagementComponent },
      { path: 'manage/users', component: UsersComponent },
      { path: 'booking', component: AdminBookingsComponent },
      { path: 'financials', component: AdminDashboardComponent }, // placeholder
      { path: 'notifications', component: AdminDashboardComponent }, // placeholder
      { path: 'audit', component: AdminDashboardComponent }, // placeholder
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // Customer Protected Area
  // NOTE: there was a redirect to 'dashboard' here but no CustomerDashboardComponent imported.
  // To avoid a missing route error, redirect customers to /home by default (change if you have a dashboard).
  {
    path: 'customer',
    canActivate: [AuthGuard],
    children: [
      { path: 'profile', component: ProfileComponent },
      { path: '', redirectTo: '/home', pathMatch: 'full' }
    ]
  },

  // Category page (lazy-loaded)
  {
    path: 'category/:id',
    loadComponent: () => import('./service-list/service-list.component').then(m => m.ServiceListComponent)
    // If you prefer eager load, import ServiceListComponent and use:
    // { path: 'category/:id', component: ServiceListComponent }
  },

  // Old Redirects
  { path: 'services', redirectTo: '/admin/service', pathMatch: 'full' },

  // 404 / fallback
  { path: '**', redirectTo: '/home' }
];
