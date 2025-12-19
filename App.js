import 'react-native-gesture-handler';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { BlurView } from 'expo-blur';
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { setAppUserId } from "./config/SupabaseClient";

import CameraCapture from './screens/CameraCapture';
import CheckScreen from './screens/CheckScreen';
import DressCodeScreen from './screens/DressCodeScreen';
import ForgotScreen from './screens/ForgotScreen';
import HistoryScreen from './screens/HistoryScreen';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import ProfileScreen from './screens/ProfileScreen';
import RegisterScreen from './screens/RegisterScreen';

// -----------------------------------------
// NAV OBJECTS
// -----------------------------------------
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// -----------------------------------------
// MAIN TABS
// -----------------------------------------
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'rgba(255,255,255,0.12)',
          borderTopWidth: 0,
          elevation: 0,
          height: 70,
        },
        tabBarBackground: () => (
          <BlurView tint="dark" intensity={40} style={{ flex: 1 }} />
        ),
        tabBarActiveTintColor: '#ff0000ff',
        tabBarInactiveTintColor: '#ffffffff',

        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Home')
            return <Ionicons name="home" size={size} color={color} />;

          if (route.name === 'Verify Uniform')
            return <MaterialCommunityIcons name="tshirt-crew" size={size} color={color} />;

          if (route.name === 'Dress Code Regulations')
            return <Ionicons name="book-outline" size={size} color={color} />;

          if (route.name === 'Profile')
            return <Ionicons name="person-circle-outline" size={size} color={color} />;

          return null;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Verify Uniform" component={CheckScreen} />
      <Tab.Screen name="Dress Code Regulations" component={DressCodeScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// -----------------------------------------
// ROOT APP + AUTO LOGIN
// -----------------------------------------
export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    (async () => {
      const stored = await SecureStore.getItemAsync("user_id");
      console.log("📌 Using stored userId =", stored);

      if (stored) {
        setAppUserId(stored);
        setInitialRoute("Main");
      } else {
        setInitialRoute("Login");
      }
    })();
  }, []);

  if (!initialRoute) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Forgot" component={ForgotScreen} />

        <Stack.Screen name="Main" component={MainTabs} />

        <Stack.Screen
          name="History"
          component={HistoryScreen}
          options={{
            headerShown: true,
            title: "ประวัตินักศึกษาที่ไม่ผ่าน",
          }}
        />

        <Stack.Screen
          name="CameraCapture"
          component={CameraCapture}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
