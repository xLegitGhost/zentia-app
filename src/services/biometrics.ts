import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export interface BiometricsCapability {
  supported: boolean;
  enrolled: boolean;
  label: string;
}

export const biometrics = {
  async getCapability(): Promise<BiometricsCapability> {
    if (Platform.OS === 'web') {
      return {
        supported: false,
        enrolled: false,
        label: 'Biometría disponible solo en móvil (iOS / Android)',
      };
    }

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        return {
          supported: false,
          enrolled: false,
          label: 'Tu dispositivo no cuenta con sensor biométrico',
        };
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const hasFaceId = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
      const label = hasFaceId ? 'Face ID / Reconocimiento facial' : 'Huella dactilar / Touch ID';

      return {
        supported: true,
        enrolled,
        label: enrolled ? label : `${label} (sin configurar en el dispositivo)`,
      };
    } catch (e) {
      console.warn('Error checking biometrics capability:', e);
      return {
        supported: false,
        enrolled: false,
        label: 'No se pudo consultar el sensor biométrico',
      };
    }
  },

  async authenticate(promptMessage = 'Desbloquear Zentia'): Promise<boolean> {
    if (Platform.OS === 'web') {
      return true;
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Cancelar',
        fallbackLabel: 'Usar código del dispositivo',
        disableDeviceFallback: false,
      });
      return result.success;
    } catch (e) {
      console.warn('Error authenticating with biometrics:', e);
      return false;
    }
  },
};

export default biometrics;
