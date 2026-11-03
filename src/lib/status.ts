import type { InfluencerStatus } from "./types";

export const STATUS_LABEL: Record<InfluencerStatus, string> = {
  pending: "قيد المراجعة",
  approved: "مقبول",
  rejected: "مرفوض",
  banned: "محظور",
};

/**
 * التحويلات المسموحة عبر تغيير الحالة العادي. المقبول لا يُرفض أبداً — خياره الوحيد الحظر (بسبب)،
 * والحظر ورفعه لهما دالتان مخصصتان (banInfluencer / unbanInfluencer) لأن رفع الحظر يمدّد الباقة.
 */
export const ALLOWED_TRANSITIONS: Record<InfluencerStatus, InfluencerStatus[]> = {
  pending: ["approved", "rejected"],
  approved: [],
  rejected: ["approved"],
  banned: [],
};
