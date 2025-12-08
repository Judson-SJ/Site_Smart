import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup,
  AbstractControl
} from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  @Output() saved = new EventEmitter<void>();

  profileForm!: FormGroup;
  submitting = false;

  avatarPreview: string = '';
  avatarFile: File | null = null;

  showPasswordSection = false;
  showAddressSection = false;

  constructor(private fb: FormBuilder, private auth: AuthService) {}

  ngOnInit() {
    this.initForm();

    // load initial avatar from logged-in user
    const user = this.auth.getCurrentUser();
    this.avatarPreview =
      user?.profileImage || this.getDefaultAvatar(user?.fullName || 'User');

    this.loadProfile();
  }

  private initForm() {
    this.profileForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],

      address: this.fb.group({
        street: ['', Validators.required],
        city: ['', Validators.required],
        state: ['', Validators.required],
        postalCode: ['', Validators.required],
        country: ['Sri Lanka']
      }),

      passwordGroup: this.fb.group(
        {
          currentPassword: [''],
          newPassword: ['', [Validators.minLength(6)]],
          confirmPassword: ['']
        },
        { validators: [this.passwordsMatchValidator] }
      )
    });
  }

  // ---------- GETTERS used in template ----------
  get passwordGroup(): FormGroup {
    return this.profileForm.get('passwordGroup') as FormGroup;
  }
  get newPassword() { return this.passwordGroup.get('newPassword'); }

  get fullName() { return this.profileForm.get('fullName'); }
  get email() { return this.profileForm.get('email'); }
  get phone() { return this.profileForm.get('phone'); }

  // -----------------------------------------
  // LOAD PROFILE + ADDRESS
  // -----------------------------------------
  loadProfile() {
    const user = this.auth.getCurrentUser();
    if (!user) return;

    this.avatarPreview = user.profileImage || '/assets/avatar.png';

    this.profileForm.patchValue({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone
    });

    this.auth.getMyAddress().subscribe({
      next: (addrResp: any) => {
        console.log('Fetched address:', addrResp);

        let addressObj: any = null;

        if (addrResp?.data && Array.isArray(addrResp.data)) {
          addressObj = addrResp.data[0];
        } else if (Array.isArray(addrResp)) {
          addressObj = addrResp[0];
        } else if (addrResp?.street) {
          addressObj = addrResp;
        }

        this.profileForm.patchValue({
          address: {
            street: addressObj?.street || '',
            city: addressObj?.city || '',
            state: addressObj?.state || '',
            postalCode: addressObj?.postalCode || '',
            country: addressObj?.country || 'Sri Lanka'
          }
        });
      },
      error: () => {
        this.profileForm.patchValue({
          address: {
            street: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'Sri Lanka'
          }
        });
      }
    });
  }

  // -----------------------------------------
  // PASSWORD VALIDATION
  // -----------------------------------------
  passwordsMatchValidator(group: AbstractControl) {
    const newPwd = group.get('newPassword')?.value;
    const confirm = group.get('confirmPassword')?.value;
    if (!newPwd && !confirm) return null;
    return newPwd === confirm ? null : { mismatch: true };
  }

  // -----------------------------------------
  // AVATAR UPLOAD + PREVIEW
  // -----------------------------------------
  onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) return;

    this.avatarFile = file;

    const reader = new FileReader();
    reader.onload = () => (this.avatarPreview = reader.result as string);
    reader.readAsDataURL(file);
  }

  uploadAvatar(): Promise<string | null> {
    return new Promise(resolve => {
      if (!this.avatarFile) return resolve(null);

      const form = new FormData();
      form.append('file', this.avatarFile);

      this.auth.uploadTechnicianAvatar(form).subscribe({
        next: (res: any) => {
          const url =
            res?.data?.url ||
            res?.url ||
            res?.profileImage ||
            null;

          resolve(url);
        },
        error: () => resolve(null)
      });
    });
  }

  resetAvatar() {
    this.avatarFile = null;
    this.avatarPreview = '/assets/avatar.png';
  }

  togglePasswordSection() {
    this.showPasswordSection = !this.showPasswordSection;
    if (!this.showPasswordSection) this.passwordGroup.reset();
  }

  toggleAddressSection() {
    this.showAddressSection = !this.showAddressSection;
  }

  // -----------------------------------------
  // SAVE PROFILE
  // -----------------------------------------
  async saveProfile() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.submitting = true;

    let uploadedImageUrl = await this.uploadAvatar();

    const payload: any = {
      fullName: this.profileForm.value.fullName,
      email: this.profileForm.value.email,
      phone: this.profileForm.value.phone,

      address: {
        street: this.profileForm.value.address.street,
        city: this.profileForm.value.address.city,
        state: this.profileForm.value.address.state,
        postalCode: this.profileForm.value.address.postalCode,
        country: this.profileForm.value.address.country
      }
    };

    if (uploadedImageUrl) {
      payload.profileImage = uploadedImageUrl;
    }

    this.auth.updateTechnicianProfile(payload).subscribe({
      next: (res: any) => {
        const pw = this.passwordGroup.value;

        if (pw.newPassword) {
          alert('Password changed successfully! Please login again.');
          this.auth.logout();
          return;
        }

        // -------- FIXED: Avatar update -----------

        let returnedUrl =
          res?.data?.profileImage ||
          res?.data?.url ||
          uploadedImageUrl ||
          null;

        if (returnedUrl && returnedUrl.startsWith('/')) {
          returnedUrl = window.location.origin + returnedUrl;
        }

        const finalImageUrl = returnedUrl
          ? `${returnedUrl}${returnedUrl.includes('?') ? '&' : '?'}t=${Date.now()}`
          : undefined;

        // Build update object and only include profileImage when present
        const updateObj: any = {
          fullName: payload.fullName,
          phone: payload.phone
        };

        if (finalImageUrl) {
          updateObj.profileImage = finalImageUrl;
          localStorage.setItem('userPhoto', finalImageUrl);
          this.avatarPreview = finalImageUrl;
        }

        // Update global AuthService (won't overwrite profileImage if absent)
        this.auth.updateCurrentUser(updateObj);

        console.log("PROFILE UPDATED:", {
          returnedUrl,
          finalImageUrl,
          currentUser: this.auth.getCurrentUser()
        });

        alert('Profile updated successfully!');
        this.submitting = false;
        this.saved.emit();
      },

      error: (err) => {
        console.error(err);
        alert(err.error?.message ?? 'Profile update failed!');
        this.submitting = false;
      }
    });
  }

  resetForm() {
    this.profileForm.reset({
      fullName: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'Sri Lanka'
      },
      passwordGroup: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
    });
    this.resetAvatar();
    this.showPasswordSection = false;
  }

  private getDefaultAvatar(name: string): string {
    const n = encodeURIComponent((name || 'User').trim());
    return `https://ui-avatars.com/api/?name=${n}&background=8b5cf6&color=fff&bold=true&size=256&rounded=true`;
  }
}
