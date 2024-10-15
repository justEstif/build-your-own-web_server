import * as net from "net";
import type { TCPConn } from "./TCPConn";

/**
 * Wraps the net.Socket into a custom TCPConn object
 */
export function soInit(socket: net.Socket): TCPConn {
  const conn: TCPConn = {
    socket: socket,
    err: null,
    ended: false,
    reader: null,
  };
  socket.on("data", (data: Buffer) => {
    // If there's a reader waiting for data, resolve the promise with the received data
    if (conn.reader) {
      conn.reader.resolve(data);
      conn.reader = null;
      // Pause the socket to prevent more data until it's resumed in soRead
      socket.pause();
    }

    // Echo the received data back to the client
    socket.write(Buffer.concat([Buffer.from("Echo: "), data]));
  });
  socket.on("end", () => {
    // this also fulfills the current read.
    conn.ended = true;
    if (conn.reader) {
      conn.reader.resolve(Buffer.from("")); // EOF
      conn.reader = null;
    }
  });
  socket.on("error", (err: Error) => {
    // errors are also delivered to the current read.
    conn.err = err;
    if (conn.reader) {
      conn.reader.reject(err);
      conn.reader = null;
    }
  });
  return conn;
}
