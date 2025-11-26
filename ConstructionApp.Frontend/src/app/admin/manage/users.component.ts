// src/app/admin/users/users.component.ts
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from "lucide-angular";

interface User {
  userID: number;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  createdAt: string;
  profileImage?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  searchTerm = '';
  selectedRole = 'all'; // all, Customer, Technician, Admin

  // Modal
  showModal = false;
  isEditMode = false;
  form: Partial<User> = {
    fullName: '',
    email: '',
    phone: '',
    role: 'Customer',
    status: 'Active'
  };
  editingId: number | null = null;

  private apiUrl = 'http://localhost:5035/api/admin/users'; // உங்க backend URL

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.http.get<ApiResponse<User[]>>(this.apiUrl).subscribe(res => {
      this.users = res.data || [];
      this.filteredUsers = [...this.users];
      this.applyFilters();
    });
  }

  // Search + Role Filter
  applyFilters() {
    let filtered = this.users;

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        u.fullName.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
      );
    }

    if (this.selectedRole !== 'all') {
      filtered = filtered.filter(u => u.role === this.selectedRole);
    }

    this.filteredUsers = filtered;
  }

  // Add/Edit Modal
  openAddModal() {
    this.isEditMode = false;
    this.form = { fullName: '', email: '', phone: '', role: 'Customer', status: 'Active' };
    this.editingId = null;
    this.showModal = true;
  }

  openEditModal(user: User) {
    this.isEditMode = true;
    this.form = { ...user };
    this.editingId = user.userID;
    this.showModal = true;
  }

  saveUser() {
    if (!this.form.fullName?.trim() || !this.form.email?.trim()) {
      alert('Name and Email required!');
      return;
    }

    const request = this.isEditMode && this.editingId
      ? this.http.put(`${this.apiUrl}/${this.editingId}`, this.form)
      : this.http.post(this.apiUrl, this.form);

    request.subscribe({
      next: () => {
        alert(this.isEditMode ? 'User updated!' : 'User added!');
        this.showModal = false;
        this.loadUsers();
      },
      error: (err) => alert(err.error?.message || 'Failed')
    });
  }

  deleteUser(id: number) {
    if (!confirm('Delete this user permanently?')) return;
    this.http.delete(`${this.apiUrl}/${id}`).subscribe({
      next: () => {
        alert('User deleted!');
        this.loadUsers();
      }
    });
  }

  toggleStatus(user: User) {
    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    this.http.patch(`${this.apiUrl}/${user.userID}/status`, { status: newStatus }).subscribe({
      next: () => this.loadUsers()
    });
  }
}
