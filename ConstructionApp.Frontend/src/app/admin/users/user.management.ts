// src/app/admin/users/users-management.component.ts
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface User {
  userID: number;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  createdAt: string;
}

@Component({
  selector: 'app-users-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user.managenet.html',  // ← உங்க HTML file name correct ஆ இருக்கு
  styleUrls: ['./user.management.css']
})
export class UsersManagementComponent implements OnInit {
  users: User[] = [];
  searchQuery = '';
  roleFilter = 'all';
  statusFilter = 'all';

  showModal = false;
  isEditMode = false;
  editingUser: User | null = null;

  form = {
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: 'Customer' as 'Customer' | 'Admin' | 'Technician'
  };

  private apiUrl = 'http://localhost:5035/api/admin/users';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.http.get<any>(this.apiUrl).subscribe({
      next: (res) => {
        this.users = res.data || res || [];
      },
      error: (err) => {
        console.error('Load users failed:', err);
        alert('Failed to load users: ' + (err.error?.message || 'Check API'));
      }
    });
  }

  filterUsers() {
    // Trigger getter
    this.filteredUsersList;
  }

  get filteredUsersList(): User[] {
    return this.users.filter(user => {
      const search = this.searchQuery.toLowerCase();
      const matchesSearch = !search ||
        user.fullName.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search);

      const matchesRole = this.roleFilter === 'all' || user.role === this.roleFilter;
      const matchesStatus = this.statusFilter === 'all' || user.status === this.statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }

  openAddUser() {
    this.isEditMode = false;
    this.editingUser = null;
    this.form = { fullName: '', email: '', phone: '', password: '', role: 'Customer' };
    this.showModal = true;
  }

  openEditUser(user: User) {
    this.isEditMode = true;
    this.editingUser = user;
    this.form = {
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || '',
      password: '',
      role: user.role as any
    };
    this.showModal = true;
  }

  saveUser() {
    if (!this.form.fullName || !this.form.email) {
      alert('Name & Email required!');
      return;
    }

    const payload: any = {
      fullName: this.form.fullName,
      email: this.form.email,
      phone: this.form.phone || null,
      role: this.form.role
    };

    if (!this.isEditMode) {
      payload.password = this.form.password || '123456';
    }

    const request = this.isEditMode && this.editingUser
      ? this.http.put(`${this.apiUrl}/${this.editingUser.userID}`, payload)
      : this.http.post(this.apiUrl, payload);

    request.subscribe({
      next: () => {
        alert(this.isEditMode ? 'User Updated!' : 'User Added! Default password: 123456');
        this.showModal = false;
        this.loadUsers();
      },
      error: (err) => alert(err.error?.message || 'Failed')
    });
  }

  toggleUserStatus(user: User) {
    const newStatus = user.status === 'Active' ? 'Blocked' : 'Active';
    this.http.patch(`${this.apiUrl}/${user.userID}/status`, { status: newStatus })
      .subscribe(() => {
        user.status = newStatus;
        alert(`User ${newStatus}!`);
      });
  }

  deleteUser(id: number) {
    if (!confirm('Delete permanently?')) return;
    this.http.delete(`${this.apiUrl}/${id}`).subscribe(() => {
      this.loadUsers();
      alert('User Deleted!');
    });
  }
}
