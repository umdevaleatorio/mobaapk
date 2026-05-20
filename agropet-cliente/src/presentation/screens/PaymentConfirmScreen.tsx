import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PaymentConfirmScreen() {
  return (
    <View style={styles.container}>
      <Text>PaymentConfirmScreen</Text>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', alignItems: 'center' } });
