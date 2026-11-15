import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Animated,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import { colors } from './theme';

interface ActionBarProps {
  onCallDriver: () => void;
  onAttendanceHistory: () => void;
  onReferrals: () => void;
  onMorePress: () => void;
  onSettings: () => void;
  onLogout: () => void;
  isLoading?: boolean;
}

export function ActionBar({
  onCallDriver,
  onAttendanceHistory,
  onReferrals,
  onMorePress,
  onSettings,
  onLogout,
  isLoading = false,
}: ActionBarProps) {
  const [expanded, setExpanded] = useState(false);
  const [animValue] = useState(new Animated.Value(0));

  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt: GestureResponderEvent, state: PanResponderGestureState) => {
        return Math.abs(state.dy) > 10; // Only respond to vertical swipes
      },
      onPanResponderMove: (evt: GestureResponderEvent, state: PanResponderGestureState) => {
        // Handle swipe
      },
      onPanResponderRelease: (evt: GestureResponderEvent, state: PanResponderGestureState) => {
        if (state.vy < -0.3) {
          // Swipe up
          expandBar();
        } else if (state.vy > 0.3) {
          // Swipe down
          collapseBar();
        }
      },
    })
  ).current;

  const expandBar = () => {
    setExpanded(true);
    Animated.timing(animValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const collapseBar = () => {
    setExpanded(false);
    Animated.timing(animValue, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const heightInterpolation = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [120, 340],
  });

  return (
    <Animated.View
      style={[styles.container, { height: heightInterpolation }]}
      {...panResponder.panHandlers}
    >
      <View style={styles.dragHandle} />

      {/* Collapsed/Always Visible Buttons */}
      <View style={styles.mainButtons}>
        <TouchableOpacity
          style={styles.button}
          onPress={onCallDriver}
          disabled={isLoading}
        >
          <Text style={styles.buttonEmoji}>📞</Text>
          <Text style={styles.buttonText}>CALL DRIVER</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={onAttendanceHistory}
          disabled={isLoading}
        >
          <Text style={styles.buttonEmoji}>📊</Text>
          <Text style={styles.buttonText}>ATTEND HIST</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={onReferrals}
          disabled={isLoading}
        >
          <Text style={styles.buttonEmoji}>💰</Text>
          <Text style={styles.buttonText}>EARN ₹200</Text>
        </TouchableOpacity>
      </View>

      {/* Expanded Menu Items */}
      {expanded && (
        <View style={styles.expandedMenu}>
          <TouchableOpacity style={styles.menuItem} onPress={onMorePress}>
            <Text style={styles.menuItemText}>⋮ More</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={onSettings}>
            <Text style={styles.menuItemText}>⚙️ Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={onLogout}>
            <Text style={styles.menuItemText}>🚪 Logout</Text>
          </TouchableOpacity>
        </View>
      )}

      {expanded && (
        <TouchableOpacity
          style={styles.collapseButton}
          onPress={collapseBar}
        >
          <Text style={styles.collapseButtonText}>Collapse</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.panel,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.line,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  mainButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.accent,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
  buttonEmoji: {
    fontSize: 20,
  },
  buttonText: {
    color: colors.panel,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  expandedMenu: {
    marginTop: 12,
    gap: 8,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  menuItemText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  collapseButton: {
    marginTop: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  collapseButtonText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
});
