export const addZero = (number: number, length: number = 2): string => {
	const numberLength: number = number.toString().length;
	const gap: number = length >= numberLength ? length - numberLength : 0;
	return `${'0'.repeat(gap)}${number}`;
};

export const range = (start: number, stop: number, step = 1): number[] => {
	if (stop <= start) return [];
	const result: number[] = [];
	if (step > 0) {
		for (let i = start; i <= stop; i += step) {
			result.push(i);
		}
	} else {
		for (let i = start; i > stop; i += step) {
			result.push(i);
		}
	}
	return result;
};

export const formatCurrency = (amount: number, currency: string = 'USD') => {
	const formatted = new Intl.NumberFormat('vi', {
		style: 'currency',
		currency,
	}).format(amount);
	return formatted;
};
