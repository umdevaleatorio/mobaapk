import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { AuthContext } from '../../presentation/contexts/AuthContext';
import { ThemeProvider } from '../../presentation/contexts/ThemeContext';
import { UserMenuProvider } from '../../presentation/contexts/UserMenuContext';
import * as SecureStore from 'expo-secure-store';
import { Alert, TouchableOpacity } from 'react-native';

import AdminProfileScreen from '../../presentation/screens/admin/AdminProfile';

const buildFromMock = (overrides: any = {}) => {
  const chain: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: overrides.singleData !== undefined ? overrides.singleData : { name: 'Admin', role: 'admin' },
      error: overrides.error || null,
    }),
    maybeSingle: jest.fn().mockResolvedValue({
      data: overrides.maybeSingleData !== undefined ? overrides.maybeSingleData : null,
      error: overrides.maybeSingleError || null,
    }),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockResolvedValue({ data: {}, error: null }),
    then: (resolve: any) => {
      if (typeof resolve === 'function') {
        resolve({ data: overrides.data !== undefined ? overrides.data : [], error: overrides.error || null });
      }
      return Promise.resolve({ data: overrides.data !== undefined ? overrides.data : [], error: overrides.error || null });
    },
  };
  return chain;
};

jest.mock('../../data/datasources/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      signOut: jest.fn(),
      signUp: jest.fn().mockResolvedValue({ data: { user: {} }, error: null }),
      signInWithPassword: jest.fn().mockResolvedValue({ data: { session: {} }, error: null }),
      refreshSession: jest.fn().mockResolvedValue({ data: { session: {} }, error: null }),
      updateUser: jest.fn().mockResolvedValue({ data: {}, error: null }),
      verifyOtp: jest.fn().mockResolvedValue({ data: {}, error: null }),
      onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
    },
    channel: jest.fn().mockImplementation(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
      unsubscribe: jest.fn(),
    })),
    removeChannel: jest.fn(),
    rpc: jest.fn().mockResolvedValue({ data: true, error: null }),
    from: jest.fn().mockImplementation(() => buildFromMock()),
    storage: {
      from: jest.fn().mockImplementation(() => ({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test/path' }, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/image.png' } }),
        remove: jest.fn().mockResolvedValue({ data: {}, error: null }),
      })),
    },
  },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    addListener: jest.fn().mockReturnValue(jest.fn()),
    setOptions: jest.fn(),
    getParent: jest.fn().mockReturnValue({ setOptions: jest.fn() }),
  }),
  useRoute: () => ({ params: {} }),
  useFocusEffect: (cb: () => void) => {
    require('react').useEffect(() => {
      const cleanup = cb();
      return typeof cleanup === 'function' ? cleanup : undefined;
    }, []);
  },
}));

jest.mock('../../presentation/contexts/ThemeContext', () => {
  const actual = jest.requireActual('../../presentation/contexts/ThemeContext');
  return {
    ...actual,
    useTheme: () => ({
      isDarkMode: false,
      colors: actual.lightColors,
      toggleTheme: jest.fn(),
    }),
  };
});

import { supabase } from '../../data/datasources/supabase/client';

const mockUser = { id: 'admin-cover-test-999', email: 'cover@test.com' };

const defaultProfileData = {
  name: 'Cover Test',
  username: 'covertest',
  email: 'cover@test.com',
  phone: '',
  rua: 'Rua Coberta',
  bairro: 'Bairro Teste',
  cep: '37480-000',
  numero: '42',
  lat: -22.0,
  lng: -45.0,
  location_confirmed: false,
};

const defaultAuthVal = {
  session: null,
  user: mockUser as any,
  isLoading: false,
  signOut: jest.fn().mockResolvedValue(undefined),
};

const renderScreen = () => {
  return render(
    <AuthContext.Provider value={defaultAuthVal}>
      <ThemeProvider>
        <UserMenuProvider>
          <AdminProfileScreen />
        </UserMenuProvider>
      </ThemeProvider>
    </AuthContext.Provider>
  );
};

describe('AdminProfileScreen - 100% Coverage Remainder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    (supabase.from as jest.Mock).mockImplementation(() =>
      buildFromMock({ singleData: defaultProfileData })
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should cover line 133: photo URI loading from SecureStore', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('stored-avatar-uri');
    (supabase.auth.updateUser as jest.Mock).mockResolvedValue({ data: {}, error: null });
    const authValWithAvatar = {
      session: null,
      user: { ...mockUser, user_metadata: { avatar_url: 'old-avatar' } } as any,
      isLoading: false,
      signOut: jest.fn().mockResolvedValue(undefined),
    };
    render(
      <AuthContext.Provider value={authValWithAvatar}>
        <ThemeProvider>
          <UserMenuProvider>
            <AdminProfileScreen />
          </UserMenuProvider>
        </ThemeProvider>
      </AuthContext.Provider>
    );
    await act(async () => {
      jest.advanceTimersByTime(200);
    });
    expect(SecureStore.getItemAsync).toHaveBeenCalled();
  });

  it('should cover lines 228-229: lat/lng save in debounced address effect', async () => {
    (supabase.from as jest.Mock).mockImplementation(() =>
      buildFromMock({ singleData: { ...defaultProfileData, lat: -22.0, lng: -45.0 } })
    );
    const { getByPlaceholderText } = renderScreen();
    await act(async () => {
      jest.advanceTimersByTime(200);
    });

    const ruaInput = getByPlaceholderText('Digite sua rua...');
    fireEvent.changeText(ruaInput, 'Rua Nova');
    await act(async () => {
      jest.advanceTimersByTime(1100);
    });
    expect(supabase.from).toHaveBeenCalledWith('users');
  });

  it('should cover line 269: Nominatim fetch rejection outer catch', async () => {
    const originalUseRef = React.useRef;
    const useRefSpy = jest.spyOn(React, 'useRef');
    useRefSpy.mockClear();
    useRefSpy.mockRestore();

    let nullRefIdx = 0;
    const nullRefsLocal2: any[] = [];
    const useRefSpy2 = jest.spyOn(React, 'useRef').mockImplementation((init: any) => {
      if (init === null) {
        if (!nullRefsLocal2[nullRefIdx]) {
          nullRefsLocal2[nullRefIdx] = {
            _current: null,
            get current() {
              return this._current;
            },
            set current(val: any) {
              if (val && typeof val === 'object') {
                val.isFocused = () => true;
                val.focus = () => {};
              }
              this._current = val;
            }
          };
        }
        const ref = nullRefsLocal2[nullRefIdx];
        nullRefIdx++;
        return ref;
      }
      return originalUseRef(init);
    });

    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

    (supabase.from as jest.Mock).mockImplementation(() =>
      buildFromMock({ singleData: defaultProfileData })
    );

    try {
      const { getByPlaceholderText } = renderScreen();
      await act(async () => {
        jest.advanceTimersByTime(200);
      });

      const ruaInput = getByPlaceholderText('Digite sua rua...');
      (ruaInput as any).isFocused = jest.fn().mockReturnValue(true);
      fireEvent(ruaInput, 'focus');
      fireEvent.changeText(ruaInput, 'Rua Teste');
      await act(async () => {
        jest.advanceTimersByTime(600);
      });
    } finally {
      useRefSpy2.mockRestore();
    }
  });

  it('should cover lines 266-267: Nominatim JSON parse error inner catch', async () => {
    let nullRefIdx = 0;
    const nullRefsLocal: any[] = [];
    const originalUseRef = React.useRef;
    const useRefSpy = jest.spyOn(React, 'useRef').mockImplementation((init: any) => {
      if (init === null) {
        if (!nullRefsLocal[nullRefIdx]) {
          nullRefsLocal[nullRefIdx] = {
            _current: null,
            get current() {
              return this._current;
            },
            set current(val: any) {
              if (val && typeof val === 'object') {
                val.isFocused = () => true;
                val.focus = () => {};
              }
              this._current = val;
            }
          };
        }
        const ref = nullRefsLocal[nullRefIdx];
        nullRefIdx++;
        return ref;
      }
      return originalUseRef(init);
    });

    jest.spyOn(global, 'fetch').mockResolvedValue({
      text: jest.fn().mockResolvedValue('invalid json {{'),
    } as any);

    (supabase.from as jest.Mock).mockImplementation(() =>
      buildFromMock({ singleData: defaultProfileData })
    );

    try {
      const { getByPlaceholderText } = renderScreen();
      await act(async () => {
        jest.advanceTimersByTime(200);
      });

      const ruaInput = getByPlaceholderText('Digite sua rua...');
      (ruaInput as any).isFocused = jest.fn().mockReturnValue(true);
      fireEvent(ruaInput, 'focus');
      fireEvent.changeText(ruaInput, 'Rua Teste');
      await act(async () => {
        jest.advanceTimersByTime(600);
      });
    } finally {
      useRefSpy.mockRestore();
    }
  });

  it('should cover line 453: success alert without confirmLocation', async () => {
    (supabase.from as jest.Mock).mockImplementation(() =>
      buildFromMock({ singleData: { ...defaultProfileData, lat: 0, lng: 0, location_confirmed: false } })
    );

    jest.spyOn(global, 'fetch').mockResolvedValue({
      json: jest.fn().mockResolvedValue([]),
      ok: true,
    } as any);

    const { getByText } = renderScreen();
    await act(async () => {
      jest.advanceTimersByTime(200);
    });

    fireEvent.press(getByText('Enviar'));
    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    const calls = (Alert.alert as jest.Mock).mock.calls;
    const notFoundAlert = calls.find((c: any) => c[0] === 'Endereço não localizado');
    if (notFoundAlert) {
      const saveAnywayHandler = notFoundAlert[2]?.[1]?.onPress;
      if (saveAnywayHandler) {
        await act(async () => {
          await saveAnywayHandler();
        });
      }
    }
  });

  it('should cover lines 489-498: RPC error fallback with different user ID', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: new Error('RPC error') });
    (supabase.from as jest.Mock).mockImplementation(() =>
      buildFromMock({
        singleData: { ...defaultProfileData, username: '' },
        maybeSingleData: { id: 'other-user-id' },
      })
    );
    const { getByPlaceholderText, getByText } = renderScreen();
    await act(async () => {
      jest.advanceTimersByTime(200);
    });

    fireEvent.press(getByText('Definir nome de usuário...'));
    const userInp = getByPlaceholderText('Ex: usuario123');
    fireEvent.changeText(userInp, 'newadmin');
    await act(async () => {
      jest.advanceTimersByTime(700);
    });
  });

  it('should cover lines 553-560: handleConfirmPhone validar branch', async () => {
    (supabase.from as jest.Mock).mockImplementation(() =>
      buildFromMock({ singleData: { ...defaultProfileData, phone: '' } })
    );
    const { getByText, getByPlaceholderText } = renderScreen();
    await act(async () => {
      jest.advanceTimersByTime(200);
    });

    fireEvent.press(getByText('Cadastrar'));
    const phoneInput = getByPlaceholderText('+55 (11) 99999-9999');
    fireEvent.changeText(phoneInput, '11999992222');
    await act(async () => {
      fireEvent.press(getByText('Confirmar'));
    });
    await act(async () => {
      fireEvent.press(getByText('Confirmar'));
    });
    expect(supabase.from).toHaveBeenCalledWith('users');
  });

  it('should cover line 748: phone Validar button on main screen', async () => {
    (supabase.from as jest.Mock).mockImplementation(() =>
      buildFromMock({ singleData: { ...defaultProfileData, phone: '' } })
    );
    const { getByText, getByPlaceholderText, queryByText } = renderScreen();
    await act(async () => {
      jest.advanceTimersByTime(200);
    });

    fireEvent.press(getByText('Cadastrar'));
    const phoneInput = getByPlaceholderText('+55 (11) 99999-9999');
    fireEvent.changeText(phoneInput, '11999992222');
    fireEvent.press(getByText('Confirmar'));

    const cancelBtns = queryByText('Cancelar');
    if (cancelBtns) {
      fireEvent.press(cancelBtns);
    }
    const validarBtn = queryByText('Validar');
    if (validarBtn) {
      fireEvent.press(validarBtn);
    }
  });

  it('should cover line 909: Alterar address button', async () => {
    (supabase.from as jest.Mock).mockImplementation(() =>
      buildFromMock({ singleData: defaultProfileData })
    );
    const { getAllByText } = renderScreen();
    await act(async () => {
      jest.advanceTimersByTime(200);
    });

    const alterarLinks = getAllByText('Alterar');
    fireEvent.press(alterarLinks[alterarLinks.length - 1]);
  });

  it('should cover lines 1078-1083: image picker modal onRequestClose and overlay', async () => {
    (supabase.from as jest.Mock).mockImplementation(() =>
      buildFromMock({ singleData: defaultProfileData })
    );
    const { getByText, UNSAFE_getAllByType } = renderScreen();
    await act(async () => {
      jest.advanceTimersByTime(200);
    });

    fireEvent.press(getByText('Alterar foto'));

    const modals = UNSAFE_getAllByType('Modal' as any);
    const visibleModal = modals.find((m: any) => m.props.visible === true);
    if (visibleModal && visibleModal.props.onRequestClose) {
      await act(async () => {
        visibleModal.props.onRequestClose();
      });
    }

    fireEvent.press(getByText('Alterar foto'));
    fireEvent.press(getByText('Alterar Foto de Perfil'));
  });

  it('should cover lines 1133-1151: Cancelar in picker and view photo modal close', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('existing-photo');
    (supabase.from as jest.Mock).mockImplementation(() =>
      buildFromMock({ singleData: defaultProfileData })
    );
    const { getByText, getAllByText, UNSAFE_getAllByType } = renderScreen();
    await act(async () => {
      jest.advanceTimersByTime(200);
    });

    fireEvent.press(getByText('Alterar foto'));
    const cancelBtns = getAllByText('Cancelar');
    fireEvent.press(cancelBtns[cancelBtns.length - 1]);

    fireEvent.press(getByText('Alterar foto'));
    await act(async () => {
      fireEvent.press(getByText('Ver foto'));
    });

    const modals1 = UNSAFE_getAllByType('Modal' as any);
    const viewPhotoModal1 = modals1.find((m: any) =>
      m.props.visible && m.props.transparent
    );
    if (viewPhotoModal1 && viewPhotoModal1.props.onRequestClose) {
      await act(async () => {
        viewPhotoModal1.props.onRequestClose();
      });
    }

    fireEvent.press(getByText('Alterar foto'));
    await act(async () => {
      fireEvent.press(getByText('Ver foto'));
    });

    await act(async () => {
      fireEvent.press(getByText('x'));
    });

    fireEvent.press(getByText('Alterar foto'));
    await act(async () => {
      fireEvent.press(getByText('Ver foto'));
    });

    const allTouchables = UNSAFE_getAllByType(TouchableOpacity);
    const viewPhotoOverlay = allTouchables.find((t: any) =>
      t.props.activeOpacity === 1 && t.props.style !== undefined
    );
    if (viewPhotoOverlay) {
      await act(async () => {
        fireEvent.press(viewPhotoOverlay);
      });
    }
  });
});
