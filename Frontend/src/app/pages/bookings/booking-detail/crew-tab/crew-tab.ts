import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Booking, BookingEvent, CrewPlanDay, CrewAssignment } from '../../../../services/booking.service';
import { EventDayModal, NewEventDayData } from './event-day-modal/event-day-modal';
import { AssignCrewModal, NewAssignmentData } from './assign-crew-modal/assign-crew-modal';

@Component({
  selector: 'app-crew-tab',
  standalone: true,
  imports: [CommonModule, EventDayModal, AssignCrewModal],
  templateUrl: './crew-tab.html',
  styleUrl: './crew-tab.scss',
})
export class CrewTab {
  @Input({ required: true }) booking!: Booking;

  @Output() addDay = new EventEmitter<NewEventDayData>();
  @Output() removeDay = new EventEmitter<BookingEvent>();
  @Output() assignCrewMember = new EventEmitter<NewAssignmentData>();
  @Output() verifyFiles = new EventEmitter<CrewAssignment>();
  @Output() removeAssignment = new EventEmitter<CrewAssignment>();

  showAddDayModal = false;
  confirmDeleteDayTarget: BookingEvent | null = null;

  showAssignModal = false;
  assignModalEventDayId: string | null = null;
  assignModalRole: string | null = null;

  formatDate(value: string | null): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  trackByDayId(index: number, item: BookingEvent): string {
    return item.id;
  }

  trackByAssignmentId(index: number, item: CrewAssignment): string {
    return item.id;
  }

  /**
   * Dynamically constructs the Crew Plan according to the booking's actual event_days.
   * If event_days are defined, every event day gets a crew plan card matching package roles or default roles.
   */
  get displayCrewPlan(): CrewPlanDay[] {
    if (!this.booking) return [];

    const eventDays = this.booking.event_days || [];
    const packagePlan = this.booking.package_crew_plan || [];

    if (eventDays.length === 0) {
      return packagePlan;
    }

    return eventDays.map((eventDay, index) => {
      // 1. Try to find matching package plan day by event_name === event_type
      let matchedPlan = packagePlan.find(
        (p) => p.event_type?.trim().toLowerCase() === eventDay.event_name?.trim().toLowerCase()
      );

      // 2. If not matched by name, try matching by index
      if (!matchedPlan && packagePlan[index]) {
        matchedPlan = packagePlan[index];
      }

      // 3. Construct CrewPlanDay for this specific event day
      return {
        day_number: index + 1,
        event_type: eventDay.event_name,
        roles: matchedPlan && matchedPlan.roles && matchedPlan.roles.length > 0 ? matchedPlan.roles : [
          { role: 'Photographer', quantity: 2 },
          { role: 'Cinematographer', quantity: 1 }
        ]
      };
    });
  }

  eventForDay(day: CrewPlanDay): BookingEvent | undefined {
    return this.booking?.event_days?.find(
      (e) => e.event_name?.trim().toLowerCase() === day.event_type?.trim().toLowerCase()
    );
  }

  assignedCount(day: CrewPlanDay, role: string): number {
    if (!this.booking?.crew_assignments) return 0;
    const targetEventName = day.event_type?.trim().toLowerCase();
    const targetRole = role?.trim().toLowerCase();

    return this.booking.crew_assignments.filter((a: CrewAssignment) => {
      const assignmentEventName = a.event_name?.trim().toLowerCase();
      const assignmentRole = a.assigned_role?.trim().toLowerCase();
      const eventMatches = !assignmentEventName || !targetEventName || assignmentEventName === targetEventName;
      const roleMatches = assignmentRole === targetRole;
      return eventMatches && roleMatches;
    }).length;
  }

  roleStatus(day: CrewPlanDay, role: { role: string; quantity: number }): 'done' | 'left' {
    return this.assignedCount(day, role.role) >= role.quantity ? 'done' : 'left';
  }

  roleProgress(day: CrewPlanDay, role: { role: string; quantity: number }): number {
    if (!role.quantity) return 0;
    return Math.min(100, Math.round((this.assignedCount(day, role.role) / role.quantity) * 100));
  }

  get totalCrewSlots(): number {
    return this.displayCrewPlan.reduce((sum, d) => sum + d.roles.reduce((s, r) => s + r.quantity, 0), 0);
  }

  get pendingCrewSlots(): number {
    let pending = 0;
    for (const day of this.displayCrewPlan) {
      for (const role of day.roles) pending += Math.max(0, role.quantity - this.assignedCount(day, role.role));
    }
    return pending;
  }

  get filledCrewSlots(): number {
    return this.totalCrewSlots - this.pendingCrewSlots;
  }

  get isComplete(): boolean {
    return this.pendingCrewSlots === 0 && this.totalCrewSlots > 0;
  }

  get completionPercentage(): number {
    if (!this.totalCrewSlots) return 0;
    return Math.round((this.filledCrewSlots / this.totalCrewSlots) * 100);
  }

  // --- Event Day modal ---
  onOpenAddDay(): void {
    this.showAddDayModal = true;
  }

  onCloseAddDay(): void {
    this.showAddDayModal = false;
  }

  onSubmitAddDay(data: NewEventDayData): void {
    this.showAddDayModal = false;
    this.addDay.emit(data);
  }

  onDeleteDayClick(day: BookingEvent): void {
    this.confirmDeleteDayTarget = day;
  }

  onCancelDeleteDay(): void {
    this.confirmDeleteDayTarget = null;
  }

  onConfirmDeleteDay(): void {
    if (this.confirmDeleteDayTarget) this.removeDay.emit(this.confirmDeleteDayTarget);
    this.confirmDeleteDayTarget = null;
  }

  // --- Assign Crew modal ---
  onOpenAssignForRole(day: CrewPlanDay, role: string): void {
    const eventDay = this.eventForDay(day);
    this.assignModalEventDayId = eventDay?.id ?? null;
    this.assignModalRole = role;
    this.showAssignModal = true;
  }

  onOpenAssignCrewGeneral(): void {
    this.assignModalEventDayId = this.booking.event_days?.[0]?.id ?? null;
    this.assignModalRole = null;
    this.showAssignModal = true;
  }

  onCloseAssignModal(): void {
    this.showAssignModal = false;
  }

  onSubmitAssign(data: NewAssignmentData): void {
    console.log('CrewTab: onSubmitAssign called with data:', data);
    console.log('CrewTab: Emitting assignCrewMember event');
    this.assignCrewMember.emit(data);
    console.log('CrewTab: Event emitted');
    // Close the modal after emitting the event
    this.showAssignModal = false;
  }
}