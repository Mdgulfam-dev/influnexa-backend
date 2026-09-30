import cron from "node-cron";
import AdminUser from "../models/AdminUser.js";
import AdminLoginHistory from "../models/AdminLoginHistory.js";

export function startAdminAutoLogout() {
  // Runs every day at exactly 12:00 AM
  // Asia/Kolkata = Indian Standard Time
  cron.schedule(
    "0 0 * * *",
    async () => {
      try {
        console.log("Running automatic admin logout...");

        const activeUsers = await AdminUser.find({
          status: "active",
          sessionTokenHash: {
            $exists: true,
            $ne: null,
          },
        });

        for (const user of activeUsers) {
          // Find the latest login for this user
          const latestLogin = await AdminLoginHistory.findOne({
            adminUser: user._id,
            action: "login",
          }).sort({ createdAt: -1 });

          let durationMinutes = null;

          if (latestLogin) {
            durationMinutes = Math.max(
              0,
              Math.round(
                (Date.now() - new Date(latestLogin.createdAt).getTime()) /
                  60000
              )
            );
          }

          // Create automatic logout history
          await AdminLoginHistory.create({
            adminUser: user._id,
            action: "logout",
            durationMinutes,
          });

          // Invalidate current session
          user.sessionTokenHash = undefined;
          await user.save();

          console.log(
            `Auto logged out: ${user.email}`
          );
        }

        console.log("Automatic admin logout completed.");
      } catch (error) {
        console.error(
          "ADMIN AUTO LOGOUT ERROR:",
          error
        );
      }
    },
    {
      timezone: "Asia/Kolkata",
    }
  );

  console.log(
    "Admin automatic midnight logout scheduler started."
  );
}