import { NextResponse } from "next/server";
import {
  getRecentNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsRead,
} from "@/lib/notifications-repo";

export async function GET() {
  const [notifications, unreadCount] = await Promise.all([
    getRecentNotifications(),
    getUnreadNotificationsCount(),
  ]);
  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH() {
  await markAllNotificationsRead();
  return NextResponse.json({ ok: true });
}
