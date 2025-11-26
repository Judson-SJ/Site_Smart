// src/app/service-list/service-list.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CatalogService } from '../shared/services/catalog.service';
import { catchError, of } from 'rxjs';

export interface ServiceItemFromApi {
  // flexible - backend may use different field names; we'll normalize below
  id?: number;
  serviceID?: number;
  categoryId?: number;
  CategoryID?: number;
  categoryName?: string;
  CategoryName?: string;
  serviceName?: string;
  ServiceName?: string;
  fixedRate?: number;
  FixedRate?: number;
  shortDescription?: string;
  ShortDescription?: string;
  description?: string;
  estimatedDuration?: number;
  EstimatedDuration?: number;
  durationMinutes?: number;
  DurationMinutes?: number;
  imageUrl?: string;
  imagePath?: string;
  image?: string;
  Service?: any;
  price?: any;
  FixedPrice?: any;
  Category?: any;
  [key: string]: any;
}

export interface ServiceItem {
  id: number;
  serviceName: string;
  fixedRate?: number | null;
  shortDescription?: string | null;
  estimatedDuration?: number | null; // in hours
  durationMinutes?: number | null;   // in minutes
  imageUrl?: string | null;
  categoryId?: number | null;
  categoryName?: string | null;
  raw?: any;
}

@Component({
  selector: 'app-service-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './service-list.component.html',
  styleUrls: ['./service-list.component.css']
})
export class ServiceListComponent implements OnInit {
  private route = inject(ActivatedRoute);
  public router = inject(Router);     // public so template can optionally use it
  private catalog = inject(CatalogService);

  categoryId!: number;
  categoryName = 'Services';
  services: ServiceItem[] = [];
  loading = false;
  error = '';

  // optional: keep raw JSON for debugging
  rawJson: any = null;

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (!id) {
        this.error = 'Category not specified';
        return;
      }
      this.categoryId = Number(id);
      // You can replace this with a call to fetch category meta/name from API if available
      this.categoryName = `Category ${this.categoryId}`;
      this.loadServices();
    });
  }

  private normalizeApiItem(item: ServiceItemFromApi): ServiceItem {
    // Use bracket notation for properties that may only exist via index signature
    const id =
      item.id ??
      item.serviceID ??
      item['ServiceID'] ??
      0;

    const serviceName =
      item.serviceName ??
      item['ServiceName'] ??
      item['Service'] ??
      item['service'] ??
      `Service ${id}`;

    const fixedRate =
      item.fixedRate ??
      item['FixedRate'] ??
      item['price'] ??
      item['FixedPrice'] ??
      null;

    const shortDescription =
      item.shortDescription ??
      item['ShortDescription'] ??
      item.description ??
      null;

    const estimatedDuration =
      item.estimatedDuration ??
      item['EstimatedDuration'] ??
      null;

    const durationMinutes =
      item.durationMinutes ??
      item['DurationMinutes'] ??
      null;

    const imageUrl =
      item.imageUrl ??
      item.imagePath ??
      item.image ??
      null;

    const categoryId =
      item.categoryId ??
      item['CategoryID'] ??
      item['categoryID'] ??
      null;

    const categoryName =
      item.categoryName ??
      item['CategoryName'] ??
      item['Category'] ??
      null;

    return {
      id,
      serviceName,
      fixedRate,
      shortDescription,
      estimatedDuration,
      durationMinutes,
      imageUrl,
      categoryId,
      categoryName,
      raw: item
    };
  }

  loadServices(): void {
    this.loading = true;
    this.error = '';
    this.services = [];
    this.rawJson = null;

    this.catalog.getServicesByCategory(this.categoryId)
      .pipe(
        catchError((err: any) => {
          console.error('ServiceListComponent: failed to load services', err);
          // on network/API error, surface empty array to UI
          return of([] as ServiceItemFromApi[]);
        })
      )
      .subscribe({
        next: (list: ServiceItemFromApi[]) => {
          // keep raw for debugging (optional)
          this.rawJson = list;

          // normalize
          try {
            const normalized = (list || []).map(i => this.normalizeApiItem(i));
            this.services = normalized;
          } catch (mapErr) {
            console.error('Normalization failed', mapErr);
            this.services = [];
          }

          this.loading = false;
        },
        error: (e: any) => {
          console.error('Unhandled subscription error', e);
          this.error = 'Unable to load services.';
          this.loading = false;
        }
      });
  }

  // navigate back to home
  goBack(): void {
    this.router.navigate(['/home']).catch(err => console.error('Navigation error', err));
  }

  // Book: navigate to customer booking page and pass serviceId as query param
  book(service: ServiceItem): void {
    const sid = service.id;
    this.router.navigate(['/customer/booking/new'], { queryParams: { serviceId: sid } })
      .catch(err => console.error('Navigation to booking failed', err));
  }

  // Show details page (assuming route exists)
  details(service: ServiceItem): void {
    const sid = service.id;
    this.router.navigate(['/services', sid]).catch(err => console.error('Navigation to details failed', err));
  }
}
