describe('Platform.OS android branch - AdminConsultSalesScreen.styles', () => {
  it('creates styles on Android', () => {
    jest.isolateModules(() => {
      jest.doMock('react-native', () => ({
        Platform: { OS: 'android', Version: 33, select: (obj: any) => obj.android ?? obj.default },
        StyleSheet: { create: (styles: any) => styles },
        Dimensions: { get: () => ({ width: 390, height: 844 }) },
      }));
      const styles = require('../../presentation/screens/admin/AdminConsultSales/AdminConsultSalesScreen.styles');
      expect(styles.styles).toBeDefined();
    });
  });
});

describe('Platform.OS android branch - AdminDashboardScreen.styles', () => {
  it('creates styles on Android', () => {
    jest.isolateModules(() => {
      jest.doMock('react-native', () => ({
        Platform: { OS: 'android', Version: 33, select: (obj: any) => obj.android ?? obj.default },
        StyleSheet: { create: (styles: any) => styles },
        Dimensions: { get: () => ({ width: 390, height: 844 }) },
      }));
      const styles = require('../../presentation/screens/admin/AdminDashboard/AdminDashboardScreen.styles');
      expect(styles.styles).toBeDefined();
    });
  });
});

describe('Platform.OS android branch - AdminBottomTabBar.styles', () => {
  it('creates styles on Android', () => {
    jest.isolateModules(() => {
      jest.doMock('react-native', () => ({
        Platform: { OS: 'android', Version: 33, select: (obj: any) => obj.android ?? obj.default },
        StyleSheet: { create: (styles: any) => styles },
      }));
      const styles = require('../../presentation/screens/admin/AdminDashboard/components/AdminBottomTabBar.styles');
      expect(styles.styles).toBeDefined();
    });
  });
});

describe('Platform.OS android branch - AdminPDVBottomBar.styles', () => {
  it('creates styles on Android', () => {
    jest.isolateModules(() => {
      jest.doMock('react-native', () => ({
        Platform: { OS: 'android', Version: 33, select: (obj: any) => obj.android ?? obj.default },
        StyleSheet: { create: (styles: any) => styles },
      }));
      const styles = require('../../presentation/screens/admin/AdminDashboard/components/AdminPDVBottomBar.styles');
      expect(styles.styles).toBeDefined();
    });
  });
});

describe('Platform.OS android branch - AdminMap styles', () => {
  it('creates styles on Android', () => {
    jest.isolateModules(() => {
      jest.doMock('react-native', () => ({
        Platform: { OS: 'android', Version: 33, select: (obj: any) => obj.android ?? obj.default },
        StyleSheet: { create: (styles: any) => styles },
        Dimensions: { get: () => ({ width: 390, height: 844 }) },
      }));
      const styles = require('../../presentation/screens/admin/AdminMap/styles');
      expect(styles.styles).toBeDefined();
    });
  });
});
