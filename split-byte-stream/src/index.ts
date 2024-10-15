import * as net from "net";
import { soInit } from "./soInit";
import type { TCPConn } from "./TCPConn";
import { soRead } from "./soRead";
import { soWrite } from "./soWrite";

// A dynamic-sized buffer
type DynBuf = {
  data: Buffer;
  length: number;
};

// append data to Dynamic
function bufPush(buf: DynBuf, data: Buffer): void {
  const newLen = buf.length + data.length;
  if (buf.data.length < newLen) {
    // grow the capacity by the power of two
    let cap = Math.max(buf.data.length, 32);
    while (cap < newLen) {
      cap *= 2;
    }
    const grown = Buffer.alloc(cap);
    buf.data.copy(grown, 0, 0);
    buf.data = grown;
  }

  data.copy(buf.data, buf.length, 0);
  buf.length = newLen;
}

function cutMessage(buf: DynBuf): null | Buffer {
  // messages are separeated by \n
  const idx = buf.data.subarray(0, buf.length).indexOf("\n");
  if (idx < 0) {
    return null;
  }
  const msg = Buffer.from(buf.data.subarray(0, idx + 1));
  bufPop(buf, idx + 1);
  return msg;
}

function bufPop(buf: DynBuf, len: number): void {
  buf.data.copyWithin(0, len, buf.length);
  buf.length -= len;
}

async function serveClient(socket: net.Socket): Promise<void> {
  const conn: TCPConn = soInit(socket);
  const buf: DynBuf = { data: Buffer.alloc(0), length: 0 };
  while (true) {
    // try to get 1 message from the buffer
    const msg: null | Buffer = cutMessage(buf);
    if (!msg) {
      // need more data
      const data: Buffer = await soRead(conn);
      bufPush(buf, data);
      // EOF?
      if (data.length === 0) {
        console.log("Client disconnected");
        return;
      }
      continue;
    }
    //  process the message and send the response
    if (msg.equals(Buffer.from("quit\n"))) {
      await soWrite(conn, Buffer.from("Bye.\n"));
      socket.destroy();
      return;
    } else {
      const reply = Buffer.concat([Buffer.from("Echo: "), msg]);
      await soWrite(conn, reply);
    }
  } // loop for messages
}

// TCP server setup using the serveClient function
const server = net.createServer((socket: net.Socket) => {
  serveClient(socket).catch((err) => {
    console.error("Error serving client:", err);
    socket.destroy();
  });
});

server.listen(3000, () => {
  console.log("Server listening on port 3000");
});
