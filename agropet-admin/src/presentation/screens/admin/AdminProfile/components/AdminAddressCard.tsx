import React from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Animated } from 'react-native';
import { styles } from './AdminAddressCard.styles';

interface AdminAddressCardProps {
  isDarkMode: boolean;
  locationConfirmed: boolean;
  handleSendAddress: () => void;
  showAddressValidationErrors: boolean;
  firstEmptyField: string | null;
  rua: string;
  ruaRef: React.RefObject<any>;
  setRua: (val: string) => void;
  addressErrorOpacity: any;
  addressSuggestions: any[];
  handleSelectAddress: (item: any) => void;
  bairro: string;
  bairroRef: React.RefObject<any>;
  setBairro: (val: string) => void;
  cep: string;
  cepRef: React.RefObject<any>;
  setCep: (val: string) => void;
  numero: string;
  numeroRef: React.RefObject<any>;
  setNumero: (val: string) => void;
}

export default function AdminAddressCard({
  isDarkMode, locationConfirmed, handleSendAddress, showAddressValidationErrors,
  firstEmptyField, rua, ruaRef, setRua, addressErrorOpacity, addressSuggestions,
  handleSelectAddress, bairro, bairroRef, setBairro, cep, cepRef, setCep,
  numero, numeroRef, setNumero
}: AdminAddressCardProps) {
  return (
    <View style={[styles.addressCard, { backgroundColor: isDarkMode ? '#2E2E38' : '#1C2434' }]}>
      <View style={styles.addressHeaderRow}>
        <Text style={styles.addressTitle}>Endereço</Text>
        <TouchableOpacity
          style={[styles.enviarBtn, locationConfirmed ? styles.enviarBtnConfirmed : styles.enviarBtnActive]}
          onPress={handleSendAddress}
          activeOpacity={0.8}
        >
          <Text style={styles.enviarBtnText}>{locationConfirmed ? '✓ Enviado' : 'Enviar'}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.addressFieldGroup, { zIndex: 10 }]}>
        <Text style={styles.addressLabel}>Rua</Text>
        <View style={[
          styles.addressInputBox,
          { backgroundColor: isDarkMode ? '#1E1E24' : '#E3E4EB' },
          (showAddressValidationErrors && !rua.trim()) ? styles.addressInputBoxError : null
        ]}>
          <TextInput
            ref={ruaRef}
            style={[styles.addressInput, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}
            placeholder="Digite sua rua..."
            placeholderTextColor={isDarkMode ? '#8E8E93' : '#919191'}
            value={rua}
            onChangeText={setRua}
          />
          <TouchableOpacity onPress={() => ruaRef.current?.focus()}>
            <Text style={[styles.alterarLinkAddr, { color: isDarkMode ? '#5B86E5' : '#042A7D' }]}>Alterar</Text>
          </TouchableOpacity>
        </View>
        {showAddressValidationErrors && firstEmptyField === 'rua' && (
          <Animated.Text style={[styles.addressErrorText, { opacity: addressErrorOpacity }]}>Preencha todos os campos para continuar</Animated.Text>
        )}
        {addressSuggestions.length > 0 && (
          <ScrollView
            style={[styles.suggestionsDropdown, { backgroundColor: isDarkMode ? '#1E1E24' : '#2A3444' }]}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {addressSuggestions.map((item: any, index: number) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionItem}
                onPress={() => handleSelectAddress(item)}
              >
                <Text style={styles.suggestionText} numberOfLines={2}>{item.display_name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.addressFieldGroup}>
        <Text style={styles.addressLabel}>Bairro</Text>
        <View style={[
          styles.addressInputBox,
          { backgroundColor: isDarkMode ? '#1E1E24' : '#E3E4EB' },
          (showAddressValidationErrors && !bairro.trim()) ? styles.addressInputBoxError : null
        ]}>
          <TextInput
            ref={bairroRef}
            style={[styles.addressInput, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}
            placeholder="Digite seu bairro..."
            placeholderTextColor={isDarkMode ? '#8E8E93' : '#919191'}
            value={bairro}
            onChangeText={setBairro}
          />
          <TouchableOpacity onPress={() => bairroRef.current?.focus()}>
            <Text style={[styles.alterarLinkAddr, { color: isDarkMode ? '#5B86E5' : '#042A7D' }]}>Alterar</Text>
          </TouchableOpacity>
        </View>
        {showAddressValidationErrors && firstEmptyField === 'bairro' && (
          <Animated.Text style={[styles.addressErrorText, { opacity: addressErrorOpacity }]}>Preencha todos os campos para continuar</Animated.Text>
        )}
      </View>

      <View style={styles.row}>
        <View style={[styles.addressFieldGroup, { flex: 1.5, marginRight: 10 }]}>
          <Text style={styles.addressLabel}>CEP</Text>
          <View style={[
            styles.addressInputBox,
            { backgroundColor: isDarkMode ? '#1E1E24' : '#E3E4EB' },
            (showAddressValidationErrors && !cep.trim()) ? styles.addressInputBoxError : null
          ]}>
            <TextInput
              ref={cepRef}
              style={[styles.addressInput, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}
              placeholder="00000-000"
              placeholderTextColor={isDarkMode ? '#8E8E93' : '#919191'}
              value={cep}
              onChangeText={setCep}
            />
            <TouchableOpacity onPress={() => cepRef.current?.focus()}>
              <Text style={[styles.alterarLinkAddr, { color: isDarkMode ? '#5B86E5' : '#042A7D' }]}>Alterar</Text>
            </TouchableOpacity>
          </View>
          {showAddressValidationErrors && firstEmptyField === 'cep' && (
            <Animated.Text style={[styles.addressErrorText, { opacity: addressErrorOpacity }]}>Preencha todos os campos para continuar</Animated.Text>
          )}
        </View>
        <View style={[styles.addressFieldGroup, { flex: 1 }]}>
          <Text style={styles.addressLabel}>Nº</Text>
          <View style={[
            styles.addressInputBox,
            { backgroundColor: isDarkMode ? '#1E1E24' : '#E3E4EB' },
            (showAddressValidationErrors && !numero.trim()) ? styles.addressInputBoxError : null
          ]}>
            <TextInput
              ref={numeroRef}
              style={[styles.addressInput, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}
              placeholder="Nº"
              placeholderTextColor={isDarkMode ? '#8E8E93' : '#919191'}
              value={numero}
              onChangeText={setNumero}
              keyboardType="numeric"
            />
            <TouchableOpacity onPress={() => numeroRef.current?.focus()}>
              <Text style={[styles.alterarLinkAddr, { color: isDarkMode ? '#5B86E5' : '#042A7D' }]}>Alterar</Text>
            </TouchableOpacity>
          </View>
          {showAddressValidationErrors && firstEmptyField === 'numero' && (
            <Animated.Text style={[styles.addressErrorText, { opacity: addressErrorOpacity }]}>Preencha todos os campos para continuar</Animated.Text>
          )}
        </View>
      </View>

      <Text style={[styles.obsText, { fontWeight: 'bold', color: '#FFFFFF', marginTop: 10, fontSize: 14 }]}>
        Obs: É aqui que os clientes verão a localização da sua loja!
      </Text>
    </View>
  );
}
