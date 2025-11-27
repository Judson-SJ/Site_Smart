import { Routes } from '@angular/router';
import { HomeComponent } from './home/home';
import { ServicesCatalogComponent } from './home/services-catalog.component';

// keep your other imports as before (auth, admin, etc.)
import { LoginComponent } from './auth/login.component';
import { RegisterComponent } from './auth/register.component';
import { VerifyComponent } from './auth/verify.component';
import { ResendVerificationComponent } from './auth/resend-verification.component';
import { ForgotPasswordComponent } from './auth/forgot-password.component';
import { ResetPasswordComponent } from './auth/reset-password.component';
import { AdminLayoutComponent } from './admin/admin-layout/admin.layout';
import { AdminGuard } from './shared/guards/admin.guard';
import { AuthGuard } from './shared/guards/auth.guard';
import { AdminDashboardComponent } from './admin/dashboard';
import { ServicesManagementComponent } from './admin/service/services-management.component';
import { AdminLoginComponent } from './auth/admin-login/admin.login';
import { UsersComponent } from './admin/manage/users.component';
import { AdminBookingsComponent } from './admin/booking/admin-bookings.component';
import { ProfileComponent } from './customer/profile/profile.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },

  // Public services catalog (search + category filtering)
  { path: 'services', component: ServicesCatalogComponent },

  // Auth routes...
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'verify/:token', component: VerifyComponent },
  { path: 'resend-verification', component: ResendVerificationComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset/:token', component: ResetPasswordComponent },

  // Admin
  { path: 'admin-login', component: AdminLoginComponent },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AdminGuard],
    children: [
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'service', component: ServicesManagementComponent },
      { path: 'manage/users', component: UsersComponent },
      { path: 'booking', component: AdminBookingsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // Customer
  {
    path: 'customer',
    canActivate: [AuthGuard],
    children: [
      { path: 'profile', component: ProfileComponent },
      { path: '', redirectTo: '/home', pathMatch: 'full' }
    ]
  },

  // fallback
  { path: '**', redirectTo: '/home' }
];
