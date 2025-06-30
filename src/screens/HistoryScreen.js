import { API_URL } from '@env';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import SideMenu from './SideMenu';

//formatear fecha
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-CL', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export default function HistoryScreen({ navigation }) {
  const [histories, setHistories] = useState([]);
  const [expandedRows, setExpandedRows] = useState({}); // manejar expansión por id
  const [loading, setLoading] = useState(true); // loader
  const [menuVisible, setMenuVisible] = useState(false); //menu lateral

  useEffect(() => {
    const fetchHistories = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('token');
        const response = await axios.get(`${API_URL}/histories`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const sorted = response.data.sort((a, b) =>
          new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
        );
        setHistories(sorted);
      } catch (error) {
        Alert.alert('Error', 'No se pudo obtener el historial');
        setHistories([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHistories();
  }, []);

  const renderDetailsBlock = (entry) => {
    if (!entry.details && !entry.subcomponent_name) return null;

    const fieldNames = {
      name: 'Nombre',
      type: 'Tipo',
      status: 'Estado',
      description: 'Características',
      descriptions: 'Características',
      components: 'Componentes asociados'
    };

    return (
      <View style={styles.detailsBox}>
        {entry.subcomponent_name && (
          <Text style={styles.detailsText}>
            <Text style={{ fontWeight: 'bold' }}>Subcomponente:</Text> {entry.subcomponent_name}
          </Text>
        )}
        {entry.details && typeof entry.details === 'object' && Object.entries(entry.details).map(([key, change], idx) => {
          const label = fieldNames[key] || key;

          if (key === 'descriptions' && typeof change === 'object') {
            return (
              <View key={idx} style={{ marginBottom: 6 }}>
                {/* Editadas con formato limpio */}
                {Array.isArray(change.edited) && change.edited.length > 0 && (
                  change.edited.map((desc, j) => (
                    <View key={`edit-${j}`} style={{ marginLeft: 6, marginBottom: 12 }}>
                      <Text style={[styles.detailsText, { fontWeight: 'bold', marginBottom: 4 }]}>Editadas:</Text>
                      
                      <Text style={[styles.detailsText, { fontWeight: '600' }]}>Antes:</Text>
                      <Text style={styles.detailsText}>Nombre: {desc.before.name}</Text>
                      <Text style={styles.detailsText}>Descripción: {desc.before.description}</Text>
                      
                      <Text style={[styles.detailsText, { fontWeight: '600', marginTop: 8 }]}>Después:</Text>
                      <Text style={styles.detailsText}>Nombre: {desc.after.name}</Text>
                      <Text style={styles.detailsText}>Descripción: {desc.after.description}</Text>
                    </View>
                  ))
                )}

                {/* Agregadas sin colores */}
                {Array.isArray(change.added) && change.added.length > 0 && (
                  <View style={{ marginLeft: 6, marginBottom: 12 }}>
                    <Text style={[styles.detailsText, { fontWeight: 'bold' }]}>Agregadas:</Text>
                    {change.added.map((desc, i) => (
                      <Text key={`add-${i}`} style={styles.detailsText}>
                        Nombre: {desc.name}, Descripción: {desc.description}
                      </Text>
                    ))}
                  </View>
                )}

                {/* Eliminadas sin colores */}
                {Array.isArray(change.deleted) && change.deleted.length > 0 && (
                  <View style={{ marginLeft: 6, marginBottom: 12 }}>
                    <Text style={[styles.detailsText, { fontWeight: 'bold' }]}>Eliminadas:</Text>
                    {change.deleted.map((desc, i) => (
                      <Text key={`del-${i}`} style={styles.detailsText}>
                        Nombre: {desc.name}, Descripción: {desc.description}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            );
          } else if (change && typeof change === 'object' && change.before !== undefined && change.after !== undefined) {
            // Otros campos editados (ej. status)
            return (
              <View key={idx} style={{ marginBottom: 8 }}>
                <Text style={[styles.detailsText, { fontWeight: '600' }]}>
                  {label}:
                </Text>
                <Text style={styles.detailsText}>Antes: {String(change.before).charAt(0).toUpperCase() + String(change.before).slice(1)}</Text>
                <Text style={styles.detailsText}>Después: {String(change.after).charAt(0).toUpperCase() + String(change.after).slice(1)}</Text>
              </View>
            );
          }

          return null;
        })}
        
        {entry.details && typeof entry.details === 'string' && (
          <Text style={styles.detailsText}>{entry.details}</Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>


      {/* Header institucional con menú */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.iconWrapper}>
          <Ionicons name="menu" size={24} color="#E8EDF7" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Historial de modificaciones</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Menú lateral */}
      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} navigation={navigation} />

      {/* Loader */}
      {loading ? (
        <ActivityIndicator size="large" color="#1976d2" style={{ marginTop: 32 }} />
      ) : (
        // Limita la altura de la tabla y permite scroll interno
        <View style={styles.tableWrapper}>
          <ScrollView>
            <View style={styles.table}>
              {/* Encabezado */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>Componente</Text>
                <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Acción</Text>
                <Text style={[styles.tableHeaderText, { flex: 0.7, textAlign: 'center' }]}></Text>
              </View>
              {/* Filas */}
              {histories.map((entry, idx) => {
                const isExpanded = !!expandedRows[entry._id];
                return (
                  <View key={entry._id || idx}>
                    <View style={styles.tableRow}>
                      <Text style={[styles.cell, { flex: 2 }]}>
                        {entry.component_name}
                      </Text>
                      <Text style={[styles.cell, { flex: 1.5 }]}>
                        {entry.action}
                      </Text>
                      <TouchableOpacity
                        style={{ flex: 0.7, alignItems: 'center', justifyContent: 'center' }}
                        onPress={() => setExpandedRows(prev => ({
                          ...prev,
                          [entry._id]: !isExpanded
                        }))}
                      >
                        <Ionicons
                          name={isExpanded ? 'chevron-up-circle-outline' : 'chevron-down-circle-outline'}
                          size={22}
                          color="#1976d2"
                        />
                      </TouchableOpacity>
                    </View>
                    {isExpanded && (
                      <View style={styles.expandedRow}>
                        <Text style={styles.detailsText}>
                          <Text style={{ fontWeight: 'bold' }}>Usuario:</Text> {entry.user_id?.username || 'Desconocido'}
                        </Text>
                        <Text style={styles.detailsText}>
                          <Text style={{ fontWeight: 'bold' }}>Fecha:</Text> {formatDate(entry.date || entry.createdAt)}
                        </Text>
                        {renderDetailsBlock(entry)}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Botón Volver institucional */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Volver</Text>
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
  tableWrapper: {
    maxHeight: 600, // ajustar espacio tabla
    minHeight: 160,
    marginBottom: 16,
  },
  table: {
    backgroundColor: '#f9fbfe',
    borderRadius: 14,
    padding: 6,
    elevation: 1,
    flex: 1,
    minHeight: 120,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e5f4ff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 4,
  },
  tableHeaderText: {
    color: '#003057',
    fontWeight: '700',
    fontSize: 14,
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginBottom: 2,
    borderWidth: 1,
    borderColor: '#e6eaf0',
    minHeight: 40,
  },
  cell: {
    color: '#1c1c1e',
    fontSize: 14,
    flex: 1,
    marginRight: 2,
    minWidth: 80,
    flexWrap: 'wrap',
    lineHeight: 18,
  },
  expandedRow: {
    backgroundColor: '#eaf4ff',
    borderRadius: 8,
    marginHorizontal: 8,
    marginTop: -6,
    marginBottom: 10,
    padding: 10,
    minHeight: 40,
  },
  detailsBox: {
    flexDirection: 'column',
    gap: 3,
    marginTop: 3,
  },
  detailsText: {
    color: '#003057',
    fontSize: 13,
    marginBottom: 2,
    lineHeight: 17,
  },
  backButton: {
    marginTop: 5,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1976d2',
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 16,
  },
  backButtonText: {
    color: '#1976d2',
    fontWeight: 'bold',
    fontSize: 16,
  },
});