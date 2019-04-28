# rev-service
Rev allows you to connect to, monitor and control devices supporting the
firmataBoard protocol.

## Firmata
[Firmata](http://firmata.org/wiki/Main_Page) is a protocol that allows
near-realtime communication between a host and client device. It can be used to read values or execute specific actions, such as performing
serial UART communication. Rev makes use of the [firmata.js](https://github.com/firmata/firmata.js/tree/master/packages/firmata.js) library, 
in conjunction with [SerialPort](https://www.npmjs.com/package/serialport) to handle the transport layer for serial connections.

Devices are able to connect over ethernet and serial USB interfaces, although no guarantees can be given about latencies when using ethernet.

## Interfaces
Rev contains an extensive set of interfaces to connect to the outside world and firmataBoard-compatible devices.

### Serial
The SerialService scans all host USB interfaces for plugged in devices with firmataBoard-compatibility. When recognized, they are added to the list of connected devices.

### Ethernet
Devices are able to connect using nothing but a regular network connection. The EthernetService opens up and listens port 9000 by default.

### WebSocket
The frontend application can be fed through a WebSocket connection, again, promising near-realtime updates.
The WebSocket endpoint is by default available at <ws://localhost>

### FileServer
The FileServer serves files that are present in the ```/public``` directory on <http://localhost>. It serves ```index.html``` by default when a GET request is made to the root folder.
Will probably remove this in the future.

## Installation
Install dependencies
```sh
npm install
```

To install Rev globally, run
```sh
npm link
```
After which you will be able to start the service through the terminal, regardless of what folder you are in.
```sh
rev-service [--ethernet] [--serial] [--debug] [--port 9000]
```

