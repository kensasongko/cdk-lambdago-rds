import { App, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

// Ugly workaround, see: https://github.com/aws/aws-cdk/issues/14066

export class ContextInitStack extends Stack {
  constructor(scope: App, id: string, props: StackProps) {
    super(scope, id, props);

    const vpcId = ssm.StringParameter.valueFromLookup(this, '/Cdk/Core/VpcId');
    const vpc = ec2.Vpc.fromLookup(this, 'vpc', { vpcId: vpcId });
  }
}

const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION };

const app = new App();
new ContextInitStack(app, `ContextInitStack`, { env:env });

