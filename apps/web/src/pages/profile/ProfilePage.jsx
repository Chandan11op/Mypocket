import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { profileApi } from '../../services';
import { formatDate } from '../../utils/formatters';
import {
  User,
  Phone,
  Mail,
  Calendar,
  Shield,
  AlertCircle,
  CheckCircle2,
  Lock,
  LogOut,
  Edit2,
  Save,
  X,
  Loader2,
  KeyRound,
} from 'lucide-react';

export function ProfilePage() {
  const { user, logout, logoutAll, checkAuth } = useAuth();

  // Profile Edit Form State
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');

  // Device Logout State
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);
  const [isLoggingOutCurrent, setIsLoggingOutCurrent] = useState(false);

  // Sync state when user object loads
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setUsername(user.username || '');
      setEmail(user.email || '');
      setDateOfBirth(
        user.date_of_birth ? new Date(user.date_of_birth).toISOString().substring(0, 10) : ''
      );
      setProfilePhoto(user.profile_photo || '');
    }
  }, [user]);

  // Handle Profile Update
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccessMsg('');
    setProfileErrorMsg('');

    try {
      const res = await profileApi.updateProfile({
        full_name: fullName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        date_of_birth: dateOfBirth,
        profile_photo: profilePhoto.trim(),
      });

      if (res.data.success) {
        setProfileSuccessMsg('Profile updated successfully.');
        setIsEditing(false);
        await checkAuth(); // Refresh profile in auth context
      }
    } catch (err) {
      setProfileErrorMsg(
        err.response?.data?.message || 'Failed to update profile. Please try again.'
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordSuccessMsg('');
    setPasswordErrorMsg('');

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('New password and confirmation password do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordErrorMsg('New password must be at least 8 characters long.');
      return;
    }

    setIsChangingPassword(true);

    try {
      const res = await profileApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (res.data.success) {
        setPasswordSuccessMsg(
          'Password changed successfully! You will need to log in again on other devices.'
        );
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setPasswordErrorMsg(
        err.response?.data?.message || 'Failed to change password. Check your current password.'
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Logout All Devices
  const handleLogoutAll = async () => {
    if (
      !window.confirm(
        'Are you sure you want to sign out from all devices? You will be redirected to the login page.'
      )
    ) {
      return;
    }

    setIsLoggingOutAll(true);
    await logoutAll();
  };

  // Logout Current Device
  const handleLogoutCurrent = async () => {
    setIsLoggingOutCurrent(true);
    await logout();
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Account Profile & Security
        </h1>
        <p className="text-xs font-medium text-slate-500 mt-0.5">
          Manage your personal details, credentials, and multi-device sessions
        </p>
      </div>

      {/* Profile Details Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Header Avatar & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-brand-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-brand-500/20 shrink-0 overflow-hidden">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : user?.full_name ? (
                user.full_name.charAt(0).toUpperCase()
              ) : (
                'U'
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {user?.full_name || 'My Pocket User'}
              </h2>
              <p className="text-xs font-medium text-slate-400">@{user?.username}</p>
            </div>
          </div>

          <div>
            {!isEditing ? (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(true);
                  setProfileSuccessMsg('');
                  setProfileErrorMsg('');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-900 dark:text-white text-xs font-bold rounded-xl transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 transition"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>

        {/* Feedback Messages */}
        {profileSuccessMsg && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-2xl flex items-center gap-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{profileSuccessMsg}</span>
          </div>
        )}

        {profileErrorMsg && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-center gap-2.5 text-xs font-semibold text-rose-700 dark:text-rose-300 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{profileErrorMsg}</span>
          </div>
        )}

        {/* Edit Profile Form vs View Details */}
        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  required
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingProfile}
                className="inline-flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
              >
                {isSavingProfile ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{isSavingProfile ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Phone className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Mobile Number</span>
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {user?.mobile_number || '-'}
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Mail className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Email Address</span>
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {user?.email || '-'}
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Date of Birth</span>
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {formatDate(user?.date_of_birth)}
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Shield className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Account Created</span>
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {formatDate(user?.created_at)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Change Password Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Change Account Password
            </h2>
            <p className="text-xs text-slate-400">
              Update your password to keep your accounting data secure
            </p>
          </div>
        </div>

        {passwordSuccessMsg && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-2xl flex items-center gap-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{passwordSuccessMsg}</span>
          </div>
        )}

        {passwordErrorMsg && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-center gap-2.5 text-xs font-semibold text-rose-700 dark:text-rose-300 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{passwordErrorMsg}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              New Password (min 8 characters)
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <button
            type="submit"
            disabled={isChangingPassword}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
          >
            {isChangingPassword ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <KeyRound className="w-3.5 h-3.5" />
            )}
            <span>{isChangingPassword ? 'Updating Password...' : 'Update Password'}</span>
          </button>
        </form>
      </div>

      {/* Session Security & Device Control */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Active Sessions & Device Security
            </h2>
            <p className="text-xs text-slate-400">
              Manage your active sessions across browsers and devices
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleLogoutCurrent}
            disabled={isLoggingOutCurrent}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Current Device</span>
          </button>

          <button
            type="button"
            onClick={handleLogoutAll}
            disabled={isLoggingOutAll}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out All Devices</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
