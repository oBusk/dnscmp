import { createSocket, type Socket } from "node:dgram";
import { isIP } from "node:net";

export interface UdpResponse {
  data: Buffer;
  rtt: number;
}

/**
 * Point-to-point UDP client. Sends a datagram and resolves with the
 * first reply that `isMatch` accepts, along with the round-trip time
 * in milliseconds. Replies that don't match are ignored and the wait
 * continues, so a late reply to a previous, already timed-out
 * request can't be mistaken for the current one.
 */
export class UdpClient {
  readonly #host: string;
  readonly #port: number;
  readonly #socket: Socket;
  #bindToPortPromise: Promise<void> | null = null;

  constructor(host: string, port: number) {
    const family = isIP(host);
    if (family === 0) {
      throw new Error(`invalid host: ${host}`);
    }
    this.#host = host;
    this.#port = port;
    this.#socket = createSocket(family === 6 ? "udp6" : "udp4");
  }

  async request(
    payload: Buffer,
    timeoutMs: number,
    isMatch: (data: Buffer) => boolean,
  ): Promise<UdpResponse> {
    await this.#bindToPort();
    return this.#send(payload, timeoutMs, isMatch);
  }

  close(): void {
    try {
      this.#socket.close();
    } catch {
      // socket may already be closed
    }
  }

  #bindToPort(): Promise<void> {
    if (this.#bindToPortPromise == null) {
      this.#bindToPortPromise = new Promise<void>((resolve, reject) => {
        const onError = (err: Error) => {
          this.#socket.off("listening", onListening);
          reject(err);
        };
        const onListening = () => {
          this.#socket.off("error", onError);
          resolve();
        };
        this.#socket.once("listening", onListening);
        this.#socket.once("error", onError);
        this.#socket.bind(0);
      });
    }

    return this.#bindToPortPromise;
  }

  #send(
    payload: Buffer,
    timeoutMs: number,
    isMatch: (data: Buffer) => boolean,
  ): Promise<UdpResponse> {
    return new Promise((resolve, reject) => {
      const socket = this.#socket;
      let timer: ReturnType<typeof setTimeout>;

      function cleanup() {
        clearTimeout(timer);
        socket.off("message", onMessage);
        socket.off("error", onError);
      }

      const onMessage = (data: Buffer) => {
        const rtt = performance.now() - t0;
        if (isMatch(data)) {
          cleanup();
          resolve({ data, rtt });
        }
      };
      const onError = (err: Error) => {
        cleanup();
        reject(err);
      };

      socket.on("message", onMessage);
      socket.once("error", onError);
      timer = setTimeout(() => {
        cleanup();
        reject(new Error("ETIMEOUT"));
      }, timeoutMs);
      
      const t0 = performance.now();
      socket.send(payload, this.#port, this.#host, (err) => {
        if (err) {
          cleanup();
          reject(err);
        }
      });
    });
  }
}
