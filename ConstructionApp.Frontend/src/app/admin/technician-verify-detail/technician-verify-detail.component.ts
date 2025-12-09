import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AdminTechnicianService } from '../../shared/services/admin-technician.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-technician-verify-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './technician-verify-detail.component.html',
  styleUrls: ['./technician-verify-detail.component.css']
})
export class TechnicianVerifyDetailComponent implements OnInit {
  technician: any;
  loading = false;
  statusMsg = '';
  reason: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adminTech: AdminTechnicianService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadTechnician(id);
    }
  }

  loadTechnician(id: number): void {
    this.loading = true;
    this.adminTech.getTechnician(id).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.technician = res?.data ?? res;
      },
      error: (err) => {
        this.loading = false;
        console.error('Failed to load technician', err);
        this.statusMsg = err?.error?.message ?? 'Failed to load technician.';
      }
    });
  }

  approve(): void {
    if (!this.technician) return;
    if (!confirm(`Approve technician: ${this.technician.fullName}?`)) return;

    this.adminTech.updateVerification(this.technician.technicianID, {
      status: 'Approved'
    }).subscribe({
      next: () => {
        this.statusMsg = 'Technician approved.';
        setTimeout(() => this.router.navigate(['/admin/technicians']), 800);
      },
      error: (err) => {
        console.error('Approve error', err);
        this.statusMsg = err?.error?.message ?? 'Approve failed.';
      }
    });
  }

  reject(): void {
    if (!this.technician) return;
    if (!this.reason || !this.reason.trim()) {
      if (!confirm('No reason typed. Reject anyway?')) return;
    }

    this.adminTech.updateVerification(this.technician.technicianID, {
      status: 'Rejected',
      reason: this.reason
    }).subscribe({
      next: () => {
        this.statusMsg = 'Technician rejected.';
        setTimeout(() => this.router.navigate(['/admin/technicians']), 800);
      },
      error: (err) => {
        console.error('Reject error', err);
        this.statusMsg = err?.error?.message ?? 'Reject failed.';
      }
    });
  }

  back(): void {
    this.router.navigate(['/admin/technicians']);
  }
}