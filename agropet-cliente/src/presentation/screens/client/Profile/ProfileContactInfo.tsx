import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './ProfileScreen.styles';

type Props = { h: any };

export default function ProfileContactInfo({ h }: Props) {
  return (
    <>
      <View style={styles.infoRow}>
        <Text style={[styles.fieldLabel, { color: h.colors.textDark }]}>Número de telefone cadastrado</Text>
        <View style={[styles.infoBox, { backgroundColor: h.colors.cardBackground }]}>
          <Text style={[styles.infoText, { color: h.phone ? h.colors.textDark : (h.isDarkMode ? '#8E8E93' : '#767676') }]}>{h.phone || 'Nenhum telefone cadastrado'}</Text>
          {h.phoneStatus === 'cadastrar' && (
            <TouchableOpacity onPress={() => { h.setPhoneInput(''); h.setShowPhoneModal(true); }}>
              <Text style={[styles.alterarLink, { color: '#00C853' }]}>Cadastrar</Text>
            </TouchableOpacity>
          )}
          {h.phoneStatus === 'validar' && (
            <TouchableOpacity onPress={() => h.setShowPhoneModal(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: '#FFC107', fontSize: 16, marginRight: 4 }}>!</Text>
              <Text style={[styles.alterarLink, { color: '#FFC107' }]}>Validar</Text>
            </TouchableOpacity>
          )}
          {h.phoneStatus === 'alterar' && (
            <TouchableOpacity onPress={() => { h.setPhoneInput(h.phone); h.setShowPhoneModal(true); }}>
              <Text style={[styles.alterarLink, { color: h.isDarkMode ? '#5B86E5' : '#042A7D' }]}>Alterar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.infoRow}>
        <Text style={[styles.fieldLabel, { color: h.colors.textDark }]}>E-mail cadastrado</Text>
        <View style={[styles.infoBox, { backgroundColor: h.colors.cardBackground }]}>
          <Text style={[styles.infoText, { color: h.email ? h.colors.textDark : (h.isDarkMode ? '#8E8E93' : '#767676') }]}>{h.email || 'meuemail@email.com'}</Text>
          {h.emailStatus === 'validar' ? (
            <TouchableOpacity onPress={() => h.setShowEmailModal(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: '#FFC107', fontSize: 16, marginRight: 4 }}>!</Text>
              <Text style={[styles.alterarLink, { color: '#FFC107' }]}>Validar</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => { h.setEmailInput(h.email); h.setEmailError(''); h.setShowEmailModal(true); }}>
              <Text style={[styles.alterarLink, { color: h.isDarkMode ? '#5B86E5' : '#042A7D' }]}>Alterar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </>
  );
}
