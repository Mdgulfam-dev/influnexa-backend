import AdminUser, { hashToken } from "../models/AdminUser.js";

export async function requireAdmin(req, res, next) {
  const adminToken = process.env.ADMIN_TOKEN;
  const providedToken = req.get("x-admin-token");

  if (!providedToken) {
    return res.status(401).json({ message: "Admin token is required." });
  }

  try {
    const user = await AdminUser.findOne({
      sessionTokenHash: hashToken(providedToken),
      status: "active",
    });

    if (user) {
      req.adminUser = user;
      return next();
    }

    if (adminToken && providedToken === adminToken) {
      req.adminUser = { role: "owner", name: "Bootstrap Admin", email: "bootstrap@influnexa.local" };
      return next();
    }

    return res.status(401).json({ message: "Admin token is required." });
  } catch (error) {
    return next(error);
  }
}
