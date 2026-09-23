import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EquipmentModal } from './equipment-modal/equipment-modal';
import { EquipmentCheckoutModal } from './equipment-checkout-modal/equipment-checkout-modal';
import { EquipmentService, EquipmentItem, EquipmentType, NewEquipmentPayload, CheckoutPayload } from '../../services/equipment.service';

type TypeFilter = 'all' | EquipmentType;

@Component({
  selector: 'app-equipment',
  standalone: true,
  imports: [CommonModule, FormsModule, EquipmentModal, EquipmentCheckoutModal],
  templateUrl: './equipment-page.html',
  styleUrl: './equipment-page.scss',
})
export class Equipment implements OnInit {
  private equipmentService = inject(EquipmentService);
  searchTerm = signal('');
  typeFilter = signal<TypeFilter>('all');
  isTypeMenuOpen = signal(false);
  isLoading = signal(false);

  typeOptions: { value: TypeFilter; label: string }[] = [
    { value: 'all', label: 'All Types' },
    { value: 'camera', label: 'Camera' },
    { value: 'drone', label: 'Drone' },
    { value: 'memory_card', label: 'Memory Card' },
    { value: 'hard_disk', label: 'Hard Disk' },
    { value: 'lens', label: 'Lens' },
    { value: 'tripod', label: 'Tripod' },
    { value: 'light', label: 'Light' },
    { value: 'other', label: 'Other' },
  ];

  equipment = signal<EquipmentItem[]>([]);

  ngOnInit() {
    this.loadEquipment();
    this.loadBookingEvents();
  }

  loadBookingEvents() {
    this.equipmentService.getBookingEvents().subscribe({
      next: (response) => {
        const events = response.events.map(event => ({
          id: event.id,
          name: event.event_name,
          date: event.event_date,
          venue: event.venue
        }));
        this.bookingEvents.set(events);
      },
      error: (error) => {
        console.error('Error loading booking events:', error);
      }
    });
  }

  loadEquipment() {
    this.isLoading.set(true);
    this.equipmentService.getEquipment().subscribe({
      next: (response) => {
        const equipmentItems = response.equipment.map(item => this.equipmentService.mapToEquipmentFormat(item));
        this.equipment.set(equipmentItems);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading equipment:', error);
        this.isLoading.set(false);
        this.showToast('Failed to load equipment');
      }
    });
  }

  filteredEquipment = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const type = this.typeFilter();
    return this.equipment().filter((item) => {
      const matchesTerm =
        !term || item.name.toLowerCase().includes(term) || item.typeLabel.toLowerCase().includes(term);
      const matchesType = type === 'all' || item.type === type;
      return matchesTerm && matchesType;
    });
  });

  availableItems = computed(() => this.filteredEquipment().filter((i) => i.status === 'available'));
  checkedOutItems = computed(() => this.filteredEquipment().filter((i) => i.status === 'assigned' || i.status === 'checked_out'));
  maintenanceItems = computed(() => this.filteredEquipment().filter((i) => i.status === 'maintenance'));
  retiredItems = computed(() => this.filteredEquipment().filter((i) => i.status === 'retired'));

  totalAvailable = computed(() => this.equipment().filter((i) => i.status === 'available').length);
  totalCheckedOut = computed(() => this.equipment().filter((i) => i.status === 'assigned' || i.status === 'checked_out').length);

  toggleTypeMenu() {
    this.isTypeMenuOpen.set(!this.isTypeMenuOpen());
  }

  selectType(value: TypeFilter) {
    this.typeFilter.set(value);
    this.isTypeMenuOpen.set(false);
  }

  get typeLabel(): string {
    return this.typeOptions.find((o) => o.value === this.typeFilter())?.label ?? 'All Types';
  }

  // ==== Add Equipment modal ====
  isAddModalOpen = signal(false);

  onAddEquipment() {
    this.isAddModalOpen.set(true);
  }

  onModalClosed() {
    this.isAddModalOpen.set(false);
  }

  onModalSubmitted(payload: NewEquipmentPayload) {
    this.equipmentService.createEquipment(payload).subscribe({
      next: (response) => {
        const newEquipment = this.equipmentService.mapToEquipmentFormat(response.equipment);
        this.equipment.update(list => [...list, newEquipment]);
        this.isAddModalOpen.set(false);
        this.showToast('Equipment added successfully');
      },
      error: (error) => {
        console.error('Error creating equipment:', error);
        this.showToast('Failed to add equipment');
      }
    });
  }

  // ==== Checkout modal ====
  isCheckoutModalOpen = signal(false);
  checkoutTargetId = signal<string | null>(null);
  checkoutTargetName = signal('');
  bookingEvents = signal<any[]>([]);

  onCheckout(item: EquipmentItem) {
    this.checkoutTargetId.set(item.id);
    this.checkoutTargetName.set(item.name);
    this.isCheckoutModalOpen.set(true);
  }

  onCheckoutModalClosed() {
    this.isCheckoutModalOpen.set(false);
    this.checkoutTargetId.set(null);
  }

  onCheckoutSubmitted(payload: CheckoutPayload) {
    this.equipmentService.createAssignment(payload).subscribe({
      next: (response) => {
        // Update equipment status locally and via API
        this.equipmentService.updateEquipment(payload.equipmentId, { status: 'assigned' }).subscribe({
          next: (updateResponse) => {
            this.equipment.update((list) =>
              list.map((item) =>
                item.id === payload.equipmentId
                  ? {
                      ...item,
                      status: 'assigned' as const,
                      checkedOutWith: payload.staffName,
                      checkedOutSince: new Date(),
                      checkedOutDue: payload.expectedReturnDate ? new Date(payload.expectedReturnDate) : undefined,
                    }
                  : item
              )
            );
            this.isCheckoutModalOpen.set(false);
            this.checkoutTargetId.set(null);
            this.showToast('Equipment checked out successfully');
          },
          error: (error) => {
            console.error('Error updating equipment status:', error);
            this.showToast('Equipment checked out but status update failed');
          }
        });
      },
      error: (error) => {
        console.error('Error checking out equipment:', error);
        this.showToast('Failed to checkout equipment');
      }
    });
  }

  // ==== Mark Returned ====
  markReturned(item: EquipmentItem) {
    this.equipmentService.returnEquipment(item.id).subscribe({
      next: (response) => {
        this.equipment.update((list) =>
          list.map((i) =>
            i.id === item.id
              ? { ...i, status: 'available' as const, checkedOutWith: undefined, checkedOutSince: undefined, checkedOutDue: undefined }
              : i
          )
        );
        this.showToast('Equipment returned successfully');
      },
      error: (error) => {
        console.error('Error returning equipment:', error);
        this.showToast('Failed to return equipment');
      }
    });
  }

  formatShortDate(date?: Date): string {
    if (!date) return '';
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  // ==== Inline toast (self-contained, no external component dependency) ====
  toastVisible = signal(false);
  toastMessage = signal('');
  private toastTimeoutId: ReturnType<typeof setTimeout> | null = null;

  showToast(message: string) {
    if (this.toastTimeoutId) clearTimeout(this.toastTimeoutId);
    this.toastMessage.set(message);
    this.toastVisible.set(true);
    this.toastTimeoutId = setTimeout(() => this.toastVisible.set(false), 3000);
  }

  closeToast() {
    if (this.toastTimeoutId) clearTimeout(this.toastTimeoutId);
    this.toastVisible.set(false);
  }
}