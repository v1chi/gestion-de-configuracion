import { API_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { Alert, Image, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Configurar Google Sign-In al cargar la pantalla
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '466631932190-5kiqs5kpcgk605oa5qvqgvivqi3ph1bd.apps.googleusercontent.com',
      offlineAccess: false,
      scopes: ['email', 'profile'], 
    });
  }, []);

  /**
   * Inicia sesión usando correo y contraseña.
   * Guarda el token y datos del usuario en AsyncStorage,
   * y redirige según su rol.
   */
  const handleLogin = async () => {

    if (!email || !password) {
      Alert.alert('Faltan campos', 'Debe ingresar correo y contraseña.');
      return;
    }
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/v1/auth/signin`, {
        email,
        password
      });
      const { access_token, id, role } = response.data;
      if (!role) {
        Alert.alert('Error', 'No se pudo determinar el rol del usuario.');
        return;
      }
      await AsyncStorage.setItem('token', access_token);
      await AsyncStorage.setItem('userId', id);
      await AsyncStorage.setItem('userRole', role);
      navigation.navigate(role === 'administrador' ? 'MenuAdmin' : 'MenuUser');

    } catch (error) {
      Alert.alert('Error', 'Correo o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Inicia sesión con Google.
   * Si el correo existe en la plataforma, guarda el token y redirige según el rol
   * Si el correo no existe aún, lo trata como usuario normal y redirige a la vista de usuario.
   */
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      await GoogleSignin.signOut(); // limpiar sesión anterior
      const userInfo = await GoogleSignin.signIn();

      let email = null;
      if (userInfo && userInfo.user && userInfo.user.email) {
        email = userInfo.user.email;
      } else if (userInfo.data && userInfo.data.user && userInfo.data.user.email) {
        email = userInfo.data.user.email;
      }
      if (!email){
        console.warn('No se obtuvo el correo del usuario.');
        return;
      } 

      const response = await axios.get(`${API_URL}/api/v1/auth/email/${email}`);
      const { access_token, id, role } = response.data;

      if (!role) {
        Alert.alert('Error', 'No se pudo determinar el rol del usuario.');
        return;
      }

      await AsyncStorage.setItem('token', access_token);
      await AsyncStorage.setItem('userId', id);
      await AsyncStorage.setItem('userRole', role);
      navigation.navigate(role === 'administrador' ? 'MenuAdmin' : 'MenuUser');

    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo iniciar sesión con Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.backgroundCircle1} />
      <View style={styles.backgroundCircle2} />
      
      <Text style={styles.projectTitle}>Gestión de Configuración</Text>

      <View style={styles.box}>
        <Text style={styles.title}>Iniciar Sesión</Text>

        <Text style={styles.label}>Correo:</Text>
        <TextInput
          style={styles.input}
          placeholder="correo@dominio.com"
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Contraseña:</Text>
        <TextInput
          style={styles.input}
          placeholder="********"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.5 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Iniciar Sesión</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: '#fff',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 12,
              borderWidth: 1,
              borderColor: '#1976d2'
            }
          ]}
          onPress={handleGoogleLogin}
          disabled={loading}
        >
          <Image source={require('../assets/google_icon.jpg')} style={{ width: 22, height: 22, marginRight: 10 }} />
          <Text style={[styles.buttonText, { color: '#1976d2' }]}>Iniciar con Google</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#003057',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundCircle1: {
    position: 'absolute',
    top: -120,
    left: -90,
    width: 270,
    height: 270,
    borderRadius: 135,
    backgroundColor: '#2377b7',
    opacity: 0.17,
  },
  backgroundCircle2: {
    position: 'absolute',
    bottom: -120,
    right: -90,
    width: 270,
    height: 270,
    borderRadius: 135,
    backgroundColor: '#92c5f9',
    opacity: 0.14,
  },
  projectTitle: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 35,
    marginTop: -30,
    letterSpacing: 0.3,
    textShadowColor: '#00213a',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  box: {
    width: '88%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 28,
    shadowColor: '#000',
    shadowOpacity: 0.19,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 7,
  },
  title: {
    fontSize: 24,
    color: '#0d47a1',
    fontWeight: 'bold',
    marginBottom: 22,
    textAlign: 'center',
  },
  label: {
    color: '#003057',
    fontWeight: '500',
    marginBottom: 4,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#1976d2',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#f0f2f5',
    color: '#1c1c1e',
  },
  button: {
    marginTop: 20,
    backgroundColor: '#1976d2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});