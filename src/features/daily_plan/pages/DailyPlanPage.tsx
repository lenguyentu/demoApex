import React, { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { useAuthStore } from '../../auth/store';
import { supabase } from '../../../lib/supabase';
import { Plus, Trash2 } from 'lucide-react';

interface TaskRow {
  id: string;
  time: string;
  task: string;
  target: string;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const DailyPlanPage = () => {
  const { user } = useAuthStore();

  const [isLocked, setIsLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAfternoon, setIsAfternoon] = useState(false);
  const [dbHasMorning, setDbHasMorning] = useState(false);
  const [dbHasAfternoon, setDbHasAfternoon] = useState(false);

  // Tách làm 2 mảng riêng biệt cho Morning và Afternoon
  const [morningTasks, setMorningTasks] = useState<TaskRow[]>([
    { id: generateId(), time: '8h30 - 9h00', task: 'Create daily plan, check emails', target: '-' },
    { id: generateId(), time: '9h00 - 11h00', task: '', target: '' },
    { id: generateId(), time: '11h00 - 12h00', task: '', target: '' }
  ]);

  const [afternoonTasks, setAfternoonTasks] = useState<TaskRow[]>([
    { id: generateId(), time: '13h00 - 15h00', task: '', target: '' },
    { id: generateId(), time: '15h00 - 17h00', task: '', target: '' },
    { id: generateId(), time: '17h00 - 17h30', task: 'Update database, summarize day', target: '-' }
  ]);
  
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const checkStatus = async () => {
      setIsLoading(true);
      const vnDate = new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const { data: planData } = await supabase
        .from('hh_daily_plans')
        .select('has_morning, has_afternoon')
        .eq('user_id', user.id)
        .eq('plan_date', vnDate)
        .maybeSingle();
        
      const { data: exceptionData } = await supabase
        .from('hh_daily_plan_exceptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('plan_date', vnDate)
        .maybeSingle();

      const hasMorning = planData?.has_morning || false;
      const hasAfternoon = planData?.has_afternoon || false;
      const hasException = !!exceptionData;

      setDbHasMorning(hasMorning);
      setDbHasAfternoon(hasAfternoon);

      const vnTimeStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false });
      const vnTime = new Date(vnTimeStr);
      const currentHour = vnTime.getHours();
      const currentMinute = vnTime.getMinutes();
      
      setIsAfternoon(currentHour >= 12);

      if (user.role === 'Admin') {
        setIsLocked(false);
      } else if (!hasException) {
        if (currentHour >= 9 && (currentHour < 13 || (currentHour === 13 && currentMinute < 20)) && !hasMorning) {
          setIsLocked(true);
          setLockMessage('Morning plan submission deadline (09:00) has passed. Please contact Admin for late submission.');
        } else if ((currentHour > 13 || (currentHour === 13 && currentMinute >= 20)) && !hasAfternoon) {
          setIsLocked(true);
          setLockMessage('Afternoon plan submission deadline (13:20) has passed. Please contact Admin for late submission.');
        } else {
          setIsLocked(false);
        }
      } else {
        setIsLocked(false);
      }
      setIsLoading(false);
    };
    
    checkStatus();
  }, [user?.id]);

  const handleSendReport = async () => {
    const currentHasMorning = isAfternoon ? dbHasMorning : morningTasks.some(t => t.time.trim() !== '' || t.task.trim() !== '' || t.target.trim() !== '');
    const currentHasAfternoon = afternoonTasks.some(t => t.time.trim() !== '' || t.task.trim() !== '' || t.target.trim() !== '');

    if (!currentHasMorning && !currentHasAfternoon) return alert('The board is completely empty, please enter data into at least 1 row!');

    setIsCapturing(true);

    setTimeout(async () => {
      const element = document.getElementById('report-table');
      if (!element) {
        setIsCapturing(false);
        return;
      }

      try {
        if (user?.id) {
          const vnDate = new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().split('T')[0];
          const { error: dbError } = await supabase.from('hh_daily_plans').upsert({
            user_id: user.id,
            plan_date: vnDate,
            has_morning: currentHasMorning,
            has_afternoon: currentHasAfternoon
          }, { onConflict: 'user_id, plan_date' });
          
          if (dbError) console.error('Error saving daily plan:', dbError);
        }

        const canvas = await html2canvas(element, {
          scale: 2,
          backgroundColor: '#ffffff'
        });
        
        canvas.toBlob(async (blob) => {
          setIsCapturing(false);
          if (!blob) return;

          const webhookUrl = import.meta.env.VITE_DISCORD_DAILY_PLAN_WEBHOOK_URL;
          
          if (!webhookUrl) {
            alert('Error: VITE_DISCORD_DAILY_PLAN_WEBHOOK_URL is not configured in .env');
            return;
          }

          const contentMessage = user?.discord_id 
            ? `<@${user.discord_id}> has submitted daily plan!` 
            : `**${user?.full_name || 'A member'}** has submitted daily plan!`;

          const payload: any = { content: contentMessage };
          if (user?.discord_id) payload.allowed_mentions = { users: [user.discord_id] };

          const formData = new FormData();
          formData.append('file', blob, 'daily_report.png');
          formData.append('payload_json', JSON.stringify(payload));

          const response = await fetch(webhookUrl, { method: 'POST', body: formData });
          if (response.ok) alert('Success! Image uploaded to Discord.');
          else alert('Error sending Webhook.');
        }, 'image/png');
        
      } catch (error) {
        console.error('Error creating image:', error);
        setIsCapturing(false);
      }
    }, 150);
  };

  const renderRows = (tasks: TaskRow[], setTasks: React.Dispatch<React.SetStateAction<TaskRow[]>>) => {
    const displayTasks = isCapturing 
      ? tasks.filter(t => t.time.trim() !== '' || t.task.trim() !== '' || t.target.trim() !== '')
      : tasks;

    if (isCapturing && displayTasks.length === 0) {
      return (
        <tr>
          <td colSpan={3} className="border border-gray-300 p-4 text-center text-gray-400 italic">No schedule</td>
        </tr>
      );
    }

    return displayTasks.map((t, index) => (
      <tr key={t.id} className="transition-colors hover:bg-gray-50 focus-within:bg-blue-50 group">
        <td className="border border-gray-300 p-0 h-10 w-1/4 relative">
          {isCapturing ? (
            <div className="px-4 py-2 text-center whitespace-pre-wrap break-words font-medium">{t.time}</div>
          ) : (
            <textarea 
              value={t.time} 
              onChange={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
                const newTasks = [...tasks];
                newTasks[index].time = e.target.value;
                setTasks(newTasks);
              }}
              className="w-full h-full min-h-[40px] px-4 py-2 bg-transparent outline-none text-center resize-none overflow-hidden font-medium"
              placeholder="VD: 9h00 - 10h30"
              rows={1}
            />
          )}
        </td>
        <td className="border border-gray-300 p-0 align-top w-2/4">
          {isCapturing ? (
            <div className="px-4 py-2 whitespace-pre-wrap break-words">{t.task}</div>
          ) : (
            <textarea 
              value={t.task} 
              onChange={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
                const newTasks = [...tasks];
                newTasks[index].task = e.target.value;
                setTasks(newTasks);
              }}
              className="w-full h-full min-h-[40px] px-4 py-2 bg-transparent outline-none resize-none overflow-hidden"
              placeholder="Enter task here..."
              rows={1}
            />
          )}
        </td>
        <td className="border border-gray-300 p-0 align-top w-1/4">
          {isCapturing ? (
            <div className="px-4 py-2 text-center whitespace-pre-wrap break-words">{t.target}</div>
          ) : (
            <textarea 
              value={t.target} 
              onChange={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
                const newTasks = [...tasks];
                newTasks[index].target = e.target.value;
                setTasks(newTasks);
              }}
              className="w-full h-full min-h-[40px] px-4 py-2 bg-transparent outline-none text-center resize-none overflow-hidden"
              placeholder="..."
              rows={1}
            />
          )}
        </td>
        {!isCapturing && (
          <td className="w-10 p-0 align-middle text-center opacity-0 group-hover:opacity-100 transition-opacity absolute right-[-40px] mt-2">
            <button 
              onClick={() => {
                const newTasks = [...tasks];
                newTasks.splice(index, 1);
                setTasks(newTasks);
              }}
              className="p-1.5 text-red-500 hover:bg-red-50 rounded"
              title="Delete row"
            >
              <Trash2 size={16} />
            </button>
          </td>
        )}
      </tr>
    ));
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading Daily Plan configuration...</div>;

  if (isLocked) {
    return (
      <div className="p-8 flex flex-col items-center min-h-[80vh] justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-red-200 text-center max-w-lg">
           <div className="text-4xl mb-4">🔒</div>
           <h1 className="text-2xl font-bold text-red-600 mb-4">SCREEN LOCKED</h1>
           <p className="text-gray-700 text-lg mb-6">{lockMessage}</p>
           <p className="text-sm text-gray-500 italic">System is blocking you from receiving CVs because you haven't submitted your report on time.</p>
        </div>
      </div>
    );
  }

  const isSubmittedForCurrentShift = (!isAfternoon && dbHasMorning) || (isAfternoon && dbHasAfternoon);

  return (
    <div className="p-8 flex flex-col items-center min-h-screen bg-gray-50 pb-32">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Daily Plan Report</h1>
      
      {isSubmittedForCurrentShift ? (
        <div className="w-full max-w-2xl mt-10 p-8 bg-white border border-green-200 rounded-xl shadow-lg flex flex-col items-center justify-center text-center animate-fade-in">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">Report Submitted</h2>
          <p className="text-gray-600 text-lg">
            You have submitted the Daily Plan for the {isAfternoon ? 'Afternoon' : 'Morning'} shift today.
          </p>
          <button 
            onClick={() => {
              if (isAfternoon) setDbHasAfternoon(false);
              else setDbHasMorning(false);
            }}
            className="mt-6 text-brand-600 hover:text-brand-700 underline text-sm font-medium"
          >
            Enter a new report
          </button>
        </div>
      ) : (
      <div className="w-full max-w-4xl flex flex-col items-center">
        
        {/* VÙNG BỊ CHỤP */}
        <div id="report-table" className="p-8 bg-white border border-gray-200 rounded-xl w-full shadow-sm">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wide">
              Daily Plan {new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
            </h2>
            <div className="text-gray-600 mt-2 font-medium">
              Full Name: <span className="text-brand-600">{user?.full_name || 'Loading...'}</span>
            </div>
          </div>
          
          <table className="border-collapse border border-gray-300 text-gray-800 w-full relative">
            <thead>
              <tr className="bg-brand-50">
                <th className="border border-gray-300 px-4 py-3 font-semibold text-brand-800">Time</th>
                <th className="border border-gray-300 px-4 py-3 font-semibold text-brand-800">Task</th>
                <th className="border border-gray-300 px-4 py-3 font-semibold text-brand-800">Target</th>
              </tr>
            </thead>
            <tbody>
              {/* CA SÁNG */}
              {!isAfternoon && (
                <>
                  {!isCapturing && (
                    <tr className="bg-gray-100">
                      <td colSpan={3} className="border border-gray-300 px-4 py-2 font-bold text-gray-700">
                        Morning  (08:30 - 12:00)
                      </td>
                    </tr>
                  )}
                  {renderRows(morningTasks, setMorningTasks)}
                  
                  {!isCapturing && (
                    <tr>
                      <td colSpan={3} className="border border-gray-300 p-0">
                        <button 
                          onClick={() => {
                            const newTasks = [...morningTasks];
                            const newTask = { id: generateId(), time: '', task: '', target: '' };
                            if (newTasks.length > 0) {
                              newTasks.splice(newTasks.length - 1, 0, newTask);
                            } else {
                              newTasks.push(newTask);
                            }
                            setMorningTasks(newTasks);
                          }}
                          className="w-full py-2 flex items-center justify-center gap-2 text-sm text-brand-600 hover:bg-brand-50 transition-colors font-medium"
                        >
                          <Plus size={16} /> Add row
                        </button>
                      </td>
                    </tr>
                  )}
                </>
              )}

              {/* CA CHIỀU */}
              {!isCapturing && (
                <tr className="bg-gray-100">
                  <td colSpan={3} className="border border-gray-300 px-4 py-2 font-bold text-gray-700">
                    Afternoon (13:00 - 17:30)
                  </td>
                </tr>
              )}
              {renderRows(afternoonTasks, setAfternoonTasks)}

              {!isCapturing && (
                <tr>
                  <td colSpan={3} className="border border-gray-300 p-0">
                    <button 
                      onClick={() => {
                        const newTasks = [...afternoonTasks];
                        const newTask = { id: generateId(), time: '', task: '', target: '' };
                        if (newTasks.length > 0) {
                          newTasks.splice(newTasks.length - 1, 0, newTask);
                        } else {
                          newTasks.push(newTask);
                        }
                        setAfternoonTasks(newTasks);
                      }}
                      className="w-full py-2 flex items-center justify-center gap-2 text-sm text-brand-600 hover:bg-brand-50 transition-colors font-medium"
                    >
                      <Plus size={16} /> Add row
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <button 
          onClick={handleSendReport}
          disabled={isCapturing}
          className={`mt-8 px-8 py-3 font-bold rounded-lg transition shadow-md flex items-center justify-center gap-2 ${
            isCapturing 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-brand-600 text-white hover:bg-brand-700 active:scale-95'
          }`}
        >
          {isCapturing ? '⏳ Hiding buttons and capturing image...' : 'Submit Report'}
        </button>
        
        
      </div>
      )}
    </div>
  );
};

export default DailyPlanPage;
