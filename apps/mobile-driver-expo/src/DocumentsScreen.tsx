import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { colors } from './theme';

interface Document {
  id: string;
  title: string;
  type: 'LICENSE' | 'INSURANCE' | 'CONTRACT' | 'INVOICE' | 'TAX_DOC';
  expiryDate?: string;
  status: 'VERIFIED' | 'PENDING' | 'EXPIRED';
  url?: string;
}

interface DocumentsScreenProps {
  documents: Document[];
  onDownload: (docId: string) => void;
  onBack: () => void;
}

export function DocumentsScreen({
  documents,
  onDownload,
  onBack,
}: DocumentsScreenProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return '#16a34a';
      case 'PENDING':
        return '#f97316';
      case 'EXPIRED':
        return '#dc2626';
      default:
        return colors.muted;
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      LICENSE: '📋',
      INSURANCE: '🛡️',
      CONTRACT: '📄',
      INVOICE: '💰',
      TAX_DOC: '💼',
    };
    return icons[type] || '📄';
  };

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.titleDark}>Documents</Text>
      </View>

      <ScrollView contentContainerStyle={styles.stack}>
        {documents.length > 0 ? (
          <View style={styles.section}>
            <FlatList
              data={documents}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.documentCard}>
                  <View style={styles.documentIcon}>
                    <Text style={styles.icon}>{getTypeIcon(item.type)}</Text>
                  </View>
                  <View style={styles.documentInfo}>
                    <Text style={styles.documentTitle}>{item.title}</Text>
                    {item.expiryDate && (
                      <Text style={styles.expiryText}>
                        Expires: {item.expiryDate}
                      </Text>
                    )}
                  </View>
                  <View style={styles.documentActions}>
                    <View style={[styles.statusBadge, { borderColor: getStatusColor(item.status) }]}>
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                      <Text style={[styles.statusLabel, { color: getStatusColor(item.status) }]}>
                        {item.status}
                      </Text>
                    </View>
                    {item.status === 'VERIFIED' && (
                      <TouchableOpacity
                        style={styles.downloadButton}
                        onPress={() => onDownload(item.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.downloadIcon}>↓</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            />
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No documents</Text>
            <Text style={styles.emptyBody}>Your documents will appear here once verified</Text>
          </View>
        )}

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  backButton: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  titleDark: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '700',
  },
  stack: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 20,
  },
  section: {
    gap: 12,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.panel,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 12,
  },
  documentIcon: {
    width: 44,
    height: 44,
    backgroundColor: colors.surface,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
  },
  documentInfo: {
    flex: 1,
    gap: 2,
  },
  documentTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  expiryText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '400',
  },
  documentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  downloadButton: {
    width: 32,
    height: 32,
    backgroundColor: colors.accent + '20',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadIcon: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyCard: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyBody: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
  },
  spacer: {
    height: 20,
  },
});
