// src/app/app.routes.ts
import { Routes } from '@angular/router';

// Existing imports (உங்க original)
import { HomeComponent } from './home/home';
import { ServicesCatalogComponent } from './home/services-catalog.component';
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
import { BookingComponent } from './customer/booking/booking.component';

// NEW: Customer Dashboard Import (இதை மட்டும் add பண்ணுங்க)
import { CustomerDashboardComponent } from './customer/dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },

  // Public services catalog
  { path: 'services', component: ServicesCatalogComponent },

  // Auth routes
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'technician-register', component: RegisterComponent }, // same component
  { path: 'verify/:token', component: VerifyComponent },
  { path: 'resend-verification', component: ResendVerificationComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset/:token', component: ResetPasswordComponent },

  // Admin Login & Panel
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

  // CUSTOMER PROTECTED AREA - இங்கதான் Dashboard add பண்ணினேன்
  {
    path: 'customer',
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: CustomerDashboardComponent },
      { path: 'booking', component: BookingComponent },   // இது புதுசா add ஆனது
      { path: 'profile', component: ProfileComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }       // login பண்ணா direct dashboard வரும்
    ]
  },

  // TECHNICIAN (இதுவும் வேணும்னா add பண்ணிக்கோங்க)
  {
    path: 'technician',
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: CustomerDashboardComponent }, // இப்போ technician dashboard இல்லைனா இதை use பண்ணலாம் அல்லது மாத்திக்கோங்க
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // Fallback
  { path: '**', redirectTo: '/home' }
];