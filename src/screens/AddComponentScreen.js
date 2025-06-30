import { API_URL } from '@env';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useState } from 'react';
import { Alert, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Picker from 'react-native-picker-select';
import SideMenu from './SideMenu';

export default function AddComponentScreen({ navigation }) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [descriptions, setDescriptions] = useState([]);
  const [showDescriptionModal, setshowDescriptionModal] = useState(false);
  const [descriptionName, setDescriptionname] = useState('');
  const [descriptionInfo, setDescriptionInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateComponent = async () => {
    if (!name || !type || !status) {
      Alert.alert('Error', 'Faltan datos');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      setIsSubmitting(true);
      const cleanDescriptions = descriptions.map(({ name, description }) => ({ name, description }));
      const newComponent = { name, type, status, descriptions: cleanDescriptions };
      await axios.post(
        `${API_URL}/components`,
        newComponent,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setName('');
      setType('');
      setStatus('');
      setDescriptions([]);
      setIsSubmitting(false);
      Alert.alert('Componente creado', 'Componente creado con éxito');
      navigation.goBack();
    } catch (error) {
      console.error('Error al crear componente:', error);
      setIsSubmitting(false);
      Alert.alert('Error', 'No se pudo crear el componente');
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.iconWrapper}>
          <Ionicons name="menu" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agregar Componente</Text>
        <View style={{ width: 32 }} /> {/* espacio invisible a la derecha para centrar */}
      </View>

      {/* FORMULARIO */}
      <View style={styles.formBox}>
        <Text style={styles.label}>Nombre</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={styles.input}
          placeholder="Nombre"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Tipo</Text>
        <TextInput
          value={type}
          onChangeText={setType}
          style={styles.input}
          placeholder="Tipo"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Estado</Text>
        <Picker
          onValueChange={setStatus}
          items={[
            { label: 'Activo', value: 'activo' },
            { label: 'De baja', value: 'de baja' }
          ]}
          placeholder={{ label: 'Seleccione un estado...', value: null }}
          style={{
            inputIOS: styles.pickerInput,
            inputAndroid: styles.pickerInput,
            placeholder: { color: '#999' },
          }}
        />

        <View style={styles.characteristicsHeader}>
          <Text style={styles.label}>Características</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setshowDescriptionModal(true)}>
            <Ionicons name="add" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.descriptionList}
          contentContainerStyle={styles.descriptionContent}
          nestedScrollEnabled
        >
          {descriptions.map((desc, index) => (
            <Text key={index} style={styles.descriptionItem}>
              {desc.name}: {desc.description}
            </Text>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
          disabled={isSubmitting}
          onPress={handleCreateComponent}
        >
          <Text style={styles.submitButtonText}>Guardar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL DE CARACTERÍSTICAS */}
      <Modal
        visible={showDescriptionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setshowDescriptionModal(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <SafeAreaView>
              <Text style={styles.label}>Nombre de la característica</Text>
              <TextInput
                value={descriptionName}
                onChangeText={setDescriptionname}
                style={styles.input}
                placeholder="Nombre"
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Descripción</Text>
              <TextInput
                value={descriptionInfo}
                onChangeText={setDescriptionInfo}
                style={styles.input}
                placeholder="Descripción"
                placeholderTextColor="#999"
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.modalButtonCancel}
                  onPress={() => {
                    setDescriptionInfo('');
                    setDescriptionname('');
                    setshowDescriptionModal(false);
                  }}
                >
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButtonAdd}
                  onPress={() => {
                    if (!descriptionInfo || !descriptionName) {
                      Alert.alert('Faltan datos', 'Falta información');
                    } else {
                      const newDescription = { name: descriptionName, description: descriptionInfo };
                      setDescriptions([...descriptions, newDescription]);
                      setDescriptionInfo('');
                      setDescriptionname('');
                      setshowDescriptionModal(false);
                    }
                  }}
                >
                  <Text style={styles.buttonText}>Agregar</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </View>
        </View>
      </Modal>

      <SideMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        navigation={navigation}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#003057',
    paddingHorizontal: 20,
    paddingTop: 60, 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#003057',
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 7,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.09,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    marginBottom: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,      
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.1,
    marginLeft: 0,
  },
  iconWrapper: {
    width: 34,        
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: 'transparent',
    marginHorizontal: 2,
  },
  formBox: {
    width: '96%',
    maxWidth: 390,
    backgroundColor: '#fff',
    borderRadius: 22,
    paddingVertical: 30,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOpacity: 0.13,
    shadowOffset: { width: 0, height: 7 },
    shadowRadius: 15,
    elevation: 9,
    alignSelf: 'center',
    marginTop: 25,
    marginBottom: 20,
  },
  label: {
    color: '#003057',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F6F9FE',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#1976d2',
    color: '#003057',
    marginBottom: 14,
  },
  pickerInput: {
    backgroundColor: '#F6F9FE',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1976d2',
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 15,
    color: '#003057',
    marginBottom: 14,
    justifyContent: 'center',
  },
  characteristicsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 10,
  },
  addButton: {
    backgroundColor: '#1976d2',
    borderRadius: 12,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    alignSelf: 'flex-start',
    elevation: 3,
  },
  descriptionList: {
    backgroundColor: '#f8fbff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E3E9F0',
    padding: 12,
    marginBottom: 18,
    minHeight: 40,
    maxHeight: 105,
  },
  descriptionItem: {
    color: '#003057',
    fontSize: 15,
    marginBottom: 7,
  },
  descriptionContent: {
    paddingBottom: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 8,
    elevation: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButtonCancel: {
    backgroundColor: '#ffffff',
    borderColor: '#d32f2f',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flex: 0.48,
    alignItems: 'center',
  },
  modalButtonAdd: {
    backgroundColor: '#1976d2',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flex: 0.48,
    alignItems: 'center',
  },
  buttonText: {
    color: '#1c1c1e',
    fontWeight: 'bold',
    fontSize: 14,
  },
  backgroundCircle1: {
    position: 'absolute',
    top: -120,
    left: -90,
    width: 270,
    height: 270,
    borderRadius: 135,
    backgroundColor: '#2377b7',
    opacity: 0.14,
    zIndex: -1,
  },
  backgroundCircle2: {
    position: 'absolute',
    bottom: -120,
    right: -90,
    width: 270,
    height: 270,
    borderRadius: 135,
    backgroundColor: '#92c5f9',
    opacity: 0.12,
    zIndex: -1,
  },
  submitButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 15,
    borderRadius: 9,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
    width: '100%',
  },
  cancelButton: {
    borderWidth: 1.5,
    borderColor: '#1976d2',
    borderRadius: 9,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: '#fff',
    width: '100%',
    marginBottom: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButtonText: {
    color: '#1976d2',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

