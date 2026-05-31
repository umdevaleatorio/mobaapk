import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../AdminProfileScreen.styles';

interface Props {
  phone: string;
  phoneStatus: 'cadastrar' | 'validar' | 'alterar';
  setPhoneInput: (v: string) => void;
  setShowPhoneModal: (v: boolean) => void;
  email: string;
  emailStatus: 'validar' | 'alterar';
  setEmailInput: (v: string) => void;
  setEmailError: (v: string) => void;
  setShowEmailModal: (v: boolean) => void;
  isDarkMode: boolean;
  colors: any;
}

export default function ProfileInfoCard({
  phone, phoneStatus, setPhoneInput, setShowPhoneModal,
  email, emailStatus, setEmailInput, setEmailError, setShowEmailModal,
  isDarkMode, colors,
}: Props) {
  return (
    <>
      <View style={styles.infoRow}>
        <Text style={[styles.fieldLabel, { color: colors.textDark }]}>Número de telefone cadastrado</Text>
        <View style={[styles.infoBox, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.infoText, { color: phone ? colors.textDark : (isDarkMode ? '#8E8E93' : '#767676') }]}>{phone || 'Nenhum telefone cadastrado'}</Text>
          {phoneStatus === 'cadastrar' && (
            <TouchableOpacity onPress={() => { setPhoneInput(''); setShowPhoneModal(true); }}>
              <Text style={[styles.alterarLink, { color: '#00C853' }]}>Cadastrar</Text>
            </TouchableOpacity>
          )}
          {phoneStatus === 'validar' && (
            <TouchableOpacity onPress={() => setShowPhoneModal(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: '#FFC107', fontSize: 16, marginRight: 4 }}>!</Text>
              <Text style={[styles.alterarLink, { color: '#FFC107' }]}>Validar</Text>
            </TouchableOpacity>
          )}
          {phoneStatus === 'alterar' && (
            <TouchableOpacity onPress={() => { setPhoneInput(phone); setShowPhoneModal(true); }}>
              <Text style={[styles.alterarLink, { color: isDarkMode ? '#5B86E5' : '#042A7D' }]}>Alterar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.infoRow}>
        <Text style={[styles.fieldLabel, { color: colors.textDark }]}>E-mail cadastrado</Text>
        <View style={[styles.infoBox, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.infoText, { color: email ? colors.textDark : (isDarkMode ? '#8E8E93' : '#767676') }]}>{email || 'meuemail@email.com'}</Text>
          {emailStatus === 'validar' ? (
            <TouchableOpacity onPress={() => setShowEmailModal(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: '#FFC107', fontSize: 16, marginRight: 4 }}>!</Text>
              <Text style={[styles.alterarLink, { color: '#FFC107' }]}>Validar</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => { setEmailInput(email); setEmailError(''); setShowEmailModal(true); }}>
              <Text style={[styles.alterarLink, { color: isDarkMode ? '#5B86E5' : '#042A7D' }]}>Alterar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </>
  );
}
