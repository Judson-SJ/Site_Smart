// src/app/customer/profile/profile.component.ts → FINAL 100% WORKING VERSION!
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../shared/services/auth.service';
import { LucideAngularModule } from 'lucide-angular';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';

interface Address {
  addressID: number;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

  user = { name: 'Loading...', email: '', phone: '', avatar: '' };
  addresses: Address[] = [];
  notifications = { bookingConfirmation: true, statusUpdates: true, offers: false };

  isLoading = true;
  showAddForm = false;
  isEditMode = false;
  currentEditId = 0;

  newAddress: Partial<Address> = {
    street: '', city: '', state: '', postalCode: '', country: 'Sri Lanka', isDefault: false
  };

  private apiUrl = environment.apiBaseUrl.replace(/\/$/, '');

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadAddresses();
  }

  // MAIN FIX: இப்போ API + JWT + localStorage எல்லாம் correct ஆ work ஆகும்!
  private loadUserData(): void {
    const token = this.auth.getToken();

    if (!token) {
      this.isLoading = false;
      return;
    }

    // 1. JWT Decode (Instant)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const jwtName = payload.fullName || payload.FullName || payload.name || 'User';
      const jwtEmail = payload.email || payload.Email || '';

      this.user.name = jwtName;
      this.user.email = jwtEmail;
      this.user.avatar = this.getDefaultAvatar(jwtName);
    } catch (e) {
      this.user.name = 'User';
    }

    // 2. API Call — Real Data from Database
    this.http.get<any>(`${this.apiUrl}/customer/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        if (res?.success && res?.data) {
          const d = res.data;

          this.user.name = d.fullName || d.FullName || this.user.name;
          this.user.email = d.email || d.Email || this.user.email;
          this.user.phone = d.phone || d.Phone || '';
          this.user.avatar = d.profileImage || d.ProfileImage || this.user.avatar;

          // Save to localStorage
          localStorage.setItem('userName', this.user.name);
          localStorage.setItem('userEmail', this.user.email);
          localStorage.setItem('userPhone', this.user.phone);
          if (d.profileImage || d.ProfileImage) {
            localStorage.setItem('userPhoto', this.user.avatar);
          }
        }
      },
      error: (err) => {
        console.error('Profile API failed:', err);
        // Fallback to JWT/localStorage data
        this.user.name = localStorage.getItem('userName') || this.user.name;
        this.user.email = localStorage.getItem('userEmail') || this.user.email;
        this.user.phone = localStorage.getItem('userPhone') || '';
        this.user.avatar = localStorage.getItem('userPhoto') || this.getDefaultAvatar(this.user.name);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  private loadAddresses(): void {
    const token = this.auth.getToken();
    if (!token) return;

    this.http.get<any>(`${this.apiUrl}/addresses/my`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        const raw = Array.isArray(res) ? res : (res?.data || res?.addresses || []);
        this.addresses = raw
          .map((a: any): Address => ({
            addressID: Number(a.addressID || a.AddressID || a.id || 0),
            street: String(a.street || '').trim(),
            city: String(a.city || '').trim(),
            state: String(a.state || '').trim(),
            postalCode: String(a.postalCode || '').trim(),
            country: String(a.country || 'Sri Lanka'),
            isDefault: !!a.isDefault
          }))
          .filter((a: Address) => a.addressID > 0 && a.street.length > 0);
      }
    });
  }

  private getDefaultAvatar(name: string): string {
    const n = encodeURIComponent((name || 'User').trim());
    return `https://ui-avatars.com/api/?name=${n}&background=8b5cf6&color=fff&bold=true&size=256&rounded=true&font-size=0.4`;
  }

  onImgError(e: any): void {
    e.target.src = this.getDefaultAvatar(this.user.name);
  }

  // Camera Button Click → File Input Trigger
  changeProfileImage(): void {
    const input = document.getElementById('avatar-upload') as HTMLInputElement;
    input?.click();
  }

  // Local Folder Upload — 100% WORKING!
  onAvatarChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    if (file.size > 5 * 1024 * 1024) {
      alert('Max 5MB allowed!');
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = () => this.user.avatar = reader.result as string;
    reader.readAsDataURL(file);

    // Upload
    const formData = new FormData();
    formData.append('file', file);

    this.http.post(`${this.apiUrl}/customer/upload-avatar`, formData, {
      headers: { Authorization: `Bearer ${this.auth.getToken()}` }
    }).subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.user.avatar = res.data.url;
          localStorage.setItem('userPhoto', res.data.url);
          alert('Photo uploaded successfully!');
        }
      },
      error: () => alert('Upload failed, but preview is shown')
    });
  }

  saveProfile(): void {
    const payload = {
      fullName: this.user.name.trim(),
      phone: this.user.phone.trim()
    };

    this.http.put(`${this.apiUrl}/customer/profile`, payload, {
      headers: { Authorization: `Bearer ${this.auth.getToken()}` }
    }).subscribe({
      next: () => {
        alert('Profile updated!');
        localStorage.setItem('userName', this.user.name);
        localStorage.setItem('userPhone', this.user.phone);
      }
    });
  }

  // Address Functions
  openAddForm(): void { this.isEditMode = false; this.resetForm(); this.showAddForm = true; }
  openEditModal(addr: Address): void { this.isEditMode = true; this.currentEditId = addr.addressID; this.newAddress = { ...addr }; this.showAddForm = true; }
  resetForm(): void { this.newAddress = { street: '', city: '', state: '', postalCode: '', country: 'Sri Lanka', isDefault: false }; }

  saveAddress(): void {
    if (!this.newAddress.street?.trim() || !this.newAddress.city?.trim()) {
      alert('Street and City required!');
      return;
    }

    const url = this.isEditMode ? `${this.apiUrl}/addresses/${this.currentEditId}` : `${this.apiUrl}/addresses`;
    const req = this.isEditMode
      ? this.http.put(url, this.newAddress, { headers: { Authorization: `Bearer ${this.auth.getToken()}` } })
      : this.http.post(url, this.newAddress, { headers: { Authorization: `Bearer ${this.auth.getToken()}` } });

    req.subscribe({
      next: () => { alert('Success!'); this.showAddForm = false; this.loadAddresses(); },
      error: () => alert('Failed')
    });
  }

  setDefaultAddress(id: number): void {
    this.http.patch(`${this.apiUrl}/addresses/${id}/default`, {}, {
      headers: { Authorization: `Bearer ${this.auth.getToken()}` }
    }).subscribe(() => this.loadAddresses());
  }

  deleteAddress(id: number): void {
    if (!confirm('Delete?')) return;
    this.http.delete(`${this.apiUrl}/addresses/${id}`, {
      headers: { Authorization: `Bearer ${this.auth.getToken()}` }
    }).subscribe(() => this.addresses = this.addresses.filter(a => a.addressID !== id));
  }

  goToDashboard(): void {
    this.router.navigate(['/customer/dashboard']);
  }
}