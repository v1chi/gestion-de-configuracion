import { API_URL } from '@env';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { FlatList, Modal, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function MenuUserScreen({ navigation }) {
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [componentHistory, setComponentHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [componentList, setComponentList] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  const fetchComponentById = async (id) => {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.get(`${API_URL}/components/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  };

  const fetchAllComponents = async () => {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.get(`${API_URL}/components`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  };

  const handleSearch = async (text) => {
    setSearchQuery(text);
    const token = await AsyncStorage.getItem('token');
    try {
      if (!text.trim()) {
        const all = await fetchAllComponents();
        setComponentList(all);
      } else {
        const response = await axios.get(`${API_URL}/components/search?q=${encodeURIComponent(text)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setComponentList(response.data);
      }
    } catch (err) {
      console.error('Error al buscar componentes:', err);
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

  useEffect(() => {
    (async () => {
      const all = await fetchAllComponents();
      setComponentList(all);
    })();
  }, []);

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
      </View>
    </View>
  );


  return (
    <SafeAreaView style={styles.container}>
      

      {/* Header */}
      <View style={styles.header}>
        {/* Botón cerrar sesión */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          style={styles.iconWrapper}
        >
          <Ionicons name="log-out-outline" size={22} color="#E8EDF7" />
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Todos los Componentes</Text>
        </View>

        <TouchableOpacity onPress={() => setShowSearch(!showSearch)} style={styles.iconWrapper}>
          <Ionicons name={showSearch ? 'filter' : 'filter-outline'} size={24} color="#E8EDF7" />
        </TouchableOpacity>
      </View>

      {/* Tabla Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, { flex: 2 }]}>Nombre</Text>
        <Text style={[styles.tableHeaderText, { flex: 1.3 }]}>Tipo</Text>
        <Text style={[styles.tableHeaderText, { flex: 1.1 }]}>Estado</Text>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>Acciones</Text>
      </View>


      {/* Buscador */}
      {showSearch && (
        <View style={styles.filters}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar componentes..."
            placeholderTextColor="#ccc"
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
      )}

      {/* Lista */}
      <FlatList
        data={componentList}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
      />

      {/* Modal de detalle */}
      <Modal visible={showComponentModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {selectedComponent && (
              <>
                <Text style={styles.modalTitle}>{selectedComponent.name}</Text>
                <Text style={styles.modalLabel}>Tipo:</Text>
                <Text style={styles.modalText}>{selectedComponent.type}</Text>
                <Text style={styles.modalLabel}>Estado:</Text>
                <Text style={styles.modalText}>{capitalize(selectedComponent.status)}</Text>

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
  filters: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 8,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#003057',
    marginBottom: 6,
    borderWidth: 0,
    elevation: 1,
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

  moreButton: {
    marginLeft: 8,
    padding: 4,
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
