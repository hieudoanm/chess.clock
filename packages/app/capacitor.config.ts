import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'io.github.hieudoanm.chess.clock',
	appName: '@chess.clock/app',
	webDir: '../../docs',
	android: { path: 'mobile/android' },
	ios: { path: 'mobile/ios' },
};

export default config;
