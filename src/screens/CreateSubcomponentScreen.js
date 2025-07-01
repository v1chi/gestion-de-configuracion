import { API_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";
import { useState } from "react";
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function CreateSubcomponentScreen({ navigation, route }) {
  const { parentId } = route.params;
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('activo');
  const [loading, setLoading] = useState(false);


  /**
   * Crea un nuevo subcomponente asociado al componente actual.
   * Envía nombre, tipo, estado y características al backend.
   * Si se guarda con éxito, vuelve a la pantalla anterior.
   */
  const handleSave = async () => {
    if (!name.trim() || !type.trim() || !status) {
      Alert.alert('Completa todos los campos');
      return;
    }
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${API_URL}/components/${parentId}/components`,
        {
          name,
          type,
          status,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Subcomponente creado y asociado');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'No se pudo crear el subcomponente');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <SafeAreaView style={styles.container}>
      <ActivityIndicator color="#1976d2" size="large" style={{ marginTop: 64 }} />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Crear subcomponente</Text>

        <Text style={styles.label}>Nombre</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nombre" placeholderTextColor="#9BB8DD" />

        <Text style={styles.label}>Tipo</Text>
        <TextInput style={styles.input} value={type} onChangeText={setType} placeholder="Tipo" placeholderTextColor="#9BB8DD" />

        <Text style={styles.sectionTitle}>Estado</Text>
        <View style={styles.statusRow}>
          <TouchableOpacity
            style={[styles.statusBtn, status === 'activo' && styles.statusBtnSelected]}
            onPress={() => setStatus('activo')}
          ><Text style={[styles.statusBtnText, status === 'activo' && { color: '#fff' }]}>Activo</Text></TouchableOpacity>
          <TouchableOpacity
            style={[styles.statusBtn, status === 'de baja' && styles.statusBtnSelected, { marginLeft: 10 }]}
            onPress={() => setStatus('de baja')}
          ><Text style={[styles.statusBtnText, status === 'de baja' && { color: '#fff' }]}>De baja</Text></TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
          <Text style={styles.actionButtonText}>Guardar subcomponente</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
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
  card: {
    width: '92%',
    backgroundColor: '#fff',
    borderRadius: 22,
    paddingVertical: 28,
    paddingHorizontal: 22,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
    marginTop: 48,
    marginBottom: 38,
  },
  title: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#1976d2',
    textAlign: 'center',
    marginBottom: 18,
    letterSpacing: 0.2,
  },
  label: {
    color: '#003057',
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 4,
    marginTop: 14,
    alignSelf: 'flex-start',
  },
  sectionTitle: {
    color: '#1976D2',
    fontSize: 16.5,
    fontWeight: 'bold',
    marginTop: 18,
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  input: {
    backgroundColor: '#F6F9FE',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 13,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#D1D9E6',
    marginBottom: 6,
    color: '#003057',
  },
  statusRow: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 12,
  },
  statusBtn: {
    flex: 1,
    backgroundColor: '#e8edf7',
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1976d2',
    marginHorizontal: 2,
  },
  statusBtnSelected: {
    backgroundColor: '#1976d2',
  },
  statusBtnText: {
    color: '#1976d2',
    fontWeight: 'bold',
    fontSize: 15,
  },
  statusBtnTextSelected: {
    color: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 5,
  },
  listBox: {
    backgroundColor: '#f8fbff',
    borderRadius: 10,
    padding: 9,
    borderWidth: 1,
    borderColor: '#E3E9F0',
    minHeight: 44,
    marginBottom: 13,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#edf2f7',
    paddingVertical: 9,
    paddingRight: 4,
  },
  itemText: {
    color: '#003057',
    fontSize: 15,
    flex: 1,
    marginRight: 10,
    flexWrap: 'wrap',
  },
  iconActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  icon: {
    marginLeft: 16,
  },
  iconDeleteBtn: {
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    fontSize: 14,
    color: '#A0AEC0',
    paddingVertical: 8,
  },
  actionButton: {
    backgroundColor: '#1976D2',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
    width: '100%',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1.6,
    borderColor: '#1976D2',
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 13,
    width: '100%',
  },
  cancelButtonText: {
    color: '#1976D2',
    fontWeight: 'bold',
    fontSize: 16,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10,20,40,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '92%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'stretch',
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10,20,40,0.25)', 
    justifyContent: 'center',
    alignItems: 'center',
  },
});
