// @ts-nocheck
import React, { useState } from 'react';
// --- MOCK API ---
const changePassword = async (oldPass: string, newPass: string) => {
  return new Promise((resolve) => setTimeout(resolve, 1000));
};
// ----------------
import toast from 'react-hot-toast';
import { Loader2, Lock, Eye, EyeOff } from 'lucide-react';

export const ChangePasswordTab = () => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error("Confirmation password does not match");
            return;
        }

        if (newPassword.length < 6) {
             toast.error("New password must have at least 6 characters");
            return;
        }

        setIsLoading(true);

        try {
            // Now calling with BOTH old and new password
            await changePassword(oldPassword, newPassword);

            toast.success("Password changed successfully");
            
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');

        } catch (error: any) {
            toast.error(error.message || "Current password is not correct");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto py-6">
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                         <div className="p-2 bg-blue-100 rounded-lg">
                            <Lock className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                             <h3 className="font-semibold text-gray-900">Change password</h3>
                             <p className="text-sm text-gray-500">Update a new password for your account</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Current password</label>
                            <input 
                                type="password"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                placeholder="Enter current password"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">New password</label>
                            <div className="relative">
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                         <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Confirm new password</label>
                             <div className="relative">
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Re-enter new password"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 pr-10"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-100">
                        <button 
                            type="submit" 
                            disabled={isLoading} 
                            className="bg-brand-600 hover:bg-brand-700 text-white min-w-[120px] px-4 py-2 rounded-lg font-medium flex items-center justify-center transition-colors disabled:opacity-70"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </form>
             </div>
        </div>
    );
};
