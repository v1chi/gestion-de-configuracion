import { API_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Picker from "react-native-picker-select";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function ComponentDetailScreen({navigation, route}){
    const { componentId } = route.params;
    const [loading, setLoading] = useState(false);

    const [name, setName] = useState('');
    const [type, setType] = useState('');
    const [status, setStatus] = useState('');
    const [descriptions, setDescriptions] = useState([]);
    const [components, setComponents] = useState([]);
    const [showAssociateModal, setShowAssociateModal] = useState(false);
    const [showCharModal, setShowCharModal] = useState(false);

    // para características
    const [descriptionName, setDescriptionName] = useState('');
    const [descriptionType, setDescriptionType] = useState('');
    const [editingDescriptionId, setEditingDescriptionId] = useState(null);

    // para asociar subcomponentes existentes
    const [availableComponents, setAvailableComponents] = useState([]);
    const [selectedExistingComponent, setSelectedExistingComponent] = useState(null);

    useEffect(() => {
        const fetchComponentDetails = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(`${API_URL}/components/${componentId}`, {
            headers: { Authorization: `Bearer ${token}` }
            });
            setName(res.data.name);
            setType(res.data.type);
            setStatus(res.data.status);
            setDescriptions(res.data.descriptions ?? []);
            setComponents(res.data.components ?? []);
        } catch (err) {
            console.error('Error al obtener detalles del componente:', err);
        }
        };
        fetchComponentDetails();
    }, []);

    const handleAddOrEditChar = () => {
        if (!descriptionName || !descriptionType) {
            Alert.alert('Error', 'Faltan campos por completar');
            return;
        }
        const nueva = { name: descriptionName, description: descriptionType };
        if (editingDescriptionId) {
            setDescriptions(prev =>
                prev.map(desc =>
                    desc._id === editingDescriptionId
                        ? { ...desc, ...nueva }
                        : desc
                )
            );
        } else {
            setDescriptions(prev => [...prev, { ...nueva }]);
        }
        setDescriptionName('');
        setDescriptionType('');
        setEditingDescriptionId(null);
        setShowCharModal(false);
    };

    const handleEditDescription = (desc) => {
        setDescriptionName(desc.name);
        setDescriptionType(desc.description);
        setEditingDescriptionId(desc._id);
        setShowCharModal(true);
    };

    const handleMarkDescriptionForDeletion = (descId) => {
        setDescriptions(prev =>
            prev.map(d =>
                d._id === descId
                    ? { ...d, toDelete: true }
                    : d
            )
        );
    };

    const handleMarkForDisassociation = (childId) => {
        setComponents(prev =>
            prev.map((c) => (c._id === childId ? { ...c, toDelete: true } : c))
        );
    };

    const fetchAvailableComponents = async () => {
        try {
        const token = await AsyncStorage.getItem('token');
        const response = await axios.get(`${API_URL}/components`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const sinPadre = response.data.filter(comp => !comp.parent && comp._id !== componentId);
        setAvailableComponents(sinPadre);
        } catch (err) {
        console.error('Error al obtener componentes sin padre:', err);
        }
    };

    const handleAssociateExistingComponent = () => {
        if (!selectedExistingComponent) {
            Alert.alert('Error', 'Debes seleccionar un componente');
            return;
        }
        const comp = availableComponents.find(c => c._id === selectedExistingComponent);
        if (comp) {
            setComponents(prev => [...prev, { ...comp, toAssociate: true }]);
            setSelectedExistingComponent(null);
            setShowAssociateModal(false);
        }
    };

    const handleUpdateComponent = async () => {
        if (!name.trim() || !type.trim()) {
            Alert.alert('Error', 'El nombre y el tipo no pueden estar vacíos');
            return;
        }
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            // 1. Actualizar componente principal
            await axios.put(`${API_URL}/components/${componentId}`, {
                name,
                type,
                status,
                descriptions: descriptions
                    .filter(d => !d.toDelete)
                    .map(d => ({
                        ...(d._id ? { _id: d._id } : {}),
                        name: d.name,
                        description: d.description,
                    })),}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            // 2. Crear subcomponentes nuevos
            for (const sub of components.filter(c => c.isNew)) {
                await axios.post(
                    `${API_URL}/components/${componentId}/components`,
                    {
                    name: sub.name,
                    type: sub.type,
                    status: sub.status,
                    descriptions: [],
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }
            // 2b. Actualizar estado de subcomponentes existentes (de activo a de baja)
            for (const sub of components.filter(c => !c.isNew && !c.toDelete && c.status === 'de baja')) {
                await axios.put(
                    `${API_URL}/components/${sub._id}`,
                    {
                    name: sub.name,
                    type: sub.type,
                    status: 'de baja',
                    descriptions: sub.descriptions || [],
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }
            // 3. Desasociar subcomponentes marcados
            for (const sub of components.filter(c => c.toDelete && c._id)) {
                await axios.post(
                    `${API_URL}/components/${componentId}/disassociate/${sub._id}`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }
            // 4. Asociar subcomponentes seleccionados existentes
            for (const sub of components.filter(c => c.toAssociate && c._id)) {
                await axios.post(
                    `${API_URL}/components/${componentId}/associate/${sub._id}`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }
            Alert.alert('Éxito', 'Cambios guardados correctamente');
        } catch (err) {
            console.error('Error al guardar componente:', err);
            Alert.alert('Error', 'No se pudieron guardar los cambios');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.card}>
                {/* Nombre */}
                <Text style={styles.label}>Nombre</Text>
                <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Nombre"
                placeholderTextColor="#b8c3d9"
                />

                {/* Tipo */}
                <Text style={styles.label}>Tipo</Text>
                <TextInput
                style={styles.input}
                value={type}
                onChangeText={setType}
                placeholder="Tipo"
                placeholderTextColor="#b8c3d9"
                />

                {/* Características con botón + */}
                <View style={styles.rowTitle}>
                    <Text style={styles.sectionTitle}>Características</Text>
                    <TouchableOpacity
                        onPress={() => {
                        setDescriptionName('');
                        setDescriptionType('');
                        setEditingDescriptionId(null);
                        setShowCharModal(true);
                        }}
                        style={styles.addButton}
                    >
                        <Icon name="plus-circle-outline" size={22} color="#1976d2" />
                    </TouchableOpacity>
                </View>

                <View style={styles.listBox}>
                    <ScrollView style={{ maxHeight: 130 }}>
                        {descriptions.filter(d => !d.toDelete).length === 0 ? (
                        <Text style={styles.emptyText}>No hay características</Text>
                        ) : (
                        descriptions.filter(d => !d.toDelete).map((item, index) => (
                            <View key={item._id || index} style={styles.listItem}>
                            <Text style={styles.itemText}>
                                {item.name}: {item.description}
                            </Text>
                            <View style={styles.iconActions}>
                                <TouchableOpacity onPress={() => handleEditDescription(item)}>
                                <Icon name="pencil-outline" size={19} color="#1976d2" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleMarkDescriptionForDeletion(item._id)}>
                                <Icon name="trash-can-outline" size={19} color="#e74c3c" style={{ marginLeft: 13 }} />
                                </TouchableOpacity>
                            </View>
                            </View>
                        ))
                        )}
                    </ScrollView>
                </View>

                {/* Subcomponentes con botón + */}
                <View style={styles.rowTitle}>
                    <Text style={styles.sectionTitle}>Subcomponentes</Text>
                    <TouchableOpacity
                        onPress={() => {
                        Alert.alert(
                            'Agregar subcomponente',
                            '¿Qué quieres hacer?',
                            [
                            { text: 'Crear nuevo', onPress: () => navigation.navigate('CreateSubcomponent', { parentId: componentId }) },
                            { text: 'Asociar existente', onPress: () => { fetchAvailableComponents(); setShowAssociateModal(true); } },
                            { text: 'Cancelar', style: 'cancel' }
                            ]
                        );
                        }}
                        style={styles.addButton}
                    >
                        <Icon name="plus-circle-outline" size={22} color="#1976d2" />
                    </TouchableOpacity>
                </View>

                <View style={styles.listBox}>
                    <ScrollView style={{ maxHeight: 130 }}>
                        {components.filter(c => !c.toDelete).length === 0 ? (
                        <Text style={styles.emptyText}>No hay subcomponentes asociados</Text>
                        ) : (
                        components.filter(c => !c.toDelete).map((item) => (
                            <View key={item._id || item.name} style={styles.listItem}>
                            <Text style={styles.itemText}>{item.name} - {item.type}</Text>
                            <TouchableOpacity onPress={() => handleMarkForDisassociation(item._id)}>
                                <Icon name="trash-can-outline" size={19} color="#e74c3c" />
                            </TouchableOpacity>
                            </View>
                        ))
                        )}
                    </ScrollView>
                </View>

                {/* Cambiar estado (con colores institucionales) */}
                <TouchableOpacity
                    style={[
                        styles.statusButton,
                        status === 'de baja' && styles.statusButtonDeBaja
                    ]}
                    onPress={async () => {
                        if (loading) return;
                        // ... lógica de cambio de estado ...
                        if (status === 'activo') {
                        const hijos = components.filter(c => !c.toDelete);
                        if (hijos.length === 0) {
                            setStatus('de baja');
                            return;
                        }
                        try {
                            const token = await AsyncStorage.getItem('token');
                            const hijosConHijos = [];
                            for (const hijo of hijos) {
                            const res = await axios.get(`${API_URL}/components/${hijo._id}`, {
                                headers: { Authorization: `Bearer ${token}` },
                            });
                            if (res.data.components && res.data.components.length > 0) {
                                hijosConHijos.push(hijo.name);
                            }
                            }
                            if (hijosConHijos.length > 0) {
                            Alert.alert(
                                'No se puede dar de baja',
                                `Los siguientes subcomponentes tienen hijos y no pueden darse de baja automáticamente:\n- ${hijosConHijos.join('\n')}`
                            );
                            return;
                            }
                            Alert.alert(
                            'Dar de baja',
                            'Este componente tiene subcomponentes. ¿Desea darlos de baja también?',
                            [
                                { text: 'Cancelar', style: 'cancel' },
                                {
                                text: 'Sí, dar de baja todos',
                                onPress: () => {
                                    setStatus('de baja');
                                    const nuevos = components.map(c => ({ ...c, status: 'de baja' }));
                                    setComponents(nuevos);
                                },
                                },
                            ]
                            );
                        } catch (error) {
                            console.error('Error al verificar hijos:', error);
                            Alert.alert('Error', 'No se pudieron verificar los subcomponentes');
                        }
                        } else {
                        setStatus('activo');
                        }
                    }}
                    >
                    <Text style={styles.statusButtonText}>
                        {status === 'activo' ? 'Activo (Presione para dar de baja)' : 'De baja (Presione para activar)'}
                    </Text>
                </TouchableOpacity>

                {/* Guardar */}
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleUpdateComponent}
                    disabled={loading}
                >
                    {loading ? (<ActivityIndicator color="#FFF" />) : (<Text style={styles.actionButtonText}>Guardar cambios</Text>)}
                </TouchableOpacity>

                {/* Cancelar */}
                <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.cancelButtonText}>Volver</Text>
                </TouchableOpacity>

                {/* Modal agregar/editar característica */}
                <Modal visible={showCharModal} onRequestClose={() => setShowCharModal(false)} transparent>
                    <View style={styles.modalBg}>
                        <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>{editingDescriptionId ? 'Editar característica' : 'Agregar característica'}</Text>
                        <TextInput
                            style={styles.input}
                            value={descriptionName}
                            onChangeText={setDescriptionName}
                            placeholder="Nombre"
                            placeholderTextColor="#b8c3d9"
                        />
                        <TextInput
                            style={styles.input}
                            value={descriptionType}
                            onChangeText={setDescriptionType}
                            placeholder="Descripción"
                            placeholderTextColor="#b8c3d9"
                        />
                        <TouchableOpacity style={styles.actionButton} onPress={handleAddOrEditChar}>
                            <Text style={styles.actionButtonText}>{editingDescriptionId ? 'Guardar' : 'Agregar'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => setShowCharModal(false)}>
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Modal asociar subcomponente existente */}
                <Modal visible={showAssociateModal} onRequestClose={() => setShowAssociateModal(false)} transparent>
                    <View style={styles.modalBg}>
                        <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Asociar subcomponente existente</Text>
                        <Picker
                            onValueChange={(value) => setSelectedExistingComponent(value)}
                            items={availableComponents.map((comp) => ({
                            label: `${comp.name} - ${comp.type}`,
                            value: comp._id,
                            }))}
                            placeholder={{ label: 'Seleccione un componente...', value: null }}
                            style={{
                            inputIOS: styles.input,
                            inputAndroid: styles.input,
                            placeholder: { color: '#b8c3d9' },
                            }}
                            value={selectedExistingComponent}
                        />
                        <TouchableOpacity style={styles.actionButton} onPress={handleAssociateExistingComponent}>
                            <Text style={styles.actionButtonText}>Asociar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAssociateModal(false)}>
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>
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
    justifyContent: 'center', // Centra verticalmente el card
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
    marginTop: 54, // Para evitar estar pegado arriba
    marginBottom: 38,
  },
  label: {
    color: '#003057',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 10,
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
    marginBottom: 10,
    color: '#003057',
  },
  sectionTitle: {
    fontSize: 17,
    color: '#1976D2',
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 7,
    letterSpacing: 0.1,
  },
  rowTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 5,
    marginBottom: 10,
  },
  addButton: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  listBox: {
    backgroundColor: '#f8fbff',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E3E9F0',
    marginBottom: 7,
    minHeight: 44,
  },
  listItem: {
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemText: {
    color: '#374B67',
    fontSize: 15,
    flex: 1,
    flexWrap: 'wrap',
    marginRight: 8,
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    fontSize: 14,
    color: '#A0AEC0',
    paddingVertical: 8,
  },
  statusButton: {
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 17,
    marginBottom: 6,
    backgroundColor: '#e8edf7',
    width: '100%',
  },
  statusButtonDeBaja: {
    backgroundColor: '#fde6e6',
  },
  statusButtonText: {
    color: '#1976d2',
    fontWeight: 'bold',
    fontSize: 15,
  },
  actionButton: {
    backgroundColor: '#1976D2',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 16,
    width: '100%',
  },
  cancelButton: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1.4,
    borderColor: '#1976D2',
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 12,
    width: '100%',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButtonText: {
    color: '#1976D2',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // MODAL STYLES
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 26,
    width: '100%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 9,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2B48',
    marginBottom: 18,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D9E6',
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    marginBottom: 16,
    color: '#1A2B48',
  },
  modalMainButton: {
    backgroundColor: '#1976D2',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  modalMainButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalCancelButton: {
    borderRadius: 8,
    borderWidth: 1.6,
    borderColor: '#1976D2',
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#1976D2',
    fontSize: 16,
    fontWeight: 'bold',
  },
  //iconos
  iconActions: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'flex-end',
  marginLeft: 8,
  // Puedes agregar un minWidth si quieres que siempre tengan espacio
},
icon: {
  marginLeft: 16, // separa bien ambos íconos
},
  
});
