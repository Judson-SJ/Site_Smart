// src/app/admin/users/admin-users.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import {  AdminUsersService,UserListItem,UserDetail } from '../../shared/services/admin-users.service';
import { AdminTechnicianService } from '../../shared/services/admin-technician.service';
import { environment } from '../../../environments/environment';


@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css']
})
export class AdminUsersComponent implements OnInit {
  tabs = [
    { key: null, label: 'All' },
    { key: 'Customer', label: 'Customers' },
    { key: 'Technician', label: 'Technicians' },
    { key: 'Admin', label: 'Admins' }
  ];

  activeRole: string | null = null;
  q = '';
  page = 1;
  pageSize = 12;
  total = 0;
  users: UserListItem[] = [];
  loading = false;
  error = '';

  // details drawer
  selectedUser: UserDetail | null = null;
  drawerOpen = false;
  detailLoading = false;

  // technician approve/reject
  techActionMsg = '';
  rejectReason = '';
  techActionLoading = false;

  // 🔗 API base for file links
 fileBase = environment.fileBaseUrl;

  constructor(
    private svc: AdminUsersService,
    private techAdmin: AdminTechnicianService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  setTab(role: string | null) {
    if (this.activeRole === role) return;
    this.activeRole = role;
    this.page = 1;
    this.load();
  }

  onSearchKey(e?: Event | KeyboardEvent) {
    if (e && 'key' in e) {
      const ke = e as KeyboardEvent;
      if (ke.key && ke.key !== 'Enter') return;
    }
    this.page = 1;
    this.load();
  }

  load() {
    this.loading = true;
    this.error = '';
    this.svc
      .listUsers({
        q: this.q || undefined,
        role: this.activeRole || undefined,
        page: this.page,
        pageSize: this.pageSize
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.users = res.items || [];
          this.total = res.total || 0;
          this.page = res.page || this.page;
          this.pageSize = res.pageSize || this.pageSize;
        },
        error: (err) => {
          console.error('listUsers error', err);
          this.error = 'Failed to load users. Check server.';
        }
      });
  }

  openDetails(u: UserListItem) {
    this.detailLoading = true;
    this.drawerOpen = true;
    this.selectedUser = null;
    this.techActionMsg = '';
    this.rejectReason = '';

    this.svc
      .getUser(u.userId)
      .pipe(finalize(() => (this.detailLoading = false)))
      .subscribe({
        next: (d) => {
          // base detail from /admin/users api
          this.selectedUser = d;

          // If this is a technician, also load verification docs
          if (
            this.selectedUser.role === 'Technician' &&
            this.selectedUser.technician?.technicianID != null
          ) {
            const techId = this.selectedUser.technician.technicianID;

            this.techAdmin.getTechnician(techId).subscribe({
              next: (res: any) => {
                const data = res?.data ?? res;

                // merge docs into technician object
                (this.selectedUser as any).technician = {
                  ...this.selectedUser!.technician,
                  idProof: data.idProof,
                  certificate: data.certificate
                };

                // optional: if address empty, build from dto
                if (
                  !this.selectedUser!.address &&
                  (data.street || data.city)
                ) {
                  const pieces = [
                    data.street,
                    data.city,
                    data.state,
                    data.postalCode,
                    data.country
                  ].filter(
                    (x: string | null | undefined) => !!x
                  );
                  this.selectedUser!.address = pieces.join(', ');
                }
              },
              error: (err) => {
                console.error('getTechnician verify details error', err);
                // ignore – user detail still shows basic info
              }
            });
          }
        },
        error: (err) => {
          console.error('getUser', err);
          // fallback to row data shape
          this.selectedUser = {
            ...u,
            technician: u.technician,
            admin: u.admin
          } as UserDetail;
        }
      });
  }

  closeDrawer() {
    this.drawerOpen = false;
    this.selectedUser = null;
    this.techActionMsg = '';
    this.rejectReason = '';
  }

  prevPage() {
    if (this.page <= 1) return;
    this.page--;
    this.load();
  }

  nextPage() {
    if (this.page * this.pageSize >= this.total) return;
    this.page++;
    this.load();
  }

  fmt(date?: string | null) {
    if (!date) return '-';
    try {
      return formatDate(date, 'MMM dd, yyyy', 'en-US');
    } catch {
      return date;
    }
  }

  // ---------- Technician helpers ----------

  get technicianSelected(): boolean {
    return !!(
      this.selectedUser &&
      this.selectedUser.role === 'Technician' &&
      this.selectedUser.technician
    );
  }

  get technicianHasDocs(): boolean {
    const tech: any = this.selectedUser?.technician;
    return !!(tech && tech.idProof && tech.certificate);
  }

  // 🔗 Build full URL for idProof / certificate
  getDocUrl(path: string | null | undefined): string | null {
    if (!path) return null;

    path = path.replace('/api/','/');

    // already absolute
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    // ensure leading slash
    if (!path.startsWith('/')) {
      path = '/' + path;
    }

    return this.fileBase + path; // e.g. http://localhost:5035/uploads/...
  }

  approveTechnician() {
    if (!this.technicianSelected || !this.selectedUser?.technician) return;
    const tech = this.selectedUser.technician;
    if (tech.technicianID == null) {
      this.techActionMsg = 'Invalid technician id.';
      return;
    }

    if (!confirm(`Approve technician: ${this.selectedUser.fullName}?`)) return;

    this.techActionLoading = true;
    this.techActionMsg = '';

    this.techAdmin
      .updateVerification(tech.technicianID!, { status: 'Approved' })
      .pipe(finalize(() => (this.techActionLoading = false)))
      .subscribe({
        next: () => {
          this.techActionMsg = 'Technician approved successfully.';
          this.selectedUser!.technician!.verificationStatus = 'Approved';
          this.load(); // refresh list
        },
        error: (err) => {
          console.error('approveTechnician error', err);
          this.techActionMsg = err?.error?.message ?? 'Approve failed.';
        }
      });
  }

  rejectTechnician() {
    if (!this.technicianSelected || !this.selectedUser?.technician) return;
    const tech = this.selectedUser.technician;
    if (tech.technicianID == null) {
      this.techActionMsg = 'Invalid technician id.';
      return;
    }

    const reasonTrim = (this.rejectReason || '').trim();
    if (!reasonTrim) {
      if (!confirm('No reason typed. Reject anyway?')) return;
    }

    this.techActionLoading = true;
    this.techActionMsg = '';

    this.techAdmin
      .updateVerification(tech.technicianID!, {
        status: 'Rejected',
        reason: reasonTrim || undefined
      })
      .pipe(finalize(() => (this.techActionLoading = false)))
      .subscribe({
        next: () => {
          this.techActionMsg = 'Technician rejected.';
          this.selectedUser!.technician!.verificationStatus = 'Rejected';
          this.load();
        },
        error: (err) => {
          console.error('rejectTechnician error', err);
          this.techActionMsg = err?.error?.message ?? 'Reject failed.';
        }
      });
  }
}