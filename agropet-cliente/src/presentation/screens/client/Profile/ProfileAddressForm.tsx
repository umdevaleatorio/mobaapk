import React from 'react';
import { View, TextInput, Text, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { styles } from './ProfileScreen.styles';

type Props = { h: any };

export default function ProfileAddressForm({ h }: Props) {
  return (
    <View style={[styles.addressCard, { backgroundColor: h.isDarkMode ? '#2E2E38' : '#1C2434' }]}>
      <View style={styles.addressHeaderRow}>
        <Text style={styles.addressTitle}>Endereço</Text>
        <TouchableOpacity
          style={[styles.enviarBtn, h.locationConfirmed ? styles.enviarBtnConfirmed : styles.enviarBtnActive]}
          onPress={h.handleSendAddress}
          activeOpacity={0.8}
        >
          <Text style={styles.enviarBtnText}>{h.locationConfirmed ? '\u2713 Enviado' : 'Enviar'}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.addressFieldGroup, { zIndex: 10 }]}>
        <Text style={styles.addressLabel}>Rua</Text>
        <View style={[
          styles.addressInputBox,
          { backgroundColor: h.isDarkMode ? '#1E1E24' : '#E3E4EB' },
          (h.showAddressValidationErrors && !h.rua.trim()) ? styles.addressInputBoxError : null
        ]}>
          <TextInput
            ref={h.ruaRef}
            style={[styles.addressInput, { color: h.isDarkMode ? '#FFFFFF' : '#1C2434' }]}
            placeholder="Digite sua rua..."
            placeholderTextColor={h.isDarkMode ? '#8E8E93' : '#919191'}
            value={h.rua}
            onChangeText={h.setRua}
          />
          <TouchableOpacity onPress={() => h.ruaRef.current?.focus()}>
            <Text style={[styles.alterarLinkAddr, { color: h.isDarkMode ? '#5B86E5' : '#042A7D' }]}>Alterar</Text>
          </TouchableOpacity>
        </View>
        {h.showAddressValidationErrors && h.firstEmptyField === 'rua' && (
          <Animated.View style={{ opacity: h.addressErrorOpacity }}>
            <Text style={styles.addressErrorText}>Preencha todos os campos para continuar</Text>
          </Animated.View>
        )}
        {h.addressSuggestions.length > 0 && (
          <ScrollView
            style={[styles.suggestionsDropdown, { backgroundColor: h.isDarkMode ? '#1E1E24' : '#2A3444' }]}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {h.addressSuggestions.map((item: any, index: number) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionItem}
                onPress={() => h.handleSelectAddress(item)}
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
          { backgroundColor: h.isDarkMode ? '#1E1E24' : '#E3E4EB' },
          (h.showAddressValidationErrors && !h.bairro.trim()) ? styles.addressInputBoxError : null
        ]}>
          <TextInput
            ref={h.bairroRef}
            style={[styles.addressInput, { color: h.isDarkMode ? '#FFFFFF' : '#1C2434' }]}
            placeholder="Digite seu bairro..."
            placeholderTextColor={h.isDarkMode ? '#8E8E93' : '#919191'}
            value={h.bairro}
            onChangeText={h.setBairro}
          />
          <TouchableOpacity onPress={() => h.bairroRef.current?.focus()}>
            <Text style={[styles.alterarLinkAddr, { color: h.isDarkMode ? '#5B86E5' : '#042A7D' }]}>Alterar</Text>
          </TouchableOpacity>
        </View>
        {h.showAddressValidationErrors && h.firstEmptyField === 'bairro' && (
          <Animated.View style={{ opacity: h.addressErrorOpacity }}>
            <Text style={styles.addressErrorText}>Preencha todos os campos para continuar</Text>
          </Animated.View>
        )}
      </View>

      <View style={styles.row}>
        <View style={[styles.addressFieldGroup, { flex: 1.5, marginRight: 10 }]}>
          <Text style={styles.addressLabel}>CEP</Text>
          <View style={[
            styles.addressInputBox,
            { backgroundColor: h.isDarkMode ? '#1E1E24' : '#E3E4EB' },
            (h.showAddressValidationErrors && !h.cep.trim()) ? styles.addressInputBoxError : null
          ]}>
            <TextInput
              ref={h.cepRef}
              style={[styles.addressInput, { color: h.isDarkMode ? '#FFFFFF' : '#1C2434' }]}
              placeholder="00000-000"
              placeholderTextColor={h.isDarkMode ? '#8E8E93' : '#919191'}
              value={h.cep}
              onChangeText={h.setCep}
            />
            <TouchableOpacity onPress={() => h.cepRef.current?.focus()}>
              <Text style={[styles.alterarLinkAddr, { color: h.isDarkMode ? '#5B86E5' : '#042A7D' }]}>Alterar</Text>
            </TouchableOpacity>
          </View>
          {h.showAddressValidationErrors && h.firstEmptyField === 'cep' && (
            <Animated.View style={{ opacity: h.addressErrorOpacity }}>
              <Text style={styles.addressErrorText}>Preencha todos os campos para continuar</Text>
            </Animated.View>
          )}
        </View>
        <View style={[styles.addressFieldGroup, { flex: 1 }]}>
          <Text style={styles.addressLabel}>N°</Text>
          <View style={[
            styles.addressInputBox,
            { backgroundColor: h.isDarkMode ? '#1E1E24' : '#E3E4EB' },
            (h.showAddressValidationErrors && !h.numero.trim()) ? styles.addressInputBoxError : null
          ]}>
            <TextInput
              ref={h.numeroRef}
              style={[styles.addressInput, { color: h.isDarkMode ? '#FFFFFF' : '#1C2434' }]}
              placeholder="N°"
              placeholderTextColor={h.isDarkMode ? '#8E8E93' : '#919191'}
              value={h.numero}
              onChangeText={h.setNumero}
              keyboardType="numeric"
            />
            <TouchableOpacity onPress={() => h.numeroRef.current?.focus()}>
              <Text style={[styles.alterarLinkAddr, { color: h.isDarkMode ? '#5B86E5' : '#042A7D' }]}>Alterar</Text>
            </TouchableOpacity>
          </View>
          {h.showAddressValidationErrors && h.firstEmptyField === 'numero' && (
            <Animated.View style={{ opacity: h.addressErrorOpacity }}>
              <Text style={styles.addressErrorText}>Preencha todos os campos para continuar</Text>
            </Animated.View>
          )}
        </View>
      </View>

      <Text style={styles.obsText}>
        <Text style={styles.obsTextBold}>Obs:</Text> pedimos o seu endereço para entregarmos seu produto em sua casa caso opte por frete.{'\n'}
        Frete válido apenas em Lambari.
      </Text>
    </View>
  );
}
