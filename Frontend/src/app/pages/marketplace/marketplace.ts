import { Component, signal, computed, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkAssignmentModal, WorkRequest } from './work-assignment-modal/work-assignment-modal';
import { WorkBriefModal } from './work-brief-modal/work-brief-modal';
import { AddProfileModal } from './add-profile-modal/add-profile-modal';
import { MarketplaceService, Professional } from '../../services/marketplace.service';

type ServiceFilter =
  | 'all'
  | 'photographer'
  | 'cinematographer'
  | 'videographer'
  | 'drone_operator'
  | 'photo_editor'
  | 'video_editor'
  | 'album_designer'
  | 'live_streaming_team'
  | 'lighting_team'
  | 'other';

type TypeFilter = 'all' | 'individual' | 'team';

@Component({
  selector: 'app-marketplace',
  standalone: true,
  imports: [CommonModule, FormsModule, WorkAssignmentModal, WorkBriefModal, AddProfileModal],
  templateUrl: './marketplace.html',
  styleUrl: './marketplace.scss'
})
export class Marketplace implements OnInit {
  activeTab = signal<'browse' | 'requests'>('browse');

  searchTerm = signal('');
  serviceFilter = signal<ServiceFilter>('all');
  typeFilter = signal<TypeFilter>('all');
  cityTerm = signal('');

  isServiceMenuOpen = signal(false);
  isTypeMenuOpen = signal(false);

  showAssignmentModal = signal(false);
  selectedWorkRequest = signal<WorkRequest | null>(null);

  showBriefModal = signal(false);
  selectedProfessionalForBrief = signal<Professional | null>(null);

  showAddProfileModal = signal(false);

  isLoading = signal(false);
  error = signal<string | null>(null);

  constructor(
    private marketplaceService: MarketplaceService,
    private elementRef: ElementRef
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isServiceMenuOpen.set(false);
      this.isTypeMenuOpen.set(false);
    }
  }

  ngOnInit() {
    this.loadMarketplaceData();
  }

  loadMarketplaceData() {
    this.isLoading.set(true);
    this.error.set(null);

    this.marketplaceService.getProfessionals().subscribe({
      next: (response) => {
        if (response.success) {
          this.professionals.set(response.professionals);
        } else {
          this.error.set('Failed to load professionals');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading professionals:', err);
        this.error.set('Failed to load professionals');
        this.isLoading.set(false);
      }
    });

    this.marketplaceService.getWorkRequests().subscribe({
      next: (response) => {
        if (response.success) {
          const transformedRequests = response.workRequests.map(req => ({
            id: req.id,
            project: req.project,
            professionalRole: req.professionalRole,
            professionalName: req.professionalName,
            professionalEmail: req.professionalEmail,
            professionalPhone: req.professionalPhone,
            eventDate: req.eventDate,
            venue: req.venue,
            budget: req.budget,
            status: req.status as 'Pending' | 'Accepted' | 'Declined' | 'Completed'
          }));
          this.workRequests.set(transformedRequests);
        } else {
          console.error('Failed to load work requests');
        }
      },
      error: (err) => {
        console.error('Error loading work requests:', err);
      }
    });
  }

  serviceOptions: { value: ServiceFilter; label: string }[] = [
    { value: 'all', label: 'All services' },
    { value: 'photographer', label: 'Wedding Photographer' },
    { value: 'cinematographer', label: 'Cinematographer' },
    { value: 'videographer', label: 'Traditional Videographer' },
    { value: 'drone_operator', label: 'Drone Operator' },
    { value: 'photo_editor', label: 'Photo Editor' },
    { value: 'video_editor', label: 'Video Editor' },
    { value: 'album_designer', label: 'Album Designer' }, 
    { value: 'live_streaming_team', label: 'Live Streaming Team' },
    { value: 'lighting_team', label: 'Lighting Team' },
    { value: 'other', label: 'Other' }
  ];

  typeOptions: { value: TypeFilter; label: string }[] = [
    { value: 'all', label: 'Individuals & teams' },
    { value: 'individual', label: 'Individuals only' },
    { value: 'team', label: 'Teams only' }
  ];

  professionals = signal<Professional[]>([]);
  workRequests = signal<WorkRequest[]>([]);

  statusOptions = [
    { value: 'Pending', label: 'Pending' },
    { value: 'Accepted', label: 'Accepted' },
    { value: 'Declined', label: 'Declined' },
    { value: 'Completed', label: 'Completed' }
  ];

  filteredProfessionals = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const service = this.serviceFilter();
    const type = this.typeFilter();
    const city = this.cityTerm().trim().toLowerCase();

    return this.professionals().filter(p => {
      const matchesTerm =
        !term || p.name.toLowerCase().includes(term) || p.skills.some(s => s.toLowerCase().includes(term));

      let matchesService = service === 'all';
      if (!matchesService) {
        matchesService = p.skills.some(s => {
          const sClean = s.toLowerCase().replace(/[^a-z0-9]/g, '');
          const serviceClean = service.replace(/_/g, '');
          if (serviceClean === 'cinematographer') {
            return sClean.includes('cinematography') || sClean.includes('cinematographer');
          }
          if (serviceClean === 'photographer') {
            return sClean.includes('photo') || sClean.includes('photographer');
          }
          if (serviceClean === 'videographer') {
            return sClean.includes('video') || sClean.includes('videographer');
          }
          return sClean.includes(serviceClean) || serviceClean.includes(sClean);
        });
      }

      const matchesType =
        type === 'all' ||
        (type === 'individual' && p.type === 'Individual') ||
        (type === 'team' && p.type === 'Team');

      const matchesCity = !city || p.city.toLowerCase().includes(city) || p.state.toLowerCase().includes(city);

      return matchesTerm && matchesService && matchesType && matchesCity;
    });
  });

  hasActiveFilters = computed(
    () => !!this.searchTerm() || this.serviceFilter() !== 'all' || this.typeFilter() !== 'all' || !!this.cityTerm()
  );

  verifiedCount = computed(() => this.professionals().filter(p => p.verified).length);
  hiredCount = computed(() => 
    this.workRequests().filter(r => r.status === 'Accepted' || r.status === 'Completed').length
  );

  setTab(tab: 'browse' | 'requests') {
    this.activeTab.set(tab);
  }

  toggleServiceMenu(event?: MouseEvent) {
    if (event) event.stopPropagation();
    this.isServiceMenuOpen.set(!this.isServiceMenuOpen());
    this.isTypeMenuOpen.set(false);
  }

  toggleTypeMenu(event?: MouseEvent) {
    if (event) event.stopPropagation();
    this.isTypeMenuOpen.set(!this.isTypeMenuOpen());
    this.isServiceMenuOpen.set(false);
  }

  selectService(value: ServiceFilter) {
    this.serviceFilter.set(value);
    this.isServiceMenuOpen.set(false);
  }

  selectType(value: TypeFilter) {
    this.typeFilter.set(value);
    this.isTypeMenuOpen.set(false);
  }

  get serviceLabel(): string {
    return this.serviceOptions.find(o => o.value === this.serviceFilter())?.label ?? 'All services';
  }

  get typeLabel(): string {
    return this.typeOptions.find(o => o.value === this.typeFilter())?.label ?? 'Individuals & teams';
  }

  resetFilters() {
    this.searchTerm.set('');
    this.serviceFilter.set('all');
    this.typeFilter.set('all');
    this.cityTerm.set('');
  }

  visibleSkills(p: Professional): string[] {
    return p.skills.slice(0, 3);
  }

  extraSkillsCount(p: Professional): number {
    return Math.max(0, p.skills.length - 3);
  }

  onOpenAddProfile() {
    this.showAddProfileModal.set(true);
  }

  onAddProfileClose() {
    this.showAddProfileModal.set(false);
  }

  onProfileAdded(newProf: Professional) {
    this.professionals.update(list => [newProf, ...list]);
  }

  onSendWorkBrief(p: Professional) {
    this.selectedProfessionalForBrief.set(p);
    this.showBriefModal.set(true);
  }

  onBriefModalClose() {
    this.showBriefModal.set(false);
    this.selectedProfessionalForBrief.set(null);
  }

  onBriefSubmitted(newWorkRequest: WorkRequest) {
    this.workRequests.update(requests => [newWorkRequest, ...requests]);
  }

  onAssignWork(request: WorkRequest) {
    this.selectedWorkRequest.set(request);
    this.showAssignmentModal.set(true);
  }

  onStatusChange(request: WorkRequest, newStatus: string) {
    const properStatus = newStatus.charAt(0).toUpperCase() + newStatus.slice(1).toLowerCase() as 'Pending' | 'Accepted' | 'Declined' | 'Completed';

    this.marketplaceService.updateWorkRequest(request.id, { status: properStatus }).subscribe({
      next: (response) => {
        if (response.success) {
          this.workRequests.update(requests =>
            requests.map(r => r.id === request.id ? { ...r, status: properStatus } : r)
          );
        }
      },
      error: (err) => {
        console.error('Error updating work request status:', err);
        this.error.set('Failed to update work request status');
      }
    });
  }

  onAssignmentModalClose() {
    this.showAssignmentModal.set(false);
    this.selectedWorkRequest.set(null);
  }

  onAssignmentConfirmed(data: any) {
    const requestId = this.selectedWorkRequest()?.id;
    if (requestId) {
      this.marketplaceService.updateWorkRequest(requestId, { status: 'Accepted' }).subscribe({
        next: (response) => {
          if (response.success) {
            this.workRequests.update(requests =>
              requests.map(r => r.id === requestId ? { ...r, status: 'Accepted' } : r)
            );
          }
        },
        error: (err) => {
          console.error('Error confirming assignment:', err);
          this.error.set('Failed to confirm assignment');
        }
      });
    }
    this.showAssignmentModal.set(false);
    this.selectedWorkRequest.set(null);
  }
}
