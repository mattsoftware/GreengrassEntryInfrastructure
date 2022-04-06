
# Raspberry Pi Install

### Create SD Image

Install raspberry pi os 32bit lite

Before booting, mount the /boot directory locally

    SSID=<ssid>
    PASSWORD=<ssid password here>
    
    touch ssh
    cat <<EOF > wpa_supplicant.conf
    country=AU
    ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
    update_config=1
    network={
    	ssid="$SSID"
    	psk="$PASSWORD"
    }
    EOF

### Boot
- login as pi/raspberry
- change password `passwd`
- change to root `sudo su -`
- `raspi-config`
  - Localisation Options
    - Locale
      - `en_AU.UTF-8`
      - remove `en_GB.UTF-8`
      - OK
      - Set default to `C.UTF-8`
    - Timezone
      - None of the above
      - UTC
    - Keyboard
      - Generic 105-key PC (intl.)
      - Other
      - English (US)
      - English (US)
      - Default for keyboard layout
      - No compose key
    - WLAN Country
      - AU
      - OK
  -  Update
  -  Finish

```
apt-get update
apt-get -y dist-upgrade
apt-get install -y vim watchdog
```

- `vim /etc/watchdog.conf`
  - uncomment max-load-1
  - uncomment min-memory
  - uncomment watchdog-device
  - uncomment watchdog-timeout and change to 15 seconds

```
systemctl enable watchdog && systemctl start watchdog
shutdown now -r
```

### Setup for Greengrass

- login as pi/[new password]
- change to root `sudo su -`

        addgroup --system ggc_group
        adduser --system ggc_user --ingroup ggc_group
        echo "fs.protected_hardlinks = 1" >> /etc/sysctl.d/90-greengrass.conf
        echo "fs.protected_symlinks = 1" >> /etc/sysctl.d/90-greengrass.conf
        echo "cgroup /sys/fs/cgroup cgroup defaults 0 0" >> /etc/fstab
        apt-get update
        apt-get install -y openjdk-8-jdk openjdk-8-jre python2.7
        ln -s /usr/bin/java /usr/bin/java8
        NODE_VERSION=12.22.9
        NODE_MAJOR_VERSION=12
        wget https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-armv7l.tar.gz -O node-v${NODE_VERSION}-linux-armv7l.tar.gz
        tar -xvf node-v${NODE_VERSION}-linux-armv7l.tar.gz -C /usr --strip 1
        ln -s /usr/bin/node /usr/bin/nodejs${NODE_VERSION}
        ln -s /usr/bin/node /usr/bin/nodejs${NODE_MAJOR_VERSION}.x

- `vim /boot/cmdline.txt`
  - add this to the end of the command line
    - `cgroup_enable=memory cgroup_memory=1 systemd.unified_cgroup_hierarchy=0`

`shutdown now -r`

### Test setup is correct

    curl -L https://github.com/aws-samples/aws-greengrass-samples/raw/master/greengrass-dependency-checker-GGCv1.10.x.zip > greengrass-dependency-checker-GGCv1.10.x.zip
    unzip greengrass-dependency-checker-GGCv1.10.x.zip
    cd greengrass-dependency-checker-GGCv1.10.x
    modprobe configs
    ./check_ggc_dependencies | more

You can ignore python3.7 binary not being found.

## Install greengrass - part 1

    cd /root
    curl https://s3.amazonaws.com/ec2-downloads-windows/SSMAgent/latest/debian_arm/amazon-ssm-agent.deb -o amazon-ssm-agent.deb
    dpkg -i amazon-ssm-agent.deb
    service amazon-ssm-agent stop
    
    curl -L https://d1onfpft10uf5o.cloudfront.net/greengrass-core/downloads/1.10.0/greengrass-linux-armv7l-1.10.0.tar.gz > greengrass-linux-armv7l-1.10.0.tar.gz
    tar -zxvf greengrass-linux-armv7l-1.10.0.tar.gz -C /
    pushd /greengrass/certs
    
    openssl genrsa -out cert.key 4096
    openssl req -new -sha256 -key cert.key -out cert.csr
    cat cert.csr
    
    openssl genrsa -out s3sync.key 4096
    openssl req -new -sha256 -key s3sync.key -out s3sync.csr
    cat s3sync.csr

## CDK Deploy

Before deploying the lambda functions will need to be built.

    pushd ../lambda-UserWatch/
    yarn install
    ./build.sh
    popd

Then we need to create the key/csr for the monitor script.

    pushd monitor
    curl https://www.amazontrust.com/repository/AmazonRootCA1.pem > root.ca.pem
    openssl genrsa -out monitor.key 4096
    openssl req -new -sha256 -key monitor.key -out monitor.csr
    cat monitor.csr
    popd

Edit the config.json file and add a section for the new account. The iotEndpoint can be fetched from the AWS console. (IoT Core -> Settings.) The output of cert.csr, s3sync.csr and monitor.csr goes into the config file and cdk will need to be deployed.

    yarn install
    cdk bootstrap aws://<ACCOUNT-NUMBER>/<REGION>
    cdk deploy

- Head into the AWS IoT Core console to get the certificate
  - IoT Core
    - Manage
      - Things
        - [prefix]_Core
          - certificates
            - click certificate id
              - actions -> download
- `vim /greengrass/certs/cert.pem` put certificate here
- Do the same for s3sync (this goes in /greengrass/certs/s3sync.pem)

- `vim /greengrass/config/config.json`
  - caPath = root.ca.pem
  - certPath = cert.pem
  - keyPath = cert.key
  - thingArn = [get the Prefix_Core thing arn from the console]
  - iotHost = [host from iot console settings]
  - ggHost = add the region to the endpoint
  - add runtime option…. "allowFunctionsToRunAsRoot": "yes"
  - useSystemd = yes
  - caPath = change brackets to root.ca.pem
  - privateKeyPath change brackets to cert.key (2 places)
  - certificateKeyPath change brackets to cert.pem

- Save the monitor certificate to the monitor directory. The name of the certificate much match the prefix in the config file for the profile you have deployed as.

        PREFIX=$(cat config.json | jq '."'$(aws sts get-caller-identity | jq '.Account' -r)'".prefix' -r)
        vim monitor/monitor-${PREFIX}.pem

Create an activation for ssm

    ROLE_NAME=$(yarn -s output | jq '.'$(yarn -s output | jq 'keys|map(match("^.*Role$"))[0].string' -r) -r)
    aws ssm create-activation --iam-role "$ROLE_NAME" --description "$ROLE_NAME Managed Instance" --default-instance-name "$ROLE_NAME" --registration-limit 1

(the output from this will be used for the next step on the pi)

## Install greengrass

    amazon-ssm-agent -register -code <code from above> -id <id from above> -region <region>
    service amazon-ssm-agent start
    
    curl https://www.amazontrust.com/repository/AmazonRootCA1.pem > /greengrass/certs/root.ca.pem
    
    cd /greengrass/ggc/packages/1.10.0/runtime/nodejs/
    cp -a node_modules node_modules-backup
    npm install aws-sdk aws-greengrass-core-sdk aws-iot-device-sdk
    npm install onoff mfrc522-rpi msw_greengrass_entry msw_nodejs_helper
    cp -a node_modules-backup/* node_modules

- /etc/systemd/system/greengrass.service

        [Unit]
        Description=Greengrass Daemon
        
        [Service]
        Type=forking
        PIDFile=/var/run/greengrassd.pid
        Restart=on-failure
        ExecStart=/greengrass/ggc/core/greengrassd start
        ExecReload=/greengrass/ggc/core/greengrassd restart
        ExecStop=/greengrass/ggc/core/greengrassd stop
        
        [Install]
        WantedBy=multi-user.target

```
systemctl enable greengrass
systemctl start greengrass
systemctl status greengrass
```

## Deploy to the greengrass group

- IoT Core Console
  - Greengrass
    - Classic (v1)
      - Groups
        - [Prefix]
          - Actions -> Deploy
          - Automatic detection

# Backup / Restore

## Backup an existing system

    ./backup/export.sh
    ls -lah backup/export.json

## Restore a previous backup

    # transform existing backup/export.json file ready for import
    ./backup/transform_to_import_files.js
    ls -lah backup/for_import-*.json
    # load entries into dynamodb table
    ./backup/import.js

