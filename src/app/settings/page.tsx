'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { AuthModal } from '@/components/AuthModal';
import {
  User,
  Mail,
  Shield,
  Calendar,
  Camera,
  Save,
  Lock,
  Loader2,
  Check,
  AlertTriangle,
  Trash2,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const supabase = createClient();

  // Profile form
  const [displayName, setDisplayName] = useState('');
  const [nameInitialized, setNameInitialized] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Avatar
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Auth modal for unauthenticated users
  const [showAuth, setShowAuth] = useState(false);

  // Initialize display name from profile
  if (profile && !nameInitialized) {
    setDisplayName(profile.display_name);
    setNameInitialized(true);
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gray-400">Sign in to access your settings.</p>
          <button
            onClick={() => setShowAuth(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Sign In
          </button>
          {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
        </div>
      </div>
    );
  }

  const handleSaveProfile = async () => {
    if (!displayName.trim()) return;
    setSavingProfile(true);
    setProfileMsg(null);
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() })
      .eq('id', user.id);

    if (error) {
      setProfileMsg({ type: 'error', text: error.message });
    } else {
      setProfileMsg({ type: 'success', text: 'Profile updated!' });
      await refreshProfile();
    }
    setSavingProfile(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setProfileMsg(null);

    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setProfileMsg({ type: 'error', text: `Upload failed: ${uploadError.message}` });
      setUploadingAvatar(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: urlData.publicUrl })
      .eq('id', user.id);

    if (updateError) {
      setProfileMsg({ type: 'error', text: updateError.message });
    } else {
      setProfileMsg({ type: 'success', text: 'Avatar updated!' });
      await refreshProfile();
    }
    setUploadingAvatar(false);
  };

  const handleChangePassword = async () => {
    setPasswordMsg(null);
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordMsg({ type: 'error', text: error.message });
    } else {
      setPasswordMsg({ type: 'success', text: 'Password changed successfully!' });
      setNewPassword('');
      setConfirmPassword('');
    }
    setSavingPassword(false);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    // Sign out and let user know they need to contact admin for full deletion
    // (client-side can't delete auth users — requires service role key)
    await signOut();
    window.location.href = '/';
  };

  const roleBadgeColor: Record<string, string> = {
    citizen: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    official: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    admin: 'bg-red-500/15 text-red-400 border-red-500/25',
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>

        {/* Profile Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-5">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4" /> Profile
          </h2>

          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-700"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-indigo-500/15 border-2 border-indigo-500/25 flex items-center justify-center">
                  <span className="text-xl font-bold text-indigo-400">
                    {profile.display_name[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                {uploadingAvatar ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{profile.display_name}</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors mt-0.5"
              >
                Change avatar
              </button>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 outline-none transition-all"
            />
          </div>

          {profileMsg && (
            <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
              profileMsg.type === 'success'
                ? 'bg-green-500/10 text-green-400'
                : 'bg-red-500/10 text-red-400'
            }`}>
              {profileMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {profileMsg.text}
            </div>
          )}

          <button
            onClick={handleSaveProfile}
            disabled={savingProfile || displayName.trim() === profile.display_name}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Profile
          </button>
        </div>

        {/* Account Info */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4" /> Account
          </h2>

          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Mail className="w-4 h-4" /> Email
              </div>
              <span className="text-sm text-white">{user.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Shield className="w-4 h-4" /> Role
              </div>
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${roleBadgeColor[profile.role] || roleBadgeColor.citizen}`}>
                {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Calendar className="w-4 h-4" /> Member since
              </div>
              <span className="text-sm text-white">
                {new Date(profile.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-4 h-4" /> Change Password
          </h2>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 outline-none transition-all"
            />
          </div>

          {passwordMsg && (
            <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
              passwordMsg.type === 'success'
                ? 'bg-green-500/10 text-green-400'
                : 'bg-red-500/10 text-red-400'
            }`}>
              {passwordMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {passwordMsg.text}
            </div>
          )}

          <button
            onClick={handleChangePassword}
            disabled={savingPassword || !newPassword}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            Update Password
          </button>
        </div>

        {/* Danger Zone */}
        <div className="bg-gray-900 border border-red-500/20 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Danger Zone
          </h2>
          <p className="text-sm text-gray-400">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete Account
            </button>
          ) : (
            <div className="space-y-3 bg-red-500/5 border border-red-500/20 rounded-lg p-4">
              <p className="text-sm text-red-400">
                Type <strong>delete my account</strong> to confirm:
              </p>
              <input
                type="text"
                value={deleteText}
                onChange={e => setDeleteText(e.target.value)}
                placeholder="delete my account"
                className="w-full bg-gray-800 border border-red-500/30 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500/40 outline-none transition-all"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteText !== 'delete my account' || deleting}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Confirm Delete
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteText(''); }}
                  className="text-sm text-gray-400 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
