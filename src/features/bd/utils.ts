// Hàm tính toán trạng thái nhắc nhở
export const calculateReminder = (createdAt: string, _lastContactDate: string | null) => {
  const createdDate = new Date(createdAt.split('/').reverse().join('-')); // Convert DD/MM/YYYY to Date
  const today = new Date(); // Use current date
  
  // Các mốc thời gian cần nhắc (tính bằng mili giây)
  const MILESTONES = [7, 15, 30];
  
  // Tìm mốc quan trọng tiếp theo hoặc mốc đang bị trễ
  for (const days of MILESTONES) {
    const targetDate = new Date(createdDate.getTime() + days * 24 * 60 * 60 * 1000);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // const lastContact = lastContactDate ? new Date(lastContactDate.split('/').reverse().join('-')) : null;
    // Logic check lastContact có thể thêm vào đây:
    // ví dụ: if (lastContact && lastContact >= targetDate) continue; // Nếu đã contact sau khi đến hạn thì bỏ qua mốc này
    
    // Nếu targetDate vẫn còn ở tương lai hoặc hôm nay
    if (diffDays >= -5) { // Hiển thị cả những cái vừa trễ 5 ngày
       return {
         date: targetDate.toLocaleDateString('en-GB'), // DD/MM/YYYY
         daysLeft: diffDays,
         milestone: days
       };
    }
  }

  // Nếu quá tất cả các mốc (tức là quá hạn mốc cuối cùng 30 ngày)
  const lastMilestone = MILESTONES[MILESTONES.length - 1];
  const lastTargetDate = new Date(createdDate.getTime() + lastMilestone * 24 * 60 * 60 * 1000);
  const diffTimeLast = lastTargetDate.getTime() - today.getTime();
  const diffDaysLast = Math.ceil(diffTimeLast / (1000 * 60 * 60 * 24));

  return {
    date: lastTargetDate.toLocaleDateString('en-GB'),
    daysLeft: diffDaysLast, // Số âm (quá hạn)
    milestone: lastMilestone
  };
};
