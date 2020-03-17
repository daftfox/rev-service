| Branch  | Build status                                                                                                               | Code coverage                                                                                                                                                                         | Tests                                                                                                                                                                |
| :------ | :------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| develop | ![Gitlab pipeline status (branch)](https://img.shields.io/gitlab/pipeline/daftfox/rev-service/develop?style=for-the-badge) | [![coverage report](https://gitlab.com/daftfox/rev-service/badges/develop/coverage.svg?style=flat-square)](https://daftfox.gitlab.io/rev-service/reports/develop/coverage/index.html) | [Unit](https://daftfox.gitlab.io/rev-service/reports/develop/test-unit/index.html) [e2e](https://daftfox.gitlab.io/rev-service/reports/develop/test-unit/index.html) |
| master  | ![Gitlab pipeline status (branch)](https://img.shields.io/gitlab/pipeline/daftfox/rev-service/master?style=for-the-badge)  | [![coverage report](https://gitlab.com/daftfox/rev-service/badges/master/coverage.svg?style=flat-square)](https://daftfox.gitlab.io/rev-service/reports/master/coverage/index.html)   | [Unit](https://daftfox.gitlab.io/rev-service/reports/master/test-unit/index.html)                                                                                    |

</br>

![GitHub tag (latest by date)](https://img.shields.io/github/v/tag/daftfox/rev-service?style=for-the-badge)

[![npm](https://img.shields.io/npm/v/rev-service?color=success&style=for-the-badge)](https://www.npmjs.com/package/rev-service)

[![Gitlab repository](https://img.shields.io/badge/gitlab-blue?logo=gitlab&style=for-the-badge)](https://gitlab.com/daftfox/rev-service)&nbsp;
[![Github repository](https://img.shields.io/badge/github-blue?logo=github&style=for-the-badge)](https://github.com/daftfox/rev-service)&nbsp;

# Rev

Rev is a platform that allows you to control and monitor micro-controllers real-time. All micro-controllers
capable of running firmware with an implementation of the [firmata](https://github.com/firmata/protocol) protocol
can be connected using either a serial or ethernet connection. Useful for sensor readouts, home-automation
or other projects that require real-time communication with your homemade hardware.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

-   A micro-controller running firmware with an implementation of the firmata protocol.
    -   A more detailed explanation on how to achieve this is given [here](#flashing-a-micro-controller-with-firmata-firmware).
-   Nodejs. Tested on [11.14.0](https://nodejs.org/dist/v11.14.0/).
-   NPM (this usually comes with the Nodejs installation).

### Installing

#### Using GIT

Clone the repository

```sh
$ git clone https://github.com/daftfox/rev-service
```

Install dependencies

```sh
$ cd rev-service
$ npm install
```

If you want to use rev in conjunction with sqlite, you seem to have to install the
required package manually according to their documentation.

```sh
$ npm install sqlite3
```

You should now be able to execute the rev service by running:

```sh
$ npm start
```

If you want to execute the rev service from other directories, run the following command in the root
of the project directory to make a symbolic link to rev in your global `node_modules`:

```sh
$ npm link
```

#### Using NPM

Install the package

```sh
$ npm install -g @rev-control/service
```

After which you should be able to execute the rev service anywhere by running the following command:

```sh
$ rev-service [options]
```

### Options

The following options can be added as flags when executing rev.

| flag           | purpose                                                                 | default   |
| :------------- | :---------------------------------------------------------------------- | :-------- |
| --ethernetPort | Port from which the ethernet service will be served                     | 3001      |
| --debug        | Enable debug logging                                                    | false     |
| --serial       | Enable serial interface                                                 | false     |
| --ethernet     | Enable ethernet interface                                               | false     |
| --dbSchema     | The default schema to use                                               | rev       |
| --dbHost       | The database server's host address                                      | localhost |
| --dbPort       | Port on which the database server is running                            | 3306      |
| --dbUsername   | Username to log in to the database server                               | null      |
| --dbPassword   | Password to log in to the database server                               | null      |
| --dbDialect    | The database server's dialect (mysql, postgres, mariadb, sqlite, mssql) | sqlite    |
| --dbPath       | Path to the database file (only when using sqlite)                      | :memory:  |

## Interfaces

Rev is able to connect to micro-controllers using the following interfaces:

### Serial

The rev scans all host serial interfaces for plugged in devices running the firmata protocol.

### Ethernet

Devices are able to connect using nothing but a regular network connection. Wireless or wired. Rev binds to port 9000 by default.

## Running the tests

The rev service contains an extensive suite of unit tests executed by [Jest](https://jestjs.io/).
These tests can be executed using:

```sh
$ npm test
```

### Break down into end to end tests

Todo

```
todo
```

### And coding style tests

Todo

```
todo
```

## Deployment

Todo

## Flashing a micro-controller with firmata firmware

A comprehensible guide flashing firmata firmware onto your micro-controller

### Prerequisites

-   [Arduino IDE](https://www.arduino.cc/en/main/software)
-   [ConfigurableFirmata library](https://www.arduinolibraries.info/libraries/configurable-firmata) (installed in Arduino IDE)
-   Firmware. I recommend picking the features you require on [firmatabuilder](http://firmatabuilder.com/)

Open the firmware downloaded from firmatabuilder using the Arduino IDE and connect your board.
Select the correct board type under 'tools' and hit 'upload'.

## Built With

Todo

## Contributing

Todo
Please read [CONTRIBUTING.md]() for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/daftfox/rev-service/tags).

## Authors

-   **Timothy Claassens** - _Owner_ - [daftfox](https://github.com/daftfox)

See also the list of [contributors](https://github.com/daftfox/rev-service/contributors) who participated in this project.

## License

[![License](https://img.shields.io/badge/license-GPL-blue?style=for-the-badge)](LICENSE)

This project is licensed under the GNU General Public License.

## Acknowledgments

Todo
