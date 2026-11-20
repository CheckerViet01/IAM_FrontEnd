import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, UserProfile, ActivityLog, PageResponse, AvatarItem } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1/users';

  getProfile(): Observable<ApiResponse<UserProfile>> {
    return this.http.get<ApiResponse<UserProfile>>(`${this.apiUrl}/profile`);
  }

  updateProfile(data: any): Observable<ApiResponse<UserProfile>> {
    return this.http.put<ApiResponse<UserProfile>>(`${this.apiUrl}/profile`, data);
  }

  changePassword(data: any): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/change-password`, data);
  }

  uploadAvatar(file: File): Observable<ApiResponse<string>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/avatar`, formData);
  }

  getUserAvatars(): Observable<ApiResponse<AvatarItem[]>> {
    return this.http.get<ApiResponse<AvatarItem[]>>(`${this.apiUrl}/avatars`);
  }

  requestEnable2fa(): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/2fa/request-enable`, {});
  }

  confirmEnable2fa(otpCode: string): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/2fa/confirm-enable`, { otpCode });
  }

  disable2fa(password: string): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/2fa/disable`, { password });
  }

  getActivityLogs(page = 0, size = 10): Observable<ApiResponse<PageResponse<ActivityLog>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<PageResponse<ActivityLog>>>(`${this.apiUrl}/activity-logs`, { params });
  }
}
