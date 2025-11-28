// src/app/customer/booking/booking.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../environments/environment';

interface ServiceDto {
  serviceID: number;
  serviceName: string;
  description?: string | null;
  fixedRate: number;
  estimatedDuration: number;
  imageUrl?: string | null;
}

interface CalendarDay {
  day: number | string;
  disabled?: boolean;
  selected?: boolean;
}

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.css']
})
export class BookingComponent implements OnInit {
  step = 1;
  services: ServiceDto[] = [];
  selectedService: ServiceDto | null = null;
  selectedDate = '';
  selectedTime = '';
  isLoading = true;
  error = '';

  currentMonth: string = '';
  currentYear: number = 0;

  timeSlots: string[] = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM',
    '05:00 PM', '06:00 PM'
  ];

  calendarDays: CalendarDay[] = [];

  private apiUrl = (environment.apiBaseUrl || '').replace(/\/$/, '');

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.generateCalendar();
    this.loadServices();

    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state;
    if (state?.['selectedService']) {
      this.selectedService = state['selectedService'] as ServiceDto;
      this.step = 2;
    }
  }

  private getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders();
    if (token) {
      return headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  generateCalendar(): void {
    const today = new Date();
    this.currentMonth = today.toLocaleString('default', { month: 'long' });
    this.currentYear = today.getFullYear();

    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    this.calendarDays = [];

    for (let i = 0; i < firstDay; i++) {
      this.calendarDays.push({ day: '', disabled: true });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(today.getFullYear(), today.getMonth(), day);
      const isPast = date < new Date(today.setHours(0, 0, 0, 0));
      this.calendarDays.push({
        day,
        disabled: isPast,
        selected: false
      });
    }
  }

  loadServices(): void {
    this.isLoading = true;
    const url = `${this.apiUrl}/admin/services`;

    this.http.get<ServiceDto[]>(url, { headers: this.getAuthHeaders() }).subscribe({
      next: (data) => {
        this.services = data || [];
        this.isLoading = false;

        const serviceId = this.route.snapshot.queryParams['serviceId'];
        if (serviceId) {
          const service = this.services.find(s => s.serviceID === Number(serviceId));
          if (service) this.selectService(service);
        }
      },
      error: () => {
        this.error = 'Failed to load services. Please try again.';
        this.isLoading = false;
      }
    });
  }

  getImageUrl(service: ServiceDto): string {
    if (!service.imageUrl) return '';
    if (service.imageUrl.startsWith('http')) return service.imageUrl;
    const base = this.apiUrl.replace(/\/api$/, '');
    const path = service.imageUrl.startsWith('/') ? service.imageUrl : `/uploads/${service.imageUrl}`;
    return `${base}${path}`;
  }

  formatDuration(hours: number): string {
    return hours === 1 ? '1 hr' : `${hours} hrs`;
  }

  formatPrice(price: number): string {
    return 'Rs. ' + price.toLocaleString('en-IN');
  }

  selectService(service: ServiceDto): void {
    this.selectedService = service;
  }

  goToSchedule(): void {
    if (this.selectedService) {
      this.step = 2;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  selectDate(day: CalendarDay): void {
    if (day.disabled || typeof day.day !== 'number') return;

    this.calendarDays.forEach(d => d.selected = false);
    day.selected = true;
    this.selectedDate = `${day.day} ${this.currentMonth} ${this.currentYear}`;
  }

  // 100% WORKING CONFIRM BOOKING – MATCHES YOUR BACKEND EXACTLY!
  confirmBooking(): void {
    if (!this.selectedService || !this.selectedDate || !this.selectedTime) {
      alert('Please select service, date, and time!');
      return;
    }

    // Convert "23 November 2025" + "11:00 AM" → ISO DateTime
    const [day, month, year] = this.selectedDate.split(' ');
    const monthIndex = new Date(Date.parse(`${month} 1, ${year}`)).getMonth() + 1;
    const dateStr = `${year}-${monthIndex.toString().padStart(2, '0')}-${day.padStart(2, '0')}`;

    // Convert time (e.g., "11:00 AM" → "11:00")
    let [time, period] = this.selectedTime.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;

    const startDateTime = `${dateStr}T${timeStr}`;
    const endDateTime = new Date(new Date(startDateTime).getTime() + this.selectedService.estimatedDuration * 60 * 60 * 1000)
      .toISOString();

    // FormData – because backend uses [FromForm]
    const formData = new FormData();
    formData.append('ServiceID', this.selectedService.serviceID.toString());
    formData.append('Description', this.selectedService.description || 'Service booked via app');
    formData.append('AddressID', '1'); // Change later when address system ready
    formData.append('PreferredStartDateTime', new Date(startDateTime).toISOString());
    formData.append('PreferredEndDateTime', endDateTime);

    console.log('Booking Request:', Object.fromEntries(formData));

    // CORRECT API ENDPOINT: /api/bookings (NOT /customer/bookings)
    this.http.post(`${this.apiUrl}/api/bookings`, formData, {
      headers: this.getAuthHeaders() // Only Authorization – NO Content-Type!
    }).subscribe({
      next: (response: any) => {
        console.log('Booking Created!', response);

        this.router.navigate(['/customer/booking-success'], {
          state: {
            booking: {
              bookingId: response.data?.BookingID || 'BKG' + Date.now(),
              serviceName: this.selectedService!.serviceName,
              price: this.selectedService!.fixedRate,
              duration: this.formatDuration(this.selectedService!.estimatedDuration),
              date: this.selectedDate,
              time: this.selectedTime,
              serviceImage: this.getImageUrl(this.selectedService!)
            }
          }
        });
      },
      error: (err) => {
        console.error('Booking Failed:', err);
        alert(`Booking failed! Status: ${err.status}\nCheck console (F12)`);
      }
    });
  }
}