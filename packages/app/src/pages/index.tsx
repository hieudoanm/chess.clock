import {
	LandingContent,
	LandingTemplate,
} from '@clock/templates/LandingTemplate';
import { NextPage } from 'next';

const content: LandingContent = {
	navbar: {
		title: 'ChessTimer',
		buttonText: 'Open App',
		buttonHref: '/app',
	},
	hero: {
		title: 'Time Your Chess Games Perfectly',
		tagline:
			'A fast, easy-to-use chess clock app for all skill levels, with customizable timers and game modes.',
		buttonText: 'Start Playing',
		buttonHref: '/app',
	},
	features: {
		title: 'Features',
		items: [
			{
				id: 'custom-timers',
				emoji: '⏱️',
				title: 'Custom Timers',
				description:
					'Set up classical, blitz, bullet, or custom time controls for any game format.',
			},
			{
				id: 'pause-resume',
				emoji: '⏸️',
				title: 'Pause & Resume',
				description:
					'Pause games at any time and resume without losing track of your remaining time.',
			},
			{
				id: 'increment-delay',
				emoji: '➕',
				title: 'Increment & Delay',
				description:
					'Supports FIDE-standard increments and delay settings for professional play.',
			},
			{
				id: 'sound-vibration',
				emoji: '🔔',
				title: 'Sound & Vibration Alerts',
				description:
					'Get audible and haptic alerts when your time is running low.',
			},
			{
				id: 'privacy-first',
				emoji: '🔒',
				title: 'Privacy First',
				description:
					'All games and timers are local. No data is uploaded or shared remotely.',
			},
			{
				id: 'multi-device',
				emoji: '📱',
				title: 'Multi-Device Ready',
				description:
					'Use it on phones, tablets, or desktops with responsive design and synced settings.',
			},
		],
	},
	cta: {
		title: 'Start Timing Your Games Today',
		description:
			'Keep fair and accurate timing for every match, whether casual or tournament-level. No signup required.',
		buttonText: 'Open Chess Clock',
		buttonHref: '/app',
	},
	footer: {
		name: 'ChessTimer',
	},
};

const HomePage: NextPage = () => {
	return <LandingTemplate content={content} />;
};

export default HomePage;
