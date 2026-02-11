import { NextPage } from 'next';
import { useEffect, useRef, useState } from 'react';
import {
	FaArrowsRotate,
	FaPause,
	FaPlay,
	FaGear,
	FaDownload,
} from 'react-icons/fa6';

/* ---------------- Utils ---------------- */

const ONE_SECOND = 1000;
const ONE_MINUTE = 60 * ONE_SECOND;
const ONE_UNIT = 10;

const addZero = (n: number) => (n < 10 ? `0${n}` : `${n}`);

/* ---------------- Types ---------------- */

type ChessClockSide = 'white' | 'black';

type DelayType = 'none' | 'bronstein' | 'fischer';

type ClockState = {
	running: boolean;
	current: ChessClockSide | '';
	timeControl: { white: string; black: string };
	milliseconds: { white: number; black: number };
	increment: { white: number; black: number };
	delay: number;
	delayType: DelayType;
	moves: number;
	timeout: ChessClockSide | ''; // 👈 ADD
};

/* ---------------- Presets ---------------- */

const PRESETS = {
	Bullet: ['1+0', '1+1', '2+1'],
	Blitz: ['3+0', '3+2', '5+0', '5+2', '5+5'],
	Rapid: ['10+0', '10+5', '15+0', '15+10', '30+0'],
};

/* ---------------- Page ---------------- */

const HomePage: NextPage = () => {
	const initial: ClockState = {
		running: false,
		current: '',
		timeControl: { white: '10+0', black: '10+0' },
		milliseconds: { white: 10 * ONE_MINUTE, black: 10 * ONE_MINUTE },
		increment: { white: 0, black: 0 },
		delay: 0,
		delayType: 'none',
		moves: 0,
		timeout: '', // 👈 ADD
	};

	const [clock, setClock] = useState<ClockState>(initial);
	const [timer, setTimer] = useState<any>(null);
	const [showModal, setShowModal] = useState(true);

	/* Bronstein tracking */
	const delaySpent = useRef<{ white: number; black: number }>({
		white: 0,
		black: 0,
	});

	/* ---------------- Helpers ---------------- */

	const convert = (tc: string) => {
		const [min, inc] = tc.split('+');
		return {
			milliseconds: Number.parseInt(min) * ONE_MINUTE,
			increment: Number.parseInt(inc),
		};
	};

	const format = (ms: number) => {
		const m = Math.floor(ms / ONE_MINUTE);
		const remain = ((ms % ONE_MINUTE) / 1000).toFixed(1);
		const [s, d] = remain.split('.');
		return `${addZero(m)}:${addZero(Number.parseFloat(s))}.${d}`;
	};

	/* ---------------- Clock Logic ---------------- */

	const startTurn = (side: ChessClockSide) => {
		delaySpent.current[side] = 0;
	};

	const endTurn = (side: ChessClockSide) => {
		setClock((p) => {
			let refund = 0;

			if (p.delayType === 'bronstein') {
				refund = Math.min(delaySpent.current[side], p.delay * ONE_SECOND);
			}

			if (p.delayType === 'fischer') {
				refund = p.increment[side] * ONE_SECOND;
			}

			return {
				...p,
				milliseconds: {
					...p.milliseconds,
					[side]: p.milliseconds[side] + refund,
				},
				moves: p.moves + (side === 'black' ? 1 : 0),
			};
		});
	};

	const click = (side: ChessClockSide) => {
		const other = side === 'white' ? 'black' : 'white';

		if (clock.current) endTurn(side);
		startTurn(other);

		setClock((p) => ({ ...p, current: other, running: true }));

		clearInterval(timer);

		const t = setInterval(() => {
			setClock((p) => {
				if (!p.current) return p;

				let deduction = ONE_UNIT;

				/* Bronstein delay countdown */
				if (p.delayType === 'bronstein') {
					const spent = delaySpent.current[p.current];
					if (spent < p.delay * ONE_SECOND) {
						delaySpent.current[p.current] += ONE_UNIT;
						deduction = 0;
					}
				}

				const newMs = p.milliseconds[p.current] - deduction;

				if (newMs <= 0) {
					clearInterval(timer);

					return {
						...p,
						milliseconds: {
							...p.milliseconds,
							[p.current]: 0,
						},
						running: false,
						current: '',
						timeout: p.current, // 👈 FLAG
					};
				}

				return {
					...p,
					milliseconds: {
						...p.milliseconds,
						[p.current]: newMs,
					},
				};
			});
		}, ONE_UNIT);

		setTimer(t);
	};

	const pause = () => {
		clearInterval(timer);
		setClock((p) => ({ ...p, running: false }));
	};

	const reset = () => {
		setClock((p) => {
			const w = convert(p.timeControl.white);
			const b = convert(p.timeControl.black);

			return {
				...initial,
				timeControl: p.timeControl,
				milliseconds: { white: w.milliseconds, black: b.milliseconds },
				increment: { white: w.increment, black: b.increment },
				delay: p.delay,
				delayType: p.delayType,
			};
		});
	};

	/* ---------------- PGN Export ---------------- */

	const exportPGN = () => {
		const pgn = `[TimeControl "${clock.timeControl.white}"]\n[Moves "${clock.moves}"]`;
		const blob = new Blob([pgn], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);

		const a = document.createElement('a');
		a.href = url;
		a.download = 'clock.pgn';
		a.click();
	};

	useEffect(() => () => clearInterval(timer), [timer]);

	/* ---------------- UI ---------------- */

	return (
		<div className="bg-base-300 flex h-screen w-screen flex-col">
			{/* ---------- Modal ---------- */}
			{showModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-md">
					<form
						onSubmit={(e) => {
							e.preventDefault();
							setShowModal(false);
						}}
						className="card bg-base-100 w-full max-w-2xl shadow-2xl">
						<div className="card-body gap-6">
							<h2 className="text-lg font-bold">Time Control</h2>

							{/* Presets */}
							<div className="space-y-3">
								{Object.entries(PRESETS).map(([group, list]) => (
									<div key={group}>
										<p className="text-sm opacity-60">{group}</p>
										<div className="flex flex-wrap gap-2">
											{list.map((tc) => (
												<button
													type="button"
													key={tc}
													className="btn btn-sm btn-outline"
													onClick={() => {
														const c = convert(tc);
														setClock((p) => ({
															...p,
															timeControl: { white: tc, black: tc },
															milliseconds: {
																white: c.milliseconds,
																black: c.milliseconds,
															},
															increment: {
																white: c.increment,
																black: c.increment,
															},
														}));
													}}>
													{tc}
												</button>
											))}
										</div>
									</div>
								))}
							</div>

							{/* Separate Custom Inputs */}
							<div className="grid grid-cols-2 gap-4">
								<input
									type="number"
									placeholder="White minutes"
									className="input input-bordered"
									onChange={(e) => {
										const m = parseInt(e.target.value || '0');
										setClock((p) => ({
											...p,
											milliseconds: {
												...p.milliseconds,
												white: m * ONE_MINUTE,
											},
										}));
									}}
								/>

								<input
									type="number"
									placeholder="Black minutes"
									className="input input-bordered"
									onChange={(e) => {
										const m = Number.parseInt(e.target.value || '0');
										setClock((p) => ({
											...p,
											milliseconds: {
												...p.milliseconds,
												black: m * ONE_MINUTE,
											},
										}));
									}}
								/>

								<input
									type="number"
									placeholder="White increment"
									className="input input-bordered"
									onChange={(e) => {
										const v = Number.parseInt(e.target.value || '0');
										setClock((p) => ({
											...p,
											increment: { ...p.increment, white: v },
										}));
									}}
								/>

								<input
									type="number"
									placeholder="Black increment"
									className="input input-bordered"
									onChange={(e) => {
										const v = Number.parseInt(e.target.value || '0');
										setClock((p) => ({
											...p,
											increment: { ...p.increment, black: v },
										}));
									}}
								/>
							</div>

							{/* Delay */}
							<div className="grid grid-cols-2 gap-4">
								<select
									className="select select-bordered"
									value={clock.delayType}
									onChange={(e) =>
										setClock((p) => ({
											...p,
											delayType: e.target.value as DelayType,
										}))
									}>
									<option value="none">No Delay</option>
									<option value="bronstein">Bronstein</option>
									<option value="fischer">Fischer</option>
								</select>

								<input
									type="number"
									placeholder="Delay sec"
									className="input input-bordered"
									onChange={(e) =>
										setClock((p) => ({
											...p,
											delay: Number.parseInt(e.target.value || '0'),
										}))
									}
								/>
							</div>

							<button className="btn">Start</button>
						</div>
					</form>
				</div>
			)}

			{/* ---------- Clock ---------- */}
			<div className="flex h-full flex-col">
				{/* Times */}
				<div className="grid flex-1 grid-cols-1 md:grid-cols-2">
					<button
						className={`flex items-center justify-center p-6 text-6xl font-bold md:text-9xl ${
							clock.timeout === 'white'
								? 'bg-error text-error-content'
								: clock.current === 'white'
									? 'bg-secondary text-secondary-content'
									: 'bg-base-100'
						}`}
						onClick={() => click('white')}>
						{format(clock.milliseconds.white)}
					</button>

					<button
						className={`flex items-center justify-center p-6 text-6xl font-bold md:text-9xl ${
							clock.timeout === 'black'
								? 'bg-error text-error-content'
								: clock.current === 'black'
									? 'bg-secondary text-secondary-content'
									: 'bg-base-200'
						}`}
						onClick={() => click('black')}>
						{format(clock.milliseconds.black)}
					</button>
				</div>

				{/* Bottom Controls */}
				<div className="bg-base-300 grid grid-cols-4 gap-2 p-3 md:grid-cols-4">
					<button
						className="btn btn-base flex items-center justify-center"
						onClick={() => setShowModal(true)}>
						<FaGear />
					</button>

					<button
						className="btn btn-base flex items-center justify-center"
						onClick={() => {
							// If time is over → reset
							if (clock.timeout) {
								reset();
								return;
							}

							// Running → pause
							if (clock.running) {
								pause();
								return;
							}

							// Paused → resume
							if (!clock.running && clock.current !== '') {
								click(clock.current === 'white' ? 'black' : 'white');
							}
						}}>
						{clock.timeout ? (
							<FaArrowsRotate />
						) : clock.running ? (
							<FaPause />
						) : (
							<FaPlay />
						)}
					</button>

					<button
						className="btn flex items-center justify-center"
						onClick={reset}>
						<FaArrowsRotate />
					</button>

					<button
						className="btn flex items-center justify-center"
						onClick={exportPGN}>
						<FaDownload />
					</button>
				</div>

				{/* Move Counter */}
				<div className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2">
					<div className="badge badge-primary badge-lg">Move {clock.moves}</div>
				</div>
			</div>
		</div>
	);
};

export default HomePage;
