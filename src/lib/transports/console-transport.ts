import type { LogTransport } from "../types.js";

export class ConsoleTransport implements LogTransport {
	writeLog(log: string): void {
		console.log(log);
	}
}

