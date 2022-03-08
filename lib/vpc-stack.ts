import { App, Stack, StackProps } from 'aws-cdk-lib';
import { aws_ec2 as ec2 } from 'aws-cdk-lib';

export class VpcStack extends Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: App, id: string, props: StackProps) {
    super(scope, id, props);

    const { env } = props;

    const vpcCdir = this.node.tryGetContext('vpcCdir');

    this.vpc = new ec2.Vpc(this, 'vpc-stack', {
      cidr: vpcCdir,
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: 'public-subnet-1',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'private-subnet-1',
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
          cidrMask: 24,
        },
        {
          name: 'isolated-subnet-1',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    new ec2.InterfaceVpcEndpoint(this, 'SecretsManagerEndpoint', {
      vpc: this.vpc,
      service: new ec2.InterfaceVpcEndpointService('com.amazonaws.' + env?.region + '.secretsmanager', 443),
      privateDnsEnabled: true,
    });
  }
}