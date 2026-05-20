import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ProductEditScreen() {
  return (
    <View style={styles.container}>
      <Text>ProductEditScreen</Text>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', alignItems: 'center' } });
