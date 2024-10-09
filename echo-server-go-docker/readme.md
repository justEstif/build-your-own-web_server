## 
## Using docker-compose

1. build and start the service

```bash
docker-compose up --build -d
```

2. stop the service

```bash
docker-compose down
```
## Without

1. build the docker image

```bash
docker build -t echo-server-go .
```

2. run the docker container

```bash
docker run -d -p 3333:3333 --name echo-server echo-server-go
```

3. test

```bash
echo "Hello server" | nc localhost 3333
```

4. stop and remove the container

```bash
docker stop echo-server
docker rm echo-server
```

