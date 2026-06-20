import { useEffect, useState } from 'react';
import { Plus, Megaphone, Edit, Trash2, Eye } from 'lucide-react';
import { getCampaigns, deleteCampaign, type Campaign } from '../api';
import { CampaignModal } from '../components/CampaignModal';
import { CampaignLeaderboardModal } from '../components/CampaignLeaderboardModal';

export const CampaignsPage = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | undefined>();
  const [selectedLeaderboardId, setSelectedLeaderboardId] = useState<string | null>(null);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await getCampaigns();
      setCampaigns(data);
    } catch (error) {
      console.error('Failed to load campaigns', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const handleEdit = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedCampaign(undefined);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      try {
        await deleteCampaign(id);
        await loadCampaigns();
      } catch (error) {
        console.error('Delete failed', error);
      }
    }
  };

  return (
    <div className="p-6 h-[calc(100vh-64px)] overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="text-brand-600" />
            Campaigns Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage dynamic reward campaigns for freelancers</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
        >
          <Plus size={18} />
          New Campaign
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
          <div className="overflow-auto flex-1 custom-scrollbar">
            <table className="w-full text-left relative">
              <thead className="bg-gray-50/90 border-b border-gray-200 text-sm text-gray-500 uppercase sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                <th className="px-6 py-4 font-medium">Campaign Name</th>
                <th className="px-6 py-4 font-medium">Metric</th>
                <th className="px-6 py-4 font-medium">Reward</th>
                <th className="px-6 py-4 font-medium">Duration</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No campaigns found. Create one to get started.
                  </td>
                </tr>
              ) : (
                campaigns.map(campaign => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{campaign.title}</div>
                      {campaign.subtitle && <div className="text-sm text-gray-500">{campaign.subtitle}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium">
                        {campaign.metric_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-green-600">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(campaign.reward_amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div><span className="text-gray-400 w-12 inline-block">Apply:</span> {new Date(campaign.apply_start_date).toLocaleDateString()} - {new Date(campaign.apply_end_date).toLocaleDateString()}</div>
                      <div><span className="text-gray-400 w-12 inline-block">Show:</span> {new Date(campaign.display_start_date).toLocaleDateString()} - {new Date(campaign.display_end_date).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${campaign.status === 'Active' ? 'bg-green-100 text-green-800' : 
                          campaign.status === 'Draft' ? 'bg-gray-100 text-gray-800' : 
                          'bg-blue-100 text-blue-800'}`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedLeaderboardId(campaign.id)}
                          className="p-2 text-gray-400 hover:text-brand-600 transition"
                          title="View Leaderboard"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(campaign)}
                          className="p-2 text-gray-400 hover:text-brand-600 transition"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(campaign.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <CampaignModal
          campaign={selectedCampaign}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            loadCampaigns();
          }}
        />
      )}

      <CampaignLeaderboardModal
        isOpen={!!selectedLeaderboardId}
        campaignId={selectedLeaderboardId || ''}
        onClose={() => setSelectedLeaderboardId(null)}
      />
    </div>
  );
};
