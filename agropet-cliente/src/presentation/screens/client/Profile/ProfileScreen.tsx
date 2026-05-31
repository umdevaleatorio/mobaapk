import React from 'react';
import { View, StatusBar, ScrollView, RefreshControl } from 'react-native';
import { useProfile } from './useProfile';
import { styles } from './ProfileScreen.styles';
import { CatalogHeader } from '../../../components/CatalogHeader';
import ProfileHeader from './ProfileHeader';
import ProfileContactInfo from './ProfileContactInfo';
import ProfileAddressForm from './ProfileAddressForm';
import ProfileTabBar from './ProfileTabBar';
import UsernameModal from './UsernameModal';
import PhoneModal from './PhoneModal';
import EmailModal from './EmailModal';
import ImagePickerModal from './ImagePickerModal';
import ViewPhotoModal from './ViewPhotoModal';

export default function ProfileScreen() {
  const h = useProfile();

  return (
    <View style={[styles.mainContainer, { backgroundColor: h.colors.backgroundLight }]}>
      <StatusBar backgroundColor={h.colors.headerBackground} barStyle="light-content" />
      <CatalogHeader title="Seu perfil" searchText="" onSearchChange={() => {}} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={h.refreshing} onRefresh={h.handleRefresh} />}
      >
        <ProfileHeader h={h} />
        <ProfileContactInfo h={h} />
        <ProfileAddressForm h={h} />
      </ScrollView>
      <ProfileTabBar h={h} />
      <UsernameModal h={h} />
      <PhoneModal h={h} />
      <EmailModal h={h} />
      <ImagePickerModal h={h} />
      <ViewPhotoModal h={h} />
    </View>
  );
}
