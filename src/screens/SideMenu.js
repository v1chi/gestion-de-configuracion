import { Ionicons } from '@expo/vector-icons';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SideMenu({ visible, onClose, navigation }) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.popup}>
          {/* Botón de cerrar */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={22} color="#1976d2" />
          </TouchableOpacity>

          {/* Opciones del menú */}
          <MenuOption
            icon="home-outline"
            text="Menú Principal"
            onPress={() => { onClose(); navigation.navigate('MenuAdmin'); }}
          />
          <MenuOption
            icon="add-circle-outline"
            text="Agregar Componente"
            onPress={() => { onClose(); navigation.navigate('AddComponent'); }}
          />
          <MenuOption
            icon="settings-outline"
            text="Gestionar Componente"
            onPress={() => { onClose(); navigation.navigate('ManageComponents'); }}
          />
          <MenuOption
            icon="time-outline"
            text="Ver Historial de Modificaciones"
            onPress={() => { onClose(); navigation.navigate('History'); }}
          />
          <MenuOption
            icon="log-out-outline"
            text="Cerrar Sesión"
            onPress={() => { onClose(); navigation.navigate('Login'); }}
            color="#D32F2F"
          />
        </View>
      </View>
    </Modal>
  );
}

function MenuOption({ icon, text, onPress, color = '#003057' }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.82}>
      <Ionicons name={icon} size={18} color={color} style={styles.menuIcon} />
      <Text style={[styles.menuText, { color }]}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10,20,40,0.24)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popup: {
    width: 315,
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingVertical: 28,
    paddingHorizontal: 18,
    alignItems: 'stretch',
    elevation: 18,
    shadowColor: '#003057',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 1,
    padding: 6,
    borderRadius: 50,
    backgroundColor: '#f1f6fa',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#003057',
    letterSpacing: 0.1,
  },
});