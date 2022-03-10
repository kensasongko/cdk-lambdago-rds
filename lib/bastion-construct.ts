import { Construct, IConstruct } from 'constructs';
import { Stack, RemovalPolicy, Duration } from 'aws-cdk-lib';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from 'aws-cdk-lib/aws-rds';


interface BastionConstructProps {
  instanceType: ec2.InstanceType;
  rdsAccessSg: ec2.SecurityGroup;
  rdsUserSecret: rds.DatabaseSecret;
}

export class BastionConstruct extends Construct {
  constructor(scope: Stack, id: string, props: BastionConstructProps) {
    super(scope, id);

    const vpcId = ssm.StringParameter.valueFromLookup(this, '/cdk/core/vpc-id');
    const vpc = ec2.Vpc.fromLookup(this, 'Vpc', { vpcId: vpcId});

    const bastionHost = new ec2.BastionHostLinux(this, 'BastionHost', {
      vpc,
      subnetSelection: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      instanceType: props.instanceType,
      securityGroup: props.rdsAccessSg,
      blockDevices: [{
        deviceName: 'EBSBastionHost',
        volume: ec2.BlockDeviceVolume.ebs(10, {
          encrypted: true,
        }),
      }],
    });
    //bastionHost.allowSshAccessFrom(ec2.Peer.anyIpv4());
    props.rdsUserSecret.grantRead(bastionHost);
  }
}