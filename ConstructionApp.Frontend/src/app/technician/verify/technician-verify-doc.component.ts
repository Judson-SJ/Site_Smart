import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { TechnicianService } from '../../shared/services/technician.service';
import { AuthService } from '../../shared/services/auth.service';
import { CategoryService, CategoryDto } from '../../shared/services/category.service';

@Component({
  selector: 'app-technician-verify-doc',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './technician-verify-doc.component.html',
  styleUrls: ['./technician-verify-doc.component.css']
})
export class TechnicianVerifyDocComponent implements OnInit {
  verifyForm!: FormGroup;
  submitting = false;
  statusMsg = '';

  isLoading = false;
  loadingCategories = false;
  categoriesList: string[] = [];
  categoriesSelected: string[] = [];

  nicFileName: string | null = null;
  certFileName: string | null = null;

  constructor(
    private fb: FormBuilder,
    private techService: TechnicianService,
    private auth: AuthService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.createForm();
    this.loadCategories();

    // try to load existing verify data (address, files etc)
    this.loadVerifyData();

    // Also try to auto-fill address from AuthService/getMyAddress if available
    this.tryLoadAddressFromAuth();
  }

  private createForm() {
    this.verifyForm = this.fb.group({
      address: this.fb.group({
        street: ['', Validators.required],
        city: ['', Validators.required],
        state: ['', Validators.required],
        postalCode: ['', Validators.required],
        country: ['Sri Lanka', Validators.required]
      }),

      experienceYears: ['', [Validators.required, Validators.min(0)]],
      category: [''],

      nic: [null],
      certificate: [null]
    });
  }

  loadCategories(): void {
    this.loadingCategories = true;
    this.categoryService.getAllForAuth().pipe(
      finalize(() => (this.loadingCategories = false))
    ).subscribe({
      next: (list: CategoryDto[] | any) => {
        const arr = (list || []) as CategoryDto[];
        this.categoriesList = arr.filter(c => c.isActive !== false).map(c => c.categoryName);
      },
      error: (err: any) => {
        console.error('Failed to load categories', err);
        this.categoriesList = [];
      }
    });
  }

  toggleCategory(cat: string): void {
    const idx = this.categoriesSelected.indexOf(cat);
    if (idx === -1) this.categoriesSelected.push(cat);
    else this.categoriesSelected.splice(idx, 1);
  }

  onFileSelect(event: Event, field: 'nic' | 'certificate'): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;
    if (!file) return;

    if (file.type !== 'application/pdf') {
      this.statusMsg = 'Only PDF files are allowed for documents.';
      if (input) input.value = '';
      return;
    }

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      this.statusMsg = 'File too large. Max 5MB.';
      if (input) input.value = '';
      return;
    }

    // set control and mark dirty
    this.verifyForm.patchValue({ [field]: file });
    this.verifyForm.get(field)?.markAsDirty();

    if (field === 'nic') this.nicFileName = file.name;
    if (field === 'certificate') this.certFileName = file.name;
    this.statusMsg = '';
  }

  // Attempt to auto-fill address from auth.getMyAddress or currentUser
  private tryLoadAddressFromAuth(): void {
    // 1) If current user has address in token -> patch
    const cu = this.auth.getCurrentUser();
    if (cu?.address) {
      this.verifyForm.patchValue({ address: cu.address });
      return;
    }

    // 2) Try dedicated API endpoint if available — be defensive about response shape
    this.auth.getMyAddress().pipe(finalize(() => {})).subscribe({
      next: (res: any) => {
        // normalize
        let addr: any = null;
        if (!res) {
          addr = null;
        } else if (res.data && Array.isArray(res.data)) {
          addr = res.data.length ? res.data[0] : null;
        } else if (Array.isArray(res)) {
          addr = res.length ? res[0] : null;
        } else if (res.addressID || res.street || res.city) {
          addr = res;
        } else if (res.data && typeof res.data === 'object') {
          addr = res.data;
        }

        if (addr) {
          this.verifyForm.patchValue({
            address: {
              street: addr.street ?? '',
              city: addr.city ?? '',
              state: addr.state ?? '',
              postalCode: addr.postalCode ?? '',
              country: addr.country ?? 'Sri Lanka'
            }
          });
        }
      },
      error: () => {
        // ignore — server might not have endpoint
      }
    });
  }

  // Submit documents to backend
  submit(): void {
    // basic validation
    if (this.verifyForm.invalid) {
      this.statusMsg = 'Please fill required fields.';
      this.verifyForm.markAllAsTouched();
      return;
    }

    const addr = this.verifyForm.get('address')?.value;
    const nicFile: File | null = this.verifyForm.get('nic')?.value ?? null;
    const certFile: File | null = this.verifyForm.get('certificate')?.value ?? null;

    // Build FormData because files must be uploaded as multipart/form-data
    const form = new FormData();

    if (nicFile instanceof File) form.append('nic', nicFile, nicFile.name);
    if (certFile instanceof File) form.append('certificate', certFile, certFile.name);

    form.append('street', addr.street ?? '');
    form.append('city', addr.city ?? '');
    form.append('state', addr.state ?? '');
    form.append('postalCode', addr.postalCode ?? '');
    form.append('country', addr.country ?? 'Sri Lanka');

    const years = Number(this.verifyForm.get('experienceYears')?.value);
    if (!isNaN(years)) form.append('experienceYears', String(years));

    // categories: append both array style & JSON — backend can pick either
    if (this.categoriesSelected && this.categoriesSelected.length) {
      this.categoriesSelected.forEach(c => form.append('categories[]', c));
      form.append('categories', JSON.stringify(this.categoriesSelected));
    }

    this.submitting = true;
    this.statusMsg = '';

    // inside submit() — replace next handler
this.techService.uploadVerification(form).pipe(
  finalize(() => (this.submitting = false))
).subscribe({
  next: (res: any) => {
    console.log('uploadVerification response:', res);
    this.statusMsg = 'Documents submitted — waiting admin verification.';

    // Try to read returned verification data from response (API returns { success:true, message, data: { idProof, cert, experienceYears } })
    const returned = res?.data ?? res ?? null;

    // update filenames if returned paths exist
    const nicPath = returned?.idProof ?? returned?.IDProof ?? returned?.idproof ?? null;
    const certPath = returned?.cert ?? returned?.certificate ?? returned?.certificatePath ?? null;
    if (nicPath) this.nicFileName = (typeof nicPath === 'string' ? (nicPath.split('/').pop() ?? nicPath) : String(nicPath));
    if (certPath) this.certFileName = (typeof certPath === 'string' ? (certPath.split('/').pop() ?? certPath) : String(certPath));

    // experience years
    if (returned?.experienceYears !== undefined && returned?.experienceYears !== null) {
      this.verifyForm.patchValue({ experienceYears: returned.experienceYears });
    }

    // If backend echoed categories or address, apply them too
    if (returned?.categories) {
      try {
        this.categoriesSelected = Array.isArray(returned.categories) ? returned.categories : JSON.parse(returned.categories);
      } catch {
        this.categoriesSelected = (typeof returned.categories === 'string' && returned.categories) ? returned.categories.split(',').map((s: string)=> s.trim()) : [];
      }
    }

    if (returned?.street || returned?.city || returned?.state || returned?.postalCode) {
      this.verifyForm.patchValue({
        address: {
          street: returned.street ?? '',
          city: returned.city ?? '',
          state: returned.state ?? '',
          postalCode: returned.postalCode ?? '',
          country: returned.country ?? 'Sri Lanka'
        }
      });
    }

    // Optionally refresh by calling loadVerifyData() if server later provides GET
    // this.loadVerifyData();
  },
  error: (err: any) => {
    console.error('Upload error', err);
    this.statusMsg = err?.error?.message ?? 'Failed to upload documents.';
  }
});

  }

  loadVerifyData(): void {
    this.isLoading = true;

    this.techService.getVerifyDetails().pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (res: any) => {
        console.log('VERIFY DETAILS RAW RESPONSE:', res);
        const data = res?.data ?? res ?? null;
        if (!data) return;

        // ------------ ADDRESS ------------
        const addr =
          data.address ??
          data.data?.address ??
          (data.street || data.city || data.postalCode ? {
            street: data.street,
            city: data.city,
            state: data.state,
            postalCode: data.postalCode,
            country: data.country
          } : null);

        if (addr) {
          this.verifyForm.patchValue({
            address: {
              street: addr.street ?? '',
              city: addr.city ?? '',
              state: addr.state ?? '',
              postalCode: addr.postalCode ?? '',
              country: addr.country ?? 'Sri Lanka'
            }
          });
        }

        // ------------ EXPERIENCE YEARS ------------
        if (data.experienceYears !== undefined && data.experienceYears !== null) {
          this.verifyForm.patchValue({ experienceYears: data.experienceYears });
        } else if (data.experience_years !== undefined) {
          this.verifyForm.patchValue({ experienceYears: data.experience_years });
        }

        // ------------ CATEGORIES ------------
        const cats =
          data.categories ??
          data.category ??
          data.categoryNames ??
          data.data?.categories ??
          [];

        if (Array.isArray(cats) && cats.length) {
          this.categoriesSelected = [...cats];
        }

        // ------------ DOCUMENT NAMES ------------
        const nic = data.idProof ?? data.nic ?? data.nicFile ?? data.data?.idProof ?? null;
        const cert = data.certificate ?? data.cert ?? data.certificateFile ?? data.data?.certificate ?? null;

        if (nic) {
  const nicName = (typeof nic === 'string') ? (nic.split('/').pop() ?? null) : (nic ? String(nic) : null);
  this.nicFileName = nicName;
} else {
  this.nicFileName = null;
}

if (cert) {
  const certName = (typeof cert === 'string') ? (cert.split('/').pop() ?? null) : (cert ? String(cert) : null);
  this.certFileName = certName;
} else {
  this.certFileName = null;
}


        // final debug object
        console.log('NORMALIZED VERIFY DATA:', { addr, experience: data.experienceYears, cats, nic, cert });
      },
      error: (err) => {
        console.error('Failed to load verification details', err);
      }
    });
  }
}
