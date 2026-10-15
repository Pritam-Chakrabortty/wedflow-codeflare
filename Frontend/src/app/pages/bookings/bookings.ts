import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BookingModal , NewBookingData } from './booking-modal/booking-modal';
import { ImportExcelModal } from '../../components/import-excel-modal/import-excel-modal';
import { BookingService, Booking as ApiBooking } from '../../services/booking.service';
import { ClientService } from '../../services/client.service';
import { PackageService } from '../../services/package.service';

type WorkflowStage =
  | 'Booking Confirmed'
  | 'Planning'
  | 'Production'
  | 'Post Production'
  | 'QC'
  | 'Client Review'
  | 'Revision'
  | 'Album'
  | 'Delivery'
  | 'Completed'
  | 'Advance Received'
  | 'Full Payment Received';

interface Booking {
  id: string;
  bookingId: string;
  clientName: string;
  eventType?: string;
  eventDate: string; // ISO date
  venue: string;
  packageName: string;
  workflowStage: WorkflowStage;
  amount: number;
  amountPaid?: number; // optional — thakle "Rs. X paid" sub-line dekhabe
}

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, BookingModal, ImportExcelModal],
  templateUrl: './bookings.html',
  styleUrl: './bookings.scss',
})
export class Bookings implements OnInit {
  showNewBookingModal = false;
  showImportModal = false;
  bookings: Booking[] = [];
  isLoading = false;

  bookingImportColumns = [
    'Client Name',
    'Event Date (YYYY-MM-DD)',
    'Venue / Location',
    'Package Name',
    'Total Amount',
    'Advance Paid'
  ];

  bookingSampleRows = [
    ['Rahul Sharma', '2026-11-20', 'Grand Ballroom, Taj Bengal, Kolkata', 'Royal Wedding Package', '150000', '50000'],
    ['Priya Verma', '2026-12-05', 'Hyatt Regency, Kolkata', 'Premium Photo & Cinema', '120000', '40000']
  ];

  clientOptions: { id: string; label: string }[] = [];
  packageOptions: { id: string; label: string }[] = [];

  constructor(
    private bookingService: BookingService,
    private clientService: ClientService,
    private packageService: PackageService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadBookings();
    this.loadOptions();
  }

  private loadBookings(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.bookingService.getBookings().subscribe({
      next: (response) => {
        this.bookings = (response?.bookings ?? []).map((booking) => this.mapBooking(booking));
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading bookings:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private loadOptions(): void {
    this.clientService.getClients().subscribe({
      next: (response) => {
        this.clientOptions = response.clients.map((client) => ({
          id: client.id,
          label: `${client.name}${client.phone ? ` - ${client.phone}` : ''}`,
        }));
        this.cdr.detectChanges();
      },
      error: (error) => console.error('Error loading booking clients:', error),
    });

    this.packageService.getPackages().subscribe({
      next: (response) => {
        this.packageOptions = response.packages.map((pkg) => ({
          id: pkg.id,
          label: `${pkg.name} - Rs. ${Number(pkg.price).toLocaleString('en-IN')}`,
        }));
        this.cdr.detectChanges();
      },
      error: (error) => console.error('Error loading booking packages:', error),
    });
  }

  eventTypes = [
    'Wedding',
    'Reception',
    'Rice Ceremony',
    'Baby Shoot',
    'Birthday',
    'Pre-Wedding',
    'Photo Only',
    'Video Only',
    'Other'
  ];

  workflowStages: WorkflowStage[] = [
    'Booking Confirmed',
    'Planning',
    'Production',
    'Post Production',
    'QC',
    'Client Review',
    'Revision',
    'Album',
    'Delivery',
    'Completed'
  ];

  private mapBooking(booking: ApiBooking): Booking {
    const stageMap: Record<string, WorkflowStage> = {
      booking: 'Booking Confirmed',
      planning: 'Planning',
      production: 'Production',
      post_production: 'Post Production',
      qc: 'QC',
      client_review: 'Client Review',
      revision: 'Revision',
      album: 'Album',
      delivery: 'Delivery',
      completed: 'Completed',
    };

    return {
      id: booking.id,
      bookingId: booking.booking_number,
      clientName: booking.client_name,
      eventType: booking.event_type || '',
      eventDate: booking.event_date || booking.booking_date,
      venue: booking.venue || '',
      packageName: booking.package_name,
      workflowStage: stageMap[booking.current_workflow_stage] || 'Booking Confirmed',
      amount: Number(booking.total_amount),
    };
  }

  searchTerm = '';
  dateFrom = '';
  dateTo = '';
  selectedEvent = 'all';
  selectedStage: 'all' | WorkflowStage = 'all';

  clearDateFilter(): void {
    this.dateFrom = '';
    this.dateTo = '';
  }

  private parseDate(value: string): Date | null {
    if (!value) return null;
    // Handles YYYY-MM-DD from <input type="date">
    if (value.includes('-') && value.split('-')[0].length === 4) {
      const [yyyy, mm, dd] = value.split('-').map(Number);
      if (!yyyy || !mm || !dd) return null;
      return new Date(yyyy, mm - 1, dd);
    }
    // Handles DD-MM-YYYY fallback
    if (value.length === 10) {
      const [dd, mm, yyyy] = value.split('-').map(Number);
      if (!dd || !mm || !yyyy) return null;
      return new Date(yyyy, mm - 1, dd);
    }
    return null;
  }

  get filteredBookings(): Booking[] {
    const term = this.searchTerm.trim().toLowerCase();
    const fromDate = this.parseDate(this.dateFrom);
    const toDate = this.parseDate(this.dateTo);

    return this.bookings.filter((b) => {
      const matchesSearch =
        !term ||
        b.clientName.toLowerCase().includes(term) ||
        b.bookingId.toLowerCase().includes(term) ||
        b.venue.toLowerCase().includes(term) ||
        b.packageName.toLowerCase().includes(term);

      const eventDate = new Date(b.eventDate);
      const matchesFrom = !fromDate || eventDate >= fromDate;
      const matchesTo = !toDate || eventDate <= toDate;

      const matchesEvent =
        this.selectedEvent === 'all' ||
        (b.eventType && b.eventType.toLowerCase() === this.selectedEvent.toLowerCase()) ||
        b.packageName.toLowerCase().includes(this.selectedEvent.toLowerCase());

      const matchesStage = this.selectedStage === 'all' || b.workflowStage === this.selectedStage;

      return matchesSearch && matchesFrom && matchesTo && matchesEvent && matchesStage;
    });
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatAmount(n: number): string {
    return 'Rs. ' + n.toLocaleString('en-IN');
  }

  badgeClass(stage: WorkflowStage): string {
    switch (stage) {
      case 'Full Payment Received':
      case 'Completed':
      case 'Delivery':
        return 'badge--success';
      case 'Booking Confirmed':
      case 'Planning':
        return 'badge--info';
      case 'Production':
      case 'Post Production':
      case 'QC':
        return 'badge--warning';
      case 'Client Review':
      case 'Revision':
      case 'Album':
        return 'badge--secondary';
      default:
        return 'badge--info';
    }
  }



  onOpenImportModal(): void {
    this.showImportModal = true;
  }

  onImportFile(file: File): void {
    // TODO: Send file to bulk import endpoint or parse locally
    console.log('Selected file for bookings import:', file.name, file.size);
  }

  onExportExcel(): void {
    const list = this.filteredBookings;
    if (!list || list.length === 0) {
      alert('No bookings to export.');
      return;
    }

    const headers = [
      'Booking ID',
      'Client Name',
      'Event Date',
      'Venue',
      'Package',
      'Workflow Stage',
      'Total Amount (INR)'
    ];

    const escapeCsv = (val: string | number) => `"${(val !== undefined && val !== null ? String(val) : '').replace(/"/g, '""')}"`;

    const rows = list.map((b) => [
      escapeCsv(b.bookingId),
      escapeCsv(b.clientName),
      escapeCsv(b.eventDate ? b.eventDate.slice(0, 10) : ''),
      escapeCsv(b.venue),
      escapeCsv(b.packageName),
      escapeCsv(b.workflowStage),
      escapeCsv(b.amount)
    ].join(','));

    const csvContent = [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute('download', `bookings_export_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  onNewBooking(): void {
    this.showNewBookingModal = true;
  }
    onModalClose(): void {
    this.showNewBookingModal = false;
  }

  onBookingCreate(data: NewBookingData): void {
    if (data.clientMode !== 'existing' || data.packageMode !== 'existing') {
      alert('Please select an existing client and package to create a database booking.');
      return;
    }

    this.bookingService.createBooking({
      clientId: data.clientId,
      packageId: data.packageId,
      bookingDate: this.toIsoDate(data.bookingDate),
      eventDate: this.toIsoDate(data.mainEventDate),
      totalAmount: Number(data.totalAmount),
      venue: data.venue.trim(),
      eventType: data.eventType || 'Other',
      notes: [data.notes, data.remarks].filter(Boolean).join('\n'),
    }).subscribe({
      next: () => {
        this.showNewBookingModal = false;
        this.loadBookings();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error creating booking:', error);
        const message = error?.error?.error || error?.message || 'Failed to create booking';
        alert(message);
      },
    });
  }

  private toIsoDate(value: string): string {
    const [day, month, year] = value.split('-');
    return year && month && day ? `${year}-${month}-${day}` : value;
  }
}
