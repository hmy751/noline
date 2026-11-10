import * as Sentry from '@sentry/react-native';
import { randomUUID } from 'expo-crypto';
import { initializeDiagnostics } from './sentry';

initializeDiagnostics(Sentry, randomUUID);
