# fetchmailmgr

`fetchmailmgr` is a bridge between `fetchmail` and `docker-mailserver`. It fetches emails from external mail providers and delivers them to
the `docker-mailserver`. The configuration is managed by `mailserver-admin`, the management interface for `docker-mailserver`.

## Usage

### Environment Variables

- `REDIS_URL`: The URL of the Redis server. Default is `redis://localhost:6379`.
- `TEMP_DIR`: The directory used for temporary files. Default is `/run/fetchmailmgr`.
- `MTA_HOST`: The hostname of the Mail Transfer Agent (MTA). Default is `mta`.
- `FETCHMAIL_PATH`: The path to the `fetchmail` executable. Default is `/usr/bin/fetchmail`.

### Command Line Options

- `-d, --debug`: Output extra debugging information.
- `-i, --interval <interval>`: Interval in seconds to run fetchmail. Default is `60`.
- `-s, --server <server>`: Host to listen for health check requests. Default is `0.0.0.0`.
- `-p, --port <port>`: Port to listen for health check requests. Default is `3000`.

`fetchmailmgr` is a bridge between `fetchmail` and `docker-mailserver`. It fetches emails from external mail providers and delivers them to the `docker-mailserver`. The configuration is managed by `mailserver-admin`, the management interface for `docker-mailserver`.

## How `fetchmailmgr` Functions

1. **Configuration**: The configuration details for email accounts are stored in Redis under the key `fetchmail_accounts`. These details are read and used to manage the fetching of emails.

2. **Account Object**: The `account` object represents the configuration details for an email account. It includes various properties that define how to connect to the email server and how to handle the emails.

3. **Fetching Emails**: The `fetchmailmgr` uses the `fetchmail` executable to fetch emails from the configured email accounts. It constructs the necessary configuration files and executes `fetchmail` with the appropriate arguments.

### Account Object

The `account` object has the following properties:

- `id`: A unique identifier for the account.
- `host`: The hostname of the email server.
- `protocol`: The protocol used to connect to the email server (e.g., `IMAP`, `POP3`).
- `port`: The port number to connect to the email server.
- `username`: The username for the email account.
- `password`: The password for the email account.
- `ssl`: A boolean indicating whether to use SSL or implicit TLS for the connection.
- `verifySsl`: A boolean indicating whether to verify the SSL certificate.
- `user`: The local user to deliver the emails to.

### Example of the `fetchmail_accounts` key in Redis:

```json
[
  {
    "id": 1,
    "host": "mail.example.com",
    "protocol": "IMAP",
    "port": 993,
    "username": "user@example.com",
    "password": "password123",
    "ssl": true,
    "verifySsl": true,
    "user": "localuser"
  }
]
```

## Development

To add a prefilled `fetchmail_accounts` key to Redis using `docker compose`, follow these steps:

Start the services:

```bash
docker-compose up
```

Prefill the fetchmail_accounts key in Redis:

```bash
docker-compose exec redis redis-cli \
  SET fetchmail_accounts '[{"id":1,"host":"mail.example.com","protocol":"IMAP","port":993,"username":"user@example.com","password":"password123","ssl":true,"verifySsl":true,"user":"localuser"}]'
```

These commands will start the services and set the `fetchmail_accounts` key in Redis with the specified data.
This will put fetchmailmgr in a state where it will fetch emails from the specified email account.

## Links

- [docker-mailserver](https://github.com/jeboehm/docker-mailserver)
- [mailserver-admin](https://github.com/jeboehm/mailserver-admin)
- [Issues](https://github.com/jeboehm/docker-mailserver/issues)
