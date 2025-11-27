// src/app/home/services-catalog.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Router, ActivatedRoute, Params, RouterModule } from '@angular/router';
import { environment } from '../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

interface ServiceDto {
  serviceID: number;
  serviceName: string;
  description?: string | null;
  fixedRate: number;
  estimatedDuration: number;
  categoryName: string;
  categoryID: number | null;
  imageUrl?: string | null;
  imagePublicId?: string | null;
}

interface CategoryItem {
  categoryID: number | null;
  categoryName: string;
  count: number;
}

@Component({
  selector: 'app-services-catalog',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './services-catalog.component.html',
  styleUrls: ['./services-catalog.component.css']
})
export class ServicesCatalogComponent implements OnInit, OnDestroy {
  apiRoot = (environment.apiBaseUrl || '').replace(/\/$/, ''); // e.g. http://localhost:5035/api
  services: ServiceDto[] = [];
  filtered: ServiceDto[] = [];
  categories: CategoryItem[] = [];
  activeCategoryId: number | null = null; // null = all
  search = '';
  isLoading = false;
  error = '';

  private routeSub: Subscription | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // watch for categoryId query param from Home navigation (and other changes)
    this.routeSub = this.route.queryParams.subscribe((params: Params) => {
      const raw = params['categoryId'];
      if (raw === undefined || raw === null || raw === '') {
        this.activeCategoryId = null;
      } else {
        const n = Number(raw);
        this.activeCategoryId = Number.isNaN(n) ? null : n;
      }
      // If services already loaded, re-run filtering. Otherwise load services (which will apply filter).
      if (this.services && this.services.length) {
        this.applyFilter();
      } else {
        this.loadServices();
      }
    });

    // Initial load if no query params emitted yet
    // (loadServices will be called by the subscription above on first emission in most setups)
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  private getAuthHeaders(): { headers?: HttpHeaders } {
    const token = localStorage.getItem('authToken');
    if (token) {
      return { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) };
    }
    return {};
  }

  loadServices(): void {
    this.isLoading = true;
    this.error = '';

    const adminUrl = `${this.apiRoot}/admin/services`;
    console.log('Requesting services from:', adminUrl);

    this.http.get<ServiceDto[]>(adminUrl, this.getAuthHeaders()).subscribe({
      next: (data) => {
        // ensure categoryID is numeric where possible
        this.services = (data || []).map(s => ({
          ...s,
          categoryID: s.categoryID != null ? Number(s.categoryID) : null
        }));
        this.buildCategories();
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Failed loading admin/services:', err);
        if (err.status === 0) {
          this.error = 'Cannot reach backend — is the API server running?';
        } else if (err.status === 401 || err.status === 403) {
          this.error = 'Authentication required to load services (401/403). Please login or provide a token.';
        } else if (err.status === 404) {
          this.error = `Services API not found at ${adminUrl} (404).`;
        } else if (err.error?.message) {
          this.error = err.error.message;
        } else {
          this.error = `Unable to load services. (status ${err.status})`;
        }
        this.isLoading = false;
      }
    });
  }

  buildCategories(): void {
    const map = new Map<number|string, CategoryItem>();
    for (const s of this.services) {
      const key = s.categoryID ?? 'uncat';
      const name = s.categoryName ?? 'Uncategorized';
      const numericKey = s.categoryID != null ? Number(s.categoryID) : 'uncat';
      if (!map.has(numericKey)) {
        map.set(numericKey, { categoryID: s.categoryID ?? null, categoryName: name, count: 0 });
      }
      map.get(numericKey)!.count++;
    }
    const list = Array.from(map.values());
    list.sort((a,b)=> a.categoryName.localeCompare(b.categoryName));
    this.categories = [{ categoryID: null, categoryName: 'All', count: this.services.length }, ...list];
  }

  // Accept number | string | null so callers from templates or routing work reliably
  selectCategory(catId: number | string | null): void {
    if (catId === null || catId === undefined || catId === '') {
      this.activeCategoryId = null;
    } else {
      const n = Number(catId);
      this.activeCategoryId = Number.isNaN(n) ? null : n;
    }

    // update filter locally
    this.applyFilter();

    // reflect into the URL so back/refresh works and Home navigation is honored
    // (replaceUrl: false keeps history, queryParamsHandling: 'merge' can be used if needed)
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { categoryId: this.activeCategoryId },
      queryParamsHandling: 'merge'
    });
  }

  applyFilter(): void {
    const term = (this.search || '').trim().toLowerCase();

    // Compare numeric values to avoid string vs number mismatches
    const activeNum = this.activeCategoryId == null ? null : Number(this.activeCategoryId);

    this.filtered = this.services.filter(s => {
      const svcCat = s.categoryID == null ? null : Number(s.categoryID);
      const matchesCat = activeNum == null || svcCat === activeNum;
      const matchesSearch = !term || (
        (s.serviceName && s.serviceName.toLowerCase().includes(term)) ||
        (s.description && s.description.toLowerCase().includes(term))
      );
      return matchesCat && matchesSearch;
    });

    console.debug('applyFilter -> activeCategoryId:', this.activeCategoryId, 'filtered:', this.filtered.length);
  }

  bookNow(s: ServiceDto): void {
    this.router.navigate(['/book', s.serviceID]);
  }

  getImageUrl(s: ServiceDto | string | undefined | null): string | null {
    const path = typeof s === 'string' ? s : (s ? (s as ServiceDto).imageUrl : null);
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    let p = path;
    if (!p.startsWith('/')) {
      if (p.startsWith('uploads/')) p = `/${p}`;
      else p = `/uploads/${p}`;
    }
    const apiHost = this.apiRoot.replace(/\/api$/, '');
    return `${apiHost}${p}`;
  }

  formatPrice(n: number|undefined|null): string {
    if (n == null) return 'Rs. 0.00';
    try {
      return 'Rs. ' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } catch {
      return 'Rs. ' + (Number(n) || 0).toFixed(2);
    }
  }
}
