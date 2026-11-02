/** Serialize file lifetimes, including handle close, before atomic replacement. */
export function createLocalAiFileAccess() {
	let tail = Promise.resolve();
	return function access<T>(operation: () => Promise<T>): Promise<T> {
		const result = tail.then(operation);
		tail = result.then(
			() => {},
			() => {},
		);
		return result;
	};
}
