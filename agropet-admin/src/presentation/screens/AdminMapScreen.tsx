import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AdminMapScreen() {
  return (
    <View style={styles.container}>
      <Text>AdminMapScreen</Text>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', alignItems: 'center' } });
