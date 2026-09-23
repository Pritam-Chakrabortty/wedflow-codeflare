import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Professional, WorkRequest } from '../../../services/marketplace.service';

export interface WorkBriefFormData {
  projectTitle: string;
  recipientEmail: string;
  requiredService: string;
  eventDate: string;
  location: string;
  budget: number | null;
  contactPhone: string;
  projectBrief: string;
}

@Component({
  selector: 'app-work-brief-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './work-brief-modal.html',
  styleUrl: './work-brief-modal.scss'
})
export class WorkBriefModal {
  @Input() isOpen = false;
  @Input() professional: Professional | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() briefSubmitted = new EventEmitter<WorkRequest>();

  private http = inject(HttpClient);
  private apiUrl = 'https://wedflow-codeflare.onrender.com/api';

  isSubmitting = false;
  errorMessage: string | null = null;

  formData: WorkBriefFormData = {
    projectTitle: '',
    recipientEmail: '',
    requiredService: '',
    eventDate: '',
    location: '',
    budget: null,
    contactPhone: '',
    projectBrief: ''
  };

  serviceOptions = [
    'Wedding Photographer',
    'Cinematographer',
    'Traditional Videographer',
    'Photo Editor',
    'Video Editor',
    'Album Designer',
    'Live Streaming Team',
    'Lighting Team',
    'Other'
  ];

  ngOnChanges() {
    if (this.isOpen && this.professional) {
      this.resetForm();
      this.formData.recipientEmail = this.professional.email || '';
      this.formData.requiredService = this.professional.skills?.[0] || 'Wedding Photographer';
      this.formData.location = this.professional.city ? `${this.professional.city}, ${this.professional.state}` : '';
      this.formData.budget = this.professional.availableRate || null;
      this.formData.contactPhone = this.professional.phone || '';
    }
  }

  resetForm() {
    this.formData = {
      projectTitle: '',
      recipientEmail: '',
      requiredService: '',
      eventDate: '',
      location: '',
      budget: null,
      contactPhone: '',
      projectBrief: ''
    };
    this.errorMessage = null;
  }

  onCancel() {
    this.resetForm();
    this.closeModal.emit();
  }

  onSubmit(form: NgForm) {
    if (form.invalid || !this.professional) return;

    this.isSubmitting = true;
    this.errorMessage = null;

    const payload = {
      project_name: this.formData.projectTitle,
      professional_role: this.formData.requiredService,
      professional_name: this.professional.name,
      professional_email: this.formData.recipientEmail || this.professional.email,
      professional_phone: this.formData.contactPhone || this.professional.phone,
      event_date: this.formData.eventDate || null,
      venue: this.formData.location || null,
      budget: this.formData.budget !== null ? Number(this.formData.budget) : null,
      status: 'pending',
      notes: this.formData.projectBrief
    };

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.post<{ success: boolean; workRequest: WorkRequest }>(`${this.apiUrl}/marketplace-work-requests`, payload, { headers })
      .subscribe({
        next: (res) => {
          this.isSubmitting = false;
          if (res.success && res.workRequest) {
            this.briefSubmitted.emit(res.workRequest);
          }
          this.onCancel();
        },
        error: (err) => {
          console.error('Error sending work brief:', err);
          this.isSubmitting = false;
          this.errorMessage = err.error?.error || err.error?.message || 'Failed to send work brief. Please try again.';
        }
      });
  }
}

