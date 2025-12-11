import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface CategoryDto {
  categoryID: number;
  categoryName: string;
  description?: string | null;
  isActive?: boolean;
  icon?: string;
}

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule,RouterModule,],
  
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {
  categories: CategoryDto[] = [];
  services: any[] = [];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.loadCategories();
    this.loadServices(); // optional preload
  }

  private apiRoot() {
    return (environment.apiBaseUrl || '').replace(/\/$/, '');
  }

  loadCategories() {
    this.http.get<CategoryDto[]>(`${this.apiRoot()}/categories`).subscribe({
      next: data => {
        this.categories = (data || []).map(c => ({ ...c, icon: this.getIcon(c.categoryName) }));
      },
      error: err => {
        console.error('Failed to load categories, using fallback', err);
        // fallback
        this.categories = [
          { categoryID: 1, categoryName: 'Electrical', icon: this.getIcon('Electrical') },
          { categoryID: 2, categoryName: 'Painting', icon: this.getIcon('Painting') },
          { categoryID: 3, categoryName: 'Plumbing', icon: this.getIcon('Plumbing') },
          { categoryID: 4, categoryName: 'Carpentry', icon: this.getIcon('Carpentry') },
          { categoryID: 5, categoryName: 'HVAC', icon: this.getIcon('HVAC') }
        ];
      }
    });
  }

  loadServices() {
    this.http.get<any[]>(`${this.apiRoot()}/services`).subscribe({
      next: data => this.services = data || [],
      error: err => console.warn('Could not preload services', err)
    });
  }

  // When clicking a category on home -> navigate to catalog with query param
  selectCategory(c: CategoryDto) {
    this.router.navigate(['/services'], { queryParams: { categoryId: c.categoryID }});
  }

  goToServices() {
    this.router.navigate(['/services']);
  }

  getIcon(name: string) {
    const map: any = {
      Plumbing: 'fas fa-water',
      Painting: 'fas fa-paint-roller',
      Electrical: 'fas fa-bolt',
      Carpentry: 'fas fa-hammer',
      HVAC: 'fas fa-snowflake'
    };
    return map[name] || 'fas fa-tools';
  }
}
