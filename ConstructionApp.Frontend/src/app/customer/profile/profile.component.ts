// src/app/customer/profile/profile.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../shared/services/auth.service';
import { LucideAngularModule } from "lucide-angular";

declare const cloudinary: any;

interface Address {
  id: number;
  title: string;
  address: string;
  isDefault?: boolean;
}

interface Notifications {
  bookingConfirmation: boolean;
  statusUpdates: boolean;
  offers: boolean;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user = {
    name: '',
    email: '',
    phone: '',
    avatar: 'assets/images/default-avatar.png'
  };

  addresses: Address[] = [
    { id: 1, title: 'Main Office Site', address: '123 Construction Ave\nBuilding B, 5th Floor\nColombo 07, Sri Lanka', isDefault: true },
    { id: 2, title: 'Warehouse Location', address: '456 Logistics Park\nUnit 12, Zone E\nGalle Road, Colombo' }
  ];

  notifications: Notifications = {
    bookingConfirmation: true,
    statusUpdates: true,
    offers: false
  };

  private apiUrl = 'http://localhost:5035/api';

  // Cloudinary Config – உங்க details!
  private cloudinaryConfig = {
    cloud_name: 'dxbhnpgd4',
    upload_preset: 'construction_app',
    folder: 'constructpro/profiles',
    cropping: true,
    multiple: false,
    sources: ['local', 'camera', 'facebook', 'instagram'],
    tags: ['profile', 'customer']
  };

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile() {
    const token = this.auth.getToken();
    this.http.get<any>(`${this.apiUrl}/customer/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.user.name = res.data.fullName;
          this.user.email = res.data.email;
          this.user.phone = res.data.phone || '';
          this.user.avatar = res.data.profileImage || 'assets/images/default-avatar.png';
        }
      },
      error: () => alert('Failed to load profile')
    });
  }

  // CLOUDINARY PROFILE IMAGE UPLOAD
  changeProfileImage() {
    cloudinary.openUploadWidget(
      this.cloudinaryConfig,
      (error: any, result: any) => {
        if (!error && result && result.event === 'success') {
          const imageUrl = result.info.secure_url;
          this.user.avatar = imageUrl;
          this.saveProfileImage(imageUrl);
        }
      }
    );
  }

  saveProfileImage(url: string) {
    const token = this.auth.getToken();
    this.http.patch(`${this.apiUrl}/customer/profile/image`,
      { profileImage: url },
      { headers: { Authorization: `Bearer ${token}` } }
    ).subscribe({
      next: () => alert('Profile picture updated!'),
      error: () => alert('Failed to save image')
    });
  }

  // ADDRESS MANAGEMENT
  addNewAddress() {
    this.addresses.push({
      id: Date.now(),
      title: 'New Address',
      address: 'Enter full address...',
      isDefault: false
    });
  }

  deleteAddress(id: number) {
    if (!confirm('Delete this address?')) return;
    this.addresses = this.addresses.filter(a => a.id !== id);
  }

  setDefaultAddress(id: number) {
    this.addresses.forEach(a => a.isDefault = a.id === id);
  }

  // SAVE PROFILE
  saveProfile() {
    const payload = {
      fullName: this.user.name,
      phone: this.user.phone
    };

    const token = this.auth.getToken();
    this.http.put(`${this.apiUrl}/customer/profile`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: () => alert('Profile updated successfully!'),
      error: () => alert('Save failed')
    });
  }
}
