import { API_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";
import { useState } from "react";
import { ActivityIndicator, Alert, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function CreateSubcomponentScreen({ navigation, route }) {
  const { parentId } = route.params;
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('activo');
  const [descriptions, setDescriptions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Característica states
  const [charName, setCharName] = useState('');
  const [charDesc, setCharDesc] = useState('');
  const [editingCharId, setEditingCharId] = useState(null);
  const [showCharModal, setShowCharModal] = useState(false);

  // Característica logic
  const handleAddOrEditChar = () => {
    if (!charName.trim() || !charDesc.trim()) {
      Alert.alert('Completa todos los campos');
      return;
    }
    if (editingCharId) {
      setDescriptions(prev =>
        prev.map(desc => desc._id === editingCharId ? { ...desc, name: charName, description: charDesc } : desc)
      );
    } else {
      setDescriptions(prev => [...prev, { name: charName, description: charDesc }]);
    }
    setCharName(''); setCharDesc(''); setEditingCharId(null); setShowCharModal(false);
  };
  const handleEditChar = (item) => {
    setCharName(item.name); setCharDesc(item.description); setEditingCharId(item._id); setShowCharModal(true);
  };
  const handleDeleteChar = (id) => setDescriptions(prev => prev.filter(d => d._id !== id));

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
          descriptions,
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

        {/* Características */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Características</Text>
          <TouchableOpacity onPress={() => { setCharName(''); setCharDesc(''); setEditingCharId(null); setShowCharModal(true); }}>
            <Icon name="plus-circle" size={22} color="#1976d2" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.listScroll} nestedScrollEnabled>
          {descriptions.filter(d => !d.toDelete).map((item, idx) => (
            <View key={item._id || idx} style={styles.listRow}>
              <Text style={styles.itemText}>{item.name}: {item.description}</Text>
              <View style={styles.rowIcons}>
                <TouchableOpacity onPress={() => handleEditChar(item)}><Icon name="pencil-outline" size={18} color="#1976d2" /></TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteChar(item._id)} style={{ marginLeft: 8 }}><Icon name="trash-can-outline" size={18} color="#e74c3c" /></TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
          <Text style={styles.actionButtonText}>Guardar subcomponente</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>

        {/* Modal para características */}
        <Modal visible={showCharModal} transparent animationType="fade" onRequestClose={() => setShowCharModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainerSmall}>
              <Text style={styles.modalTitle}>{editingCharId ? 'Editar característica' : 'Agregar característica'}</Text>
              <TextInput
                style={styles.modalInput}
                value={charName}
                onChangeText={setCharName}
                placeholder="Nombre"
                placeholderTextColor="#b8c3d9"
              />
              <TextInput
                style={styles.modalInput}
                value={charDesc}
                onChangeText={setCharDesc}
                placeholder="Descripción"
                placeholderTextColor="#b8c3d9"
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}>
                <TouchableOpacity style={styles.modalMainButton} onPress={handleAddOrEditChar}>
                  <Text style={styles.modalMainButtonText}>{editingCharId ? 'Guardar' : 'Agregar'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowCharModal(false)}>
                  <Text style={styles.modalCancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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
    // Puedes agregar feedback visual aquí si quieres
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

  // --- Modal ---
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
  modalTitle: {
    color: '#003057',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 18,
    textAlign: 'center',
  },
  modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(10,20,40,0.25)', // Más oscuro para que el modal destaque más
  justifyContent: 'center',
  alignItems: 'center',
},
modalContainerSmall: {
  width: 310,
  backgroundColor: '#f7fbff', // Fondo más suave, distinto al blanco total
  borderRadius: 18,
  paddingVertical: 22,
  paddingHorizontal: 19,
  alignItems: 'stretch',
  elevation: 12,
  shadowColor: '#000',
  shadowOpacity: 0.11,
  shadowOffset: { width: 0, height: 7 },
  shadowRadius: 20,
},
modalTitle: {
  color: '#1976d2',
  fontSize: 17,
  fontWeight: 'bold',
  marginBottom: 13,
  textAlign: 'center',
  letterSpacing: 0.1,
},
modalInput: {
  backgroundColor: '#fff',
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#c2daf7',
  paddingVertical: 10,
  paddingHorizontal: 11,
  fontSize: 15,
  marginBottom: 10,
  color: '#003057',
},
modalMainButton: {
  backgroundColor: '#1976D2',
  borderRadius: 7,
  paddingVertical: 10,
  paddingHorizontal: 22,
  alignItems: 'center',
  marginRight: 6,
  minWidth: 85,
},
modalMainButtonText: {
  color: '#fff',
  fontSize: 15,
  fontWeight: 'bold',
},
modalCancelButton: {
  borderRadius: 7,
  borderWidth: 1.3,
  borderColor: '#1976D2',
  backgroundColor: '#fff',
  paddingVertical: 10,
  paddingHorizontal: 22,
  alignItems: 'center',
  minWidth: 85,
},
modalCancelButtonText: {
  color: '#1976D2',
  fontSize: 15,
  fontWeight: 'bold',
},

});
