import { Component, EventEmitter, Input, Output, signal, inject, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CheckoutPayload } from '../../../services/equipment.service';
import { EquipmentService } from '../../../services/equipment.service';

interface StaffOption {
  id: string;
  name: string;
}

interface BookingEventOption {
  id: string;
  name: string;
  date: string;
  venue: string;
}

@Component({
  selector: 'app-equipment-checkout-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './equipment-checkout-modal.html',
  styleUrl: './equipment-checkout-modal.scss'
})
export class EquipmentCheckoutModal implements OnChanges {
  private equipmentService = inject(EquipmentService);
  @Input() isOpen = false;
  @Input() equipmentId: string | null = null;
  @Input() equipmentName = '';
  @Input() bookingEvents: BookingEventOption[] = [];
  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<CheckoutPayload>();

  staffOptions = signal<StaffOption[]>([]);
  isLoadingStaff = signal(false);

  selectedStaffId = signal<string | null>(null);
  selectedBookingEventId = signal<string | null>(null);
  expectedReturnDate = signal('');
  notes = signal('');
  isStaffMenuOpen = signal(false);
  isBookingEventMenuOpen = signal(false);
  showValidationError = signal(false);

  // Load staff when modal opens
  ngOnChanges() {
    if (this.isOpen) {
      this.loadStaff();
    }
  }

  loadStaff() {
    this.isLoadingStaff.set(true);
    this.equipmentService.getStaff().subscribe({
      next: (response) => {
        const rawList = response.users || response.staff || [];
        const staff = rawList
          .filter(user => user.role !== 'client') // Filter out clients, only show staff
          .map(user => {
            // Build name without showing null for missing last name
            let name = user.staff_name || user.name || user.first_name || '';
            if (user.last_name && !name.includes(user.last_name)) {
              name += ` ${user.last_name}`;
            }
            name = name.trim();

            // Add role/position in parentheses
            const role = user.role || 'staff';
            const displayName = name ? `${name} (${role})` : role;

            return {
              id: user.id,
              name: displayName
            };
          });
        this.staffOptions.set(staff);
        this.isLoadingStaff.set(false);
      },
      error: (error) => {
        console.error('Error loading staff:', error);
        this.isLoadingStaff.set(false);
      }
    });
  }

  toggleStaffMenu() {
    this.isStaffMenuOpen.set(!this.isStaffMenuOpen());
    this.isBookingEventMenuOpen.set(false);
  }

  selectStaff(id: string) {
    this.selectedStaffId.set(id);
    this.isStaffMenuOpen.set(false);
    this.showValidationError.set(false);
  }

  toggleBookingEventMenu() {
    this.isBookingEventMenuOpen.set(!this.isBookingEventMenuOpen());
    this.isStaffMenuOpen.set(false);
  }

  selectBookingEvent(id: string) {
    this.selectedBookingEventId.set(id);
    this.isBookingEventMenuOpen.set(false);
  }

  get staffLabel(): string {
    if (this.isLoadingStaff()) return 'Loading staff...';
    return this.staffOptions().find(s => s.id === this.selectedStaffId())?.name ?? 'Select staff...';
  }

  get bookingEventLabel(): string {
    const event = this.bookingEvents.find(e => e.id === this.selectedBookingEventId());
    if (!event) return 'Select event (optional)';
    return `${event.name} - ${event.date}`;
  }

  onOverlayClick() {
    this.close();
  }

  close() {
    this.resetForm();
    this.closed.emit();
  }

  submit() {
    const staffId = this.selectedStaffId();
    if (!staffId) {
      this.showValidationError.set(true);
      return;
    }

    const staff = this.staffOptions().find(s => s.id === staffId);

    this.submitted.emit({
      equipmentId: this.equipmentId ?? '',
      staffId,
      staffName: staff?.name ?? '',
      bookingEventId: this.selectedBookingEventId() || undefined,
      expectedReturnDate: this.expectedReturnDate() || undefined,
      notes: this.notes().trim() || undefined
    });

    this.resetForm();
  }

  private resetForm() {
    this.selectedStaffId.set(null);
    this.selectedBookingEventId.set(null);
    this.expectedReturnDate.set('');
    this.notes.set('');
    this.isStaffMenuOpen.set(false);
    this.isBookingEventMenuOpen.set(false);
    this.showValidationError.set(false);
  }
}