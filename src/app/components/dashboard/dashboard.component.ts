import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';
import { UserProfile, ActivityLog, AvatarItem } from '../../models/auth.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  userService = inject(UserService);
  toast = inject(ToastService);

  activeTab: 'profile' | 'avatar' | 'security' | 'logs' = 'profile';
  loading = signal(false);

  // User profile
  profile = signal<UserProfile | null>(null);

  // Profile Edit Form
  profileForm = {
    fullName: '',
    phoneNumber: '',
    address: '',
    dateOfBirth: '',
    gender: 'MALE'
  };

  // Avatar Studio
  selectedAvatarFile: File | null = null;
  avatarPreviewUrl: string | null = null;
  avatarList = signal<AvatarItem[]>([]);

  // Change Password Form
  passwordForm = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  showOldPass = false;
  showNewPass = false;
  showConfirmPass = false;

  // 2FA Management
  showEnable2faModal = signal(false);
  showDisable2faModal = signal(false);
  enable2faOtp = '';
  disable2faPassword = '';

  // Activity Logs
  activityLogs = signal<ActivityLog[]>([]);
  currentPage = 0;
  totalPages = 0;
  totalLogs = 0;

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.loading.set(true);
    this.userService.getProfile().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.data) {
          this.profile.set(res.data);
          this.authService.updateCurrentUser(res.data);
          this.profileForm = {
            fullName: res.data.fullName || '',
            phoneNumber: res.data.phoneNumber || '',
            address: res.data.address || '',
            dateOfBirth: res.data.dateOfBirth || '',
            gender: res.data.gender || 'MALE'
          };
        }
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onTabChange(tab: 'profile' | 'avatar' | 'security' | 'logs') {
    this.activeTab = tab;
    if (tab === 'avatar') {
      this.loadAvatars();
    } else if (tab === 'logs') {
      this.loadLogs(0);
    }
  }

  // --- Profile Update ---
  onUpdateProfile() {
    this.loading.set(true);
    this.userService.updateProfile(this.profileForm).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.data) {
          this.profile.set(res.data);
          this.authService.updateCurrentUser(res.data);
        }
        this.toast.success('Cập nhật thông tin cá nhân thành công! ✨');
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message || 'Cập nhật thất bại!';
        this.toast.error(msg);
      }
    });
  }

  // --- Avatar Studio ---
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        this.toast.error('Kích thước ảnh tối đa 5MB!');
        return;
      }
      this.selectedAvatarFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.avatarPreviewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onUploadAvatar() {
    if (!this.selectedAvatarFile) {
      this.toast.warning('Vui lòng chọn một tệp ảnh để tải lên!');
      return;
    }

    this.loading.set(true);
    this.userService.uploadAvatar(this.selectedAvatarFile).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.toast.success('Cập nhật ảnh đại diện thành công! 📸');
        this.selectedAvatarFile = null;
        this.avatarPreviewUrl = null;
        this.loadProfile();
        this.loadAvatars();
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message || 'Tải ảnh lên thất bại!';
        this.toast.error(msg);
      }
    });
  }

  loadAvatars() {
    this.userService.getUserAvatars().subscribe({
      next: (res) => {
        if (res.data) {
          this.avatarList.set(res.data);
        }
      }
    });
  }

  // --- Change Password ---
  onChangePassword() {
    if (!this.passwordForm.oldPassword || !this.passwordForm.newPassword) {
      this.toast.warning('Vui lòng nhập đầy đủ thông tin mật khẩu!');
      return;
    }

    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.toast.error('Mật khẩu mới và xác nhận mật khẩu không khớp!');
      return;
    }

    this.loading.set(true);
    this.userService.changePassword(this.passwordForm).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.toast.success(res.message || 'Đổi mật khẩu thành công! ✨');
        this.passwordForm = { oldPassword: '', newPassword: '', confirmPassword: '' };
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message || 'Đổi mật khẩu không thành công!';
        this.toast.error(msg);
      }
    });
  }

  // --- 2FA Management ---
  onRequestEnable2fa() {
    this.loading.set(true);
    this.userService.requestEnable2fa().subscribe({
      next: (res) => {
        this.loading.set(false);
        this.enable2faOtp = '';
        this.showEnable2faModal.set(true);
        this.toast.info('Mã OTP xác nhận kích hoạt đã được gửi tới email của bạn!');
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message || 'Không thể gửi yêu cầu bật 2FA';
        this.toast.error(msg);
      }
    });
  }

  onConfirmEnable2fa() {
    if (!this.enable2faOtp || this.enable2faOtp.length < 6) {
      this.toast.warning('Vui lòng nhập mã OTP 6 số!');
      return;
    }

    this.loading.set(true);
    this.userService.confirmEnable2fa(this.enable2faOtp).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.showEnable2faModal.set(false);
        this.enable2faOtp = '';
        this.toast.success(res.message || 'Đã bật xác thực 2 bước (2FA) thành công! 🛡️');
        this.loadProfile();
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message || 'Mã OTP không hợp lệ!';
        this.toast.error(msg);
      }
    });
  }

  openDisable2fa() {
    this.disable2faPassword = '';
    this.showDisable2faModal.set(true);
  }

  onConfirmDisable2fa() {
    if (!this.disable2faPassword) {
      this.toast.warning('Vui lòng nhập mật khẩu xác nhận!');
      return;
    }

    this.loading.set(true);
    this.userService.disable2fa(this.disable2faPassword).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.showDisable2faModal.set(false);
        this.disable2faPassword = '';
        this.toast.success(res.message || 'Đã tắt xác thực hai yếu tố (2FA)!');
        this.loadProfile();
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message || 'Mật khẩu xác nhận không đúng!';
        this.toast.error(msg);
      }
    });
  }

  // --- Activity Logs ---
  loadLogs(page = 0) {
    this.loading.set(true);
    this.userService.getActivityLogs(page, 8).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.data) {
          this.activityLogs.set(res.data.content);
          this.currentPage = res.data.number;
          this.totalPages = res.data.totalPages;
          this.totalLogs = res.data.totalElements;
        }
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onLogout() {
    this.authService.logout().subscribe({
      next: () => {
        this.toast.info('Bạn đã đăng xuất khỏi hệ thống.');
      },
      error: () => {
        this.authService.clearSession();
        this.toast.info('Đã kết thúc phiên làm việc.');
      }
    });
  }

  getAvatarSrc(url?: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return 'http://localhost:8080' + url;
  }
}
