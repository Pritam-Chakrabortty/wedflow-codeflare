import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClientModal, NewClientData, EditClientData } from './client-modal/client-modal';
import { ImportExcelModal } from '../../components/import-excel-modal/import-excel-modal';
import { ClientService, Client } from '../../services/client.service';
import { BookingService, Booking as ApiBooking } from '../../services/booking.service';
import { Auth } from '../../services/auth';

interface DisplayClient {
  id: string;
  name: string;
  customerId: string;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
  bookingDate: string;
}

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule, ClientModal, ImportExcelModal],
  templateUrl: './clients.html',
  styleUrl: './clients.scss',
})
export class Clients implements OnInit, OnDestroy {
  showNewClientModal = false;
  showImportModal = false;
  editClientData: EditClientData | null = null;
  clients: DisplayClient[] = [];
  loading = false;

  clientImportColumns = [
    'Client Name',
    'Phone',
    'Email',
    'Address'
  ];

  clientSampleRows = [
    ['Sourav Ganguly', '+91 9876543210', 'sourav@example.com', 'Behala, Kolkata'],
    ['Ananya Chatterjee', '+91 9123456789', 'ananya@example.com', 'Salt Lake, Kolkata']
  ];
  error: string | null = null;

  searchTerm = '';
  dateFrom = '';
  dateTo = '';

  private readonly handleWindowFocus = () => {
    this.loadClients();
  };

  constructor(
    private clientService: ClientService,
    private bookingService: BookingService,
    private auth: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadClients();
    window.addEventListener('focus', this.handleWindowFocus);
  }

  ngOnDestroy(): void {
    window.removeEventListener('focus', this.handleWindowFocus);
  }

  loadClients(): void {
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges(); // Force immediate UI update

    this.clientService.getClients().subscribe({
      next: (response) => {
        const rawClients = response?.clients ?? [];

        // Also fetch bookings to correlate booking date for each client
        this.bookingService.getBookings().subscribe({
          next: (bookingRes) => {
            const bookingsList: ApiBooking[] = bookingRes?.bookings ?? [];
            const bookingMap = new Map<string, string>(); // clientId -> formatted bookingDate

            bookingsList.forEach((b) => {
              if (b.client_id) {
                const dateVal = b.booking_date || b.event_date;
                if (dateVal && !bookingMap.has(b.client_id)) {
                  bookingMap.set(b.client_id, this.formatDate(dateVal));
                }
              }
            });

            this.clients = rawClients.map((client) => {
              const mapped = this.mapToDisplayClient(client);
              mapped.bookingDate = bookingMap.get(client.id) || (client.created_at ? this.formatDate(client.created_at) : '-');
              return mapped;
            });
            this.loading = false;
            this.cdr.detectChanges();
          },
          error: () => {
            // Fallback if bookings fetch fails
            this.clients = rawClients.map((client) => {
              const mapped = this.mapToDisplayClient(client);
              mapped.bookingDate = client.created_at ? this.formatDate(client.created_at) : '-';
              return mapped;
            });
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error('Error loading clients:', err);

        if (err?.status === 401 || err?.status === 403) {
          this.auth.clearSession();
          this.router.navigate(['/login']);
          return;
        }

        this.error = 'Failed to load clients';
        this.loading = false;
        this.cdr.detectChanges(); // Force UI update
      },
    });
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr.slice(0, 10);
      const day = String(d.getDate()).padStart(2, '0');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[d.getMonth()];
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return dateStr.slice(0, 10);
    }
  }

  private mapToDisplayClient(client: Client): DisplayClient {
    return {
      id: client.id,
      name: client.name,
      customerId: `DRVSTU-CUS-${client.id.slice(0, 8).toUpperCase()}`,
      phone: client.phone || '',
      email: client.email || '',
      address: client.address || '',
      createdAt: client.created_at ? client.created_at.slice(0, 10) : '',
      bookingDate: '-',
    };
  }

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

  get filteredClients(): DisplayClient[] {
    const term = this.searchTerm.trim().toLowerCase();
    const fromDate = this.parseDate(this.dateFrom);
    const toDate = this.parseDate(this.dateTo);

    return this.clients.filter((c) => {
      const matchesSearch =
        !term ||
        c.name.toLowerCase().includes(term) ||
        c.phone.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.customerId.toLowerCase().includes(term);

      const createdDate = new Date(c.createdAt);
      const matchesFrom = !fromDate || createdDate >= fromDate;
      const matchesTo = !toDate || createdDate <= toDate;

      return matchesSearch && matchesFrom && matchesTo;
    });
  }



  onOpenImportModal(): void {
    this.showImportModal = true;
  }

  onImportFile(file: File): void {
    // TODO: Send file to bulk import endpoint or parse locally
    console.log('Selected file for clients import:', file.name, file.size);
  }

  onExportExcel(): void {
    const list = this.filteredClients;
    if (!list || list.length === 0) {
      alert('No clients to export.');
      return;
    }

    const headers = [
      'Customer ID',
      'Client Name',
      'Booking Date',
      'Phone',
      'Email',
      'Address',
      'Created Date'
    ];

    const escapeCsv = (val: string | number) => `"${(val !== undefined && val !== null ? String(val) : '').replace(/"/g, '""')}"`;

    const rows = list.map((c) => [
      escapeCsv(c.customerId),
      escapeCsv(c.name),
      escapeCsv(c.bookingDate),
      escapeCsv(c.phone),
      escapeCsv(c.email),
      escapeCsv(c.address),
      escapeCsv(c.createdAt)
    ].join(','));

    const csvContent = [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute('download', `clients_export_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  onNewClient(): void {
    this.editClientData = null;
    this.showNewClientModal = true;
  }

  onEdit(client: DisplayClient): void {
    this.editClientData = {
      id: client.id,
      name: client.name,
      phone: client.phone,
      email: client.email,
      address: client.address,
      notes: ''
    };
    this.showNewClientModal = true;
  }

  onDelete(client: DisplayClient): void {
    if (confirm(`Are you sure you want to delete ${client.name}?`)) {
      this.clientService.deleteClient(client.id).subscribe({
        next: () => {
          this.clients = this.clients.filter((c) => c.id !== client.id);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error deleting client:', err);
          alert('Failed to delete client');
        },
      });
    }
  }

  onModalClose(): void {
    this.showNewClientModal = false;
    this.editClientData = null;
    this.loadClients();
  }

  onClientCreate(data: NewClientData): void {
    // Check for duplicate phone number
    if (data.phone && data.phone.trim()) {
      const existingPhone = this.clients.find(c => c.phone === data.phone.trim());
      if (existingPhone) {
        alert('A client with this phone number already exists');
        return;
      }
    }

    // Check for duplicate email
    if (data.email && data.email.trim()) {
      const existingEmail = this.clients.find(c => c.email === data.email.trim());
      if (existingEmail) {
        alert('A client with this email already exists');
        return;
      }
    }

    this.clientService.createClient({
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      status: 'active'
    }).subscribe({
      next: (response) => {
        this.clients = [...this.clients, this.mapToDisplayClient(response.client)];
        this.showNewClientModal = false;
        this.editClientData = null;
        this.cdr.detectChanges();
        this.loadClients();
      },
      error: (err) => {
        console.error('Error creating client:', err);
        if (err.status === 401 || err.status === 403) {
          this.auth.clearSession();
          this.router.navigate(['/login']);
          return;
        }

        if (err.status === 409) {
          alert(err.error?.error || 'A client with this phone number or email already exists');
        } else {
          alert('Failed to create client');
        }
      },
    });
  }

  onClientUpdate(data: EditClientData): void {
    // Check for duplicate phone number (excluding current client)
    if (data.phone && data.phone.trim()) {
      const existingPhone = this.clients.find(c => c.phone === data.phone.trim() && c.id !== data.id);
      if (existingPhone) {
        alert('A client with this phone number already exists');
        return;
      }
    }

    // Check for duplicate email (excluding current client)
    if (data.email && data.email.trim()) {
      const existingEmail = this.clients.find(c => c.email === data.email.trim() && c.id !== data.id);
      if (existingEmail) {
        alert('A client with this email already exists');
        return;
      }
    }

    this.clientService.updateClient(data.id, {
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      status: 'active'
    }).subscribe({
      next: (response) => {
        this.clients = this.clients.map(c => 
          c.id === data.id ? this.mapToDisplayClient(response.client) : c
        );
        this.showNewClientModal = false;
        this.editClientData = null;
        this.cdr.detectChanges();
        this.loadClients();
      },
      error: (err) => {
        console.error('Error updating client:', err);
        if (err.status === 401 || err.status === 403) {
          this.auth.clearSession();
          this.router.navigate(['/login']);
          return;
        }

        if (err.status === 409) {
          alert(err.error?.error || 'A client with this phone number or email already exists');
        } else {
          alert('Failed to update client');
        }
      },
    });
  }
}