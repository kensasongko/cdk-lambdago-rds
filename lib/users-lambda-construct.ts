import * as path from 'path';

import { Construct } from "constructs";
import { Stack, StackProps, DockerImage, Duration } from 'aws-cdk-lib';
import * as lambdago from "@aws-cdk/aws-lambda-go-alpha";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ssm from 'aws-cdk-lib/aws-ssm';

interface UsersLambdaConstructProps {
  lambdaTimeout: Duration
  rdsUserSecret: rds.DatabaseSecret;
}

export class UsersLambdaConstruct extends Construct {
  public readonly handler: lambdago.GoFunction;

  constructor(scope: Stack, id: string, props: UsersLambdaConstructProps) {
    super(scope, id);

    const databaseName = ssm.StringParameter.valueFromLookup(this, '/cdk/bootstrap/database-name');

    const vpcId = ssm.StringParameter.valueFromLookup(this, '/cdk/core/vpc-id');
    const vpc = ec2.Vpc.fromLookup(this, 'Vpc', { vpcId: vpcId});

    const lambdaPath = path.join(__dirname, '../sources/users/src');
    this.handler = new lambdago.GoFunction(this, 'UsersLambdaHandler', {
      //runtime: lambdago.Runtime.GO_1_X,
      entry: lambdaPath,
      functionName: 'UsersHandler',
      // Enable X-Ray tracing.
      tracing: lambda.Tracing.ACTIVE,
      timeout: props.lambdaTimeout,
      environment: {
        "RDS_SECRET_ARN": props.rdsUserSecret.secretArn,
      }
    });

    props.rdsUserSecret.grantRead(this.handler);
  }
}

