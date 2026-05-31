import React from 'react';
import {
  View,
  StatusBar,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { CatalogHeader } from '../../../components/CatalogHeader';
import { useCartScreen } from './useCartScreen';
import styles from './CartScreen.styles';

export default function CartScreen() {
  const h = useCartScreen();

  return (
    <View style={[styles.mainContainer, { backgroundColor: h.colors.backgroundLight }]}>
      <StatusBar backgroundColor={h.colors.headerBackground} barStyle="light-content" />

      <CatalogHeader 
        title="Carrinho"
        searchText={h.searchText}
        onSearchChange={h.setSearchText}
      />

      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {h.removedAlert && (
          <View style={[
            styles.removedBanner,
            { backgroundColor: h.isDarkMode ? '#2C1D1E' : '#FFF0F0', borderColor: '#FF3B30' }
          ]}>
            <Feather name="alert-circle" size={16} color="#FF3B30" style={{ marginRight: 8 }} />
            <Text style={[styles.removedBannerText, { color: h.isDarkMode ? '#FF8A8A' : '#D32F2F' }]} numberOfLines={3}>
              Aviso: O produto "{h.removedAlert}" esgotou e por isso foi retirado do seu carrinho.
            </Text>
            <TouchableOpacity onPress={() => h.setRemovedAlert(null)} style={{ marginLeft: 'auto', paddingLeft: 10 }}>
              <Feather name="x" size={16} color={h.isDarkMode ? '#FF8A8A' : '#D32F2F'} />
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.titleRow, h.isEditMode && { marginBottom: 28 }]}>
          <Text style={[styles.meuCarrinhoTitle, { color: h.colors.textDark }]}>Meu carrinho:</Text>
          
          <View style={styles.editControlsContainer}>
            <View style={styles.buttonsRowHeader}>
              {h.isEditMode && (
                <TouchableOpacity
                  onPress={h.handleCancelEdit}
                  style={styles.cancelBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
              )}
              
              <View style={styles.removerColumn}>
                <TouchableOpacity 
                  onPress={h.handleRemoverPress} 
                  activeOpacity={0.7} 
                  style={[
                    styles.removerBtnContainer, 
                    { backgroundColor: h.isDarkMode ? '#FFFFFF' : '#1C2434' }
                  ]}
                >
                  <View style={styles.cartRemoveIconWrapper}>
                    <MaterialIcons 
                      name="shopping-cart" 
                      size={24} 
                      color={h.isDarkMode ? '#8B0000' : '#FFFFFF'} 
                    />
                    <View style={styles.cartMinusBadge}>
                      <Feather name="minus" size={10} color="#FFFFFF" />
                    </View>
                  </View>
                  <Text style={[styles.removerBtnText, { color: h.isDarkMode ? '#8B0000' : '#FFFFFF' }]}>
                    Remover
                  </Text>
                </TouchableOpacity>

                {h.isEditMode && (
                  <TouchableOpacity 
                    onPress={h.handleSelectAll} 
                    style={styles.selectAllBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.selectAllText, { color: h.isDarkMode ? '#FFFFFF' : '#8B0000' }]}>
                      Selecionar tudo
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>

        {h.groupedCart.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: h.colors.textGray }]}>Carrinho vazio</Text>
          </View>
        ) : (
          h.groupedCart.map((item: any) => (
            <View key={item.id} style={[styles.productRow, { backgroundColor: h.colors.cardBackground }]}>
              <View style={[styles.productPhoto, { backgroundColor: h.isDarkMode ? '#1E1E24' : '#FFFFFF' }]}>
                {item.image_url ? (
                  <Image
                    source={{ uri: h.getFirstImageUrl(item.image_url) || '' }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.productImage, { backgroundColor: h.isDarkMode ? '#3A3A44' : '#d9d9d9', justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ color: h.isDarkMode ? '#888' : '#999', fontSize: 10 }}>N/A</Text>
                  </View>
                )}
              </View>

              <View style={[styles.colSep, { backgroundColor: h.colors.backgroundLight }]} />

              <View style={styles.colInfo}>
                <Text style={[styles.colHeader, { color: h.colors.textDark }]}>Cód. do{'\n'}produto</Text>
                <Text style={[styles.colValue, { color: h.colors.textDark }]}>{item.id?.substring(0, 7) || '---'}</Text>
              </View>

              <View style={[styles.colSep, { backgroundColor: h.colors.backgroundLight }]} />

              <View style={styles.colInfo}>
                <Text style={[styles.colHeader, { color: h.colors.textDark }]}>Nome do{'\n'}produto</Text>
                <Text style={[styles.colValue, { color: h.colors.textDark }]} numberOfLines={2}>{item.name}</Text>
              </View>

              <View style={[styles.colSep, { backgroundColor: h.colors.backgroundLight }]} />

              <View style={styles.colQty}>
                <Text style={[styles.colHeader, { color: h.colors.textDark }]}>Quantidade</Text>
                {h.isEditMode ? (
                  <View style={styles.qtyEditRow}>
                    <TouchableOpacity 
                      onPress={() => h.handleDecrease(item.id, item.quantity)}
                      style={[
                        styles.decreaseBtn,
                        { backgroundColor: h.isDarkMode ? '#2D2D35' : '#F5F5F5' }
                      ]}
                      activeOpacity={0.7}
                    >
                      <Feather name="minus" size={12} color="#FF3B30" />
                    </TouchableOpacity>

                    <Text style={[styles.qtyNumberEdit, { color: h.colors.textDark }]}>
                      {item.quantity - (h.decreases[item.id] || 0)}
                    </Text>

                    <TouchableOpacity 
                      onPress={() => h.handleToggleSelect(item.id)}
                      style={styles.checkboxTouchTarget}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.checkboxContainer,
                        h.selectedItems.has(item.id) && styles.checkboxSelected
                      ]}>
                        {h.selectedItems.has(item.id) && (
                          <Feather name="check" size={10} color="#FFFFFF" />
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={[styles.qtyNumber, { color: h.colors.textDark }]}>{item.quantity}</Text>
                )}
              </View>
            </View>
          ))
        )}

      </ScrollView>

      <View style={styles.buttonsContainer}>
        {h.checkoutError && (
          <Text style={{ color: '#FF3B30', fontSize: 13, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
            {h.checkoutError}
          </Text>
        )}
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[styles.btnContinuar, { backgroundColor: h.colors.cardBackground }]}
            onPress={() => h.navigation.navigate('Menu')}
            activeOpacity={0.7}
          >
            <Text style={[styles.btnTextSecondary, { color: h.isDarkMode ? '#FFFFFF' : '#1C2434' }]}>Continuar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnProsseguir}
            onPress={h.handleCheckout}
            activeOpacity={0.7}
          >
            <Text style={styles.btnTextPrimary}>Prosseguir</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.btnPedidos}
          activeOpacity={0.7}
          onPress={() => h.navigation.navigate('OrdersScreen')}
        >
          <Text style={styles.btnTextPrimary}>Meus pedidos</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
