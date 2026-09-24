import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserModal, NewUserData, EditUserData, UserRoleValue } from './user-modal/user-modal';
import { Toast } from '../../components/toast/toast';
import { UserService, User } from '../../services/user.service';

type Role =
  | 'Admin'
  | 'HR Manager'
  | 'Photographer'
  | 'Cinematographer'
  | 'Videographer'
  | 'Drone Operator'
  | 'Photo Editor'
  | 'Video Editor'
  | 'Client'
  | 'Freelancer';

interface AppUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  staffName?: string;
  role: Role;
  rawRole: UserRoleValue;
  joinedAt: string;
  active: boolean;
}

interface RoleGroup {
  role: Role;
  users: AppUser[];
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, UserModal, Toast],
  templateUrl: './user-management.html',
  styleUrl: './user-management.scss',
})
export class UserManagement implements OnInit {
  showNewUserModal = false;
  editUserData: EditUserData | null = null;
  isCreatingUser = false;
  isLoading = false;

  toastVisible = false;
  toastTitle = '';
  toastMessage = '';
  toastVariant: 'success' | 'error' = 'success';
  private toastTimer: any;

  constructor(
    private userService: UserService,
    private cdr: ChangeDetectorRef,
  ) {}

  private roleOrder: Role[] = [
    'Admin',
    'HR Manager',
    'Photographer',
    'Cinematographer',
    'Videographer',
    'Drone Operator',
    'Photo Editor',
    'Video Editor',
    'Client',
    'Freelancer',
  ];

  users: AppUser[] = [];

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.cdr.detectChanges(); // ← Force view update to show loading

    this.userService.getUsers().subscribe({
      next: (response) => {
        this.users = response.users.map(user => this.mapUserToAppUser(user));
        this.isLoading = false;
        this.cdr.detectChanges(); // ← Force view update to show users
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.showToast('error', 'Error', 'Failed to load users');
        this.isLoading = false;
        this.cdr.detectChanges(); // ← Force view update to show error
      }
    });
  }

  private mapUserToAppUser(user: User): AppUser {
    const roleLabel = this.roleLabelMap[user.role] || (user.role as Role);
    return {
      id: user.id,
      name: `${user.first_name} ${user.last_name || ''}`.trim(),
      email: user.email,
      phone: user.phone_number || undefined,
      staffName: user.staff_name || undefined,
      role: roleLabel,
      rawRole: (user.role as UserRoleValue) || 'photographer',
      joinedAt: user.created_at,
      active: user.is_active
    };
  }

  private roleLabelMap: Record<string, Role> = {
    admin: 'Admin',
    photographer: 'Photographer',
    cinematographer: 'Cinematographer',
    videographer: 'Videographer',
    drone_operator: 'Drone Operator',
    photo_editor: 'Photo Editor',
    video_editor: 'Video Editor',
    client: 'Client',
    freelancer: 'Freelancer',
  };

  private reverseRoleLabelMap: Record<Role, string> = {
    'Admin': 'admin',
    'HR Manager': 'hr',
    'Photographer': 'photographer',
    'Cinematographer': 'cinematographer',
    'Videographer': 'videographer',
    'Drone Operator': 'drone_operator',
    'Photo Editor': 'photo_editor',
    'Video Editor': 'video_editor',
    'Client': 'client',
    'Freelancer': 'freelancer',
  };

  get totalUsers(): number {
    return this.users.length;
  }

  get activeUsers(): number {
    return this.users.filter((u) => u.active).length;
  }

  get groupedUsers(): RoleGroup[] {
    return this.roleOrder
      .map((role) => ({
        role,
        users: this.users.filter((u) => u.role === role),
      }))
      .filter((group) => group.users.length > 0);
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  onNewUser(): void {
    this.editUserData = null;
    this.showNewUserModal = true;
  }

  onModalClose(): void {
    this.showNewUserModal = false;
    this.editUserData = null;
  }

  onUserCreate(data: NewUserData): void {
    this.isCreatingUser = true;

    const createRequest = {
      email: data.email,
      firstName: data.name.split(' ')[0],
      lastName: data.name.split(' ').slice(1).join(' ') || null,
      phoneNumber: data.phone || null,
      role: data.role,
      staffName: data.role === 'admin' ? null : data.name,
      address: data.address || null
    };

    this.userService.createUser(createRequest).subscribe({
      next: (response) => {
        this.isCreatingUser = false;
        this.showNewUserModal = false;
        this.editUserData = null;
        this.loadUsers(); // Reload users from database to get fresh data
        this.showToast('success', 'User created', `${data.name} can now log in as ${data.email}`);
      },
      error: (error) => {
        this.isCreatingUser = false;
        console.error('Error creating user:', error);
        if (error.status === 409) {
          this.showToast('error', 'Error', 'A user with this email already exists');
        } else {
          this.showToast('error', 'Error', 'Failed to create user');
        }
      }
    });
  }

  onUserUpdate(data: EditUserData): void {
    this.isCreatingUser = true;

    const updateRequest = {
      firstName: data.name.split(' ')[0],
      lastName: data.name.split(' ').slice(1).join(' ') || null,
      phoneNumber: data.phone || null,
      role: data.role,
      staffName: data.role === 'admin' ? null : data.name,
      is_active: true
    };

    this.userService.updateUser(data.id, updateRequest).subscribe({
      next: (response) => {
        this.isCreatingUser = false;
        this.showNewUserModal = false;
        this.editUserData = null;
        this.loadUsers(); // Reload users from database to get fresh data
        this.showToast('success', 'User updated', `${data.name} has been updated`);
      },
      error: (error) => {
        this.isCreatingUser = false;
        console.error('Error updating user:', error);
        if (error.status === 409) {
          this.showToast('error', 'Error', 'A user with this email already exists');
        } else {
          this.showToast('error', 'Error', 'Failed to update user');
        }
      }
    });
  }

  private showToast(variant: 'success' | 'error', title: string, message: string): void {
    clearTimeout(this.toastTimer);
    this.toastVariant = variant;
    this.toastTitle = title;
    this.toastMessage = message;
    this.toastVisible = true;
    this.cdr.detectChanges(); // ← Force view update to show toast
    this.toastTimer = setTimeout(() => {
      this.toastVisible = false;
      this.cdr.detectChanges(); // ← Force view update to hide toast
    }, 4000);
  }

  onToastClosed(): void {
    clearTimeout(this.toastTimer);
    this.toastVisible = false;
    this.cdr.detectChanges(); // ← Force view update
  }

  onEdit(user: AppUser): void {
    this.editUserData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.rawRole,
      address: ''
    };
    this.showNewUserModal = true;
    this.cdr.detectChanges();
  }

  onDelete(user: AppUser): void {
    if (!confirm(`Are you sure you want to delete ${user.name}?`)) {
      return;
    }

    this.userService.deleteUser(user.id).subscribe({
      next: (response) => {
        this.users = this.users.filter((u) => u.id !== user.id);
        this.cdr.detectChanges(); // ← Force view update after delete
        this.showToast('success', 'User deleted', `${user.name} has been removed`);
      },
      error: (error) => {
        console.error('Error deleting user:', error);
        this.showToast('error', 'Error', 'Failed to delete user');
      }
    });
  }
}
