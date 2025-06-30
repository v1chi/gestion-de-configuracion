import { API_URL } from '@env';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { FlatList, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import SideMenu from './SideMenu';

export default function MenuAdminScreen({ navigation }) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [componentsData, setComponentsData] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const [selectedComponent, setSelectedComponent] = useState(null);
  const [showComponentModal, setShowComponentModal] = useState(false);

  const [componentHistory, setComponentHistory] = useState([]);

  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historyData, setHistoryData] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [componentList, setComponentList] = useState([]); // reemplaza si ya existía
  const [loading, setLoading] = useState(false);

  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  
  const handleSearch = async (text) => {
    try {
      setSearchQuery(text);
      setLoading(true);
      const token = await AsyncStorage.getItem('token');

      if (!text.trim()) {
        const all = await fetchAllComponents();
        setComponentList(all);
      } else {
        const response = await axios.get(`${API_URL}/components/search?q=${encodeURIComponent(text)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setComponentList(response.data);
      }
    } catch (error) {
      console.error('Error buscando componentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToSubcomponent = async (subId) => {
    const sub = await fetchComponentById(subId);
    setComponentHistory(prev => [...prev, selectedComponent]);
    setSelectedComponent(sub);
  };

  const handleGoBackInModal = () => {
    if (componentHistory.length > 0) {
      const previous = componentHistory[componentHistory.length - 1];
      setComponentHistory(prev => prev.slice(0, -1));
      setSelectedComponent(previous);
    } else {
      setShowComponentModal(false);
    }
  };

  const fetchComponentById = async (id) => {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.get(`${API_URL}/components/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  };

  const fetchHistoryByComponent = async (id) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/histories/components/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (err) {
      console.error('Error al obtener historial:', err);
      Alert.alert('Error', 'No se pudo obtener el historial');
      return [];
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      const all = await fetchAllComponents();
      setComponentList(all);
    };
    fetchInitialData();
  }, []);

  const fetchAllComponents = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/components`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (err) {
      console.error('Error al obtener componentes:', err);
      return [];
    }
  };

  const capitalize = (s) => s && s[0].toUpperCase() + s.slice(1);

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={[styles.itemTextNombre, { flex: 2 }]}>{item.name}</Text>
      <Text style={[styles.itemText, { flex: 1.3 }]}>{item.type}</Text>
      <Text style={[styles.itemText, { flex: 1.1 }]}>{capitalize(item.status)}</Text>
      <View style={[styles.actionsCell, { flex: 1 }]}>
        <TouchableOpacity
          onPress={async () => {
            const data = await fetchComponentById(item._id);
            setSelectedComponent(data);
            setShowComponentModal(true);
          }}
          style={styles.iconAction}
          activeOpacity={0.7}
        >
          <Ionicons name="eye" size={19} color="#1976d2" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={async () => {
            const history = await fetchHistoryByComponent(item._id);
            setHistoryData(Array.isArray(history) ? history.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) : []);
            setHistoryModalVisible(true);
          }}
          style={styles.iconAction}
          activeOpacity={0.7}
        >
          <Ionicons name="time-outline" size={19} color="#9b59b6" />
        </TouchableOpacity>
      </View>
    </View>
  );


  return (
    <SafeAreaView style={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.iconWrapper}>
          <Ionicons name="menu" size={25} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Todos los Componentes</Text>

        <TouchableOpacity onPress={() => setShowFilters(prev => !prev)} style={styles.iconWrapper}>
          <Ionicons name={showFilters ? 'filter' : 'filter-outline'} size={22} color="#fff" />
        </TouchableOpacity>
      </View>

   
      {/* Tabla Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, { flex: 2 }]}>Nombre</Text>
        <Text style={[styles.tableHeaderText, { flex: 1.3 }]}>Tipo</Text>
        <Text style={[styles.tableHeaderText, { flex: 1.1 }]}>Estado</Text>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>Acciones</Text>
      </View>


      {showFilters && (
        <View style={styles.filters}>
          <Ionicons name="search" size={19} color="#b7bfc7" style={{ marginRight: 7 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar componentes..."
            placeholderTextColor="#bbb"
            value={searchQuery}
            onChangeText={text => {
              setSearchQuery(text);
              handleSearch(text);
            }}
          />
        </View>
      )}

      {/* Lista */}
      <FlatList
        data={componentList}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
      />

      {!loading && componentList.length === 0 && (
        <Text style={{ color: '#bbb', textAlign: 'center', marginTop: 36, fontSize: 16 }}>
          No se encontraron componentes.
        </Text>
      )}

      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} navigation={navigation} />

      {/* Subcomponentes */}
      <Modal visible={showComponentModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {selectedComponent && (
              <>
                <Text style={styles.modalTitle}>{selectedComponent.name}</Text>
                <Text style={styles.modalLabel}>Tipo:</Text>
                <Text style={styles.modalText}>{selectedComponent.type}</Text>
                <Text style={styles.modalLabel}>Estado:</Text>
                <Text style={styles.modalText}>
                  {selectedComponent.status ? selectedComponent.status.charAt(0).toUpperCase() + selectedComponent.status.slice(1) : ''}
                </Text>

                <Text style={styles.modalLabel}>Características:</Text>
                {selectedComponent.descriptions?.map((desc, index) => (
                  <Text key={index} style={styles.modalText}>
                    • {desc.name}: {desc.description}
                  </Text>
                ))}

                <Text style={styles.modalLabel}>Subcomponentes:</Text>
                  {selectedComponent.components?.map((subComp) => (
                    <TouchableOpacity
                      key={subComp._id}
                      onPress={() => handleGoToSubcomponent(subComp._id)}
                    >
                      <Text style={styles.subcomponentLink}>
                        Ver detalles de "{subComp.name}"
                      </Text>
                    </TouchableOpacity>
                ))}

                <TouchableOpacity style={styles.modalBackButton} onPress={handleGoBackInModal}>
                  <Text style={styles.modalBackText}>Volver</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Historial de modificaciones*/}
      <Modal visible={historyModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Historial de cambios</Text>
            <ScrollView style={{ marginTop: 12 }}>
              {historyData.map((entry, index) => {
                const actionTranslations = {
                  'name edited': 'Se cambió el nombre',
                  'type edited': 'Se cambió el tipo',
                  'status changed': 'Se cambió el estado',
                  'description edited': 'Se editaron características',
                  'subcomponent associated': 'Se asoció un subcomponente',
                  'subcomponent disassociated': 'Se desasoció un subcomponente',
                  'Crear componente': 'Crear componente',
                  'Editar componente': 'Editar componente',
                  'Eliminar componente': 'Eliminar componente',
                };

                const fieldNames = {
                  name: 'Nombre',
                  type: 'Tipo',
                  description: 'Características',
                  descriptions: 'Características',
                  status: 'Estado',
                  components: 'Componentes asociados',
                };

                const translatedAction = actionTranslations[entry.action] || entry.action;

                return (
                  <View key={index} style={styles.modalHistoryBlock}>
                    <Text style={styles.modalLabel}>Acción:</Text>
                    <Text style={styles.modalText}>{translatedAction}</Text>
                    {entry.subcomponent_name && entry.action?.includes('subcomponent') && (
                      <>
                        <Text style={styles.modalLabel}>Subcomponente:</Text>
                        <Text style={styles.modalText}>{entry.subcomponent_name}</Text>
                      </>
                    )}

                    {typeof entry.details === 'object' && entry.details !== null ? (
                      <>
                        <Text style={styles.modalLabel}>Detalles:</Text>
                        {Object.entries(entry.details).map(([key, change], i) => {
                          const label = fieldNames[key] || key;
                          // Si el cambio es en descripciones (características)
                          if (key === "descriptions" && typeof change === "object") {
                            return (
                              <View key={i} style={{ marginBottom: 8 }}>
                                <Text style={styles.modalText}>• {label}:</Text>
                                {/* Editadas */}
                                {Array.isArray(change.edited) && change.edited.length > 0 && (
                                  <View style={{ marginLeft: 10, marginTop: 2 }}>
                                    <Text style={[styles.modalText, { fontWeight: "bold" }]}>Editadas:</Text>
                                    {change.edited.map((desc, j) => (
                                      <View key={`edit-${desc._id || j}`} style={{ marginLeft: 8 }}>
                                        <Text style={styles.modalText}>
                                          Nombre: <Text style={{ color: '#E74C3C' }}>{desc.before.name}</Text> → <Text style={{ color: '#27ae60' }}>{desc.after.name}</Text>
                                        </Text>
                                        <Text style={styles.modalText}>
                                          Descripción: <Text style={{ color: '#E74C3C' }}>{desc.before.description}</Text> → <Text style={{ color: '#27ae60' }}>{desc.after.description}</Text>
                                        </Text>
                                      </View>
                                    ))}
                                  </View>
                                )}
                                {/* Agregadas */}
                                {Array.isArray(change.added) && change.added.length > 0 && (
                                  <View style={{ marginLeft: 10, marginTop: 2 }}>
                                    <Text style={[styles.modalText, { fontWeight: "bold" }]}>Agregadas:</Text>
                                    {change.added.map((desc, j) => (
                                      <View key={`add-${desc._id || j}`} style={{ marginLeft: 8 }}>
                                        <Text style={styles.modalText}>
                                          Nombre: <Text style={{ color: '#27ae60' }}>{desc.name}</Text>
                                        </Text>
                                        <Text style={styles.modalText}>
                                          Descripción: <Text style={{ color: '#27ae60' }}>{desc.description}</Text>
                                        </Text>
                                      </View>
                                    ))}
                                  </View>
                                )}
                                {/* Eliminadas */}
                                {Array.isArray(change.deleted) && change.deleted.length > 0 && (
                                  <View style={{ marginLeft: 10, marginTop: 2 }}>
                                    <Text style={[styles.modalText, { fontWeight: "bold" }]}>Eliminadas:</Text>
                                    {change.deleted.map((desc, j) => (
                                      <View key={`del-${desc._id || j}`} style={{ marginLeft: 8 }}>
                                        <Text style={styles.modalText}>
                                          Nombre: <Text style={{ color: '#E74C3C' }}>{desc.name}</Text>
                                        </Text>
                                        <Text style={styles.modalText}>
                                          Descripción: <Text style={{ color: '#E74C3C' }}>{desc.description}</Text>
                                        </Text>
                                      </View>
                                    ))}
                                  </View>
                                )}
                              </View>
                            );
                          } else {
                            // Otros campos (name, type, status, etc)
                            return (
                              <View key={i} style={{ marginBottom: 8 }}>
                                <Text style={styles.modalText}>• {label}:</Text>
                                <Text style={styles.modalText}>Antes: {change.before}</Text>
                                <Text style={styles.modalText}>Después: {change.after}</Text>
                              </View>
                            );
                          }
                        })}
                      </>
                    ) : (
                      entry.details && typeof entry.details === 'string' && (
                        <>
                          <Text style={styles.modalLabel}>Detalles:</Text>
                          <Text style={styles.modalText}>{entry.details}</Text>
                        </>
                      )
                    )}
                  </View>
                );
              })}
            </ScrollView>
            <TouchableOpacity onPress={() => setHistoryModalVisible(false)} style={styles.modalBackButton}>
              <Text style={styles.modalBackText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


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
    fontSize: 20,     // ↓ antes 23
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.1,
    marginLeft: 0,
  },
  iconWrapper: {
    width: 34,        // ↓ antes 36
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: 'transparent',
    marginHorizontal: 2,
  },

  filters: {
    marginBottom: 16,
    backgroundColor: '#f6fafd',
    borderRadius: 15,
    padding: 9,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  searchInput: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 16,
    color: '#003057',
    borderWidth: 0,
    flex: 1,
  },

  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eaf2fa',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 7,
    marginBottom: 7,
    elevation: 0,
  },
  tableHeaderText: {
    color: '#1976d2',
    fontWeight: 'bold',
    fontSize: 15,         // Tamaño coherente con los datos
    flexWrap: 'wrap',
    textAlign: 'center',
  },

  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 6,   // ↓ antes 8
    paddingHorizontal: 8, // ↓ antes 10
    borderRadius: 12,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: '#e6eaf0',
    elevation: 0,
    minHeight: 36,
  },

  itemTextNombre: {
    flex: 1.3,             // Proporción con el resto
    color: '#003057',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',   // Centrado ahora sí
    paddingLeft: 0,        // O máximo 2
  },
  itemText: {
    flex: 1.1,
    color: '#374B67',
    fontWeight: '500',
    fontSize: 14,
    textAlign: 'center',
  },

  itemTextAcciones: {
    flex: 1,
    textAlign: 'center',
  },
  menuModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  menuContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    elevation: 10,
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    backgroundColor: '#f0f2f5',
    borderRadius: 8,
    marginBottom: 12,
    borderColor: '#d6e8f5',
    borderWidth: 1,
  },
  menuText: {
    color: '#003057',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 12,
  },
  moreButton: {
    marginLeft: 8,
    padding: 7,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 8,
    elevation: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#003057',
    marginBottom: 12,
  },
  modalLabel: {
    color: '#1976d2',
    fontWeight: 'bold',
    marginTop: 10,
  },
  modalText: {
    color: '#1c1c1e',
    marginLeft: 8,
    marginTop: 2,
  },
  modalLink: {
    color: '#1976d2',
    marginTop: 6,
    textDecorationLine: 'underline',
    marginLeft: 8,
  },
  modalBackButton: {
    marginTop: 20,
    backgroundColor: '#1976d2',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalBackText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalHistoryBlock: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 12,
  },
  subcomponentLink: {
    color: '#1976d2',
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 8,
    fontSize: 15,
    textDecorationLine: 'underline',
  },
  actionsCell: {
    flex: 0.9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconAction: {
    padding: 3,
    marginHorizontal: 2,
  },
});