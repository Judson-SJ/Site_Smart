// src/app/shared/services/catalog.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

export interface ServiceItem {
  id: number;
  categoryId: number;
  serviceName: string;
  fixedRate: number;
  shortDescription?: string;
  durationMinutes?: number;
  // add other fields your API returns (image, etc.)
}

@Injectable({ providedIn: 'root' })
export class CatalogService {
  // set this to your API base if needed
  private apiBase = 'http://localhost:5035/api';

  constructor(private http: HttpClient) {}

  // try query param first, then fallback to a path style endpoint if needed
  getServicesByCategory(categoryId: number): Observable<ServiceItem[]> {
    // first attempt: /api/services?categoryId=#
    return this.http.get<ServiceItem[]>(`${this.apiBase}/services?categoryId=${categoryId}`)
      .pipe(
        catchError(err => {
          console.warn('Query param endpoint failed, trying fallback path endpoint', err);
          // fallback: /api/services/category/{id} (some backends use this)
          return this.http.get<ServiceItem[]>(`${this.apiBase}/services/category/${categoryId}`)
            .pipe(
              catchError(err2 => {
                console.error('Fallback endpoint also failed', err2);
                // surface empty array instead of throwing so UI can show fallback message
                return of([]);
              })
            );
        })
      );
  }

  // optional: get single service
  getServiceById(id: number) {
    return this.http.get<ServiceItem>(`${this.apiBase}/services/${id}`).pipe(
      catchError(err => { console.error(err); return of(null as any); })
    );
  }

  getCategories() {
    return this.http.get<any[]>(`${this.apiBase}/categories`).pipe(
      catchError(err => { console.error(err); return of([]); })
    );
  }
}
