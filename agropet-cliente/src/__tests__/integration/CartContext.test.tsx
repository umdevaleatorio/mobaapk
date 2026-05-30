import React, { useContext } from 'react';
import { render, waitFor, act, fireEvent } from '@testing-library/react-native';
import { Text, Button, View } from 'react-native';
import { CartContext, CartProvider } from '../../presentation/contexts/CartContext';
import { initDB } from '../../data/datasources/sqlite/database';

jest.mock('../../data/datasources/sqlite/database', () => ({
  initDB: jest.fn(),
}));

const mockDb = {
  getAllAsync: jest.fn().mockResolvedValue([]),
  getFirstAsync: jest.fn().mockResolvedValue(null),
  runAsync: jest.fn().mockResolvedValue({ changes: 1, lastInsertRowId: 1 }),
};

function CartConsumer() {
  const { cart, addToCart, removeFromCart, clearCart, total } = useContext(CartContext);

  return (
    <View>
      <Text testID="cart-length">{cart.length}</Text>
      <Text testID="cart-total">{total}</Text>
      {cart.map(item => (
        <Text key={item.id} testID={`item-${item.id}`}>{`${item.name}-${item.quantity}`}</Text>
      ))}
      <Button title="Add A" onPress={() => addToCart({ id: 'p-1', name: 'Product A', price: 10, image_url: 'img' }, 2)} />
      <Button title="Add B" onPress={() => addToCart({ id: 'p-2', name: 'Product B', price: 20 }, 1)} />
      <Button title="Add Default" onPress={() => addToCart({ id: 'p-3', name: 'Product C', price: 5 })} />
      <Button title="Dec A" onPress={() => addToCart({ id: 'p-1' }, -2)} />
      <Button title="Remove A" onPress={() => removeFromCart('p-1')} />
      <Button title="Clear" onPress={() => clearCart()} />
    </View>
  );
}

describe('CartContext & CartProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (initDB as jest.Mock).mockResolvedValue(mockDb);
    mockDb.getAllAsync.mockResolvedValue([]);
    mockDb.getFirstAsync.mockResolvedValue(null);
    mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 });
  });

  it('should initialize the database, load cart items and calculate total', async () => {
    const mockCart = [
      { id: 'p-1', name: 'Product A', price: 10, quantity: 2, image_url: 'img' },
    ];
    mockDb.getAllAsync.mockResolvedValue(mockCart);

    const { getByTestId } = render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    await waitFor(() => {
      expect(getByTestId('cart-length').props.children).toBe(1);
      expect(getByTestId('cart-total').props.children).toBe(20);
      expect(getByTestId('item-p-1').props.children).toBe('Product A-2');
    });
  });

  it('should handle database initialization failures gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (initDB as jest.Mock).mockRejectedValue(new Error('initDB failure'));

    render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });
    consoleSpy.mockRestore();
  });

  it('should handle loadCart failures gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockDb.getAllAsync.mockRejectedValue(new Error('getAllAsync failure'));

    render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });
    consoleSpy.mockRestore();
  });

  it('should add a new item to cart if it does not exist', async () => {
    const { getByText } = render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    await waitFor(() => {
      expect(initDB).toHaveBeenCalled();
    });

    // Simulate clicking Add A
    await act(async () => {
      fireEvent.press(getByText('Add A'));
    });

    expect(mockDb.getFirstAsync).toHaveBeenCalledWith(expect.any(String), ['p-1']);
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO cart'),
      ['p-1', 'Product A', 10, 2, 'img']
    );
  });

  it('should add a new item with default image if image_url is missing', async () => {
    const { getByText } = render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    await waitFor(() => {
      expect(initDB).toHaveBeenCalled();
    });

    await act(async () => {
      fireEvent.press(getByText('Add B'));
    });

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO cart'),
      ['p-2', 'Product B', 20, 1, '']
    );
  });

  it('should update quantity of an existing item', async () => {
    mockDb.getFirstAsync.mockResolvedValue({ id: 'p-1', name: 'Product A', price: 10, quantity: 2, image_url: 'img' });

    const { getByText } = render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    await waitFor(() => {
      expect(initDB).toHaveBeenCalled();
    });

    await act(async () => {
      fireEvent.press(getByText('Add A'));
    });

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE cart SET quantity = ? WHERE id = ?'),
      [4, 'p-1']
    );
  });

  it('should delete existing item if quantity becomes 0 or negative', async () => {
    mockDb.getFirstAsync.mockResolvedValue({ id: 'p-1', name: 'Product A', price: 10, quantity: 2, image_url: 'img' });

    const { getByText } = render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    await waitFor(() => {
      expect(initDB).toHaveBeenCalled();
    });

    await act(async () => {
      fireEvent.press(getByText('Dec A'));
    });

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM cart WHERE id = ?'),
      ['p-1']
    );
  });

  it('should handle error when adding item', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockDb.getFirstAsync.mockRejectedValue(new Error('Database select fail'));

    const { getByText } = render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    await waitFor(() => {
      expect(initDB).toHaveBeenCalled();
    });

    await act(async () => {
      fireEvent.press(getByText('Add A'));
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should remove item from cart', async () => {
    const { getByText } = render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    await waitFor(() => {
      expect(initDB).toHaveBeenCalled();
    });

    await act(async () => {
      fireEvent.press(getByText('Remove A'));
    });

    expect(mockDb.runAsync).toHaveBeenCalledWith('DELETE FROM cart WHERE id = ?', ['p-1']);
  });

  it('should handle error when removing item', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockDb.runAsync.mockRejectedValue(new Error('Delete error'));

    const { getByText } = render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    await waitFor(() => {
      expect(initDB).toHaveBeenCalled();
    });

    await act(async () => {
      fireEvent.press(getByText('Remove A'));
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should clear cart', async () => {
    const { getByText } = render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    await waitFor(() => {
      expect(initDB).toHaveBeenCalled();
    });

    await act(async () => {
      fireEvent.press(getByText('Clear'));
    });

    expect(mockDb.runAsync).toHaveBeenCalledWith('DELETE FROM cart');
  });

  it('should handle error when clearing cart', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockDb.runAsync.mockRejectedValue(new Error('Clear error'));

    const { getByText } = render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    await waitFor(() => {
      expect(initDB).toHaveBeenCalled();
    });

    await act(async () => {
      fireEvent.press(getByText('Clear'));
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should warn and do nothing if adding to cart before database is initialized', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    (initDB as jest.Mock).mockRejectedValue(new Error('initDB failure'));

    const { getByText } = render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    await act(async () => {
      fireEvent.press(getByText('Add A'));
    });

    expect(warnSpy).toHaveBeenCalledWith('Database is not initialized yet in CartContext.');
    consoleSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('should do nothing on removeFromCart and clearCart if database is not initialized', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (initDB as jest.Mock).mockRejectedValue(new Error('initDB failure'));

    const { getByText } = render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    await act(async () => {
      fireEvent.press(getByText('Remove A'));
    });

    await act(async () => {
      fireEvent.press(getByText('Clear'));
    });

    expect(mockDb.runAsync).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should fallback to empty array if loadCart returns null', async () => {
    mockDb.getAllAsync.mockResolvedValue(null);

    const { getByTestId } = render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    await waitFor(() => {
      expect(getByTestId('cart-length').props.children).toBe(0);
    });
  });

  it('should not add item if quantity is zero or negative and item is not in cart', async () => {
    const { getByText } = render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    await waitFor(() => {
      expect(initDB).toHaveBeenCalled();
    });

    await act(async () => {
      fireEvent.press(getByText('Dec A'));
    });

    expect(mockDb.runAsync).not.toHaveBeenCalled();
  });

  it('should add item with default quantity of 1 if qty is not specified', async () => {
    const { getByText } = render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    await waitFor(() => {
      expect(initDB).toHaveBeenCalled();
    });

    await act(async () => {
      fireEvent.press(getByText('Add Default'));
    });

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO cart'),
      ['p-3', 'Product C', 5, 1, '']
    );
  });

  it('should cover default createContext values', async () => {
    let defaultContextVal: any;
    function DummyConsumer() {
      defaultContextVal = React.useContext(CartContext);
      return null;
    }
    render(<DummyConsumer />);
    await defaultContextVal.addToCart();
    await defaultContextVal.removeFromCart();
    await defaultContextVal.clearCart();
  });
});
