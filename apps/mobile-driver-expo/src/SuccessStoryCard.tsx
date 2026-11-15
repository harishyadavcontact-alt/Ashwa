import type { SuccessStory } from '@ashwa/shared';
import React, { useState } from 'react';
import {
  Button,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from './theme';

interface SuccessStoryCardProps {
  story: SuccessStory;
  onShare?: (story: SuccessStory) => void;
}

export function SuccessStoryCard({ story, onShare }: SuccessStoryCardProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleShare = () => {
    if (onShare) {
      onShare(story);
    }
  };

  return (
    <>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.driverInfo}>
            {story.driverPhotoUrl && (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{story.driverName.charAt(0)}</Text>
              </View>
            )}
            <View style={styles.nameContainer}>
              <Text style={styles.driverName}>{story.driverName}</Text>
              <Text style={styles.subtitle}>
                From Driver to Owner in {story.metrics.monthsToOwner} months
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.metricsContainer}>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>{story.metrics.familiesServed}</Text>
            <Text style={styles.metricLabel}>Families</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>${story.metrics.monthlyIncome}</Text>
            <Text style={styles.metricLabel}>Income</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>{story.metrics.hiredDrivers}</Text>
            <Text style={styles.metricLabel}>Drivers Hired</Text>
          </View>
        </View>

        <Text style={styles.cardTitle}>{story.title}</Text>
        <Text style={styles.excerpt} numberOfLines={2}>
          {story.content}
        </Text>

        <View style={styles.actions}>
          <Button
            title="See How"
            onPress={() => setIsModalVisible(true)}
            color={colors.accent}
          />
          <Button
            title="Share"
            onPress={handleShare}
            color={colors.accent}
          />
        </View>
      </View>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Button title="Close" onPress={() => setIsModalVisible(false)} />
            <Text style={styles.modalTitle}>{story.title}</Text>
            <Button
              title="Share"
              onPress={handleShare}
              color={colors.accent}
            />
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalDriverInfo}>
              <View style={styles.largeAvatar}>
                <Text style={styles.largeAvatarText}>{story.driverName.charAt(0)}</Text>
              </View>
              <Text style={styles.modalDriverName}>{story.driverName}</Text>
              <Text style={styles.modalSubtitle}>
                From Driver to Owner in {story.metrics.monthsToOwner} months
              </Text>
            </View>

            <View style={styles.storyBody}>
              <Text style={styles.storyContent}>{story.content}</Text>

              {story.quote && (
                <View style={styles.quoteContainer}>
                  <Text style={styles.quote}>"{story.quote}"</Text>
                  <Text style={styles.quoteAuthor}>— {story.driverName}</Text>
                </View>
              )}

              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValueLarge}>{story.metrics.familiesServed}</Text>
                  <Text style={styles.metricLabelLarge}>Families Served</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValueLarge}>{story.metrics.referralsCount}</Text>
                  <Text style={styles.metricLabelLarge}>Referrals Sent</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValueLarge}>${story.metrics.monthlyIncome}</Text>
                  <Text style={styles.metricLabelLarge}>Monthly Income</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValueLarge}>{story.metrics.hiredDrivers}</Text>
                  <Text style={styles.metricLabelLarge}>Drivers Hired</Text>
                </View>
              </View>

              {story.milestones.length > 0 && (
                <View style={styles.milestonesSection}>
                  <Text style={styles.sectionTitle}>Journey</Text>
                  {story.milestones.map((milestone, index) => (
                    <View key={index} style={styles.milestone}>
                      <View style={styles.milestoneMarker}>
                        <Text style={styles.milestoneMonth}>Month {milestone.month}</Text>
                      </View>
                      <View style={styles.milestoneContent}>
                        <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                        <Text style={styles.milestoneDescription}>
                          {milestone.description}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.panel,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 12,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  driverInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.panel,
    fontSize: 24,
    fontWeight: '700',
  },
  nameContainer: {
    flex: 1,
  },
  driverName: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#f0f4f8',
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  metricValue: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '700',
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  excerpt: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.panel,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    gap: 12,
  },
  modalTitle: {
    flex: 1,
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 20,
  },
  modalDriverInfo: {
    alignItems: 'center',
    gap: 10,
  },
  largeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeAvatarText: {
    color: colors.panel,
    fontSize: 40,
    fontWeight: '700',
  },
  modalDriverName: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '700',
  },
  modalSubtitle: {
    color: colors.muted,
    fontSize: 14,
  },
  storyBody: {
    gap: 16,
  },
  storyContent: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 24,
  },
  quoteContainer: {
    backgroundColor: '#f0f4f8',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    gap: 8,
  },
  quote: {
    color: colors.ink,
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  quoteAuthor: {
    color: colors.muted,
    fontSize: 13,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f0f4f8',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    gap: 6,
  },
  metricValueLarge: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: '700',
  },
  metricLabelLarge: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
  },
  milestonesSection: {
    gap: 12,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  milestone: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
  },
  milestoneMarker: {
    width: 60,
    alignItems: 'center',
    paddingTop: 4,
  },
  milestoneMonth: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  milestoneContent: {
    flex: 1,
    borderLeftWidth: 2,
    borderLeftColor: colors.accent,
    paddingLeft: 12,
  },
  milestoneTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  milestoneDescription: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
});
