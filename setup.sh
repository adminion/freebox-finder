
apt-get update && apt-get -y install gcc make build-essential nodejs npm mongodb
npm install

sudo bash -c "cat > ./config/config.json" <<EOF
{

}
EOF

sudo bash -c "cat > /etc/init/freebox-finder.conf" <<EOF
start on started mongodb

script
    `pwd`/freebox-finder.sh | logger
end script
EOF

start freebox-finder
