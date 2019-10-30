|Branch|Build status|Code coverage|
|:---- |:---------- |:----------- |
|develop|[![pipeline status](https://gitlab.com/daftfox/rev-service/badges/develop/pipeline.svg)](https://gitlab.com/daftfox/rev-service/pipelines)|![coverage report](https://gitlab.com/daftfox/rev-service/badges/develop/coverage.svg)|
|master|[![pipeline status](https://gitlab.com/daftfox/rev-service/badges/master/pipeline.svg)](https://gitlab.com/daftfox/rev-service/pipelines)|[![coverage report](https://gitlab.com/daftfox/rev-service/badges/master/coverage.svg)](https://daftfox.gitlab.io/rev-service/reports/coverage/index.html)|

# rev-service
Rev allows you to connect to, monitor and control devices supporting the
firmataBoard protocol.

## Firmata
[Firmata](http://firmata.org/wiki/Main_Page) is a protocol that allows
near-realtime communication between a host and client device. It can be used to read values or execute specific actions, such as performing
serial UART communication. Rev makes use of the [firmata.js](https://github.com/firmata/firmata.js/tree/master/packages/firmata.js) library, 
in conjunction with [SerialPort](https://www.npmjs.com/package/serialport) to handle the transport layer for serial connections.

Devices are able to connect over ethernet and serial USB interfaces, although no guarantees can be given about latencies when using ethernet.

### Compatible firmware

## Interfaces
Rev contains an extensive set of interfaces to connect to the outside world and firmataBoard-compatible devices.

### Serial
The SerialService scans all host USB interfaces for plugged in devices with firmataBoard-compatibility. When recognized, they are added to the list of connected devices.

### Ethernet
Devices are able to connect using nothing but a regular network connection. The EthernetService opens up and listens port 9000 by default.

### WebSocket
The frontend application can be fed through a WebSocket connection, again, promising near-realtime updates.
The WebSocket endpoint is by default available at <ws://localhost:3001>

## Installation
Install dependencies
```sh
$ npm install
```

To install Rev globally, run
```sh
$ npm link
```
After which you will be able to start the service through the terminal, regardless of what folder you are in.

## Running rev-service
Rev-service can be run using `npm start` in the root of the project, but after running `npm link` it can be run from anywhere
using `rev-service`. Rev-service supports the following flags:

|      flag      |      purpose       |    default   |
|:-------------- |:------------------ |:------------ |
| --ethernetPort | Port from which the ethernet service will be served | 3001 |
| --debug        | Enable debug logging | false |
| --serial       | Enable serial interface | false |
| --ethernet     | Enable ethernet interface | false |
| --dbSchema     | The default schema to use | rev |
| --dbHost       | The database server's host address | localhost |
| --dbPort       | Port on which the database server is running | 3306 |
| --dbUsername   | Username to log in to the database server | null |
| --dbPassword   | Password to log in to the database server | null |
| --dbDialect    | The database server's dialect (mysql, postgres, mariadb, sqlite, mssql) | sqlite |
| --dbPath       | Path to the database file (only when using sqlite) | database/rev.db |

Examples:
```sh
$ npm start -- --debug --serial --ethernet
$ rev-service --ethernet --ethernetPort=3200
```