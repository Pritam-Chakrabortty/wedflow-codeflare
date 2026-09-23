import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NewTicketModal, NewTicketData } from './new-ticket-modal/new-ticket-modal';
import { EditTicketModal, EditTicketData } from './edit-ticket-modal/edit-ticket-modal';
import { Toast } from '../../components/toast/toast';
import { ProductionService, ProductionTicket, CreateTicketRequest, UpdateTicketRequest, EscalationLevel } from '../../services/production.service';
import { HttpClient } from '@angular/common/http';
import { Auth } from '../../services/auth';
import { environment } from '../../../environments/environment';
import { forkJoin } from 'rxjs';


@Component({
  selector: 'app-production',
  standalone: true,
  imports: [CommonModule, FormsModule,NewTicketModal,EditTicketModal,Toast],
  templateUrl: './production.html',
  styleUrl: './production.scss',
})
export class Production implements OnInit {
  statusFilters: { key: string; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'submitted', label: 'Submitted' },
    { key: 'approved', label: 'Approved' },
    { key: 'revision_needed', label: 'Revision Needed' },
  ];
  activeStatus = 'all';

  priorities = ['low', 'normal', 'high', 'critical'];
  selectedPriority = '';
  isPriorityOpen = false;

  searchTerm = '';
  deadlineFrom = '';
  deadlineTo = '';

  isEscalationOpen = false;

  tickets: ProductionTicket[] = [];
  isLoading = false;
  error: string | null = null;
  
  // Data for modal dropdowns
  bookings: any[] = [];
  staff: any[] = [];

  // Escalation matrix levels - loaded from API
  escalationLevels: EscalationLevel[] = [];

  constructor(
    private productionService: ProductionService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTickets();
    this.loadDropdownData();
    this.loadEscalationMatrix();
  }

  loadDropdownData(): void {
    console.log('Loading dropdown data...');

    // Load bookings for the modal
    this.http.get(`${environment.apiUrl}/bookings`).subscribe({
      next: (response: any) => {
        console.log('Bookings loaded for modal:', response);
        this.bookings = response.bookings || [];
      },
      error: (error) => {
        console.error('Error loading bookings:', error);
      }
    });

    // Load staff for the modal
    this.http.get(`${environment.apiUrl}/staff-members`).subscribe({
      next: (response: any) => {
        console.log('Staff loaded for modal:', response);
        this.staff = response.users || response.staff || [];
      },
      error: (error) => {
        console.error('Error loading staff:', error);
      }
    });
  }

  loadEscalationMatrix(): void {
    this.productionService.getEscalationMatrix().subscribe({
      next: (response) => {
        // Use backend response directly
        this.escalationLevels = response.escalationMatrix || [];
        
        // Set default values if none exist
        if (this.escalationLevels.length === 0) {
          this.escalationLevels = [
            { id: '', level: 1, overdue_hours: 24, role: 'HR', priority: 'High' },
            { id: '', level: 2, overdue_hours: 48, role: 'Admin', priority: 'Critical' },
            { id: '', level: 3, overdue_hours: 72, role: 'Superadmin', priority: 'Critical' },
          ];
        }
      },
      error: (error) => {
        console.error('Error loading escalation matrix:', error);
        // Set default values on error
        this.escalationLevels = [
          { id: '', level: 1, overdue_hours: 24, role: 'HR', priority: 'High' },
          { id: '', level: 2, overdue_hours: 48, role: 'Admin', priority: 'Critical' },
          { id: '', level: 3, overdue_hours: 72, role: 'Superadmin', priority: 'Critical' },
        ];
      }
    });
  }

  loadTickets(): void {
    console.log('Loading tickets...');
    
    // Check if user is authenticated
    const auth = new Auth();
    if (!auth.isAuthenticated()) {
      this.error = 'Please log in to view production tickets';
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }
    
    this.isLoading = true;
    this.error = null;

    this.productionService.getTickets().subscribe({
      next: (response) => {
        console.log('Production tickets loaded:', response);
        this.tickets = response.tickets || [];
        this.isLoading = false;
        this.cdr.detectChanges();
        console.log('Loading state set to false, tickets count:', this.tickets.length);
      },
      error: (error) => {
        console.error('Error loading production tickets:', error);
        console.error('Error details:', error.message, error.status, error.error);
        this.error = 'Failed to load production tickets. Please try again.';
        this.isLoading = false;
        this.cdr.detectChanges();
        console.log('Error loading tickets, loading state set to false');
      },
    }).add(() => {
      // Ensure loading state is always cleared
      this.isLoading = false;
      this.cdr.detectChanges();
      console.log('Finally block: loading state forced to false');
    });
  }

  get counts(): Record<string, number> {
  return {
    all: this.tickets.length,
    pending: this.tickets.filter((t) => t.status === 'pending').length,
    in_progress: this.tickets.filter((t) => t.status === 'in_progress').length,
    submitted: this.tickets.filter((t) => t.status === 'submitted').length,
    approved: this.tickets.filter((t) => t.status === 'approved').length,
    revision_needed: this.tickets.filter((t) => t.status === 'revision_needed').length,
  };
}

  get filteredTickets(): ProductionTicket[] {
    return this.tickets.filter((t) => {
      if (this.activeStatus !== 'all' && t.status !== this.activeStatus) return false;
      if (this.selectedPriority && t.priority !== this.selectedPriority) return false;
      if (this.searchTerm) {
        const q = this.searchTerm.toLowerCase();
        const hay = `${t.title} ${t.client_name || ''} ${t.assignee_name || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  formatDeadline(value: string): string {
    return new Date(value).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
    });
  }

  statusLabel(status: string): string {
    return status.replace('_', ' ');
  }

  priorityLabel(p: string): string {
    return p.charAt(0).toUpperCase() + p.slice(1);
  }

  setStatusFilter(key: string): void {
    this.activeStatus = key;
  }

  togglePriorityDropdown(): void {
    this.isPriorityOpen = !this.isPriorityOpen;
  }

  closePriorityDropdown(): void {
    this.isPriorityOpen = false;
  }

  selectPriority(p: string): void {
    this.selectedPriority = p;
    this.isPriorityOpen = false;
  }

  toggleEscalation(): void {
    this.isEscalationOpen = !this.isEscalationOpen;
  }

  onNewTicket(): void {
    this.onOpenNewTicket();
  }

  showNewTicketModal = false;
  showEditTicketModal = false;
  selectedTicketForEdit: ProductionTicket | null = null;

  toastVisible = false;
  toastTitle = '';
  toastMsg = '';
  toastVariant: 'success' | 'error' = 'success';
  private toastTimeout: any;

  onOpenNewTicket(): void {
    this.showNewTicketModal = true;
  }

  onCloseNewTicket(): void {
    this.showNewTicketModal = false;
  }

  onEditTicket(t: ProductionTicket): void {
    this.selectedTicketForEdit = t;
    this.showEditTicketModal = true;
  }

  onCloseEditTicket(): void {
    this.showEditTicketModal = false;
    this.selectedTicketForEdit = null;
  }

  onUpdateTicket(data: EditTicketData): void {
    this.showEditTicketModal = false;
    this.selectedTicketForEdit = null;

    const updateRequest: UpdateTicketRequest = {
      assignee_id: data.assigneeId || undefined,
      status: data.status as any,
      deadline: data.deadline || undefined,
      completion_notes: data.hrNotes || undefined,
    };

    this.productionService.updateTicket(data.id, updateRequest).subscribe({
      next: (response) => {
        console.log('Ticket updated successfully:', response);
        this.showToast('Ticket updated', 'The production ticket has been updated successfully.');
        this.loadTickets(); // Reload tickets
      },
      error: (error) => {
        console.error('Error updating ticket:', error);
        this.showToast('Error', 'Failed to update ticket');
      }
    });
  }

  async uploadTicketFiles(ticketId: string, files: File[], type: 'source' | 'output'): Promise<void> {
    if (files.length === 0) return;

    const formData = new FormData();
    const fieldName = type === 'source' ? 'sourceFiles' : 'outputFiles';
    files.forEach(file => {
      formData.append(fieldName, file);
    });

    try {
      const response = await fetch(`${environment.apiUrl}/production-tickets/${ticketId}/${type}-files`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload files');
      }

      const result = await response.json();
      console.log(`${type} files uploaded successfully:`, result);
    } catch (error) {
      console.error(`Error uploading ${type} files:`, error);
      this.showToast('Error', `Failed to upload ${type} files`);
    }
  }

  onAcknowledge(t: ProductionTicket): void {
    this.productionService.acknowledgeEscalation(t.id).subscribe({
      next: (response) => {
        console.log('Escalation acknowledged:', response);
        this.showToast('Escalation acknowledged', 'The escalation has been acknowledged.');
        this.loadTickets(); // Reload tickets
      },
      error: (error) => {
        console.error('Error acknowledging escalation:', error);
        this.showToast('Error', 'Failed to acknowledge escalation');
      }
    });
  }

  onSaveMatrix(): void {
    if (this.escalationLevels.length === 0) return;

    const saveRequests = this.escalationLevels.map(level =>
      this.productionService.saveEscalationMatrix(level.level, level.overdue_hours, level.role, level.priority)
    );

    forkJoin(saveRequests).subscribe({
      next: () => {
        console.log('Escalation matrix saved successfully');
        this.showToast('Matrix saved', 'Escalation matrix has been updated.');
        this.isEscalationOpen = false;
        this.loadEscalationMatrix();
      },
      error: (error) => {
        console.error('Error saving escalation matrix:', error);
        this.showToast('Error', 'Failed to save escalation matrix');
      }
    });
  }

  onCreateTicket(data: NewTicketData): void {
    const createRequest: CreateTicketRequest = {
      booking_id: data.bookingId !== '__none__' ? data.bookingId : undefined,
      title: data.title || 'Untitled Ticket',
      description: data.description,
      category: data.type,
      priority: (data.priority || 'normal') as 'low' | 'normal' | 'high' | 'critical',
      assignee_id: data.assigneeId !== '__none__' ? data.assigneeId : undefined,
      deadline: data.deadline,
      material_note: data.materialNote
    };

    console.log('Creating ticket with request:', createRequest);

    this.productionService.createTicket(createRequest).subscribe({
      next: (response) => {
        console.log('Ticket created successfully:', response);
        this.showNewTicketModal = false;
        this.showToast('Ticket created', 'The production ticket has been created successfully.');
        this.loadTickets(); // Reload tickets
      },
      error: (error) => {
        console.error('Error creating ticket:', error);
        this.showToast('Error', 'Failed to create ticket');
      }
    });
  }

  typeLabelFor(type: string): string {
    const map: Record<string, string> = {
      photo_editing: 'Photo Editing',
      video_editing: 'Video Editing',
      album_design: 'Album Design',
      soft_copy_delivery: 'Soft Copy Delivery',
      hard_copy_delivery: 'Hard Copy / Album',
      other: 'Other',
    };
    return map[type] ?? type;
  }

  getPriorityForRole(role: string): string {
    const priorityMap: Record<string, string> = {
      'hr': 'High',
      'admin': 'Critical',
      'superadmin': 'Critical',
      'manager': 'High',
      'editor': 'Normal',
      'photographer': 'Normal',
      'videographer': 'Normal',
    };
    return priorityMap[role.toLowerCase()] || 'Normal';
  }

  private showToast(title: string, message: string, variant: 'success' | 'error' = 'success'): void {
    this.toastTitle = title;
    this.toastMsg = message;
    this.toastVariant = variant;
    this.toastVisible = true;
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastVisible = false;
    }, 2500);
  }

  onToastClosed(): void {
    this.toastVisible = false;
    clearTimeout(this.toastTimeout);
  }
}