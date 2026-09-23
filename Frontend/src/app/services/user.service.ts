import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string | null;
  phone_number: string | null;
  role: string;
  staff_name: string | null;
  is_active: boolean;
  is_verified: boolean;
  profile_image: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName?: string | null;
  phoneNumber?: string | null;
  role?: string;
  staffName?: string | null;
  address?: string | null;
}

export interface UpdateUserRequest {
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  role?: string;
  staffName?: string | null;
  is_active?: boolean;
}

export interface UserListResponse {
  success: boolean;
  users: User[];
  count: number;
}

export interface UserResponse {
  success: boolean;
  user: User;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = 'https://wedflow-codeflare.onrender.com/api/users';

  constructor(private http: HttpClient) {}

  getUsers(): Observable<UserListResponse> {
    return this.http.get<UserListResponse>(this.apiUrl);
  }

  getUserById(id: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.apiUrl}/${id}`);
  }

  createUser(user: CreateUserRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(this.apiUrl, user);
  }

  updateUser(id: string, user: UpdateUserRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.apiUrl}/${id}`, user);
  }

  deleteUser(id: string): Observable<DeleteResponse> {
    return this.http.delete<DeleteResponse>(`${this.apiUrl}/${id}`);
  }
}