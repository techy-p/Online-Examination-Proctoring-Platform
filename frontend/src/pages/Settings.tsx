import { useState } from 'react';
import { User, Lock, Mail, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/client';
import PageHeader from '../components/ui/PageHeader';
import FormField from '../components/ui/FormField';
import PasswordStrength from '../components/ui/PasswordStrength';
import Badge from '../components/ui/Badge';

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const { success, error: toastError } = useToast();

  const [profile, setProfile] = useState({ fullName: user?.fullName || '', email: user?.email || '' });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [profileLoading, setProfileLoading] = useState(false);

  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrors({});
    setProfileLoading(true);
    try {
      const { data } = await api.patch('/auth/profile', profile);
      updateUser({ id: data.id, email: data.email, fullName: data.fullName, role: data.role });
      success('Profile updated', 'Your changes have been saved.');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { errors?: Record<string, string>; error?: string } } };
      setProfileErrors(axiosErr.response?.data?.errors || {});
      toastError('Update failed', axiosErr.response?.data?.error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrors({});

    if (passwords.new !== passwords.confirm) {
      setPasswordErrors({ confirm: 'Passwords do not match' });
      return;
    }

    setPasswordLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwords.current,
        newPassword: passwords.new,
      });
      success('Password changed', 'You will be signed out for security.');
      setPasswords({ current: '', new: '', confirm: '' });
      setTimeout(() => logout(), 1500);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { errors?: Record<string, string>; error?: string } } };
      setPasswordErrors(axiosErr.response?.data?.errors || {});
      toastError('Password change failed', axiosErr.response?.data?.error);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Account Settings"
        description="Manage your profile, security preferences, and session."
      />

      <div className="card mb-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-full bg-brand-950 border-2 border-[#b69358] flex items-center justify-center text-2xl font-display font-semibold text-[#f7f3e9]">
            {user?.fullName?.charAt(0)}
          </div>
          <div>
            <h2 className="font-display font-bold text-lg">{user?.fullName}</h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <Badge variant="brand" className="mt-2">{user?.role}</Badge>
          </div>
        </div>

        <form onSubmit={handleProfileSave} className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2 text-sm text-slate-700">
            <User className="w-4 h-4" /> Profile Information
          </h3>
          <FormField label="Full Name" error={profileErrors.fullName}>
            <input
              className="input"
              value={profile.fullName}
              onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
            />
          </FormField>
          <FormField label="Email Address" error={profileErrors.email}>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                className="input pl-10"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </div>
          </FormField>
          <button type="submit" className="btn-primary" disabled={profileLoading}>
            {profileLoading ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>

      <div className="card">
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2 text-sm text-slate-700">
            <Lock className="w-4 h-4" /> Change Password
          </h3>
          <FormField label="Current Password" error={passwordErrors.currentPassword}>
            <input
              type="password"
              className="input"
              value={passwords.current}
              onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
            />
          </FormField>
          <FormField label="New Password" error={passwordErrors.newPassword}>
            <input
              type="password"
              className="input"
              value={passwords.new}
              onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
            />
            <PasswordStrength password={passwords.new} />
          </FormField>
          <FormField label="Confirm New Password" error={passwordErrors.confirm}>
            <input
              type="password"
              className="input"
              value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
            />
          </FormField>
          <div className="flex items-center gap-2 text-xs text-slate-600 bg-[#f4f3ef] border border-slate-200 rounded-md p-3">
            <Shield className="w-4 h-4 text-brand-500" />
            Changing your password will sign you out of all other sessions.
          </div>
          <button type="submit" className="btn-primary" disabled={passwordLoading}>
            {passwordLoading ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}
