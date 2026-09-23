import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Professional } from '../../../services/marketplace.service';

export interface AddProfileFormData {
  name: string;
  email: string;
  phone: string;
  profileType: 'individual' | 'team';
  specialization: string;
  skillsStr: string;
  experienceYears: number | null;
  city: string;
  state: string;
  rate: number | null;
  portfolioUrl: string;
  summary: string;
  verified: boolean;
}

@Component({
  selector: 'app-add-profile-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-profile-modal.html',
  styleUrl: './add-profile-modal.scss'
})
export class AddProfileModal {
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() profileAdded = new EventEmitter<Professional>();

  private http = inject(HttpClient);
  private apiUrl = 'https://wedflow-codeflare.onrender.com/api';

  isSubmitting = false;
  errorMessage: string | null = null;

  formData: AddProfileFormData = {
    name: '',
    email: '',
    phone: '',
    profileType: 'individual',
    specialization: 'Wedding Photographer',
    skillsStr: '',
    experienceYears: 3,
    city: '',
    state: '',
    rate: null,
    portfolioUrl: '',
    summary: '',
    verified: true
  };

  specializationOptions = [
    'Wedding Photographer',
    'Cinematographer',
    'Traditional Videographer',
    'Drone Operator',
    'Photo Editor',
    'Video Editor',
    'Album Designer',
    'Live Streaming Team',
    'Lighting Team',
    'Other'
  ];

  resetForm() {
    this.formData = {
      name: '',
      email: '',
      phone: '',
      profileType: 'individual',
      specialization: 'Wedding Photographer',
      skillsStr: '',
      experienceYears: 3,
      city: '',
      state: '',
      rate: null,
      portfolioUrl: '',
      summary: '',
      verified: true
    };
    this.errorMessage = null;
  }

  onCancel() {
    this.resetForm();
    this.closeModal.emit();
  }

  onSubmit(form: NgForm) {
    if (form.invalid) return;

    this.isSubmitting = true;
    this.errorMessage = null;

    const rawSkills = this.formData.skillsStr
      ? this.formData.skillsStr.split(',').map(s => s.trim()).filter(Boolean)
      : [this.formData.specialization];

    if (!rawSkills.includes(this.formData.specialization)) {
      rawSkills.unshift(this.formData.specialization);
    }

    const payload = {
      name: this.formData.name,
      email: this.formData.email,
      phone: this.formData.phone,
      profile_type: this.formData.profileType,
      specialization: this.formData.specialization,
      skills: rawSkills,
      experience_years: this.formData.experienceYears !== null ? Number(this.formData.experienceYears) : 0,
      city: this.formData.city,
      state: this.formData.state,
      rate: this.formData.rate !== null ? Number(this.formData.rate) : null,
      portfolio_url: this.formData.portfolioUrl,
      summary: this.formData.summary,
      verified: this.formData.verified
    };

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.post<{ success: boolean; professional?: Professional; freelancer?: any }>(`${this.apiUrl}/freelancers`, payload, { headers })
      .subscribe({
        next: (res) => {
          this.isSubmitting = false;
          if (res.success) {
            const f = res.freelancer || res.professional;
            const newProfessional: Professional = res.professional || {
              id: f.id,
              initials: f.name ? f.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'FP',
              name: f.name,
              verified: f.verified ?? false,
              type: f.profile_type === 'team' ? 'Team' : 'Individual',
              experienceYears: f.experience_years || 0,
              city: f.city || '',
              state: f.state || '',
              skills: f.skills || [f.specialization],
              summary: f.summary || f.notes || '',
              availableRate: f.rate || 0,
              email: f.email || '',
              phone: f.phone || ''
            };

            this.profileAdded.emit(newProfessional);
            this.onCancel();
          }
        },
        error: (err) => {
          console.error('Error adding freelancer profile:', err);
          this.isSubmitting = false;
          this.errorMessage = err.error?.error || err.error?.message || 'Failed to create profile. Please try again.';
        }
      });
  }
}

