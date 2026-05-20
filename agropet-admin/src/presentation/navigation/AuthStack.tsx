import { createStackNavigator } from '@react-navigation/stack';
import AdminLoginScreen from '../screens/auth/AdminLoginScreen';

const Stack = createStackNavigator();

export default function AuthStack() {
  return (
    <Stack.Navigator initialRouteName="AdminLoginScreen">
      <Stack.Screen name="AdminLoginScreen" component={AdminLoginScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
