export const MOCK_JOBS = [
  {
    id: "job-1",
    job_id: "TD1029",
    position_title: "Senior Fullstack Engineer (React/Node.js)",
    number_of_employees: 2,
    clients: { id: "client-1", client_name: "TechNova Solutions" },
    interview_rounds: 3,
    min_monthly_salary: "$ 2500",
    max_monthly_salary: "4000",
    work_location: "Quận 1, TP. Hồ Chí Minh",
    warranty_period_days: 60,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    is_urgent: true,
    status: "Open",
    job_summary: `
      <p>Chúng tôi đang tìm kiếm một <strong>Senior Fullstack Engineer</strong> đam mê công nghệ để gia nhập đội ngũ phát triển sản phẩm cốt lõi. Bạn sẽ đóng vai trò quan trọng trong việc thiết kế và xây dựng hệ thống quy mô lớn, phục vụ hàng triệu người dùng.</p>
      <p><strong>Trách nhiệm chính:</strong></p>
      <ul style="list-style-type: disc; padding-left: 20px; line-height: 1.6;">
        <li>Thiết kế, phát triển và bảo trì các tính năng frontend sử dụng <strong>React.js</strong> và backend sử dụng <strong>Node.js</strong>.</li>
        <li>Phân tích yêu cầu hệ thống, đề xuất các giải pháp kiến trúc phần mềm tối ưu và scalable.</li>
        <li>Review code, hướng dẫn và định hướng kỹ thuật cho các thành viên Junior/Mid-level trong team.</li>
        <li>Làm việc chặt chẽ với Product Manager và QA để đảm bảo chất lượng sản phẩm tốt nhất trước khi release.</li>
      </ul>
    `,
    requirements: `
      <p>Để thành công ở vị trí này, bạn cần có:</p>
      <ul style="list-style-type: disc; padding-left: 20px; line-height: 1.6;">
        <li>Ít nhất <strong>4 năm kinh nghiệm</strong> làm việc ở vị trí Fullstack Developer.</li>
        <li>Thành thạo Javascript/Typescript, React.js, Node.js (Express/NestJS).</li>
        <li>Có kinh nghiệm làm việc với cơ sở dữ liệu quan hệ (PostgreSQL, MySQL) và NoSQL (MongoDB, Redis).</li>
        <li>Hiểu biết sâu sắc về RESTful API, GraphQL và kiến trúc Microservices.</li>
        <li>Có kinh nghiệm triển khai ứng dụng trên nền tảng Cloud (AWS/GCP), sử dụng Docker/Kubernetes là một lợi thế cực lớn.</li>
        <li>Kỹ năng giải quyết vấn đề xuất sắc, khả năng giao tiếp và làm việc nhóm tốt.</li>
      </ul>
    `,
    jd_clear: `
      <p><strong>Chính sách đãi ngộ:</strong></p>
      <ul style="list-style-type: disc; padding-left: 20px; line-height: 1.6;">
        <li>Mức lương hấp dẫn từ <strong>$2500 - $4000</strong>, thỏa thuận theo năng lực.</li>
        <li>Lương tháng 13 + Thưởng hiệu suất dự án hàng quý (lên đến 2 tháng lương/năm).</li>
        <li>Review tăng lương 2 lần/năm dựa trên năng lực và đóng góp.</li>
        <li>Gói bảo hiểm sức khỏe toàn diện (Bảo Việt Healthcare) cho nhân viên và người thân.</li>
        <li>Cấp sẵn Macbook Pro M2/M3 mới nhất và màn hình rời để làm việc.</li>
        <li>Môi trường làm việc linh hoạt (Hybrid làm việc ở nhà 2 ngày/tuần), không yêu cầu trang phục khắt khe.</li>
        <li>Du lịch công ty hàng năm tại resort 5 sao, các hoạt động teambuilding sôi nổi hàng tháng.</li>
      </ul>
    `
  },
  {
    id: "job-2",
    job_id: "TD1030",
    position_title: "Product Marketing Manager",
    number_of_employees: 1,
    clients: { id: "client-2", client_name: "FinTech Asia" },
    interview_rounds: 2,
    min_monthly_salary: "40M",
    max_monthly_salary: "60M",
    work_location: "Cầu Giấy, Hà Nội",
    warranty_period_days: 60,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    is_urgent: false,
    status: "Open",
    job_summary: `
      <p>FinTech Asia đang tìm kiếm một <strong>Product Marketing Manager</strong> tài năng để dẫn dắt chiến lược ra mắt sản phẩm và định vị thương hiệu trên thị trường Đông Nam Á.</p>
      <p><strong>Mô tả chi tiết:</strong></p>
      <ul style="list-style-type: disc; padding-left: 20px; line-height: 1.6;">
        <li>Nghiên cứu thị trường, phân tích đối thủ cạnh tranh để xác định lợi thế bán hàng độc nhất (USP) của sản phẩm.</li>
        <li>Lập kế hoạch và thực thi chiến lược GTM (Go-To-Market) cho các tính năng và sản phẩm mới.</li>
        <li>Xây dựng thông điệp truyền thông, tài liệu bán hàng (sales kit, pitch deck, case studies) phối hợp cùng team Design và Content.</li>
        <li>Phối hợp chặt chẽ với team Product, Sales và Customer Success để đảm bảo thông điệp sản phẩm nhất quán trên mọi điểm chạm.</li>
      </ul>
    `,
    requirements: `
      <p><strong>Yêu cầu ứng viên:</strong></p>
      <ul style="list-style-type: disc; padding-left: 20px; line-height: 1.6;">
        <li>Từ 3-5 năm kinh nghiệm trong lĩnh vực Marketing, trong đó có ít nhất 2 năm làm Product Marketing cho các công ty B2B/SaaS hoặc FinTech.</li>
        <li>Kỹ năng kể chuyện (storytelling) và tư duy phân tích dữ liệu xuất sắc.</li>
        <li>Thành thạo tiếng Anh (IELTS 6.5 trở lên), có khả năng viết và giao tiếp lưu loát với đối tác quốc tế.</li>
        <li>Nhạy bén với thị trường tài chính và công nghệ, luôn cập nhật các xu hướng mới.</li>
        <li>Có tư duy làm việc độc lập và chịu được áp lực cao trong môi trường startup nhịp độ nhanh.</li>
      </ul>
    `,
    jd_clear: `
      <p><strong>Phúc lợi dành cho bạn:</strong></p>
      <ul style="list-style-type: disc; padding-left: 20px; line-height: 1.6;">
        <li>Thu nhập cạnh tranh từ <strong>40,000,000 - 60,000,000 VNĐ/tháng</strong> + Thưởng kinh doanh.</li>
        <li>Được cung cấp ngân sách dồi dào để thực thi các chiến dịch marketing đột phá.</li>
        <li>Tham gia các khóa đào tạo nâng cao chuyên môn do công ty tài trợ.</li>
        <li>Bảo hiểm sức khỏe cao cấp, khám sức khỏe định kỳ hàng năm.</li>
        <li>Thời gian làm việc linh hoạt, tập trung vào hiệu quả và kết quả thay vì số giờ chấm công.</li>
      </ul>
    `
  },
  {
    id: "job-3",
    job_id: "TD1031",
    position_title: "Data Engineer (AWS/Snowflake)",
    number_of_employees: 3,
    clients: { id: "client-1", client_name: "Global E-commerce Corp" },
    interview_rounds: 3,
    min_monthly_salary: "$ 2000",
    max_monthly_salary: "3500",
    work_location: "Đà Nẵng",
    warranty_period_days: 60,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    is_urgent: true,
    status: "Open",
    job_summary: `
      <p>Trở thành thành viên chủ chốt của đội ngũ Data Data Engineer tại tập đoàn thương mại điện tử hàng đầu, xử lý hàng Terabyte dữ liệu mỗi ngày.</p>
      <p><strong>Công việc của bạn:</strong></p>
      <ul style="list-style-type: disc; padding-left: 20px; line-height: 1.6;">
        <li>Thiết kế, xây dựng và tối ưu hóa các Data Pipelines (ETL/ELT) sử dụng Python, Spark, và Airflow.</li>
        <li>Quản lý và phát triển Data Warehouse hiện đại trên nền tảng <strong>Snowflake</strong> và <strong>AWS (S3, Redshift, Glue)</strong>.</li>
        <li>Hợp tác với Data Scientists và Data Analysts để chuẩn bị dữ liệu phục vụ cho các mô hình Machine Learning và Dashboard báo cáo.</li>
        <li>Đảm bảo tính bảo mật, toàn vẹn và chất lượng dữ liệu trong toàn bộ hệ thống.</li>
      </ul>
    `,
    requirements: `
      <p><strong>Bạn cần đáp ứng:</strong></p>
      <ul style="list-style-type: disc; padding-left: 20px; line-height: 1.6;">
        <li>Tốt nghiệp Đại học khối ngành CNTT, Toán tin hoặc liên quan.</li>
        <li>Tối thiểu 3 năm kinh nghiệm thực chiến ở vị trí Data Engineer.</li>
        <li>Thành thạo lập trình <strong>Python</strong> và <strong>Advanced SQL</strong>.</li>
        <li>Kinh nghiệm chuyên sâu với ít nhất một hệ sinh thái Cloud (ưu tiên AWS) và các công cụ quản lý workflow (Airflow/Luigi).</li>
        <li>Có kinh nghiệm thực tế với Snowflake hoặc Databricks là một điểm cộng lớn.</li>
        <li>Kỹ năng giao tiếp tiếng Anh tốt để làm việc trực tiếp với đội ngũ kỹ sư tại Châu Âu và Mỹ.</li>
      </ul>
    `,
    jd_clear: `
      <p><strong>Lợi ích khi gia nhập:</strong></p>
      <ul style="list-style-type: disc; padding-left: 20px; line-height: 1.6;">
        <li>Mức lương từ <strong>$2000 - $3500</strong> tùy theo năng lực đánh giá qua bài test.</li>
        <li>Thưởng signing bonus (1 tháng lương) cho ứng viên nhận việc trong tháng này.</li>
        <li>Gói trợ cấp chuyển vùng (Relocation package) 20 triệu VNĐ cho ứng viên từ tỉnh thành khác đến Đà Nẵng làm việc.</li>
        <li>Môi trường quốc tế 100%, cơ hội giao lưu học hỏi với các chuyên gia dữ liệu hàng đầu.</li>
        <li>Bảo hiểm cao cấp cho bản thân và gia đình, ngày phép 15 ngày/năm.</li>
      </ul>
    `
  },
  {
    id: "job-4",
    job_id: "TD1032",
    position_title: "Head of Talent Acquisition",
    number_of_employees: 1,
    clients: { id: "client-2", client_name: "NextGen Logistics" },
    interview_rounds: 4,
    min_monthly_salary: "60M",
    max_monthly_salary: "100M",
    work_location: "Quận 3, TP. Hồ Chí Minh",
    warranty_period_days: 90,
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    is_urgent: false,
    status: "Open",
    job_summary: `
      <p>Chúng tôi cần tìm một nhà lãnh đạo chiến lược để định hình tương lai của đội ngũ nhân sự tại NextGen Logistics, giúp công ty mở rộng quy mô từ 500 lên 1000 nhân sự trong năm tới.</p>
      <p><strong>Nhiệm vụ chính:</strong></p>
      <ul style="list-style-type: disc; padding-left: 20px; line-height: 1.6;">
        <li>Xây dựng và thực thi chiến lược Tuyển dụng tổng thể, định vị thương hiệu nhà tuyển dụng (Employer Branding) mạnh mẽ trên thị trường.</li>
        <li>Quản lý, đào tạo và phát triển đội ngũ TA (khoảng 10-15 người) hiệu suất cao.</li>
        <li>Tối ưu hóa phễu tuyển dụng, cải tiến quy trình ứng tuyển để nâng cao trải nghiệm ứng viên (Candidate Experience).</li>
        <li>Xây dựng network mạnh lưới với các trường Đại học, đối tác tuyển dụng và cộng đồng chuyên môn.</li>
        <li>Báo cáo trực tiếp cho CHRO và tham mưu chiến lược nhân sự dài hạn cho Ban Giám đốc.</li>
      </ul>
    `,
    requirements: `
      <p><strong>Yêu cầu công việc:</strong></p>
      <ul style="list-style-type: disc; padding-left: 20px; line-height: 1.6;">
        <li>Có tối thiểu 7 năm kinh nghiệm trong lĩnh vực Tuyển dụng, trong đó ít nhất 3 năm ở vị trí quản lý cấp cao (TA Manager / Head of TA).</li>
        <li>Có track record chứng minh khả năng mở rộng quy mô tổ chức (scale up) thành công ở các công ty quy mô lớn hoặc startup công nghệ.</li>
        <li>Tư duy dữ liệu (Data-driven mindset), nhạy bén trong việc sử dụng hệ thống ATS và phân tích các chỉ số tuyển dụng.</li>
        <li>Kỹ năng lãnh đạo, truyền cảm hứng và quản trị sự thay đổi xuất sắc.</li>
        <li>Tiếng Anh lưu loát, phong thái chuyên nghiệp và giao tiếp thuyết phục.</li>
      </ul>
    `,
    jd_clear: `
      <p><strong>Gói đãi ngộ siêu hấp dẫn:</strong></p>
      <ul style="list-style-type: disc; padding-left: 20px; line-height: 1.6;">
        <li>Thu nhập cạnh tranh: Lương cứng <strong>60 - 100 triệu/tháng</strong> + Thưởng KPIs + Cổ phiếu thưởng (ESOP) hàng năm.</li>
        <li>Trợ cấp xe ô tô đi lại và công tác phí.</li>
        <li>Tham gia các khóa đào tạo lãnh đạo cấp cao trong và ngoài nước.</li>
        <li>Thời gian làm việc linh hoạt, tôn trọng không gian cá nhân.</li>
        <li>Chế độ chăm sóc sức khỏe Premium VIP dành riêng cho cấp quản lý.</li>
      </ul>
    `
  }
];
