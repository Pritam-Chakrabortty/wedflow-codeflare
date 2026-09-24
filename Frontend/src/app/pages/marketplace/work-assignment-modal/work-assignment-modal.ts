import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Auth } from '../../../services/auth';
import { Booking, BookingEvent } from '../../../services/booking.service';
import { environment } from '../../../../environments/environment';

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
  status: string;
}

export interface AssignmentData {
  workRequestId: string;
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

  private http = inject(HttpClient);
  private auth = inject(Auth);
  private apiUrl = environment.apiUrl;

  bookings: Booking[] = [];
  eventDays: BookingEvent[] = [];

  isLoadingBookings = false;
  isLoadingEventDays = false;
  isSubmitting = false;

  assignmentRoles = [
    'Photographer',
    'Cinematographer',
    'Videographer',
    'Drone Operator',
    'Photo Editor',
    'Video Editor',
    'Album Designer'
  ];

  assignmentData = {
    bookingId: '',
    eventDayId: '',
    reportTime: '',
    assignmentRole: ''
  };

  private getAuthHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  ngOnChanges() {
    if (this.isOpen && this.workRequest) {
      this.resetForm();
      this.prefillRole(this.workRequest.professionalRole);
      this.loadBookings();
    }
  }

  private prefillRole(role: string | null | undefined) {
    if (!role) return;
    if (!this.assignmentRoles.includes(role)) {
      this.assignmentRoles = [role, ...this.assignmentRoles];
    }
    this.assignmentData.assignmentRole = role;
  }

  resetForm() {
    this.assignmentData = {
      bookingId: '',
      eventDayId: '',
      reportTime: '',
      assignmentRole: ''
    };
    this.eventDays = [];
  }

  loadBookings() {
    this.isLoadingBookings = true;
    this.http.get<{ success: boolean; bookings: Booking[] }>(`${this.apiUrl}/bookings`, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (response) => {
        this.bookings = response.bookings ?? [];
        this.isLoadingBookings = false;
      },
      error: (error) => {
        console.error('Error loading bookings:', error);
        this.bookings = [];
        this.isLoadingBookings = false;
      }
    });
  }

  onBookingChange() {
    this.assignmentData.eventDayId = '';
    this.eventDays = [];

    const bookingId = this.assignmentData.bookingId;
    if (!bookingId) return;

    const selected = this.bookings.find(booking => booking.id === bookingId);
    if (selected?.event_days?.length) {
      this.eventDays = selected.event_days;
      return;
    }

    // The list response may omit event days, so fall back to the booking detail.
    this.isLoadingEventDays = true;
    this.http.get<{ success: boolean; booking: Booking }>(`${this.apiUrl}/bookings/${bookingId}`, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (response) => {
        this.eventDays = response.booking?.event_days ?? [];
        this.isLoadingEventDays = false;
      },
      error: (error) => {
        console.error('Error loading event days:', error);
        this.eventDays = [];
        this.isLoadingEventDays = false;
      }
    });
  }

  onCancel() {
    this.resetForm();
    this.isSubmitting = false;
    this.closeModal.emit();
  }

  onSubmit(form: NgForm) {
    if (form.invalid || !this.workRequest || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    const assignmentData: AssignmentData = {
      workRequestId: this.workRequest.id,
      bookingId: this.assignmentData.bookingId,
      eventDayId: this.assignmentData.eventDayId,
      reportTime: this.assignmentData.reportTime,
      assignmentRole: this.assignmentData.assignmentRole
    };

    this.assignmentConfirmed.emit(assignmentData);
    form.resetForm();
    this.onCancel();
  }
}
