import { API_URL } from '@env';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import SideMenu from './SideMenu';

export default function ManageComponentsScreen({ navigation }) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [componentsData, setComponentsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  /**
   * Al enfocarse obtiene la lista completa de componentes desde el backend
   *
   * Actualiza el estado `componentsData` con los datos obtenidos
   * Si ocurre un error, muestra una alerta y limpia la lista
   *
   * También limpia el campo de búsqueda (`search`) para evitar que persistan filtros anteriores
   */
  useFocusEffect(
    useCallback(() => {
      const fetchComponents = async () => {
        try {
          setLoading(true);
          const token = await AsyncStorage.getItem('token');
          const response = await axios.get(`${API_URL}/components`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setComponentsData(response.data);
        } catch (err) {
          Alert.alert('Error', 'No se pudo obtener los componentes');
          setComponentsData([]);
        } finally {
          setLoading(false);
        }
      };
      setSearch('');
      fetchComponents();
    }, [])
  );

  /**
   * Filtra los componentes por nombre o tipo según el texto ingresado en `search`.
   */
  const filteredData = componentsData.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.type.toLowerCase().includes(search.toLowerCase())
  );

  /**
   * Muestra cada componente con su nombre, tipo y estado.
   * Incluye un botón para ir a la pantalla de detalle del componente.
   */
  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={{ flex: 3 }}>
        <Text style={styles.itemText}>{item.name}</Text>
        <Text style={styles.itemSubText}>
          {item.type} | {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </Text>
      </View>
      
      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity
          onPress={() => navigation.navigate('ComponentDetail', { componentId: item._id })}
          style={{ marginHorizontal: 4 }}
          activeOpacity={0.75}
        >
          <Ionicons name="settings-outline" size={20} color="#1976d2" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleDeleteComponent(item._id)}
          style={{ marginHorizontal: 4 }}
          activeOpacity={0.75}
        >
          <Ionicons name="trash-outline" size={20} color="#d32f2f" />
        </TouchableOpacity>
      </View>

    </View>
  );

  const handleDeleteComponent = async (componentId) => {
    try {
      Alert.alert(
        'Confirmar eliminación',
        '¿Estás seguro de que quieres eliminar este componente?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              const token = await AsyncStorage.getItem('token');
              await axios.delete(`${API_URL}/components/${componentId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              // Actualiza la lista después de eliminar
              const response = await axios.get(`${API_URL}/components`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              setComponentsData(response.data);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error eliminando componente:', error);
      Alert.alert('Error', 'No se pudo eliminar el componente');
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>

        <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.iconWrapper}>
          <Ionicons name="menu" size={24} color="#E8EDF7" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Gestionar Componente</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowFilters((prev) => !prev)}
          style={styles.iconWrapper}
        >
          <Ionicons name={showFilters ? 'filter' : 'filter-outline'} size={24} color="#E8EDF7" />
        </TouchableOpacity>
      </View>
      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} navigation={navigation} />

      {showFilters && (
        <View style={styles.filters}>
          <Ionicons name="search-outline" size={18} color="#1976d2" style={{ marginRight: 6 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre o tipo..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#5c7a9d"
          />
        </View>
      )}

      {/* Lista de componentes*/}
      {loading ? (
        <ActivityIndicator size="large" color="#1976d2" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingBottom: 24, paddingTop: showFilters ? 8 : 0 }}
          ListEmptyComponent={
            <Text style={{ color: '#c1d1e8', textAlign: 'center', marginTop: 24 }}>
              No se encontraron componentes.
            </Text>
          }
        />
      )}

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => navigation.navigate('MenuAdmin')}
      >
        <Text style={styles.cancelButtonText}>Volver</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#003057',
    paddingHorizontal: 16,
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
    marginBottom: 7,
    backgroundColor: '#f6fafd',
    borderRadius: 15,
    padding: 9,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    marginTop: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#003057',
    backgroundColor: 'transparent',
    paddingLeft: 2,
    paddingVertical: 0,
    minHeight: 26,
  },
  itemContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d6e8f5',
  },
  itemText: {
    color: '#1c1c1e',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemSubText: {
    color: '#3c5e7b',
    fontSize: 13,
    marginTop: 2,
  },
  manageButton: {
    backgroundColor: '#1976d2',
    borderRadius: 7,
    paddingVertical: 7,
    paddingHorizontal: 16,
    marginLeft: 12,
    alignItems: 'center',
  },
  manageButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 0.1,
  },
  cancelButton: {
    marginBottom: 24,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1976d2',
    alignSelf: 'center',
    width: 200,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#1976d2',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
