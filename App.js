import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AddComponentScreen from './src/screens/AddComponentScreen';
import ComponentDetailScreen from './src/screens/ComponentDetailScreen';
import CreateSubcomponentScreen from './src/screens/CreateSubcomponentScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import LoginScreen from './src/screens/LoginScreen';
import ManageComponentsScreen from './src/screens/ManageComponentsScreen';
import MenuAdminScreen from './src/screens/MenuAdminScreen';
import MenuUserScreen from './src/screens/MenuUserScreen';
import SideMenu from './src/screens/SideMenu';
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login"  component={LoginScreen} options={{ headerShown: false}}/>
        <Stack.Screen name="MenuAdmin" component={MenuAdminScreen} options={{ headerShown: false}}/>
        <Stack.Screen name="AddComponent" component={AddComponentScreen} options={{ headerShown: false}}/>
        <Stack.Screen name="ManageComponents" component={ManageComponentsScreen} options={{ headerShown: false}}/>
        <Stack.Screen name="ComponentDetail" component={ComponentDetailScreen} options={{ headerShown: false}}/>
        <Stack.Screen name="MenuUser" component={MenuUserScreen} options={{ headerShown: false}}/>
        <Stack.Screen name="History" component={HistoryScreen} options={{ headerShown: false}}/>
        <Stack.Screen name="SideMenu" component={SideMenu} options={{ headerShown: false}}/>
        <Stack.Screen name="CreateSubcomponent" component={CreateSubcomponentScreen} options={{ headerShown: false}}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
