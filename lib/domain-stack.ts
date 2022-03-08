import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as route53 from 'aws-cdk-lib/aws-route53';

export class DomainStack extends Stack {
  public readonly zone: route53.PublicHostedZone;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const hostedZone = this.node.tryGetContext('hostedZone');

    this.zone = new route53.PublicHostedZone(this, hostedZone + ' Hosted Zone', {
      zoneName: hostedZone,
    });
  }
}
