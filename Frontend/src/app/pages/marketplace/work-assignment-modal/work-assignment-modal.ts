import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import { Auth } from '../../../services/auth';

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
  staffId: string;
  assignedRole: string;
  notes?: string;
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
  @Output() close = new EventEmitter<void>();
  @Output() assignmentConfirmed = new EventEmitter<AssignmentData>();

  private http = inject(HttpClient);

  private getAuthHeaders(): HttpHeaders {
    const auth = inject(Auth);
    const token = auth.getToken();
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
      }, 100);
    }
  }

  closeModal() {
    this.close.emit();
  }

  formData = {
    staffId: '',
    assignedRole: '',
    notes: ''
  };

  bookings: Booking[] = [];
  isLoadingBookings = false;

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

  onSubmit(form: NgForm) {
    if (form.invalid || !this.workRequest) {
      return;
    }

    const assignmentData: AssignmentData = {
      workRequestId: this.workRequest.id,
      staffId: this.formData.staffId,
      assignedRole: this.formData.assignedRole,
      notes: this.formData.notes
    };

    this.assignmentConfirmed.emit(assignmentData);
    this.closeModal();
    form.resetForm();
  }
}
