const nodemailer = require("nodemailer");
const Complaint = require("../models/Complaint");

// إنشاء شكوى
exports.createComplaint = async (req, res) => {
  try {
    const {
      name,
      phone,
      type,
      title,
      details,
    } = req.body;

    // Validation
    if (!name || !phone || !type || !title || !details) {
      return res.status(400).json({
        success: false,
        message: "جميع البيانات مطلوبة",
      });
    }

    // إنشاء الشكوى
    const complaint = await Complaint.create({
      name,
      phone,
      type,
      title,
      details,
    });

    // إعداد البريد
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // إرسال الإيميل
const info = await transporter.sendMail({
  from: `"نظام الشكاوى" <${process.env.EMAIL_USER}>`,
  to: "hanywilliam1000@gmail.com",
  subject: `شكوى جديدة - ${title}`,

  html: `
    <div dir="rtl" style="font-family: Arial, sans-serif;">
      <h2>شكوى جديدة</h2>

      <p><strong>اسم العميل:</strong> ${name}</p>
      <p><strong>رقم الهاتف:</strong> ${phone}</p>
      <p><strong>نوع المعاملة:</strong> ${type}</p>
      <p><strong>العنوان:</strong> ${title}</p>

      <p><strong>التفاصيل:</strong></p>
      <div style="background:#f5f5f5;padding:15px;">
        ${details}
      </div>

      <p>
        <strong>التاريخ:</strong>
        ${new Date().toLocaleString("ar-EG")}
      </p>
    </div>
  `,
});

console.log("EMAIL SENT:", info);
    return res.status(201).json({
      success: true,
      message: "تم إرسال الشكوى بنجاح",
      data: complaint,
    });

  } catch (error) {
    console.error("Create Complaint Error:", error);

    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء إرسال الشكوى",
      error: error.message,
    });
  }
};


// جلب شكاوى العميل برقم الهاتف
exports.getComplaints= async (req, res) => {
  try {
    const { id } = req.params;

    let {
      page = 1,
      limit = 10,
    } = req.query;

    page = Math.max(parseInt(page) || 1, 1);
    limit = Math.min(
      Math.max(parseInt(limit) || 10, 1),
      100
    );



    const skip = (page - 1) * limit;

    // عدد الشكاوى
    const total = await Complaint.countDocuments({
     
    });

    // الشكاوى
    const complaints = await Complaint.find({

    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,

      data: complaints,

      pagination: {
        currentPage: page,
        limit,
        total,
        totalPages,

        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });

  } catch (error) {
    console.error("Get Complaints Error:", error);

    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب الشكاوى",
      error: error.message,
    });
  }
};