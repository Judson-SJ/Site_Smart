import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AdminTechnicianService } from '../../shared/services/admin-technician.service';


@Component({
  selector: 'app-technician-verify-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './technician-verify-list.component.html',
  styleUrls: ['./technician-verify-list.component.css']
})
export class TechnicianVerifyListComponent implements OnInit {
  technicians: any[] = [];
  loading = false;
  statusMsg = '';

  constructor(
    private adminTech: AdminTechnicianService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPending();
  }

  loadPending(): void {
    this.loading = true;
    this.adminTech.getPendingTechnicians().subscribe({
      next: (res: any) => {
        this.loading = false;
        this.technicians = res?.data ?? res ?? [];
      },
      error: (err) => {
        this.loading = false;
        console.error('Failed to load pending technicians', err);
        this.statusMsg = err?.error?.message ?? 'Failed to load technicians.';
      }
    });
  }

  openDetail(t: any): void {
    this.router.navigate(['/admin/technicians', t.technicianID]);
  }
}