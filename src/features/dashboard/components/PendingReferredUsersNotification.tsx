import { useState } from 'react';
import { UserPlus, Users } from 'lucide-react';

export default function PendingReferredUsersNotification() {
    const [count] = useState(5);

    if (count === 0) return null;

    return (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center">
                <UserPlus className="text-blue-600 mr-3 text-xl w-6 h-6" />
                <div>
                <h3 className="text-blue-800 font-semibold">
                    There are {count} users who registered via your referral link waiting for approval
                </h3>
                <p className="text-blue-700 text-sm">
                    Please check and approve users who registered via your referral link
                </p>
                </div>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-150 flex items-center">
                <Users className="mr-2 w-4 h-4" /> View List
            </button>
        </div>
    );
}
