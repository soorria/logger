import type { LogTransport } from "./types";

export class ConsoleTransport implements LogTransport {
	writeLog(log: string): void {
		console.log(log);
	}
}
