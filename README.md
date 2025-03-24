# fetchmailmgr

`fetchmailmgr` is a bridge between `fetchmail` and `docker-mailserver`. It fetches emails from external mail providers and delivers them to
the `docker-mailserver`. The configuration is managed by `mailserver-admin`, the management interface for `docker-mailserver`.

## Usage

### Environment Variables

- `REDIS_URL`: The URL of the Redis server. Default is `redis://localhost:6379`.
- `TEMP_DIR`: The directory used for temporary files. Default is `/run/fetchmailmgr`.
- `MTA_HOST`: The hostname of the Mail Transfer Agent (MTA). Default is `mta`.
- `FETCHMAIL_PATH`: The path to the `fetchmail` executable. Default is `/usr/bin/fetchmail`.

## Links

- [docker-mailserver](https://github.com/jeboehm/docker-mailserver)
- [mailserver-admin](https://github.com/jeboehm/mailserver-admin)
- [Issues](https://github.com/jeboehm/docker-mailserver/issues)
