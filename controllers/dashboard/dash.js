const User = require("../../models/User");
const ServiceRequest = require("../../models/ServiceRequest");
const InventionRequest = require("../../models/InventionRequest");
const Payment = require("../../models/Payment");
const Complaint = require("../../models/Complaint");

exports.getDashboard = async (req, res) => {
  try {
    const [
      totalCustomers,
      totalManagers,

      totalServices,
      paidServices,
      unpaidServices,

      inspectionServices,
      consultationServices,
      maintenanceServices,

      totalInventions,
      pendingPaymentInventions,
      paidInventions,
      underReviewInventions,
      approvedInventions,
      rejectedInventions,
      completedInventions,
      cancelledInventions,

      totalPayments,
      paidPayments,
      unpaidPayments,
      failedPayments,
      refundedPayments,

      totalPaidAmount,

      totalComplaints
    ] = await Promise.all([

      // Users
      User.countDocuments({ role: "customer" }),

      User.countDocuments({ role: "manager" }),

      // Services
      ServiceRequest.countDocuments(),

      ServiceRequest.countDocuments({ status: "paid" }),

      ServiceRequest.countDocuments({ status: "unpaid" }),

      ServiceRequest.countDocuments({
        requestType: "inspection"
      }),

      ServiceRequest.countDocuments({
        requestType: "consultation"
      }),

      ServiceRequest.countDocuments({
        requestType: "maintenance"
      }),

      // Inventions
      InventionRequest.countDocuments(),

      InventionRequest.countDocuments({
        status: "pending_payment"
      }),

      InventionRequest.countDocuments({
        status: "paid"
      }),

      InventionRequest.countDocuments({
        status: "under_review"
      }),

      InventionRequest.countDocuments({
        status: "approved"
      }),

      InventionRequest.countDocuments({
        status: "rejected"
      }),

      InventionRequest.countDocuments({
        status: "completed"
      }),

      InventionRequest.countDocuments({
        status: "cancelled"
      }),

      // Payments
      Payment.countDocuments(),

      Payment.countDocuments({
        status: "paid"
      }),

      Payment.countDocuments({
        status: "unpaid"
      }),

      Payment.countDocuments({
        status: "failed"
      }),

      Payment.countDocuments({
        status: "refunded"
      }),

      Payment.aggregate([
        {
          $match: {
            status: "paid"
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" }
          }
        }
      ]),

      // Complaints
      Complaint.countDocuments()
    ]);

    res.status(200).json({
      success: true,

      data: {
        users: {
          totalCustomers,
          totalManagers
        },

        services: {
          total: totalServices,
          paid: paidServices,
          unpaid: unpaidServices,

          inspection: inspectionServices,
          consultation: consultationServices,
          maintenance: maintenanceServices
        },

        inventions: {
          total: totalInventions,
          pendingPayment: pendingPaymentInventions,
          paid: paidInventions,
          underReview: underReviewInventions,
          approved: approvedInventions,
          rejected: rejectedInventions,
          completed: completedInventions,
          cancelled: cancelledInventions
        },

        payments: {
          total: totalPayments,
          paid: paidPayments,
          unpaid: unpaidPayments,
          failed: failedPayments,
          refunded: refundedPayments,
          totalPaidAmount:
            totalPaidAmount[0]?.total || 0
        },

        complaints: {
          total: totalComplaints
        }
      }
    });

  } catch (error) {

    console.error("Dashboard Error:", error);

    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب بيانات الـ Dashboard",
      error: error.message
    });
  }
};