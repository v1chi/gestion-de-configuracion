import { API_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import axios from "axios";
import { useCallback, useState } from "react";
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
    const [descriptionName, setDescriptionName] = useState('');
    const [descriptionType, setDescriptionType] = useState('');
    const [editingDescriptionId, setEditingDescriptionId] = useState(null);
    const [availableComponents, setAvailableComponents] = useState([]);
    const [selectedExistingComponent, setSelectedExistingComponent] = useState(null);

    /**
     * Al montar la pantalla, obtiene los detalles del componente actual desde la API.
     * Extrae y guarda en el estado el nombre, tipo, estado, descripciones y subcomponentes.
     * Utiliza el token JWT almacenado en AsyncStorage para autenticar la solicitud.
     */
    useFocusEffect(
        useCallback(() => {
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
        }, [componentId])
    );

    /**
     * Agrega una nueva característica (descripción) al componente o edita una existente.
     * Si se está editando, reemplaza la descripción correspondiente en la lista.
     * Si es nueva, la agrega al final. Luego limpia el formulario y cierra el modal.
     * Muestra alerta si los campos están incompletos.
     */
    const handleAddOrEditChar = () => {
        if (!descriptionName || !descriptionType) {
            Alert.alert('Error', 'Faltan campos por completar');
            return;
        }

        const nueva = {
            name: descriptionName,
            description: descriptionType,
        };

        if (editingDescriptionId) {
            // Editar descripción existente (usa _id o tempId)
            setDescriptions(prev =>
            prev.map(desc =>
                desc._id === editingDescriptionId || desc.tempId === editingDescriptionId
                ? { ...desc, ...nueva }
                : desc
            )
            );
        } else {
            // Agregar nueva con tempId único
            const nuevaConId = {
            ...nueva,
            tempId: Date.now().toString(),
            };
            setDescriptions(prev => [...prev, nuevaConId]);
        }

        setDescriptionName('');
        setDescriptionType('');
        setEditingDescriptionId(null);
        setShowCharModal(false);
        };

 
    /**
     * Carga en el formulario los datos de una característica existente para ser editada.
     * Abre el modal de edición y guarda temporalmente el ID de la descripción seleccionada.
     */
    const handleEditDescription = (desc) => {
        setDescriptionName(desc.name);
        setDescriptionType(desc.description);
        setEditingDescriptionId(desc._id || desc.tempId);
        setShowCharModal(true);
    };


    /**
     * Marca una descripción para su eliminación lógica, sin borrarla inmediatamente.
     * La eliminación real se procesa al momento de guardar los cambios.
     */
    const handleMarkDescriptionForDeletion = (descId) => {
        setDescriptions(prev =>
            prev.map(d =>
            d._id === descId || d.tempId === descId
                ? { ...d, toDelete: true }
                : d
            )
        );
    };


    /**
     * Marca un subcomponente para ser desvinculado del componente padre.
     * La desvinculación efectiva se realiza al guardar los cambios.
     */
    const handleMarkForDisassociation = (childId) => {
        setComponents(prev =>
            prev.map((c) => (c._id === childId ? { ...c, toDelete: true } : c))
        );
    };

    /**
     * Obtiene todos los componentes desde la API y filtra los que no tienen padre ni son el actual.
     * Guarda la lista en el estado para permitir la asociación con el componente actual.
     */
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

    /**
     * Asocia un componente existente al componente actual.
     * Busca el componente seleccionado en la lista disponible y lo agrega a los asociados.
     * Marca internamente que debe asociarse al guardar.
     * Muestra alerta si no se selecciona ningún componente.
     */
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

    /**
     * Guarda los cambios realizados al componente actual.
     *
     * 1. Valida que los campos requeridos estén completos.
     * 2. Actualiza el componente principal con sus nuevos datos y descripciones.
     * 3. Crea nuevos subcomponentes agregados manualmente.
     * 4. Cambia el estado a 'de baja' en subcomponentes existentes cuando corresponde.
     * 5. Desasocia subcomponentes marcados para eliminación.
     * 6. Asocia subcomponentes seleccionados desde la lista de disponibles.
     *
     * Utiliza el token JWT desde AsyncStorage para autenticar todas las solicitudes.
     * Muestra alertas según el resultado de la operación.
     */
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
                <Text style={styles.label}>Nombre</Text>
                <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Nombre"
                placeholderTextColor="#b8c3d9"
                />

                <Text style={styles.label}>Tipo</Text>
                <TextInput
                style={styles.input}
                value={type}
                onChangeText={setType}
                placeholder="Tipo"
                placeholderTextColor="#b8c3d9"
                />

                {/* Características*/}
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
                            <View key={item._id ||  item.tempId} style={styles.listItem}>
                            <Text style={styles.itemText}>
                                {item.name}: {item.description}
                            </Text>
                            <View style={styles.iconActions}>
                                <TouchableOpacity onPress={() => handleEditDescription(item)}>
                                    <Icon name="pencil-outline" size={19} color="#1976d2" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleMarkDescriptionForDeletion(item._id || item.tempId)}>
                                    <Icon name="trash-can-outline" size={19} color="#e74c3c" style={{ marginLeft: 13 }} />
                                </TouchableOpacity>
                            </View>
                            </View>
                        ))
                        )}
                    </ScrollView>
                </View>

                {/* Subcomponentes*/}
                <View style={styles.rowTitle}>
                    <Text style={styles.sectionTitle}>Subcomponentes</Text>
                    <TouchableOpacity
                        onPress={() => {
                            Alert.alert('Aviso', 'Si tienes cambios sin guardar estos se perderán al continuar ¿Deseas seguir?',
                            [{ text: 'Cancelar', style: 'cancel' },
                                {text: 'Continuar',
                                    onPress: () => {
                                    Alert.alert('Agregar subcomponente','¿Qué quieres hacer?',
                                        [{ text: 'Crear nuevo', onPress: () => navigation.navigate('CreateSubcomponent', { parentId: componentId }) },
                                        { text: 'Asociar existente', onPress: () => { fetchAvailableComponents(); setShowAssociateModal(true); } },
                                        { text: 'Cancelar', style: 'cancel' }]
                                    );}}]);
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

                {/* Cambiar estado */}
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

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleUpdateComponent}
                    disabled={loading}
                >
                    {loading ? (<ActivityIndicator color="#FFF" />) : (<Text style={styles.actionButtonText}>Guardar cambios</Text>)}
                </TouchableOpacity>

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
    marginTop: 54,
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
  iconActions: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'flex-end',
  marginLeft: 8,
},
icon: {
  marginLeft: 16, 
},
  
});
