import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';

interface ServiceDto {
  serviceID: number;
  serviceName: string;
  description?: string;
  fixedRate: number;
  estimatedDuration: number;
  categoryName: string;
  categoryID: number;
  imageUrl?: string | null;
  imagePublicId?: string | null;
}

interface CategoryDto {
  categoryID: number;
  categoryName: string;
  description?: string | null;
  isActive: boolean;
}

@Component({
  selector: 'app-services-management',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './services-management.component.html',
  styleUrls: ['./services-management.component.css']
})
export class ServicesManagementComponent implements OnInit {
  private readonly adminBaseUrl = `${environment.apiBaseUrl}/admin`; // e.g. http://localhost:5035/api/admin

  // TAB
  activeTab: 'services' | 'categories' = 'services';

  // ===== SERVICES =====
  services: ServiceDto[] = [];
  filteredServices: ServiceDto[] = [];
  searchTerm = '';
  pageSize = 10;
  currentPage = 1;

  serviceForm!: FormGroup;
  isModalOpen = false;
  isEditMode = false;
  editingServiceId: number | null = null;
  isLoading = false;
  isSaving = false;
  deletingId: number | null = null;
  uploadInProgress = false;

  // ===== CATEGORIES =====
  categories: CategoryDto[] = [];
  categoryForm!: FormGroup;
  isCategorySaving = false;
  categoryDeletingId: number | null = null;
  showCategoryForm = false;
  editingCategoryId: number | null = null;

  // COMMON
  errorMessage = '';

  constructor(
    private http: HttpClient,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.buildForms();
    this.loadCategories();
    this.loadServices();
  }

  private buildForms(): void {
    this.serviceForm = this.fb.group({
      serviceName: ['', [Validators.required, Validators.maxLength(100)]],
      description: [''],
      fixedRate: [0, [Validators.required, Validators.min(0)]],
      estimatedDuration: [1, [Validators.required, Validators.min(0.1)]],
      categoryID: [null, [Validators.required]],
      imageUrl: [null],
      imagePublicId: [null]
    });

    this.categoryForm = this.fb.group({
      categoryName: ['', [Validators.required, Validators.maxLength(50)]],
      description: [''],
      isActive: [true]
    });
  }

  // =====================================
  // Price formatter for "Rs. 1,500.00"
  // =====================================
  formatPrice(value: number | null | undefined): string {
    if (value == null) return 'Rs. 0.00';
    try {
      const n = Number(value) || 0;
      return 'Rs. ' + n.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    } catch {
      return 'Rs. ' + (Number(value) || 0).toFixed(2);
    }
  }

  // =====================================
  // SERVICES API
  // =====================================

  loadServices(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.http.get<ServiceDto[]>(`${this.adminBaseUrl}/services`)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: data => {
          this.services = data || [];
          this.applyServiceFilter();
        },
        error: (err: HttpErrorResponse) => {
          console.error('GET /services failed', err);
          if (err.status === 0) {
            this.errorMessage = 'Cannot reach backend (is it running?).';
          } else if (err.error?.message) {
            this.errorMessage = err.error.message;
          } else if (err.status >= 500) {
            this.errorMessage = 'Server error';
          } else {
            this.errorMessage = 'Unable to load services.';
          }
        }
      });
  }

  createService(): void {
    if (this.serviceForm.invalid) {
      this.serviceForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    const body = {
      serviceName: this.serviceForm.value.serviceName,
      description: this.serviceForm.value.description,
      fixedRate: Number(this.serviceForm.value.fixedRate),
      estimatedDuration: Number(this.serviceForm.value.estimatedDuration),
      categoryID: Number(this.serviceForm.value.categoryID),
      imageUrl: this.serviceForm.value.imageUrl,
      imagePublicId: this.serviceForm.value.imagePublicId
    };

    this.http.post<ServiceDto>(`${this.adminBaseUrl}/services`, body)
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: created => {
          this.services.push(created);
          this.applyServiceFilter();
          this.closeModal();
        },
        error: (err: HttpErrorResponse) => {
          console.error('POST /services failed', err);
          this.errorMessage =
            err.error?.message || 'Error while creating service.';
        }
      });
  }

  updateService(): void {
    if (this.serviceForm.invalid || this.editingServiceId == null) {
      this.serviceForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    const id = this.editingServiceId;

    const body: any = {
      serviceName: this.serviceForm.value.serviceName,
      description: this.serviceForm.value.description,
      fixedRate: Number(this.serviceForm.value.fixedRate),
      estimatedDuration: Number(this.serviceForm.value.estimatedDuration),
      categoryID: Number(this.serviceForm.value.categoryID),
      imageUrl: this.serviceForm.value.imageUrl,
      imagePublicId: this.serviceForm.value.imagePublicId
    };

    this.http.put<void>(`${this.adminBaseUrl}/services/${id}`, body)
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: () => {
          this.loadServices();
          this.closeModal();
        },
        error: (err: HttpErrorResponse) => {
          console.error('PUT /services failed', err);
          this.errorMessage =
            err.error?.message || 'Error while updating service.';
        }
      });
  }

  deleteService(s: ServiceDto): void {
    if (!confirm(`Delete service "${s.serviceName}"?`)) return;

    this.deletingId = s.serviceID;
    this.errorMessage = '';

    this.http.delete<void>(`${this.adminBaseUrl}/services/${s.serviceID}`)
      .pipe(finalize(() => (this.deletingId = null)))
      .subscribe({
        next: () => {
          this.services = this.services.filter(x => x.serviceID !== s.serviceID);
          this.applyServiceFilter();
        },
        error: (err: HttpErrorResponse) => {
          console.error('DELETE /services failed', err);
          this.errorMessage =
            err.error?.message || 'Error while deleting service.';
        }
      });
  }

  // ===== IMAGE UPLOAD =====
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const formData = new FormData();
    formData.append('file', file);

    this.uploadInProgress = true;
    this.errorMessage = '';

    // ✅ Correct upload endpoint:
    this.http.post<{ url: string; publicId: string }>(
      `${this.adminBaseUrl}/services/upload-image`,
      formData
    )
      .pipe(finalize(() => (this.uploadInProgress = false)))
      .subscribe({
        next: res => {
          // backend returns { url: "/uploads/xxx.jpg", publicId: "xxx.jpg" }
          this.serviceForm.patchValue({
            imageUrl: res.url,
            imagePublicId: res.publicId
          });
        },
        error: (err: HttpErrorResponse) => {
          console.error('upload-image failed', err);
          this.errorMessage =
            err.error?.message || 'Error while uploading image.';
        }
      });
  }

  // =====================================
  // CATEGORIES API (list + add + delete)
  // =====================================

  loadCategories(): void {
    this.http.get<CategoryDto[]>(`${this.adminBaseUrl}/categories`)
      .subscribe({
        next: data => {
          this.categories = data || [];
        },
        error: err => {
          console.error('GET /categories failed', err);
        }
      });
  }

  openCategoryForm(): void {
    this.showCategoryForm = true;
    this.editingCategoryId = null;
    this.categoryForm.reset({
      categoryName: '',
      description: '',
      isActive: true
    });
    this.errorMessage = '';
  }

  cancelCategoryForm(): void {
    this.showCategoryForm = false;
  }

  submitCategoryForm(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.isCategorySaving = true;
    this.errorMessage = '';

    const body = {
      categoryName: this.categoryForm.value.categoryName,
      description: this.categoryForm.value.description,
      isActive: this.categoryForm.value.isActive,
      createdBy: 'admin'
    };

    this.http.post<CategoryDto>(`${this.adminBaseUrl}/categories`, body)
      .pipe(finalize(() => (this.isCategorySaving = false)))
      .subscribe({
        next: created => {
          this.categories.push(created);
          this.showCategoryForm = false;
        },
        error: (err: HttpErrorResponse) => {
          console.error('POST /categories failed', err);
          this.errorMessage =
            err.error?.message || 'Error while creating category.';
        }
      });
  }

  openEditCategory(c: CategoryDto): void {
    this.showCategoryForm = true;
    this.editingCategoryId = c.categoryID;
    this.categoryForm.patchValue({
      categoryName: c.categoryName,
      description: c.description || '',
      isActive: c.isActive
    });
  }

  deleteCategory(c: CategoryDto): void {
    if (!confirm(`Delete category "${c.categoryName}"?`)) return;

    this.categoryDeletingId = c.categoryID;
    this.errorMessage = '';

    this.http.delete<void>(`${this.adminBaseUrl}/categories/${c.categoryID}`)
      .pipe(finalize(() => (this.categoryDeletingId = null)))
      .subscribe({
        next: () => {
          this.categories = this.categories.filter(x => x.categoryID !== c.categoryID);
        },
        error: (err: HttpErrorResponse) => {
          console.error('DELETE /categories failed', err);
          this.errorMessage =
            err.error?.message || 'Error while deleting category.';
        }
      });
  }

  // =====================================
  // SERVICES UI helpers
  // =====================================

  openCreateModal(): void {
    this.isEditMode = false;
    this.editingServiceId = null;
    this.serviceForm.reset({
      serviceName: '',
      description: '',
      fixedRate: 0,
      estimatedDuration: 1,
      categoryID: null,
      imageUrl: null,
      imagePublicId: null
    });
    this.errorMessage = '';
    this.isModalOpen = true;
  }

  openEditModal(s: ServiceDto): void {
    this.isEditMode = true;
    this.editingServiceId = s.serviceID;

    this.serviceForm.reset({
      serviceName: s.serviceName,
      description: s.description || '',
      fixedRate: s.fixedRate,
      estimatedDuration: s.estimatedDuration,
      categoryID: s.categoryID,
      imageUrl: s.imageUrl || null,
      imagePublicId: s.imagePublicId || null
    });
    this.errorMessage = '';
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  submitServiceForm(): void {
    if (this.serviceForm.invalid) {
      this.serviceForm.markAllAsTouched();
      return;
    }
    this.isEditMode ? this.updateService() : this.createService();
  }

  applyServiceFilter(): void {
    const term = (this.searchTerm || '').toLowerCase();
    if (!term) {
      this.filteredServices = [...this.services];
    } else {
      this.filteredServices = this.services.filter(s =>
        s.serviceName.toLowerCase().includes(term) ||
        (s.categoryName || '').toLowerCase().includes(term)
      );
    }
    this.currentPage = 1;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredServices.length / this.pageSize));
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  get pagedServices(): ServiceDto[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredServices.slice(start, start + this.pageSize);
  }

  // image url builder (handles raw "1.jpg" or "/uploads/1.jpg" or full http)
  private buildImageUrl(path?: string | null): string | null {
    if (!path) return null;

    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    // if backend returned just '1.jpg' — prefix with /uploads/
    if (!path.startsWith('/')) {
      path = `/uploads/${path}`;
    }

    const apiRoot = environment.apiBaseUrl.replace(/\/api$/, '');
    return `${apiRoot}${path}`;
  }

  getServiceImageUrl(s: ServiceDto): string | null {
    return this.buildImageUrl(s.imageUrl ?? null);
  }

  getPreviewImageUrl(): string | null {
    return this.buildImageUrl(this.serviceForm.value.imageUrl ?? null);
  }

  // TAB
  setTab(tab: 'services' | 'categories'): void {
    this.activeTab = tab;
    this.errorMessage = '';
  }
}
