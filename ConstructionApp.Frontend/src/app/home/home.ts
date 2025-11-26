// src/app/home/home.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../shared/services/auth.service';
import { CatalogService } from '../shared/services/catalog.service';
import { catchError, of } from 'rxjs';

/**
 * Local types used by the template (matches home.component.html that uses service.title / service.desc)
 */
interface CategoryCard {
  id: number;
  icon?: string;
  title: string;
  desc: string;
}

interface ServiceDtoFromApi {
  id: number;
  categoryId: number;
  serviceName: string;
  fixedRate: number;
  shortDescription?: string;
  durationMinutes?: number;
}

/**
 * Local display model for services (keeps property names used in templates if needed)
 */
interface ServiceDisplay {
  id: number;
  serviceName: string;
  fixedRate: number;
  shortDescription?: string;
  categoryId?: number;
}

interface Testimonial {
  name: string;
  text: string;
  rating: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {
  // inject services
  private auth = inject(AuthService);
  private catalog = inject(CatalogService);
  private router = inject(Router);

  // auth
  isLoggedIn = false;
  userRole: string | null = null;
  userName: string | null = null;

  // categories shown in the grid (matches template which uses service.title / service.desc)
  services: CategoryCard[] = [
    { id: 1, icon: 'zap', title: 'Electrical', desc: 'Wiring, lighting & power solutions' },
    { id: 2, icon: 'droplet', title: 'Plumbing', desc: 'Pipe fitting & water systems' },
    { id: 3, icon: 'paintbrush', title: 'Painting', desc: 'Interior & exterior painting' },
    { id: 4, icon: 'hammer', title: 'Carpentry', desc: 'Furniture & woodwork' },
    { id: 5, icon: 'wind', title: 'HVAC', desc: 'Air conditioning & ventilation' }
  ];

  testimonials: Testimonial[] = [
    { name: 'Suresh K.', text: 'Best service! Electrician came in 2 hours and fixed everything perfectly.', rating: 5 },
    { name: 'Priya M.', text: 'Professional team. Painted my entire house in 3 days. Super clean work!', rating: 5 }
  ];

  // selected category and services loaded for that category
  selectedCategory: CategoryCard | null = null;
  servicesForCategory: ServiceDisplay[] = [];
  loadingServices = false;
  error = '';

  constructor() {}

  ngOnInit(): void {
    // safe auth checks
    try {
      this.isLoggedIn = !!this.auth && typeof this.auth.isLoggedIn === 'function' ? this.auth.isLoggedIn() : false;
      this.userRole = !!this.auth && typeof this.auth.getRole === 'function' ? this.auth.getRole() : null;
    } catch (err) {
      console.warn('AuthService check failed', err);
      this.isLoggedIn = false;
      this.userRole = null;
    }
    this.userName = localStorage.getItem('userName') ?? 'User';
  }

  onCategoryClick(category: CategoryCard): void {
  // navigate to the dedicated listing page
  this.router.navigate(['/category', category.id]).catch(err => console.error('navigation error', err));
  }

  clearCategorySelection(): void {
    this.selectedCategory = null;
    this.servicesForCategory = [];
    this.loadingServices = false;
    this.error = '';
  }


  // loads services from API and maps to local display shape
  loadServicesForCategory(categoryId: number): void {
    this.loadingServices = true;
    this.servicesForCategory = [];
    this.error = '';

    this.catalog.getServicesByCategory(categoryId)
      .pipe(
        catchError((err: any) => {
          console.error('Failed to load services from API — using fallback', err);

          // fallback sample for Electrical (categoryId === 1)
          if (categoryId === 1) {
            const fallback: ServiceDisplay[] = [
              { id: 101, categoryId: 1, serviceName: 'Wiring Inspection', fixedRate: 120, shortDescription: 'Full wiring diagnostic & safety check' },
              { id: 102, categoryId: 1, serviceName: 'Switch & Outlet Replacement', fixedRate: 80, shortDescription: 'Replace switches or power outlets' },
              { id: 103, categoryId: 1, serviceName: 'Lighting Installation', fixedRate: 150, shortDescription: 'Install new ceiling / recessed lighting' },
              { id: 104, categoryId: 1, serviceName: 'Breaker Panel Upgrade', fixedRate: 400, shortDescription: 'Upgrade old electrical panel' }
            ];
            return of(fallback as any);
          }
          return of([] as ServiceDisplay[]);
        })
      )
      .subscribe({
        next: (list: ServiceDtoFromApi[] | ServiceDisplay[]) => {
          // Normalize items returned from API into ServiceDisplay
          const normalized = (list as ServiceDtoFromApi[]).map((item: any) => ({
            id: item.id,
            serviceName: item.serviceName,
            fixedRate: item.fixedRate,
            shortDescription: item.shortDescription,
            categoryId: item.categoryId ?? categoryId
          }));
          this.servicesForCategory = normalized;
          this.loadingServices = false;
        },
        error: (e: any) => {
          console.error('Unhandled error loading services', e);
          this.error = 'Unable to load services.';
          this.loadingServices = false;
        }
      });
  }

  // navigate to booking flow (ensure /book/:id route exists)
  bookService(s: ServiceDisplay): void {
    this.router.navigate(['/book', s.id]).catch((err: any) => console.error('Navigation error', err));
  }

  // show details page for service (ensure /services/:id route exists)
  viewServiceDetails(s: ServiceDisplay): void {
    this.router.navigate(['/services', s.id]).catch((err: any) => console.error('Navigation error', err));
  }

  logout(): void {
    if (this.auth && typeof this.auth.logout === 'function') this.auth.logout();
  }

  get isCustomer(): boolean { return this.userRole === 'Customer'; }
  get isTechnician(): boolean { return this.userRole === 'Technician'; }
  get isAdmin(): boolean { return this.userRole === 'Admin'; }
}
