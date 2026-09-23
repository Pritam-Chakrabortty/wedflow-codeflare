import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DashboardService, DashboardCalendarEvent } from '../../services/dashboard.service';

interface StatCard {
  label: string;
  value: string;
  subtext: string;
  icon: string;
  link: string;
  highlighted?: boolean;
  valueColor: string;
}

interface DayEvent {
  id: string;
  name: string;
  location: string;
  packageName: string;
  needsCrew: boolean;
  colorBg: string;
}

interface CalendarDay {
  date: number;
  type: 'prev' | 'current' | 'next';
  fullDate: Date;
  events: DayEvent[];
}

interface ActionItem {
  type: 'crew' | 'payment';
  title: string;
  detail: string;
  link: string;
  urgent: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private dashboardService = inject(DashboardService);

  isLoadingSummary = signal(true);

  // ----- Attention banner -----
  bookingsNeedingCrew = signal(0);
  paymentsNeedingFollowUp = signal(0);

  // ----- Stat cards -----
  statCards = signal<StatCard[]>([
    {
      label: 'Total Revenue',
      value: '₹0',
      subtext: '₹0 collected',
      icon: 'trending-up',
      link: '/bookings',
      highlighted: true,
      valueColor: 'gold',
    },
    {
      label: 'Active Bookings',
      value: '0',
      subtext: '0 upcoming',
      icon: 'calendar',
      link: '/bookings',
      valueColor: 'white',
    },
    {
      label: 'Pending Payments',
      value: '0',
      subtext: 'Require follow up',
      icon: 'credit-card',
      link: '/bookings',
      valueColor: 'red',
    },
    {
      label: 'Need Crew',
      value: '0',
      subtext: 'Bookings unassigned',
      icon: 'users',
      link: '/crew-assignments',
      valueColor: 'gold',
    },
  ]);

  // ----- Calendar -----
  today = new Date();
  currentMonth = signal(new Date());
  selectedDate = signal(new Date());
  searchTerm = signal('');

  monthLabel = computed(() => this.currentMonth().toLocaleString('en-US', { month: 'long' }));
  yearLabel = computed(() => this.currentMonth().getFullYear());
  weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  eventsByDate = signal<Record<string, DayEvent[]>>({});
  actionItems = signal<ActionItem[]>([]);
  upcomingEventsList = signal<any[]>([]);

  ngOnInit(): void {
    this.loadDashboardSummary();
    this.loadCalendarEvents();
  }

  loadDashboardSummary(): void {
    this.isLoadingSummary.set(true);
    this.dashboardService.getSummary().subscribe({
      next: (res) => {
        this.isLoadingSummary.set(false);
        if (!res.success) return;
        const sum = res.summary;

        this.bookingsNeedingCrew.set(sum.unassignedCrewEvents || 0);
        this.paymentsNeedingFollowUp.set(sum.outstandingInvoices || 0);

        this.statCards.set([
          {
            label: 'Total Revenue',
            value: `₹${(sum.bookingValue || 0).toLocaleString('en-IN')}`,
            subtext: `₹${(sum.paidRevenue || 0).toLocaleString('en-IN')} collected`,
            icon: 'trending-up',
            link: '/bookings',
            highlighted: true,
            valueColor: 'gold',
          },
          {
            label: 'Active Bookings',
            value: `${sum.activeBookings || 0}`,
            subtext: `${sum.upcomingEvents || 0} upcoming this month`,
            icon: 'calendar',
            link: '/bookings',
            valueColor: 'white',
          },
          {
            label: 'Pending Payments',
            value: `${sum.outstandingInvoices || 0}`,
            subtext: `₹${(sum.outstandingValue || 0).toLocaleString('en-IN')} due`,
            icon: 'credit-card',
            link: '/bookings',
            valueColor: 'red',
          },
          {
            label: 'Need Crew',
            value: `${sum.unassignedCrewEvents || 0}`,
            subtext: 'Bookings unassigned',
            icon: 'users',
            link: '/crew-assignments',
            valueColor: 'gold',
          },
        ]);

        const items: ActionItem[] = [];

        (res.unassignedEvents || []).forEach((e) => {
          const days = Number(e.days_diff);
          items.push({
            type: 'crew',
            title: `Assign crew for ${e.client_name || e.event_name}`,
            detail: days < 0 ? `Event was ${Math.abs(days)} days ago - crew missing` : `Event in ${days} days - crew not yet assigned`,
            link: `/bookings/${e.booking_id}`,
            urgent: days <= 7,
          });
        });

        (res.pendingInvoices || []).forEach((inv) => {
          items.push({
            type: 'payment',
            title: `Payment pending: "${inv.invoice_number}"`,
            detail: `₹${Number(inv.total_amount).toLocaleString('en-IN')} due - follow up needed`,
            link: `/bookings/${inv.booking_id}`,
            urgent: true,
          });
        });

        this.actionItems.set(items);
        this.upcomingEventsList.set(res.unassignedEvents || []);
      },
      error: (err) => {
        this.isLoadingSummary.set(false);
        console.error('Error loading dashboard summary:', err);
      },
    });
  }

  loadCalendarEvents(): void {
    const year = this.currentMonth().getFullYear();
    const month = this.currentMonth().getMonth() + 1;

    this.dashboardService.getCalendarEvents(year, month).subscribe({
      next: (res) => {
        if (!res.success) return;

        const map: Record<string, DayEvent[]> = {};
        (res.events || []).forEach((ev) => {
          const dt = new Date(ev.eventDate);
          const key = `${dt.getFullYear()}-${dt.getMonth() + 1}-${dt.getDate()}`;
          if (!map[key]) map[key] = [];
          map[key].push({
            id: ev.bookingId || ev.id,
            name: ev.name,
            location: ev.location,
            packageName: ev.packageName,
            needsCrew: ev.needsCrew,
            colorBg: ev.needsCrew ? 'rgba(98, 24, 24, 0.35)' : 'rgba(31, 71, 31, 0.35)',
          });
        });

        this.eventsByDate.set(map);
      },
      error: (err) => {
        console.error('Error loading dashboard calendar:', err);
      },
    });
  }

  private dateKey(d: Date): string {
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  calendarDays = computed<CalendarDay[]>(() => {
    const year = this.currentMonth().getFullYear();
    const month = this.currentMonth().getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDateOfMonth = new Date(year, month + 1, 0).getDate();
    const prevLastDate = new Date(year, month, 0).getDate();
    const startOffset = (firstDay.getDay() + 6) % 7;

    const eventsMap = this.eventsByDate();
    const days: CalendarDay[] = [];

    for (let i = startOffset; i > 0; i--) {
      const d = new Date(year, month - 1, prevLastDate - i + 1);
      days.push({
        date: d.getDate(),
        type: 'prev',
        fullDate: d,
        events: eventsMap[this.dateKey(d)] ?? [],
      });
    }
    for (let d = 1; d <= lastDateOfMonth; d++) {
      const full = new Date(year, month, d);
      days.push({
        date: d,
        type: 'current',
        fullDate: full,
        events: eventsMap[this.dateKey(full)] ?? [],
      });
    }
    const remainder = days.length % 7;
    if (remainder !== 0) {
      for (let d = 1; d <= 7 - remainder; d++) {
        const full = new Date(year, month + 1, d);
        days.push({
          date: d,
          type: 'next',
          fullDate: full,
          events: eventsMap[this.dateKey(full)] ?? [],
        });
      }
    }
    return days;
  });

  prevMonth(): void {
    const d = this.currentMonth();
    this.currentMonth.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
    this.loadCalendarEvents();
  }

  nextMonth(): void {
    const d = this.currentMonth();
    this.currentMonth.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
    this.loadCalendarEvents();
  }

  goToToday(): void {
    this.currentMonth.set(new Date(this.today.getFullYear(), this.today.getMonth(), 1));
    this.selectedDate.set(this.today);
    this.loadCalendarEvents();
  }

  selectDay(day: CalendarDay): void {
    if (day.type !== 'current') return;
    this.selectedDate.set(day.fullDate);
  }

  isSelected(day: CalendarDay): boolean {
    return day.type === 'current' && this.sameDate(day.fullDate, this.selectedDate());
  }

  isToday(day: CalendarDay): boolean {
    return day.type === 'current' && this.sameDate(day.fullDate, this.today);
  }

  isOtherMonth(day: CalendarDay): boolean {
    return day.type !== 'current';
  }

  private sameDate(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  selectedDateEvents = computed<DayEvent[]>(() => {
    const key = this.dateKey(this.selectedDate());
    return this.eventsByDate()[key] ?? [];
  });

  allMonthEvents = computed<DayEvent[]>(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const map = this.eventsByDate();
    const list: DayEvent[] = [];
    Object.values(map).forEach(arr => {
      arr.forEach(item => {
        if (!term || item.name.toLowerCase().includes(term) || item.location.toLowerCase().includes(term) || item.packageName.toLowerCase().includes(term)) {
          list.push(item);
        }
      });
    });
    return list;
  });
}
