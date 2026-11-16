import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { colors } from './theme';

interface Notification {
  id: string;
  childId: string;
  childName: string;
  schoolName?: string;
  eventLabel: string;
  sentAt: Date;
  readAt?: Date;
}

interface NotificationsPanelProps {
  notifications: Notification[];
  onMarkRead?: (notificationId: string) => void;
  onClose?: () => void;
}

/**
 * Display notifications per child.
 * Each child's alerts are shown separately (not lumped by anchor child).
 * Critical for multi-child families to see all their children's status updates.
 */
export function NotificationsPanel({
  notifications,
  onMarkRead,
  onClose,
}: NotificationsPanelProps) {
  const [groupedByChild, setGroupedByChild] = useState<
    Record<string, Notification[]>
  >({});

  useEffect(() => {
    // Group notifications by child
    const grouped = notifications.reduce(
      (acc, notif) => {
        if (!acc[notif.childId]) {
          acc[notif.childId] = [];
        }
        acc[notif.childId].push(notif);
        return acc;
      },
      {} as Record<string, Notification[]>,
    );

    setGroupedByChild(grouped);
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Alerts {unreadCount > 0 && `(${unreadCount} new)`}
        </Text>
        {onClose && (
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.list}>
        {Object.entries(groupedByChild).map(([childId, childNotifs]) => (
          <View key={childId} style={styles.childGroup}>
            <Text style={styles.childName}>
              {childNotifs[0]?.childName || 'Child'}
            </Text>

            {childNotifs
              .sort(
                (a, b) =>
                  new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
              )
              .map((notif) => (
                <TouchableOpacity
                  key={notif.id}
                  style={[
                    styles.notificationCard,
                    !notif.readAt && styles.unread,
                  ]}
                  onPress={() => onMarkRead?.(notif.id)}
                >
                  <View style={styles.notifContent}>
                    <Text
                      style={[
                        styles.notifText,
                        !notif.readAt && styles.unreadText,
                      ]}
                    >
                      {notif.eventLabel}
                    </Text>
                    <Text style={styles.notifTime}>
                      {new Date(notif.sentAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  {!notif.readAt && <View style={styles.unreadDot} />}
                </TouchableOpacity>
              ))}
          </View>
        ))}

        {notifications.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No alerts yet</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  closeBtn: {
    fontSize: 24,
    color: colors.textLight,
  },
  list: {
    flex: 1,
    paddingHorizontal: 12,
  },
  childGroup: {
    marginVertical: 12,
  },
  childName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
    paddingHorizontal: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  notificationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  unread: {
    backgroundColor: '#fffbf0',
    borderLeftColor: colors.success,
  },
  notifContent: {
    flex: 1,
  },
  notifText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: '600',
    color: colors.success,
  },
  notifTime: {
    fontSize: 12,
    color: colors.textLight,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginLeft: 12,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textLight,
  },
});
