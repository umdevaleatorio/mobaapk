import { StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;
const PHOTO_WIDTH = CARD_WIDTH - 20;
const PHOTO_HEIGHT = (PHOTO_WIDTH * 120) / 129;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  productsGrid: {
    paddingTop: 12,
    paddingBottom: 110,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#919191',
  },

  productCard: {
    width: CARD_WIDTH,
    backgroundColor: '#E3E4EB',
    borderRadius: 25,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 10,
    marginBottom: 16,
    alignItems: 'center',
  },
  productImageWrapper: {
    width: PHOTO_WIDTH,
    height: PHOTO_HEIGHT,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    marginBottom: 6,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    backgroundColor: '#d9d9d9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#999',
    fontSize: 11,
  },
  productName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1C2434',
    textAlign: 'center',
    marginBottom: 4,
  },

  productBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 4,
  },
  priceAndButton: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1C2434',
  },
  verItemBtn: {
    backgroundColor: '#EA841E',
    borderRadius: 15,
    width: 85,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCartBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginRight: 4,
  },
  addCartPlusBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#25BE36',
    justifyContent: 'center',
    alignItems: 'center',
  },
  esgotadoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 10,
  },
  esgotadoBannerText: {
    fontSize: 13,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  freteBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 10,
  },
  freteBannerText: {
    fontSize: 13,
    fontWeight: 'bold',
    flexShrink: 1,
    lineHeight: 18,
  },
  greetingContainer: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  greetingText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  countdownText: {
    fontSize: 12.5,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  domingoFeriadoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 10,
  },
  domingoFeriadoText: {
    fontSize: 13,
    fontWeight: 'bold',
    flexShrink: 1,
    lineHeight: 18,
  },
  closeGreetingBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
    zIndex: 10,
  },
});

export default styles;
