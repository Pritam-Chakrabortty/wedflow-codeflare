import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';

export interface WorkRequest {
  id: string;
  project: string;
  professionalRole: string;
  professionalName: string;
  professionalEmail: string;
  professionalPhone: string;
  eventDate: string;
  venue: string;
  budget: number;
  status: 'Accepted' | 'Pending' | 'Declined' | 'Completed';
}

export interface Booking {
  id: string;
  booking_number: string;
  client_name: string;
  package_name: string;
  booking_date: string;
  event_date: string;
  venue: string;
  status?: string;
  total_amount?: number;
}

export interface EventDay {
  id: string;
  event_name: string;
  event_date: string;
  venue: string;
}

export interface AssignmentData {
  bookingId: string;
  eventDayId: string;
  reportTime: string;
  assignmentRole: string;
}

@Component({
  selector: 'app-work-assignment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './work-assignment-modal.html',
  styleUrl: './work-assignment-modal.scss'
})
export class WorkAssignmentModal {
  @Input() isOpen = false;
  @Input() workRequest: WorkRequest | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() assignmentConfirmed = new EventEmitter<AssignmentData>();

  private apiUrl = 'https://wedflow-codeflare.onrender.com/api';

  bookings: Booking[] = [];
  eventDays: EventDay[] = [];
  isLoadingBookings = false;
  isLoadingEventDays = false;
  isSubmitting = false;

  assignmentData: AssignmentData = {
    bookingId: '',
    eventDayId: '',
    reportTime: '',
    assignmentRole: ''
  };

  assignmentRoles = [
    'Wedding Photographer',
    'Cinematographer',
    'Videographer',
    'Drone Operator',
    'Photo Editor',
    'Video Editor',
    'Album Designer',
    'Lighting Technician',
    'Sound Engineer',
    'Other'
  ];

  private http = inject(HttpClient);

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  ngOnChanges() {
    console.log('ngOnChanges called:', { isOpen: this.isOpen, workRequest: this.workRequest });
    if (this.isOpen && this.workRequest) {
      console.log('Loading bookings for work request:', this.workRequest);
      // Store workRequest locally to avoid null issues in setTimeout
      const currentWorkRequest = this.workRequest;
      // Small delay to ensure modal is fully rendered before loading
      setTimeout(() => {
        this.loadBookings();
        this.loadFreelancerDetails(); // Load freelancer email/phone
        this.assignmentData.assignmentRole = currentWorkRequest.professionalRole;
      }, 100);
    }
  }

  loadBookings() {
    this.isLoadingBookings = true;
    console.log('Loading bookings...');
    this.http.get<{ success: boolean; bookings: Booking[] }>(`${this.apiUrl}/bookings`, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (response) => {
        console.log('Bookings response:', response);
        this.bookings = response.bookings;
        this.isLoadingBookings = false;
        console.log('Bookings loaded:', this.bookings.length);
      },
      error: (error) => {
        console.error('Error loading bookings:', error);
        this.isLoadingBookings = false;
      }
    });
  }

  // Load freelancer details to get the actual email/phone
  loadFreelancerDetails() {
    if (!this.workRequest?.professionalName) return;

    this.http.get<{ success: boolean; professionals: any[] }>(`${this.apiUrl}/freelancers`, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (response) => {
        const freelancer = response.professionals.find(p => p.name === this.workRequest?.professionalName);
        if (freelancer && freelancer.email && this.workRequest) {
          // Update work request with actual freelancer email by creating a new object
          const updatedWorkRequest: WorkRequest = {
            id: this.workRequest.id ?? '',
            project: this.workRequest.project ?? '',
            professionalRole: this.workRequest.professionalRole ?? '',
            professionalName: this.workRequest.professionalName ?? '',
            professionalEmail: freelancer.email,
            professionalPhone: freelancer.phone ?? this.workRequest.professionalPhone ?? '',
            eventDate: this.workRequest.eventDate ?? '',
            venue: this.workRequest.venue ?? '',
            budget: this.workRequest.budget ?? 0,
            status: this.workRequest.status ?? 'Pending'
          };
          this.workRequest = updatedWorkRequest;
          console.log('Updated work request with freelancer email:', freelancer.email);
        }
      },
      error: (error) => {
        console.error('Error loading freelancer details:', error);
      }
    });
  }

  onBookingChange() {
    if (this.assignmentData.bookingId) {
      this.loadEventDays(this.assignmentData.bookingId);
    } else {
      this.eventDays = [];
      this.assignmentData.eventDayId = '';
    }
  }

  loadEventDays(bookingId: string) {
    this.isLoadingEventDays = true;
    this.http.get<{ success: boolean; booking: any }>(`${this.apiUrl}/bookings/${bookingId}`, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (response) => {
        console.log('Booking response:', response);
        const eventDays = response.booking.event_days || [];
        this.eventDays = eventDays.map((event: any) => ({
          id: event.id, // Use the actual event ID from the database
          event_name: event.event_name,
          event_date: event.event_date,
          venue: event.venue
        })).filter((event: EventDay) => event.id); // Only include events with valid IDs
        console.log('Mapped event days:', this.eventDays);
        this.isLoadingEventDays = false;
      },
      error: (error) => {
        console.error('Error loading event days:', error);
        this.isLoadingEventDays = false;
      }
    });
  }

  onCancel() {
    this.resetForm();
    this.closeModal.emit();
  }

  onSubmit(form: NgForm) {
    if (form.invalid) return;

    // Validate required fields
    if (!this.assignmentData.bookingId) {
      alert('Please select a booking');
      return;
    }

    if (!this.assignmentData.eventDayId) {
      alert('Please select an event day');
      return;
    }

    if (!this.assignmentData.reportTime) {
      alert('Please select a report time');
      return;
    }

    this.isSubmitting = true;

    const staffData = {
      name: this.workRequest?.professionalName,
      email: this.workRequest?.professionalEmail || 'no-email@example.com',
      phone: this.workRequest?.professionalPhone,
      role: 'freelancer',
      availability: 'available',
      status: 'active',
      notes: `Added from marketplace: ${this.workRequest?.project}`
    };

    this.http.post(`${this.apiUrl}/staff`, staffData, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (staffResponse: any) => {
        const staffId = staffResponse.member?.id || staffResponse.staff?.id;
        if (staffId) {
          this.createCrewAssignment(staffId);
        } else {
          this.fallbackSearchAndAssign(staffData);
        }
      },
      error: (staffError) => {
        console.warn('Staff creation returned error or conflict, attempting fallback search...', staffError);
        this.fallbackSearchAndAssign(staffData);
      }
    });
  }

  private fallbackSearchAndAssign(staffData: any) {
    this.http.get<{ success: boolean; staff?: any[]; users?: any[] }>(`${this.apiUrl}/staff`, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (response) => {
        const list = response.staff || response.users || [];
        const found = list.find((s: any) => 
          (s.email && staffData.email && s.email.toLowerCase() === staffData.email.toLowerCase()) ||
          (s.staff_name && s.staff_name.toLowerCase() === staffData.name?.toLowerCase()) ||
          (s.name && s.name.toLowerCase() === staffData.name?.toLowerCase())
        );
        if (found?.id) {
          this.createCrewAssignment(found.id);
        } else {
          this.isSubmitting = false;
          alert('Failed to create or locate staff member. Please check staff management.');
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        alert('Failed to search staff members. Please try again.');
      }
    });
  }

  private createCrewAssignment(staffId: string) {
    const crewAssignmentData = {
      booking_event_id: this.assignmentData.eventDayId,
      staff_id: staffId,
      assigned_role: this.assignmentData.assignmentRole,
      assignment_date: new Date().toISOString().slice(0, 10),
      start_time: this.assignmentData.reportTime,
      status: 'assigned',
      notes: `Assigned from marketplace request: ${this.workRequest?.project}`
    };

    this.http.post(`${this.apiUrl}/crew-assignments`, crewAssignmentData, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (assignmentResponse) => {
        this.isSubmitting = false;
        this.assignmentConfirmed.emit(this.assignmentData);
        this.resetForm();
        this.closeModal.emit();
        alert('Assignment confirmed successfully! Professional has been notified.');
      },
      error: (assignmentError) => {
        this.isSubmitting = false;
        console.error('Error creating assignment:', assignmentError);
        alert(`Failed to create assignment: ${assignmentError.error?.message || assignmentError.message || 'Unknown error'}. Please try again.`);
      }
    });
  }

  private resetForm() {
    this.assignmentData = {
      bookingId: '',
      eventDayId: '',
      reportTime: '',
      assignmentRole: this.workRequest?.professionalRole || ''
    };
    this.eventDays = [];
  }

  get selectedBooking(): Booking | undefined {
    return this.bookings.find(b => b.id === this.assignmentData.bookingId);
  }

  get selectedEventDay(): EventDay | undefined {
    return this.eventDays.find(e => e.id === this.assignmentData.eventDayId);
  }
}
