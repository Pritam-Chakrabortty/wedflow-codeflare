import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Booking, BookingEvent, CrewAssignment, StaffMember } from '../../../../../services/booking.service';
import { BookingService } from '../../../../../services/booking.service';

export interface NewAssignmentData {
  eventDayId: string;
  eventName: string;
  eventDate: string | null;
  venue: string | null;
  shift: 'full_day' | 'first_half' | 'second_half';
  role: string;
  staffId: string;
  staffName: string;
  reportTime: string;
  reportLocation: string;
}

@Component({
  selector: 'app-assign-crew-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './assign-crew-modal.html',
  styleUrl: './assign-crew-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignCrewModal implements OnInit, OnChanges {
  private bookingService = inject(BookingService);
  private cdr = inject(ChangeDetectorRef);
  @Input({ required: true }) booking!: Booking;
  @Input() initialEventDayId: string | null = null;
  @Input() initialRole: string | null = null;

  @Output() closeModal = new EventEmitter<void>();
  @Output() create = new EventEmitter<NewAssignmentData>();

  // Load staff from User Management API
  allStaff: StaffMember[] = [];
  isLoadingStaff = false;

  // Cached computed properties to avoid performance issues
  private cachedStaffForRole: (StaffMember & { alreadyAssigned: boolean })[] = [];
  private lastRole = '';
  private lastEventDayId = '';
  private lastAllStaffHash = '';

  roles = ['Photographer', 'Cinematographer', 'Videographer', 'Drone Operator', 'Photo Editor', 'Video Editor', 'admin', 'staff'];
  shifts: { value: 'full_day' | 'first_half' | 'second_half'; label: string }[] = [
    { value: 'full_day', label: 'Full Day' },
    { value: 'first_half', label: 'First Half (Morning)' },
    { value: 'second_half', label: 'Second Half (Evening)' },
  ];

  selectedEventDayId = '';
  shift: 'full_day' | 'first_half' | 'second_half' = 'full_day';
  role = '';
  staffId = '';
  reportTime = '';
  reportLocation = '';

  isSubmitting = false;

  isEventOpen = false;
  isShiftOpen = false;
  isRoleOpen = false;
  isStaffOpen = false;
  staffTouched = false;
  roleTouched = false;

  ngOnInit(): void {
    this.initData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('AssignCrewModal ngOnChanges:', changes);
    if (changes['initialEventDayId'] || changes['initialRole'] || changes['booking']) {
      this.initData();
    }
  }

  private initData(): void {
    this.selectedEventDayId = this.initialEventDayId ?? (this.booking?.event_days?.[0]?.id ?? '');
    this.role = this.initialRole ?? (this.roles[0] ?? '');
    this.reportLocation = this.selectedEventDay?.venue ?? '';
    console.log('Loading staff with role:', this.role);
    this.clearCache();
    this.loadStaff();
  }

  private clearCache(): void {
    this.cachedStaffForRole = [];
    this.lastRole = '';
    this.lastEventDayId = '';
    this.lastAllStaffHash = '';
  }

  loadStaff() {
    this.isLoadingStaff = true;
    this.cdr.markForCheck();
    this.bookingService.getStaff().subscribe({
      next: (response) => {
        console.log('Staff API response:', response);
        // Map user management users to staff format
        this.allStaff = response.users
          .filter(member => member.is_active === true)
          .map(member => ({
            id: member.id,
            name: member.staff_name || `${member.first_name} ${member.last_name}`.trim(),
            role: member.role || 'staff'
          }));
        console.log('Mapped staff:', this.allStaff);
        this.isLoadingStaff = false;
        this.clearCache();
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading staff:', error);
        if (error.status === 401) {
          console.error('Authentication error - user may need to log in again');
        }
        this.isLoadingStaff = false;
        // Set empty staff array on error to prevent UI issues
        this.allStaff = [];
        this.clearCache();
        this.cdr.markForCheck();
      }
    });
  }

  get selectedEventDay(): BookingEvent | undefined {
    return this.booking?.event_days?.find((e) => e.id === this.selectedEventDayId);
  }

  get shiftLabel(): string {
    return this.shifts.find((s) => s.value === this.shift)?.label ?? 'Select shift';
  }

  get availabilityLabel(): string {
    const d = this.selectedEventDay;
    if (!d) return '';
    const dateLabel = d.event_date ?? 'Date TBD';
    return `Showing availability for ${dateLabel} · ${this.shiftLabel}`;
  }

  get staffForRole(): (StaffMember & { alreadyAssigned: boolean })[] {
    // Use caching to avoid expensive recomputation on every change detection
    const currentRole = this.role.toLowerCase();
    const currentEventDayId = this.selectedEventDayId;
    const currentAllStaffHash = this.allStaff.map(s => `${s.id}-${s.role}`).join('|');

    // Check if cache is valid
    if (this.lastRole === currentRole && 
        this.lastEventDayId === currentEventDayId && 
        this.lastAllStaffHash === currentAllStaffHash) {
      return this.cachedStaffForRole;
    }

    // Update cache
    this.lastRole = currentRole;
    this.lastEventDayId = currentEventDayId;
    this.lastAllStaffHash = currentAllStaffHash;

    const day = this.selectedEventDay;
    const assignedNamesForDay = (this.booking?.crew_assignments ?? [])
      .filter((a: CrewAssignment) => a.event_name === day?.event_name)
      .map((a) => a.staff_name);

    // Case-insensitive and partial role matching to handle different role formats
    let filteredStaff = this.allStaff.filter((s) => s.role.toLowerCase() === currentRole);
    
    // If no exact match, try partial match
    if (filteredStaff.length === 0) {
      filteredStaff = this.allStaff.filter((s) => 
        s.role.toLowerCase().includes(currentRole) || currentRole.includes(s.role.toLowerCase())
      );
    }
    
    // Additional matching for common role variations
    if (filteredStaff.length === 0) {
      const roleMappings: { [key: string]: string[] } = {
        'photographer': ['photo', 'photographer', 'photo editor'],
        'cinematographer': ['cine', 'cinematographer', 'video', 'videographer'],
        'videographer': ['video', 'videographer', 'cine', 'cinematographer'],
        'drone operator': ['drone', 'uav'],
        'photo editor': ['editor', 'photo editor', 'post'],
        'video editor': ['editor', 'video editor', 'post'],
        'admin': ['admin', 'administrator'],
        'staff': ['staff', 'crew', 'team']
      };
      
      const keywords = roleMappings[currentRole] || [currentRole];
      filteredStaff = this.allStaff.filter((s) => 
        keywords.some(keyword => s.role.toLowerCase().includes(keyword))
      );
    }
    
    // If still no match, show all staff as fallback
    if (filteredStaff.length === 0) {
      console.log('No staff found for role:', this.role, 'Available roles:', [...new Set(this.allStaff.map(s => s.role))], 'Showing all staff as fallback');
      filteredStaff = this.allStaff;
    }
    
    this.cachedStaffForRole = filteredStaff
      .map((s) => ({ ...s, alreadyAssigned: assignedNamesForDay.includes(s.name) }));
    
    return this.cachedStaffForRole;
  }

  get availableStaff() {
    return this.staffForRole.filter((s) => !s.alreadyAssigned);
  }

  get unavailableStaff() {
    return this.staffForRole.filter((s) => s.alreadyAssigned);
  }

  get selectedStaff(): StaffMember | undefined {
    return this.allStaff.find((s) => s.id === this.staffId);
  }

  get staffInvalid(): boolean {
    return this.staffTouched && !this.staffId;
  }

  get roleInvalid(): boolean {
    return this.roleTouched && !this.role;
  }

  // Optimized button disabled state to prevent excessive change detection
  get isFormValid(): boolean {
    return !!(this.staffId && this.selectedEventDayId && this.role && this.reportTime);
  }

  toggleEventDropdown(): void {
    this.isEventOpen = !this.isEventOpen;
    this.isShiftOpen = false;
    this.isRoleOpen = false;
    this.isStaffOpen = false;
  }

  toggleShiftDropdown(): void {
    this.isShiftOpen = !this.isShiftOpen;
    this.isEventOpen = false;
    this.isRoleOpen = false;
    this.isStaffOpen = false;
  }

  toggleRoleDropdown(): void {
    this.isRoleOpen = !this.isRoleOpen;
    this.isEventOpen = false;
    this.isShiftOpen = false;
    this.isStaffOpen = false;
    if (!this.isRoleOpen) this.roleTouched = true;
  }

  toggleStaffDropdown(): void {
    this.isStaffOpen = !this.isStaffOpen;
    this.isEventOpen = false;
    this.isShiftOpen = false;
    this.isRoleOpen = false;
    if (!this.isStaffOpen) this.staffTouched = true;
  }

  closeAllDropdowns(): void {
    this.isEventOpen = false;
    this.isShiftOpen = false;
    this.isRoleOpen = false;
    this.isStaffOpen = false;
  }

  selectEventDay(id: string): void {
    this.selectedEventDayId = id;
    this.reportLocation = this.selectedEventDay?.venue ?? '';
    this.isEventOpen = false;
    this.clearCache();
  }

  selectShift(value: 'full_day' | 'first_half' | 'second_half'): void {
    this.shift = value;
    this.isShiftOpen = false;
  }

  selectRole(r: string): void {
    this.role = r;
    this.isRoleOpen = false;
    this.clearCache();
  }

  selectStaff(id: string): void {
    this.staffId = id;
    this.isStaffOpen = false;
    this.staffTouched = true;
  }

  onCancel(): void {
    if (this.isSubmitting) return;
    this.closeModal.emit();
  }

  onSubmit(form: NgForm): void {
    console.log('onSubmit called');
    console.log('Form valid:', form.valid);
    console.log('staffId:', this.staffId);
    console.log('selectedEventDayId:', this.selectedEventDayId);
    console.log('role:', this.role);
    console.log('reportTime:', this.reportTime);
    
    this.staffTouched = true;
    this.roleTouched = true;
    
    if (!this.staffId || !this.selectedEventDayId || !this.role) {
      console.log('Validation failed - missing required fields');
      alert('Please fill in all required fields (Event Day, Shift, Required Role, and Staff Member)');
      return;
    }

    if (!this.reportTime) {
      console.log('Validation failed - missing report time');
      alert('Please enter a report time');
      return;
    }

    console.log('Validation passed, submitting...');
    this.isSubmitting = true;

    const day = this.selectedEventDay;
    const staff = this.selectedStaff;
    
    console.log('Emitting assignment data:', {
      eventDayId: this.selectedEventDayId,
      eventName: day?.event_name ?? '',
      eventDate: day?.event_date ?? null,
      venue: day?.venue ?? null,
      shift: this.shift,
      role: this.role,
      staffId: this.staffId,
      staffName: staff?.name ?? '',
      reportTime: this.reportTime,
      reportLocation: this.reportLocation,
    });
    
    // Emit the assignment data to parent component
    this.create.emit({
      eventDayId: this.selectedEventDayId,
      eventName: day?.event_name ?? '',
      eventDate: day?.event_date ?? null,
      venue: day?.venue ?? null,
      shift: this.shift,
      role: this.role,
      staffId: this.staffId,
      staffName: staff?.name ?? '',
      reportTime: this.reportTime,
      reportLocation: this.reportLocation,
    });
    
    console.log('Assignment emitted successfully');
    
    // Reset form state after a short delay to allow the parent to process
    setTimeout(() => {
      this.isSubmitting = false;
    }, 500);
  }
}